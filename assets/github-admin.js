(() => {
  "use strict";
  const TOKEN_KEY = "i3:github-token";
  const OWNER = "I3oyCHEN";
  const REPO = "I3oyCHEN.github.io";
  const BRANCH = "main";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

  const token = () => sessionStorage.getItem(TOKEN_KEY) || "";
  const setToken = (value) => value ? sessionStorage.setItem(TOKEN_KEY, value.trim()) : sessionStorage.removeItem(TOKEN_KEY);
  const utf8ToBase64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const base64ToUtf8 = (value) => {
    const binary = atob(value.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  };
  const bytesToBase64 = (bytes) => {
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    return btoa(binary);
  };

  const request = async (url, options = {}) => {
    if (!token()) throw new Error("请先在设置页连接 GitHub");
    const response = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
      ...options,
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token()}`, "X-GitHub-Api-Version": "2022-11-28", ...(options.headers || {}) }
    });
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `GitHub 请求失败：${response.status}`);
    return data;
  };

  const checkToken = async () => {
    const data = await request("");
    return data.full_name === `${OWNER}/${REPO}`;
  };

  const updateTextFile = async (path, text, message) => {
    const current = await request(`/contents/${path}?ref=${BRANCH}`);
    return request(`/contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, content: utf8ToBase64(text), sha: current.sha, branch: BRANCH })
    });
  };

  const imageToWebp = async (file) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d", { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .86));
    if (!blob) throw new Error("图片转换失败");
    return new Uint8Array(await blob.arrayBuffer());
  };

  const uploadGalleryImage = async (file, title, wall) => {
    const imageBytes = await imageToWebp(file);
    const ref = await request(`/git/ref/heads/${BRANCH}`);
    const parentSha = ref.object.sha;
    const [parentCommit, manifestFile] = await Promise.all([
      request(`/git/commits/${parentSha}`),
      request(`/contents/content/gallery-data.json?ref=${BRANCH}`)
    ]);
    const manifest = JSON.parse(base64ToUtf8(manifestFile.content));
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "image";
    const repoPath = `assets/gallery/upload-${stamp}-${slug}.webp`;
    manifest.unshift({ id: `upload-${stamp}`, title, src: `/${repoPath}`, wall: Boolean(wall) });
    const [imageBlob, manifestBlob] = await Promise.all([
      request("/git/blobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: bytesToBase64(imageBytes), encoding: "base64" }) }),
      request("/git/blobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: JSON.stringify(manifest, null, 2) + "\n", encoding: "utf-8" }) })
    ]);
    const tree = await request("/git/trees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: [
        { path: repoPath, mode: "100644", type: "blob", sha: imageBlob.sha },
        { path: "content/gallery-data.json", mode: "100644", type: "blob", sha: manifestBlob.sha }
      ] })
    });
    const commit = await request("/git/commits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Add ${title} to the gallery`, tree: tree.sha, parents: [parentSha] })
    });
    await request(`/git/refs/heads/${BRANCH}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sha: commit.sha, force: false }) });
    return { sha: commit.sha, path: repoPath };
  };

  window.GitHubAdmin = { token, setToken, checkToken, updateTextFile, uploadGalleryImage };
})();
