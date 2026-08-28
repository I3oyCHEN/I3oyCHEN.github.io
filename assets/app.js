(() => {
  "use strict";

  const content = window.GARDEN_CONTENT || { categories: [], entries: [], backgrounds: [] };
  const categoryMap = new Map(content.categories.map((category) => [category.id, category]));
  const state = { category: "all", query: "" };
  const storageKey = "i3oychen-garden-background";
  const databaseName = "i3oychen-digital-garden";

  const elements = {
    categoryGrid: document.querySelector("#category-grid"),
    filterList: document.querySelector("#filter-list"),
    entryGrid: document.querySelector("#entry-grid"),
    searchInput: document.querySelector("#search-input"),
    resultCount: document.querySelector("#result-count"),
    emptyState: document.querySelector("#empty-state"),
    clearSearch: document.querySelector("#clear-search"),
    backgroundPanel: document.querySelector("#background-panel"),
    backgroundOptions: document.querySelector("#background-options"),
    backgroundUpload: document.querySelector("#background-upload"),
    uploadStatus: document.querySelector("#upload-status")
  };

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
  }[character]));

  const formatDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  function renderCategories() {
    elements.categoryGrid.innerHTML = content.categories.map((category) => {
      const count = content.entries.filter((entry) => entry.category === category.id).length;
      return `
        <button class="category-card accent-${escapeHtml(category.accent)}" type="button" data-category="${escapeHtml(category.id)}">
          <span class="category-icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
          <h3>${escapeHtml(category.name)}</h3>
          <p>${escapeHtml(category.description)}</p>
          <span class="category-meta"><span>${escapeHtml(category.english)} · ${count} 条</span><span class="category-arrow" aria-hidden="true">↘</span></span>
        </button>`;
    }).join("");

    elements.categoryGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-category]");
      if (!card) return;
      setCategory(card.dataset.category);
      document.querySelector("#latest").scrollIntoView({ behavior: "smooth" });
    });
  }

  function renderFilters() {
    const filters = [{ id: "all", name: "全部" }, ...content.categories];
    elements.filterList.innerHTML = filters.map((filter) => `
      <button class="filter-button" type="button" data-filter="${escapeHtml(filter.id)}" aria-pressed="${filter.id === state.category}">
        ${escapeHtml(filter.name)}
      </button>`).join("");

    elements.filterList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (button) setCategory(button.dataset.filter);
    });
  }

  function setCategory(category) {
    state.category = categoryMap.has(category) ? category : "all";
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.category));
    });
    renderEntries();
  }

  function getFilteredEntries() {
    const query = state.query.trim().toLocaleLowerCase("zh-CN");
    return content.entries
      .filter((entry) => state.category === "all" || entry.category === state.category)
      .filter((entry) => {
        if (!query) return true;
        const haystack = [entry.title, entry.summary, ...(entry.tags || []), categoryMap.get(entry.category)?.name || ""]
          .join(" ")
          .toLocaleLowerCase("zh-CN");
        return haystack.includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function renderEntries() {
    const entries = getFilteredEntries();
    elements.entryGrid.innerHTML = entries.map((entry) => {
      const category = categoryMap.get(entry.category) || { name: "未分类" };
      const external = /^https?:\/\//.test(entry.url || "");
      return `
        <article class="entry-card">
          <div class="entry-top"><span class="entry-category">${escapeHtml(category.name)}</span><time datetime="${escapeHtml(entry.date)}">${escapeHtml(formatDate(entry.date))}</time></div>
          <h3><a href="${escapeHtml(entry.url || "#")}"${external ? " target=\"_blank\" rel=\"noopener noreferrer\"" : ""}>${escapeHtml(entry.title)}</a></h3>
          <p>${escapeHtml(entry.summary)}</p>
          <div class="tag-list" aria-label="标签">${(entry.tags || []).map((tag) => `<span class="tag"># ${escapeHtml(tag)}</span>`).join("")}</div>
        </article>`;
    }).join("");
    elements.resultCount.textContent = `显示 ${entries.length} / ${content.entries.length} 条记录`;
    elements.emptyState.hidden = entries.length !== 0;
  }

  function renderBackgrounds() {
    const saved = localStorage.getItem(storageKey) || "forest";
    elements.backgroundOptions.innerHTML = content.backgrounds.map((background) => `
      <button class="background-choice" type="button" role="radio" aria-checked="${background.id === saved}" data-background-choice="${escapeHtml(background.id)}">
        <span class="background-swatch" style="--swatch:${escapeHtml(background.color)}" aria-hidden="true"></span>
        <span><strong>${escapeHtml(background.name)}</strong><small>${escapeHtml(background.description)}</small></span>
        <span class="choice-check" aria-hidden="true">✓</span>
      </button>`).join("");

    elements.backgroundOptions.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-background-choice]");
      if (choice) applyBackground(choice.dataset.backgroundChoice);
    });
  }

  async function applyBackground(background) {
    if (background === "custom") {
      const image = await readCustomBackground();
      if (!image) return applyBackground("forest");
      document.documentElement.style.setProperty("--custom-background", `url("${image}")`);
    }
    document.body.dataset.background = background;
    localStorage.setItem(storageKey, background);
    document.querySelectorAll("[data-background-choice]").forEach((choice) => {
      choice.setAttribute("aria-checked", String(choice.dataset.backgroundChoice === background));
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("settings");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeCustomBackground(dataUrl) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("settings", "readwrite");
      transaction.objectStore("settings").put(dataUrl, "custom-background");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function readCustomBackground() {
    try {
      const database = await openDatabase();
      return await new Promise((resolve, reject) => {
        const request = database.transaction("settings").objectStore("settings").get("custom-background");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (_) {
      return null;
    }
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("无法读取图片"));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("图片格式无法识别"));
        image.onload = () => {
          const maximumWidth = 1920;
          const scale = Math.min(1, maximumWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    renderEntries();
  });
  elements.clearSearch.addEventListener("click", () => {
    state.query = "";
    elements.searchInput.value = "";
    setCategory("all");
    elements.searchInput.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== elements.searchInput && !elements.backgroundPanel.open) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });
  document.querySelector("#open-background").addEventListener("click", () => elements.backgroundPanel.showModal());
  elements.backgroundPanel.addEventListener("click", (event) => {
    if (event.target === elements.backgroundPanel) elements.backgroundPanel.close();
  });
  elements.backgroundUpload.addEventListener("change", async () => {
    const file = elements.backgroundUpload.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      elements.uploadStatus.textContent = "请选择图片文件。";
      return;
    }
    elements.uploadStatus.textContent = "正在处理图片…";
    try {
      const dataUrl = await resizeImage(file);
      await storeCustomBackground(dataUrl);
      let choice = document.querySelector('[data-background-choice="custom"]');
      if (!choice) {
        elements.backgroundOptions.insertAdjacentHTML("beforeend", `
          <button class="background-choice" type="button" role="radio" aria-checked="false" data-background-choice="custom">
            <span class="background-swatch" style="--swatch:#617164" aria-hidden="true"></span>
            <span><strong>我的图片</strong><small>保存在此浏览器</small></span><span class="choice-check" aria-hidden="true">✓</span>
          </button>`);
      }
      await applyBackground("custom");
      elements.uploadStatus.textContent = "已应用。图片仅保存在当前浏览器。";
    } catch (error) {
      elements.uploadStatus.textContent = error.message || "图片处理失败，请尝试另一张图片。";
    } finally {
      elements.backgroundUpload.value = "";
    }
  });

  renderCategories();
  renderFilters();
  renderEntries();
  renderBackgrounds();
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  readCustomBackground().then((image) => {
    if (image) {
      elements.backgroundOptions.insertAdjacentHTML("beforeend", `
        <button class="background-choice" type="button" role="radio" aria-checked="false" data-background-choice="custom">
          <span class="background-swatch" style="--swatch:#617164" aria-hidden="true"></span>
          <span><strong>我的图片</strong><small>保存在此浏览器</small></span><span class="choice-check" aria-hidden="true">✓</span>
        </button>`);
    }
    return applyBackground(localStorage.getItem(storageKey) || "forest");
  });
})();

