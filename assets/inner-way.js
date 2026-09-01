(() => {
  "use strict";

  const required = document.querySelector("#manager-required");
  const archive = document.querySelector("#inner-content");
  const footer = document.querySelector("#site-footer");
  let rendered = false;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const render = (data) => {
    if (rendered) return;
    rendered = true;
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
    document.title = `${data.title} · I3oyCHEN`;
  };

  const updateAccess = async ({ manager }) => {
    required.hidden = manager;
    archive.hidden = !manager;
    footer.hidden = !manager;
    if (!manager) return;
    try {
      render(await window.I3Auth.decryptInnerData());
    } catch {
      window.I3Auth.chooseVisitor();
    }
  };

  document.querySelector("#manager-enter").addEventListener("click", () => window.I3Auth.showRoleDialog(true));
  window.I3Auth.mount({ onChange: updateAccess });
})();
