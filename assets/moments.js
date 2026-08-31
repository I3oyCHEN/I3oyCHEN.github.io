(() => {
  "use strict";

  const filterButtons = [...document.querySelectorAll("[data-series-filter]")];
  const sceneCards = [...document.querySelectorAll("[data-series]")];
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("p");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.seriesFilter;
      filterButtons.forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      sceneCards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.series !== filter;
      });
    });
  });

  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".scene-card");
      lightboxImage.src = button.dataset.lightboxSrc;
      lightboxImage.alt = button.dataset.lightboxAlt || "剧照大图";
      lightboxCaption.textContent = card.querySelector(".scene-meta").textContent.replace(/\s+/g, " ").trim();
      lightbox.showModal();
    });
  });

  document.querySelectorAll(".scene-image img").forEach((image) => {
    image.addEventListener("error", () => {
      image.closest(".scene-image").classList.add("image-unavailable");
      image.alt = "剧照暂时无法显示";
    });
  });

  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
  });
})();
