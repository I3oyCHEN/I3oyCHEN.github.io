(() => {
  "use strict";

  const payload = window.INNER_WAY_ENCRYPTED;
  const gate = document.querySelector("#gate");
  const archive = document.querySelector("#inner-content");
  const footer = document.querySelector("#site-footer");
  const form = document.querySelector("#unlock-form");
  const passphrase = document.querySelector("#passphrase");
  const status = document.querySelector("#gate-status");
  const lockButton = document.querySelector("#lock-page");

  const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

  const deriveKey = async (password) => {
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: fromBase64(payload.salt), iterations: payload.iterations, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  };

  const decrypt = async (password) => {
    const key = await deriveKey(password);
    const bytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const render = (data) => {
    document.querySelector("#archive-title").textContent = data.title;
    document.querySelector("#archive-subtitle").textContent = data.subtitle;

    const portraitGrid = document.querySelector("#portrait-grid");
    data.portrait.forEach((item) => {
      const card = make("article", "portrait-card");
      card.append(make("strong", "", item.title), make("p", "", item.text));
      portraitGrid.append(card);
    });

    const topicNav = document.querySelector("#topic-nav");
    const qaSections = document.querySelector("#qa-sections");
    let questionNumber = 0;

    data.sections.forEach((section, sectionIndex) => {
      const link = make("a", "", section.shortTitle);
      link.href = `#${section.id}`;
      topicNav.append(link);

      const sectionElement = make("section", "qa-section");
      sectionElement.id = section.id;
      sectionElement.setAttribute("aria-labelledby", `${section.id}-title`);

      const heading = make("div", "section-heading");
      heading.append(make("p", "section-number", String(sectionIndex + 1).padStart(2, "0")));
      const headingCopy = make("div", "");
      headingCopy.append(make("p", "kicker", section.label));
      const h2 = make("h2", "", section.title);
      h2.id = `${section.id}-title`;
      headingCopy.append(h2);
      heading.append(headingCopy);
      sectionElement.append(heading);

      const list = make("div", "qa-list");
      section.items.forEach((item, itemIndex) => {
        questionNumber += 1;
        const details = make("details", "qa-item");
        if (itemIndex === 0) details.open = true;
        const summary = make("summary", "");
        summary.append(
          make("span", "question-index", String(questionNumber).padStart(2, "0")),
          make("span", "question-text", item.question),
          make("span", "question-toggle", "+")
        );

        const answer = make("div", "answer");
        answer.append(make("p", "answer-label", "答"));
        const answerCopy = make("div", "answer-copy");
        item.answer.forEach((paragraph) => answerCopy.append(make("p", "", paragraph)));
        if (item.actions?.length) {
          const actions = make("ul", "action-list");
          item.actions.forEach((action) => actions.append(make("li", "", action)));
          answerCopy.append(actions);
        }
        answer.append(answerCopy);
        details.append(summary, answer);
        list.append(details);
      });
      sectionElement.append(list);
      qaSections.append(sectionElement);
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    status.textContent = "";
    button.disabled = true;
    button.textContent = "解锁中";
    try {
      const data = await decrypt(passphrase.value);
      render(data);
      passphrase.value = "";
      gate.hidden = true;
      archive.hidden = false;
      footer.hidden = false;
      lockButton.hidden = false;
      document.title = `${data.title} · I3oyCHEN`;
      archive.focus?.();
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      status.textContent = "口令不正确";
      passphrase.select();
    } finally {
      button.disabled = false;
      button.textContent = "进入";
    }
  });

  lockButton.addEventListener("click", () => window.location.reload());
})();
