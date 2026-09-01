(() => {
  "use strict";

  const LOCAL_KEY = "i3:schedule";
  const wrap = document.querySelector("#schedule-wrap");
  const editButton = document.querySelector("#edit-plan");
  const saveButton = document.querySelector("#save-plan");
  const publishButton = document.querySelector("#publish-plan");
  const cancelButton = document.querySelector("#cancel-plan");
  const status = document.querySelector("#plan-status");
  let schedule;
  let backup;
  let editing = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const input = (value, label) => {
    const field = document.createElement("input");
    field.value = value;
    field.setAttribute("aria-label", label);
    return field;
  };

  const readTable = () => {
    document.querySelectorAll("[data-day]").forEach((field) => {
      schedule.days.find((day) => day.id === field.dataset.day).label = field.value.trim() || field.value;
    });
    document.querySelectorAll("[data-slot-label]").forEach((field) => {
      schedule.slots.find((slot) => slot.id === field.dataset.slotLabel).label = field.value.trim() || field.value;
    });
    document.querySelectorAll("[data-slot-time]").forEach((field) => {
      schedule.slots.find((slot) => slot.id === field.dataset.slotTime).time = field.value.trim();
    });
    document.querySelectorAll("[data-cell]").forEach((field) => {
      const [slot, day] = field.dataset.cell.split(":");
      schedule.cells[slot][day] = field.value.trim();
    });
  };

  const render = () => {
    document.querySelector("#plan-title").textContent = schedule.title;
    document.querySelector("#plan-subtitle").textContent = schedule.subtitle;
    const table = document.createElement("table");
    table.className = "schedule-table";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = "时段";
    headRow.append(corner);
    schedule.days.forEach((day) => {
      const th = document.createElement("th");
      if (editing) {
        const field = input(day.label, `${day.label}名称`);
        field.dataset.day = day.id;
        th.append(field);
      } else th.textContent = day.label;
      headRow.append(th);
    });
    head.append(headRow);
    const body = document.createElement("tbody");
    schedule.slots.forEach((slot) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      if (editing) {
        const label = input(slot.label, `${slot.label}名称`);
        label.dataset.slotLabel = slot.id;
        const time = input(slot.time, `${slot.label}时间`);
        time.dataset.slotTime = slot.id;
        th.append(label, time);
      } else {
        const strong = document.createElement("strong");
        strong.textContent = slot.label;
        const small = document.createElement("small");
        small.textContent = slot.time;
        th.append(strong, small);
      }
      row.append(th);
      schedule.days.forEach((day) => {
        const td = document.createElement("td");
        const value = schedule.cells[slot.id]?.[day.id] || "";
        if (editing) {
          const field = input(value, `${day.label} ${slot.label}`);
          field.dataset.cell = `${slot.id}:${day.id}`;
          td.append(field);
        } else td.textContent = value;
        row.append(td);
      });
      body.append(row);
    });
    table.append(head, body);
    wrap.replaceChildren(table);
  };

  const setEditing = (value) => {
    editing = value;
    editButton.hidden = value;
    saveButton.hidden = !value;
    publishButton.hidden = !value;
    cancelButton.hidden = !value;
    render();
  };

  const load = async () => {
    const response = await fetch(`../content/schedule.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("计划表读取失败");
    const remote = await response.json();
    const local = localStorage.getItem(LOCAL_KEY);
    schedule = local ? JSON.parse(local) : remote;
    render();
  };

  editButton.addEventListener("click", () => {
    backup = clone(schedule);
    setEditing(true);
    status.textContent = "";
  });
  saveButton.addEventListener("click", () => {
    readTable();
    localStorage.setItem(LOCAL_KEY, JSON.stringify(schedule));
    setEditing(false);
    status.classList.remove("is-error");
    status.textContent = "已保存到当前浏览器";
  });
  cancelButton.addEventListener("click", () => {
    schedule = backup;
    setEditing(false);
    status.textContent = "";
  });
  publishButton.addEventListener("click", async () => {
    readTable();
    status.classList.remove("is-error");
    status.textContent = "正在发布…";
    try {
      await window.GitHubAdmin.updateTextFile("content/schedule.json", `${JSON.stringify(schedule, null, 2)}\n`, "Update weekly plan");
      localStorage.setItem(LOCAL_KEY, JSON.stringify(schedule));
      setEditing(false);
      status.textContent = "已发布。GitHub Pages 更新后全站生效。";
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    }
  });

  window.I3Auth.mount({ onChange: ({ manager }) => { if (!manager && editing) { schedule = backup; setEditing(false); } } });
  window.I3Theme.load().then(window.I3Theme.apply).catch(() => {});
  load().catch((error) => { wrap.textContent = error.message; });
})();
