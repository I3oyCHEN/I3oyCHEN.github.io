(() => {
  "use strict";

  const grid = document.querySelector("#gallery-grid");
  const count = document.querySelector("#gallery-count");
  const dialog = document.querySelector("#lightbox");
  const dialogImage = document.querySelector("#lightbox-image");
  const dialogCaption = document.querySelector("#lightbox-caption");
  const form = document.querySelector("#upload-form");
  const uploadStatus = document.querySelector("#upload-status");
  const galleryStatus = document.querySelector("#gallery-status");
  let gallery = [];

  const openImage = (item) => {
    dialogImage.src = item.src;
    dialogImage.alt = item.title;
    dialogCaption.textContent = item.note ? `${item.title} · ${item.note}` : item.title;
    dialog.showModal();
  };

  const editor = (item) => {
    const panel = document.createElement("div");
    panel.className = "gallery-editor";
    panel.dataset.galleryId = item.id;
    panel.innerHTML = `
      <label>名称<input type="text" data-field="title" maxlength="80"></label>
      <label>备注<textarea data-field="note" rows="2" maxlength="300"></textarea></label>
      <label class="wall-check"><input type="checkbox" data-field="wall"> 在首页照片墙显示</label>`;
    panel.querySelector("[data-field='title']").value = item.title || "";
    panel.querySelector("[data-field='note']").value = item.note || "";
    panel.querySelector("[data-field='wall']").checked = item.wall !== false;
    panel.addEventListener("click", (event) => event.stopPropagation());
    panel.addEventListener("keydown", (event) => event.stopPropagation());
    return panel;
  };

  const render = () => {
    const manager = window.I3Auth.isManager();
    grid.replaceChildren();
    count.textContent = `${gallery.length} 幅`;
    gallery.forEach((item) => {
      const card = document.createElement("figure");
      card.className = manager ? "gallery-card is-editable" : "gallery-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `查看 ${item.title}`);
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.title;
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      const title = document.createElement("strong");
      title.className = "gallery-caption-title";
      title.textContent = item.title;
      caption.append(title);
      if (item.note) {
        const note = document.createElement("span");
        note.className = "gallery-caption-note";
        note.textContent = item.note;
        caption.append(note);
      }
      card.append(image, caption);
      if (manager) card.append(editor(item));
      card.addEventListener("click", (event) => { if (!event.target.closest(".gallery-editor")) openImage(item); });
      card.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".gallery-editor")) {
          event.preventDefault();
          openImage(item);
        }
      });
      grid.append(card);
    });
  };

  const loadGallery = async () => {
    const response = await fetch(`../content/gallery-data.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("图库读取失败");
    gallery = await response.json();
    render();
  };

  const collectEdits = () => {
    document.querySelectorAll("[data-gallery-id]").forEach((panel) => {
      const item = gallery.find((entry) => entry.id === panel.dataset.galleryId);
      if (!item) return;
      item.title = panel.querySelector("[data-field='title']").value.trim() || "未命名";
      item.note = panel.querySelector("[data-field='note']").value.trim();
      item.wall = panel.querySelector("[data-field='wall']").checked;
    });
  };

  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    uploadStatus.classList.remove("is-error");
    if (!window.I3Auth.isManager()) return;
    const file = form.elements.image.files[0];
    if (!file || !file.type.startsWith("image/")) {
      uploadStatus.textContent = "请选择图片文件";
      uploadStatus.classList.add("is-error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      uploadStatus.textContent = "单张图片请控制在 20 MB 以内";
      uploadStatus.classList.add("is-error");
      return;
    }
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    uploadStatus.textContent = "正在保存…";
    try {
      await window.GitHubAdmin.uploadGalleryImage(file, form.elements.title.value.trim(), form.elements.wall.checked);
      form.reset();
      form.elements.wall.checked = true;
      uploadStatus.textContent = "已保存。页面部署完成后会显示新图片。";
    } catch (error) {
      uploadStatus.textContent = error.message;
      uploadStatus.classList.add("is-error");
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector("#save-gallery").addEventListener("click", async () => {
    galleryStatus.classList.remove("is-error");
    collectEdits();
    galleryStatus.textContent = "正在发布…";
    try {
      await window.GitHubAdmin.updateTextFile("content/gallery-data.json", `${JSON.stringify(gallery, null, 2)}\n`, "Update gallery captions");
      render();
      galleryStatus.textContent = "已发布。页面部署完成后全站生效。";
    } catch (error) {
      galleryStatus.textContent = error.message;
      galleryStatus.classList.add("is-error");
    }
  });

  window.I3Auth.mount({ onChange: render });
  window.I3Theme.load().then(window.I3Theme.apply).catch(() => {});
  loadGallery().catch((error) => {
    grid.textContent = error.message;
    count.textContent = "";
  });
})();
