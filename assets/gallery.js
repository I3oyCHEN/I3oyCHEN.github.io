(() => {
  "use strict";

  const grid = document.querySelector("#gallery-grid");
  const count = document.querySelector("#gallery-count");
  const dialog = document.querySelector("#lightbox");
  const dialogImage = document.querySelector("#lightbox-image");
  const dialogCaption = document.querySelector("#lightbox-caption");
  const form = document.querySelector("#upload-form");
  const status = document.querySelector("#upload-status");

  const openImage = (item) => {
    dialogImage.src = item.src;
    dialogImage.alt = item.title;
    dialogCaption.textContent = item.title;
    dialog.showModal();
  };

  const render = (items) => {
    grid.replaceChildren();
    count.textContent = `${items.length} 幅`;
    items.forEach((item) => {
      const card = document.createElement("figure");
      card.className = "gallery-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `查看 ${item.title}`);
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.title;
      image.loading = "lazy";
      image.decoding = "async";
      const caption = document.createElement("figcaption");
      caption.textContent = item.title;
      card.append(image, caption);
      card.addEventListener("click", () => openImage(item));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
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
    const items = await response.json();
    render(items);
    return items;
  };

  dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.classList.remove("is-error");
    if (!window.I3Auth.isManager()) {
      status.textContent = "请先以管理者身份进入";
      status.classList.add("is-error");
      return;
    }
    const file = form.elements.image.files[0];
    if (!file || !file.type.startsWith("image/")) {
      status.textContent = "请选择图片文件";
      status.classList.add("is-error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      status.textContent = "单张图片请控制在 20 MB 以内";
      status.classList.add("is-error");
      return;
    }
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    status.textContent = "正在保存…";
    try {
      await window.GitHubAdmin.uploadGalleryImage(file, form.elements.title.value.trim(), form.elements.wall.checked);
      form.reset();
      form.elements.wall.checked = true;
      status.textContent = "已保存。GitHub Pages 更新后会显示新图片。";
      await loadGallery();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    } finally {
      button.disabled = false;
    }
  });

  window.I3Auth.mount();
  window.I3Theme.load().then(window.I3Theme.apply).catch(() => {});
  loadGallery().catch((error) => {
    grid.textContent = error.message;
    count.textContent = "";
  });
})();
