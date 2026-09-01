(() => {
  "use strict";
  const LOCAL_KEY = "i3:site-settings";
  const defaults = { background: "/assets/gallery/violet-evergarden.webp", wallMode: "auto", wallInterval: 8, overlay: 62 };

  const loadRemote = async () => {
    let remote = {};
    try {
      const response = await fetch(`/content/site-settings.json?t=${Date.now()}`, { cache: "no-store" });
      if (response.ok) remote = await response.json();
    } catch {}
    return { ...defaults, ...remote };
  };

  const local = () => {
    try {
      const value = localStorage.getItem(LOCAL_KEY);
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  };

  const load = async () => ({ ...(await loadRemote()), ...(local() || {}) });

  const apply = (settings) => {
    document.documentElement.style.setProperty("--site-background-image", `url("${settings.background}")`);
    document.documentElement.style.setProperty("--site-overlay", String(Math.min(90, Math.max(20, Number(settings.overlay) || 62)) / 100));
  };

  const saveLocal = (settings) => localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  const clearLocal = () => localStorage.removeItem(LOCAL_KEY);
  window.I3Theme = { defaults, load, loadSettings: load, loadRemote, local, apply, saveLocal, clearLocal, localKey: LOCAL_KEY };
})();
