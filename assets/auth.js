(() => {
  "use strict";

  const ROLE_KEY = "i3:role";
  const MANAGER_KEY = "i3:manager-key";
  let changeHandler = () => {};
  let dialog;

  const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  const toBase64 = (bytes) => {
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };

  const role = () => sessionStorage.getItem(ROLE_KEY);
  const isManager = () => role() === "manager" && Boolean(sessionStorage.getItem(MANAGER_KEY));

  const decryptWithKey = async (rawKey) => {
    const payload = window.INNER_WAY_ENCRYPTED;
    if (!payload) throw new Error("missing payload");
    const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  };

  const verifyManager = async (password) => {
    const payload = window.INNER_WAY_ENCRYPTED;
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: fromBase64(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
    await decryptWithKey(rawKey);
    sessionStorage.setItem(ROLE_KEY, "manager");
    sessionStorage.setItem(MANAGER_KEY, toBase64(rawKey));
  };

  const applyRole = () => {
    const manager = isManager();
    document.querySelectorAll("[data-manager-only]").forEach((element) => { element.hidden = !manager; });
    document.querySelectorAll("[data-role-button]").forEach((button) => { button.textContent = manager ? "管理者" : role() === "visitor" ? "游客" : "选择身份"; });
    changeHandler({ role: manager ? "manager" : "visitor", manager });
  };

  const chooseVisitor = () => {
    sessionStorage.setItem(ROLE_KEY, "visitor");
    sessionStorage.removeItem(MANAGER_KEY);
    sessionStorage.removeItem("i3:github-token");
    dialog.hidden = true;
    applyRole();
  };

  const show = (managerForm = false) => {
    dialog.hidden = false;
    dialog.querySelector(".manager-form").hidden = !managerForm;
    dialog.querySelector(".role-options").hidden = managerForm;
    dialog.querySelector(".role-close").hidden = !role();
    if (managerForm) dialog.querySelector("input").focus();
  };

  const buildDialog = () => {
    dialog = document.createElement("div");
    dialog.className = "role-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "role-title");
    dialog.innerHTML = `
      <div class="role-panel">
        <button class="role-close" type="button" aria-label="关闭">×</button>
        <p class="role-kicker">ACCESS</p>
        <h2 id="role-title">访问方式</h2>
        <p>选择本次浏览身份。</p>
        <div class="role-options">
          <button type="button" data-visitor>游客进入</button>
          <button type="button" data-manager>管理者进入</button>
        </div>
        <form class="manager-form" hidden>
          <label for="manager-passphrase">管理者口令</label>
          <div class="manager-row"><input id="manager-passphrase" type="password" inputmode="numeric" autocomplete="current-password" required><button type="submit">确认</button></div>
          <p class="manager-status" role="alert" aria-live="polite"></p>
        </form>
      </div>`;
    document.body.append(dialog);
    dialog.querySelector("[data-visitor]").addEventListener("click", chooseVisitor);
    dialog.querySelector("[data-manager]").addEventListener("click", () => show(true));
    dialog.querySelector(".role-close").addEventListener("click", () => { dialog.hidden = true; });
    dialog.querySelector(".manager-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const input = form.querySelector("input");
      const button = form.querySelector("button");
      const status = form.querySelector(".manager-status");
      button.disabled = true;
      status.textContent = "";
      try {
        await verifyManager(input.value);
        input.value = "";
        dialog.hidden = true;
        applyRole();
      } catch {
        status.textContent = "口令不正确";
        input.select();
      } finally {
        button.disabled = false;
      }
    });
  };

  const mount = ({ onChange } = {}) => {
    changeHandler = typeof onChange === "function" ? onChange : () => {};
    if (!dialog) buildDialog();
    document.querySelectorAll("[data-role-button]").forEach((button) => button.addEventListener("click", () => show(false)));
    applyRole();
    if (!role()) show(false);
  };

  const getManagerKey = () => {
    const value = sessionStorage.getItem(MANAGER_KEY);
    return value ? fromBase64(value) : null;
  };

  const decryptInnerData = async () => {
    const key = getManagerKey();
    if (!key) throw new Error("manager session required");
    return decryptWithKey(key);
  };

  window.I3Auth = { mount, isManager, role, showRoleDialog: show, getManagerKey, decryptInnerData, chooseVisitor };
})();
