(() => {
  "use strict";
  const wall = document.querySelector(".photo-wall");
  const currentLayer = document.querySelector("#wall-current");
  const nextLayer = document.querySelector("#wall-next");
  const caption = document.querySelector("#wall-caption");
  const indexText = document.querySelector("#wall-index");
  const totalText = document.querySelector("#wall-total");
  const toggleButton = document.querySelector("#wall-toggle");
  let gallery = [];
  let index = 0;
  let timer = null;
  let settings;
  let paused = false;

  const renderGroups = () => {
    const grid = document.querySelector("#group-grid");
    grid.replaceChildren();
    window.SITE_CONTENT.groups.filter((group) => !group.managerOnly || window.I3Auth.isManager()).forEach((group) => {
      const link = document.createElement("a");
      link.className = "group-card";
      link.href = group.url;
      link.innerHTML = `<span class="group-icon" aria-hidden="true">${group.icon}</span><small>${group.english}</small><h3>${group.name}</h3><span class="group-arrow" aria-hidden="true">↗</span>`;
      grid.append(link);
    });
  };

  const setWall = (nextIndex, immediate = false) => {
    if (!gallery.length) return;
    index = (nextIndex + gallery.length) % gallery.length;
    const item = gallery[index];
    const image = new Image();
    image.onload = () => {
      if (immediate || !currentLayer.style.backgroundImage) {
        currentLayer.style.backgroundImage = `url("${item.src}")`;
      } else {
        nextLayer.style.backgroundImage = `url("${item.src}")`;
        wall.classList.add("is-transitioning");
        window.setTimeout(() => {
          currentLayer.style.backgroundImage = nextLayer.style.backgroundImage;
          wall.classList.remove("is-transitioning");
        }, 1050);
      }
      caption.textContent = item.note ? `${item.title} · ${item.note}` : item.title;
      indexText.textContent = String(index + 1).padStart(2, "0");
    };
    image.src = item.src;
  };

  const stopTimer = () => { if (timer) window.clearInterval(timer); timer = null; };
  const startTimer = () => {
    stopTimer();
    if (settings.wallMode === "auto" && !paused && gallery.length > 1) {
      timer = window.setInterval(() => setWall(index + 1), Math.max(3, Number(settings.wallInterval) || 8) * 1000);
    }
  };

  document.querySelector("#wall-prev").addEventListener("click", () => { setWall(index - 1); startTimer(); });
  document.querySelector("#wall-next-button").addEventListener("click", () => { setWall(index + 1); startTimer(); });
  toggleButton.addEventListener("click", () => {
    paused = !paused;
    toggleButton.textContent = paused ? "▶" : "Ⅱ";
    toggleButton.setAttribute("aria-label", paused ? "开始自动切换" : "暂停自动切换");
    startTimer();
  });

  const init = async () => {
    window.I3Auth.mount({ onChange: renderGroups });
    settings = await window.I3Theme.loadSettings();
    window.I3Theme.apply(settings);
    try {
      const response = await fetch(`/content/gallery-data.json?t=${Date.now()}`, { cache: "no-store" });
      const data = await response.json();
      gallery = data.filter((item) => item.wall !== false);
    } catch { gallery = []; }
    totalText.textContent = String(gallery.length).padStart(2, "0");
    if (gallery.length) setWall(0, true);
    if (settings.wallMode === "manual") toggleButton.hidden = true;
    startTimer();
    renderGroups();
    document.querySelector("#current-year").textContent = new Date().getFullYear();
  };
  init();
})();
