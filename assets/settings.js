(() => {
  "use strict";

  const denied = document.querySelector("#settings-denied");
  const content = document.querySelector("#settings-content");
  const form = document.querySelector("#appearance-form");
  const background = document.querySelector("#background");
  const overlay = document.querySelector("#overlay");
  const overlayOutput = document.querySelector("#overlay-output");
  const preview = document.querySelector("#background-preview");
  const settingsStatus = document.querySelector("#settings-status");
  const tokenForm = document.querySelector("#token-form");
  const tokenInput = document.querySelector("#github-token");
  const tokenStatus = document.querySelector("#token-status");
  let remoteSettings;

  const formSettings = () => ({
    background: form.elements.background.value,
    wallMode: form.elements.wallMode.value,
    wallInterval: Math.max(3, Math.min(60, Number(form.elements.wallInterval.value) || 8)),
    overlay: Math.max(20, Math.min(90, Number(form.elements.overlay.value) || 62))
  });

  const fillForm = (settings) => {
    form.elements.background.value = settings.background;
    form.elements.wallMode.value = settings.wallMode;
    form.elements.wallInterval.value = settings.wallInterval;
    form.elements.overlay.value = settings.overlay;
    updatePreview();
  };

  const updatePreview = () => {
    const settings = formSettings();
    overlayOutput.value = `${settings.overlay}%`;
    preview.style.backgroundImage = `linear-gradient(rgba(4,8,6,${settings.overlay / 100}),rgba(4,8,6,${settings.overlay / 100})),url("${settings.background}")`;
  };

  const load = async () => {
    const [galleryResponse, settings] = await Promise.all([
      fetch(`../content/gallery-data.json?v=${Date.now()}`, { cache: "no-store" }),
      window.I3Theme.loadRemote()
    ]);
    if (!galleryResponse.ok) throw new Error("图库读取失败");
    const gallery = await galleryResponse.json();
    gallery.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.src;
      option.textContent = item.title;
      background.append(option);
    });
    remoteSettings = settings;
    fillForm(window.I3Theme.local() || settings);
    tokenStatus.textContent = window.GitHubAdmin.token() ? "当前会话已连接" : "当前会话未连接";
  };

  form.addEventListener("input", updatePreview);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const settings = formSettings();
    window.I3Theme.saveLocal(settings);
    window.I3Theme.apply(settings);
    settingsStatus.classList.remove("is-error");
    settingsStatus.textContent = "已应用到当前浏览器";
  });

  document.querySelector("#publish-settings").addEventListener("click", async () => {
    settingsStatus.classList.remove("is-error");
    settingsStatus.textContent = "正在发布…";
    try {
      const settings = formSettings();
      await window.GitHubAdmin.updateTextFile("content/site-settings.json", `${JSON.stringify(settings, null, 2)}\n`, "Update site presentation settings");
      remoteSettings = settings;
      window.I3Theme.saveLocal(settings);
      window.I3Theme.apply(settings);
      settingsStatus.textContent = "已发布。GitHub Pages 更新后全站生效。";
    } catch (error) {
      settingsStatus.textContent = error.message;
      settingsStatus.classList.add("is-error");
    }
  });

  document.querySelector("#restore-settings").addEventListener("click", () => {
    window.I3Theme.clearLocal();
    fillForm(remoteSettings);
    window.I3Theme.apply(remoteSettings);
    settingsStatus.classList.remove("is-error");
    settingsStatus.textContent = "已恢复网站当前设置";
  });

  tokenForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    tokenStatus.classList.remove("is-error");
    window.GitHubAdmin.setToken(tokenInput.value);
    tokenInput.value = "";
    tokenStatus.textContent = "正在验证…";
    try {
      await window.GitHubAdmin.checkToken();
      tokenStatus.textContent = "已连接 I3oyCHEN/I3oyCHEN.github.io";
    } catch (error) {
      window.GitHubAdmin.setToken("");
      tokenStatus.textContent = error.message;
      tokenStatus.classList.add("is-error");
    }
  });

  document.querySelector("#clear-token").addEventListener("click", () => {
    window.GitHubAdmin.setToken("");
    tokenInput.value = "";
    tokenStatus.classList.remove("is-error");
    tokenStatus.textContent = "已断开";
  });

  document.querySelector("#settings-login").addEventListener("click", () => window.I3Auth.showRoleDialog(true));
  window.I3Auth.mount({ onChange: ({ manager }) => {
    denied.hidden = manager;
    content.hidden = !manager;
  } });
  window.I3Theme.load().then(window.I3Theme.apply).catch(() => {});
  load().catch((error) => {
    settingsStatus.textContent = error.message;
    settingsStatus.classList.add("is-error");
  });
})();
