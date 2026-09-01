(() => {
  "use strict";

  const ROLE_KEY = "i3:role";
  const MANAGER_KEY = "i3:manager-session";
  let changeHandler = () => {};
  let dialog;

  const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  const sameBytes = (left, right) => left.length === right.length && left.every((byte, index) => byte === right[index]);
  const role = () => sessionStorage.getItem(ROLE_KEY);
  const isManager = () => role() === "manager" && sessionStorage.getItem(MANAGER_KEY) === "verified";

  const verifyManager = async (password) => {
    const config = window.I3_AUTH_CONFIG;
    if (!config) throw new Error("missing authentication config");
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: fromBase64(config.salt), iterations: config.iterations, hash: "SHA-256" },
      material,
      256
    );
    if (!sameBytes(new Uint8Array(bits), fromBase64(config.verifier))) throw new Error("invalid passphrase");
    sessionStorage.setItem(ROLE_KEY, "manager");
    sessionStorage.setItem(MANAGER_KEY, "verified");
    sessionStorage.removeItem("i3:manager-key");
  };

  const applyRole = () => {
    const manager = isManager();
    document.querySelectorAll("[data-manager-only]").forEach((element) => { element.hidden = !manager; });
    document.querySelectorAll("[data-role-button]").forEach((button) => {
      button.textContent = manager ? "管理者" : role() === "visitor" ? "游客" : "选择身份";
    });
    changeHandler({ role: manager ? "manager" : "visitor", manager });
  };

  const chooseVisitor = () => {
    sessionStorage.setItem(ROLE_KEY, "visitor");
    sessionStorage.removeItem(MANAGER_KEY);
    sessionStorage.removeItem("i3:manager-key");
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

  window.I3Auth = { mount, isManager, role, showRoleDialog: show, chooseVisitor };
})();
