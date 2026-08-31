(() => {
  "use strict";

  const filterButtons = document.querySelectorAll("[data-series-filter]");
  const quoteCards = document.querySelectorAll("[data-series]");
  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = lightbox.querySelector("img");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.seriesFilter;
      filterButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
      quoteCards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.series !== filter;
      });
    });
  });

  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.lightboxSrc;
      lightboxImage.alt = button.dataset.lightboxAlt || "剧照大图";
      lightbox.showModal();
    });
  });

  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
  });
})();
