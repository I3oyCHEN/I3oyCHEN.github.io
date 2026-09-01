(() => {
  "use strict";

  const LOCAL_KEY = "i3:schedule";
  const wrap = document.querySelector("#schedule-wrap");
  const editButton = document.querySelector("#edit-plan");
  const appendButton = document.querySelector("#append-slot");
  const saveButton = document.querySelector("#save-plan");
  const publishButton = document.querySelector("#publish-plan");
  const cancelButton = document.querySelector("#cancel-plan");
  const status = document.querySelector("#plan-status");
  let schedule;
  let backup;
  let editing = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const toMinutes = (value) => {
    const [hour, minute] = String(value || "00:00").split(":").map(Number);
    return hour * 60 + minute;
  };
  const toTime = (minutes) => {
    const safe = Math.max(0, Math.min(1439, minutes));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  };
  const normalize = (data) => {
    data.slots.forEach((slot) => {
      if (!slot.start || !slot.end) {
        const [start = "08:00", end = "09:00"] = String(slot.time || "").split(/[–—-]/).map((part) => part.trim());
        slot.start = start;
        slot.end = end;
        delete slot.time;
      }
      data.cells[slot.id] ||= Object.fromEntries(data.days.map((day) => [day.id, ""]));
    });
    return data;
  };
  const input = (value, label, type = "text") => {
    const field = document.createElement("input");
    field.type = type;
    field.value = value;
    field.setAttribute("aria-label", label);
    return field;
  };
  const makeSlot = (start, end) => {
    const id = `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    schedule.cells[id] = Object.fromEntries(schedule.days.map((day) => [day.id, ""]));
    return { id, label: "新时段", start, end };
  };

  const readTable = () => {
    document.querySelectorAll("[data-day]").forEach((field) => {
      schedule.days.find((day) => day.id === field.dataset.day).label = field.value.trim() || field.value;
    });
    document.querySelectorAll("[data-slot-label]").forEach((field) => {
      schedule.slots.find((slot) => slot.id === field.dataset.slotLabel).label = field.value.trim() || "未命名时段";
    });
    document.querySelectorAll("[data-slot-start]").forEach((field) => {
      schedule.slots.find((slot) => slot.id === field.dataset.slotStart).start = field.value;
    });
    document.querySelectorAll("[data-slot-end]").forEach((field) => {
      schedule.slots.find((slot) => slot.id === field.dataset.slotEnd).end = field.value;
    });
    document.querySelectorAll("[data-cell]").forEach((field) => {
      const [slot, day] = field.dataset.cell.split(":");
      schedule.cells[slot][day] = field.value.trim();
    });
  };

  const validateTimes = () => {
    const invalid = schedule.slots.find((slot) => toMinutes(slot.start) >= toMinutes(slot.end));
    if (invalid) throw new Error(`${invalid.label}的结束时间必须晚于开始时间`);
  };

  const insertAfter = (slotId) => {
    readTable();
    const index = schedule.slots.findIndex((slot) => slot.id === slotId);
    const current = schedule.slots[index];
    const next = schedule.slots[index + 1];
    let start;
    let end;
    if (next && toMinutes(next.end) - toMinutes(next.start) >= 30) {
      start = next.start;
      end = toTime(Math.round((toMinutes(next.start) + toMinutes(next.end)) / 2));
      next.start = end;
    } else {
      start = current.end;
      end = toTime(toMinutes(start) + 60);
      if (next && next.start === start) next.start = end;
    }
    schedule.slots.splice(index + 1, 0, makeSlot(start, end));
    render();
  };

  const removeSlot = (slotId) => {
    if (schedule.slots.length <= 1) return;
    readTable();
    schedule.slots = schedule.slots.filter((slot) => slot.id !== slotId);
    delete schedule.cells[slotId];
    render();
  };

  const linkTimeBoundaries = (field, kind) => {
    const oldValue = field.dataset.previous;
    readTable();
    const slotId = kind === "start" ? field.dataset.slotStart : field.dataset.slotEnd;
    const index = schedule.slots.findIndex((slot) => slot.id === slotId);
    const slot = schedule.slots[index];
    if (kind === "start" && index > 0 && schedule.slots[index - 1].end === oldValue) schedule.slots[index - 1].end = slot.start;
    if (kind === "end" && index < schedule.slots.length - 1 && schedule.slots[index + 1].start === oldValue) schedule.slots[index + 1].start = slot.end;
    render();
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
        const box = document.createElement("div");
        box.className = "slot-editor";
        const label = input(slot.label, `${slot.label}名称`);
        label.dataset.slotLabel = slot.id;
        const times = document.createElement("div");
        times.className = "slot-times";
        const start = input(slot.start, `${slot.label}开始时间`, "time");
        start.dataset.slotStart = slot.id;
        start.dataset.previous = slot.start;
        const end = input(slot.end, `${slot.label}结束时间`, "time");
        end.dataset.slotEnd = slot.id;
        end.dataset.previous = slot.end;
        start.addEventListener("change", () => linkTimeBoundaries(start, "start"));
        end.addEventListener("change", () => linkTimeBoundaries(end, "end"));
        times.append(start, end);
        const actions = document.createElement("div");
        actions.className = "slot-actions";
        const insert = document.createElement("button");
        insert.type = "button";
        insert.textContent = "下方插入";
        insert.addEventListener("click", () => insertAfter(slot.id));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "删除行";
        remove.disabled = schedule.slots.length <= 1;
        remove.addEventListener("click", () => removeSlot(slot.id));
        actions.append(insert, remove);
        box.append(label, times, actions);
        th.append(box);
      } else {
        const strong = document.createElement("strong");
        strong.textContent = slot.label;
        const small = document.createElement("small");
        small.textContent = `${slot.start}–${slot.end}`;
        th.append(strong, small);
      }
      row.append(th);
      schedule.days.forEach((day) => {
        const td = document.createElement("td");
        const value = schedule.cells[slot.id]?.[day.id] || "";
        if (editing) {
          const field = document.createElement("textarea");
          field.rows = 2;
          field.value = value;
          field.dataset.cell = `${slot.id}:${day.id}`;
          field.setAttribute("aria-label", `${day.label} ${slot.label}`);
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
    appendButton.hidden = !value;
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
    schedule = normalize(local ? JSON.parse(local) : remote);
    render();
  };

  editButton.addEventListener("click", () => {
    backup = clone(schedule);
    setEditing(true);
    status.textContent = "";
  });
  appendButton.addEventListener("click", () => {
    readTable();
    const last = schedule.slots.at(-1);
    schedule.slots.push(makeSlot(last.end, toTime(toMinutes(last.end) + 60)));
    render();
  });
  saveButton.addEventListener("click", () => {
    try {
      readTable();
      validateTimes();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(schedule));
      setEditing(false);
      status.classList.remove("is-error");
      status.textContent = "已保存到当前浏览器";
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    }
  });
  cancelButton.addEventListener("click", () => {
    schedule = backup;
    setEditing(false);
    status.textContent = "";
  });
  publishButton.addEventListener("click", async () => {
    status.classList.remove("is-error");
    try {
      readTable();
      validateTimes();
      status.textContent = "正在发布…";
      await window.GitHubAdmin.updateTextFile("content/schedule.json", `${JSON.stringify(schedule, null, 2)}\n`, "Update weekly plan");
      localStorage.setItem(LOCAL_KEY, JSON.stringify(schedule));
      setEditing(false);
      status.textContent = "已发布。页面部署完成后全站生效。";
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("is-error");
    }
  });

  window.I3Auth.mount({ onChange: ({ manager }) => {
    if (!manager && editing) {
      schedule = backup;
      setEditing(false);
    }
  } });
  window.I3Theme.load().then(window.I3Theme.apply).catch(() => {});
  load().catch((error) => { wrap.textContent = error.message; });
})();
