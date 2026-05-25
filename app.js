const STORAGE_PREFIX = "planner-enem-rosa:";

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const schedule = [
  {
    day: "Segunda",
    title: "Matemática",
    weight: "Dia pesado",
    accentClass: "day-card--rose",
    tasks: [
      ["14:00-15:30", "Teoria de Matemática"],
      ["15:40-17:10", "Exercícios"],
      ["19:00-20:00", "Questões ENEM difíceis"],
      ["20:00-20:20", "Revisão de fórmulas"],
    ],
  },
  {
    day: "Terça",
    title: "Física + Redação",
    weight: "Educação física 16h-18h",
    accentClass: "day-card--sky",
    tasks: [
      ["13:30-15:00", "Física teoria"],
      ["15:00-15:40", "Questões rápidas"],
      ["19:00-20:00", "Redação: introdução, conclusão e repertório"],
      ["20:00-20:40", "Análise de redação nota 1000"],
    ],
  },
  {
    day: "Quarta",
    title: "Química",
    weight: "Ensaio de quadrilha 19h",
    accentClass: "day-card--mint",
    tasks: [
      ["13:30-15:00", "Química teoria"],
      ["15:10-16:30", "Exercícios"],
      ["16:40-17:20", "Revisão ativa e mapas mentais"],
      ["17:20-18:00", "Jantar e descanso antes do ensaio"],
    ],
  },
  {
    day: "Quinta",
    title: "Humanas + Linguagens",
    weight: "Curso às 18h",
    accentClass: "day-card--gold",
    tasks: [
      ["13:30-15:00", "Ciências Humanas"],
      ["15:10-16:00", "Questões ENEM"],
      ["16:10-17:00", "Linguagens e interpretação"],
      ["17:00-17:40", "Revisão leve ou atualidades"],
    ],
  },
  {
    day: "Sexta",
    title: "Biologia + Redação",
    weight: "Ensaio às 17h",
    accentClass: "day-card--rose",
    tasks: [
      ["13:30-15:00", "Biologia teoria"],
      ["15:10-16:00", "Exercícios"],
      ["20:00-21:00", "Redação completa ou correção"],
    ],
  },
  {
    day: "Sábado",
    title: "Matemática avançada + Simulado",
    weight: "Dia pesado",
    accentClass: "day-card--rose-deep",
    tasks: [
      ["13:30-15:00", "Matemática avançada"],
      ["15:10-17:10", "Simulado ENEM"],
      ["19:00-20:00", "Correção dos erros"],
    ],
  },
  {
    day: "Domingo",
    title: "Revisão leve ou descanso",
    weight: "Escolha o ritmo",
    accentClass: "day-card--mint",
    tasks: [
      ["16:00-17:00", "Flashcards, atualidades ou revisão rápida"],
      ["14:00-16:00", "Revisão geral da semana e caderno de erros"],
      ["Livre", "Descanso sem culpa"],
    ],
  },
];

const reviewSeeds = [
  ["", "Fórmulas de Matemática", "Matemática", "24 horas"],
  ["", "Redação: repertórios e conclusão", "Redação", "7 dias"],
  ["", "Física: eletricidade", "Natureza", "Questões"],
  ["", "Química orgânica", "Natureza", "Resumo ativo"],
  ["", "Atualidades da semana", "Humanas", "Domingo"],
  ["", "Erros mais repetidos", "Geral", "Caderno de erros"],
];

const simulateRows = 4;
const questionRows = 5;
const essayRows = 5;

const iconCheck =
  '<svg viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>';

const iconTrash =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 4h6m-8 4h10m-8 0 .5 12h5L15 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>';

function $(selector, root = document) {
  return root.querySelector(selector);
}

function key(name) {
  return STORAGE_PREFIX + name;
}

function readValue(name) {
  return localStorage.getItem(key(name)) || "";
}

function writeValue(name, value) {
  localStorage.setItem(key(name), value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function monthValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getSelectedMonth() {
  const inputValue = $("#plannerMonth")?.value;
  const saved = inputValue || readValue("plannerMonth");
  if (/^\d{4}-\d{2}$/.test(saved)) {
    const [year, month] = saved.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

function setSelectedMonth(date) {
  const value = monthValue(date);
  const input = $("#plannerMonth");
  if (input) input.value = value;
  writeValue("plannerMonth", value);
  renderCalendar();
  updateProgress();
}

function showMessage(message) {
  const element = $("#appMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.add("is-visible");
  window.clearTimeout(showMessage.timeout);
  showMessage.timeout = window.setTimeout(() => {
    element.classList.remove("is-visible");
  }, 2600);
}

function makeCheckbox(store, label, detail, progress = true) {
  const progressAttr = progress ? "data-progress" : "";
  return `
    <label class="check-row">
      <input ${progressAttr} data-store="${store}" type="checkbox" />
      <span class="box" aria-hidden="true">${iconCheck}</span>
      <span class="check-text"><strong>${label}</strong><span>${detail}</span></span>
    </label>
  `;
}

function renderDailyCheckins() {
  const container = $("#dailyCheckins");
  if (!container) return;
  container.innerHTML = days
    .map(
      (day) => `
        <label class="day-check">
          <input data-progress data-store="checkin-${day}" type="checkbox" />
          <span>${day}</span>
        </label>
      `
    )
    .join("");
}

function renderWeek() {
  const grid = $("#weekGrid");
  if (!grid) return;
  grid.innerHTML = schedule
    .map(
      (item, dayIndex) => `
        <article class="card day-card ${item.accentClass}">
          <div class="card__inner">
            <div class="day-title">
              <h3>${item.day} — ${item.title}</h3>
              <span>${item.weight}</span>
            </div>
            <ul class="task-list">
              ${item.tasks
                .map(
                  ([time, label], taskIndex) => `
                    <li>${makeCheckbox(`task-${dayIndex}-${taskIndex}`, time, label)}</li>
                  `
                )
                .join("")}
            </ul>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCalendar() {
  const calendar = $("#calendarGrid");
  if (!calendar) return;

  const selected = getSelectedMonth();
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const selectedValue = monthValue(selected);
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayValue = monthValue(today);

  const title = $("#calendarTitle");
  if (title) {
    title.textContent = selected.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }

  const headers = days.map((day) => `<div class="calendar__head">${day}</div>`).join("");
  const blanks = Array.from({ length: firstDayOffset }, () => '<div class="calendar-day--blank"></div>').join("");
  const cells = Array.from({ length: lastDate }, (_, index) => {
    const number = index + 1;
    const isToday = selectedValue === todayValue && number === today.getDate();
    return `
      <label class="calendar-day ${isToday ? "calendar-day--today" : ""}">
        <input data-progress data-calendar-day data-store="calendar-${selectedValue}-${number}" type="checkbox" />
        <span>${number}</span>
        <i aria-hidden="true">✓</i>
      </label>
    `;
  }).join("");

  calendar.innerHTML = headers + blanks + cells;
  hydrateStoredFields(calendar);
}

function renderQuestionRows() {
  const body = $("#questionRows");
  if (!body) return;
  body.innerHTML = Array.from({ length: questionRows }, (_, index) => {
    const week = index + 1;
    return `
      <tr>
        <td data-label="Semana">Semana ${week}</td>
        <td data-label="Meta"><input class="table-input js-question-meta" data-store="q-meta-${week}" type="number" min="0" value="150" /></td>
        <td data-label="Feitas"><input class="table-input js-question-done" data-store="q-done-${week}" type="number" min="0" placeholder="0" /></td>
        <td data-label="Faltam"><strong id="q-left-${week}">150</strong></td>
        <td data-label="Ritmo">
          <div class="tracker-bar" aria-hidden="true"><span id="q-bar-${week}"></span></div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderEssayRows() {
  const body = $("#essayRows");
  if (!body) return;
  body.innerHTML = Array.from({ length: essayRows }, (_, index) => {
    const row = index + 1;
    return `
      <tr>
        <td data-label="Data"><input class="table-input" data-store="essay-date-${row}" type="text" placeholder="__/__" /></td>
        <td data-label="Tema"><input class="table-input" data-store="essay-theme-${row}" type="text" placeholder="Tema" /></td>
        <td data-label="Nota"><input class="table-input" data-store="essay-grade-${row}" type="number" min="0" max="1000" placeholder="0" /></td>
        <td data-label="Competência foco">
          <select class="select-input" data-store="essay-competence-${row}">
            <option value="">Escolha</option>
            <option>Competência 1</option>
            <option>Competência 2</option>
            <option>Competência 3</option>
            <option>Competência 4</option>
            <option>Competência 5</option>
          </select>
        </td>
        <td data-label="Melhorar"><input class="table-input" data-store="essay-improve-${row}" type="text" placeholder="Ponto de melhoria" /></td>
      </tr>
    `;
  }).join("");
}

function renderReviewRows() {
  const body = $("#reviewRows");
  if (!body) return;
  body.innerHTML = reviewSeeds
    .map(([date, subject, area, action], index) => {
      const row = index + 1;
      return `
        <tr>
          <td data-label="Data"><input class="table-input" data-store="review-date-${row}" type="text" placeholder="${date || "__/__"}" /></td>
          <td data-label="Assunto"><input class="table-input" data-store="review-subject-${row}" type="text" value="${subject}" /></td>
          <td data-label="Área">
            <select class="select-input" data-store="review-area-${row}">
              ${["Matemática", "Natureza", "Redação", "Humanas", "Linguagens", "Geral"]
                .map((option) => `<option ${option === area ? "selected" : ""}>${option}</option>`)
                .join("")}
            </select>
          </td>
          <td data-label="Próxima ação"><input class="table-input" data-store="review-action-${row}" type="text" value="${action}" /></td>
          <td data-label="Status">
            <label class="day-check">
              <input data-progress data-store="review-done-${row}" type="checkbox" />
              <span>Feito</span>
            </label>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderSimulateRows() {
  const body = $("#simulateRows");
  if (!body) return;
  body.innerHTML = Array.from({ length: simulateRows }, (_, index) => {
    const row = index + 1;
    return `
      <tr>
        <td data-label="Data"><input class="table-input" data-store="sim-date-${row}" type="text" placeholder="__/__" /></td>
        <td data-label="Matemática"><input class="table-input" data-store="sim-math-${row}" type="number" min="0" max="45" placeholder="0" /></td>
        <td data-label="Natureza"><input class="table-input" data-store="sim-nature-${row}" type="number" min="0" max="45" placeholder="0" /></td>
        <td data-label="Humanas"><input class="table-input" data-store="sim-human-${row}" type="number" min="0" max="45" placeholder="0" /></td>
        <td data-label="Linguagens"><input class="table-input" data-store="sim-language-${row}" type="number" min="0" max="45" placeholder="0" /></td>
        <td data-label="Redação"><input class="table-input" data-store="sim-essay-${row}" type="number" min="0" max="1000" placeholder="0" /></td>
        <td data-label="Observação"><input class="table-input" data-store="sim-note-${row}" type="text" placeholder="O que ajustar" /></td>
      </tr>
    `;
  }).join("");
}

function readExtraTasks() {
  try {
    const value = readValue("extraTasks");
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveExtraTasks(tasks) {
  writeValue("extraTasks", JSON.stringify(tasks));
}

function renderExtraTasks() {
  const list = $("#extraTaskList");
  if (!list) return;

  const tasks = readExtraTasks();
  if (tasks.length === 0) {
    list.innerHTML = '<p class="empty-state">Nenhuma tarefa extra cadastrada ainda.</p>';
    updateProgress();
    return;
  }

  list.innerHTML = tasks
    .map(
      (task) => `
        <article class="extra-item ${task.done ? "is-done" : ""}" data-task-id="${task.id}">
          <input data-progress type="checkbox" ${task.done ? "checked" : ""} aria-label="Marcar tarefa ${escapeHtml(task.title)}" />
          <span class="extra-item__text">
            <strong>${escapeHtml(task.title)}</strong>
            <span>${escapeHtml(task.type)} · criado em ${escapeHtml(task.createdAt)}</span>
          </span>
          <button class="icon-button" type="button" aria-label="Remover tarefa">${iconTrash}</button>
        </article>
      `
    )
    .join("");

  list.querySelectorAll(".extra-item").forEach((item) => {
    const id = item.dataset.taskId;
    const checkbox = item.querySelector('input[type="checkbox"]');
    const removeButton = item.querySelector("button");

    checkbox.addEventListener("change", () => {
      const nextTasks = readExtraTasks().map((task) =>
        task.id === id ? { ...task, done: checkbox.checked } : task
      );
      saveExtraTasks(nextTasks);
      item.classList.toggle("is-done", checkbox.checked);
      updateProgress();
    });

    removeButton.addEventListener("click", () => {
      saveExtraTasks(readExtraTasks().filter((task) => task.id !== id));
      renderExtraTasks();
      showMessage("Tarefa removida.");
    });
  });

  updateProgress();
}

function bindStoredField(element) {
  if (element.dataset.bound === "true") return;
  element.dataset.bound = "true";

  const store = element.dataset.store;
  const saved = readValue(store);

  if (element.type === "checkbox") {
    element.checked = saved === "true";
  } else if (saved) {
    element.value = saved;
  } else if (element.value) {
    writeValue(store, element.value);
  }

  const handleUpdate = () => {
    if (element.type === "checkbox") {
      writeValue(store, String(element.checked));
    } else {
      writeValue(store, element.value);
    }

    if (store === "plannerMonth") {
      renderCalendar();
    }

    updateQuestionBars();
    updateProgress();
  };

  element.addEventListener("input", handleUpdate);
  element.addEventListener("change", handleUpdate);
}

function hydrateStoredFields(root = document) {
  root.querySelectorAll("[data-store]").forEach(bindStoredField);
}

function updateProgress() {
  const boxes = Array.from(document.querySelectorAll("input[data-progress]"));
  const checked = boxes.filter((box) => box.checked).length;
  const total = boxes.length || 1;
  const value = Math.round((checked / total) * 100);
  const ring = $("#progressRing");
  const valueText = $("#progressValue");
  const helper = $("#progressText");

  if (ring) ring.style.setProperty("--value", value);
  if (valueText) valueText.textContent = `${value}%`;
  if (helper) {
    helper.textContent =
      checked === 0
        ? "Marque seus blocos concluídos para acompanhar o ritmo."
        : `${checked} de ${total} check-ins concluídos neste planner.`;
  }

  updateDashboard(value, checked, total);
}

function updateQuestionBars() {
  let totalDone = 0;
  let totalMeta = 0;

  for (let week = 1; week <= questionRows; week += 1) {
    const meta = Number($(`[data-store="q-meta-${week}"]`)?.value || 150);
    const done = Number($(`[data-store="q-done-${week}"]`)?.value || 0);
    const percent = Math.max(0, Math.min(100, Math.round((done / Math.max(meta, 1)) * 100)));
    const bar = $(`#q-bar-${week}`);
    const left = $(`#q-left-${week}`);

    if (bar) bar.style.width = `${percent}%`;
    if (left) left.textContent = String(Math.max(meta - done, 0));

    totalDone += done;
    totalMeta += meta;
  }

  const metric = $("#metricQuestions");
  const helper = $("#metricQuestionsText");
  if (metric) metric.textContent = String(totalDone);
  if (helper) helper.textContent = totalMeta > 0 ? `${Math.max(totalMeta - totalDone, 0)} questões para bater a meta.` : "Defina metas semanais.";
}

function updateDashboard(progressValue = null, checked = null, total = null) {
  const boxes = Array.from(document.querySelectorAll("input[data-progress]"));
  const checkedCount = checked ?? boxes.filter((box) => box.checked).length;
  const totalCount = total ?? (boxes.length || 1);
  const progress = progressValue ?? Math.round((checkedCount / totalCount) * 100);

  const progressMetric = $("#metricProgress");
  const progressText = $("#metricProgressText");
  if (progressMetric) progressMetric.textContent = `${progress}%`;
  if (progressText) progressText.textContent = `${checkedCount} de ${totalCount} marcações concluídas.`;

  const studyDays = Array.from(document.querySelectorAll("input[data-calendar-day]")).filter((box) => box.checked).length;
  const studyMetric = $("#metricStudyDays");
  if (studyMetric) studyMetric.textContent = String(studyDays);

  const grades = Array.from({ length: essayRows }, (_, index) => Number($(`[data-store="essay-grade-${index + 1}"]`)?.value || 0)).filter(Boolean);
  const average = grades.length ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length) : 0;
  const essayMetric = $("#metricEssayAverage");
  const essayText = $("#metricEssayText");
  if (essayMetric) essayMetric.textContent = String(average);
  if (essayText) essayText.textContent = grades.length ? `${grades.length} redações com nota registrada.` : "Registre notas para acompanhar evolução.";

  const todayIndex = (new Date().getDay() + 6) % 7;
  const today = schedule[todayIndex];
  const todayLabel = $("#todayLabel");
  const todayFocus = $("#todayFocus");
  const todayWeight = $("#todayWeight");
  if (todayLabel) todayLabel.textContent = today.day;
  if (todayFocus) todayFocus.textContent = today.title;
  if (todayWeight) todayWeight.textContent = today.weight;

  updateReviewQueue();
}

function updateReviewQueue() {
  const list = $("#reviewQueue");
  if (!list) return;

  const pending = reviewSeeds
    .map((_, index) => {
      const row = index + 1;
      return {
        done: readValue(`review-done-${row}`) === "true",
        subject: $(`[data-store="review-subject-${row}"]`)?.value || readValue(`review-subject-${row}`),
        action: $(`[data-store="review-action-${row}"]`)?.value || readValue(`review-action-${row}`),
      };
    })
    .filter((item) => !item.done && item.subject)
    .slice(0, 3);

  list.innerHTML =
    pending.length === 0
      ? '<li class="detail-row"><strong>Fila</strong><span>Todas as revisões cadastradas estão marcadas como feitas.</span></li>'
      : pending
          .map(
            (item) => `
              <li class="detail-row">
                <strong>${escapeHtml(item.action || "Revisar")}</strong>
                <span>${escapeHtml(item.subject)}</span>
              </li>
            `
          )
          .join("");
}

function setupExtraTaskForm() {
  const form = $("#extraTaskForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const titleInput = $("#extraTaskTitle");
    const typeInput = $("#extraTaskType");
    const title = titleInput.value.trim();
    if (!title) {
      showMessage("Escreva uma tarefa antes de adicionar.");
      titleInput.focus();
      return;
    }

    const task = {
      id: `task-${Date.now()}`,
      title,
      type: typeInput.value,
      done: false,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    saveExtraTasks([task, ...readExtraTasks()]);
    titleInput.value = "";
    renderExtraTasks();
    showMessage("Tarefa adicionada.");
  });
}

function exportPlanner() {
  const storage = {};
  Object.keys(localStorage)
    .filter((storageKey) => storageKey.startsWith(STORAGE_PREFIX))
    .sort()
    .forEach((storageKey) => {
      storage[storageKey.replace(STORAGE_PREFIX, "")] = localStorage.getItem(storageKey);
    });

  const payload = {
    name: "Planner ENEM",
    version: 1,
    exportedAt: new Date().toISOString(),
    storage,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `planner-enem-${monthValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showMessage("Planner exportado.");
}

function importPlanner(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const storage = payload.storage || payload;

      Object.keys(localStorage)
        .filter((storageKey) => storageKey.startsWith(STORAGE_PREFIX))
        .forEach((storageKey) => localStorage.removeItem(storageKey));

      Object.entries(storage).forEach(([storageKey, value]) => {
        const cleanKey = storageKey.startsWith(STORAGE_PREFIX)
          ? storageKey
          : `${STORAGE_PREFIX}${storageKey}`;
        localStorage.setItem(cleanKey, String(value));
      });

      showMessage("Planner importado. Recarregando...");
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      showMessage("Não consegui importar esse arquivo.");
    }
  });
  reader.readAsText(file);
}

function setupActions() {
  $("#printPlanner")?.addEventListener("click", () => window.print());
  $("#exportPlanner")?.addEventListener("click", exportPlanner);
  $("#importPlannerFile")?.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importPlanner(file);
    event.target.value = "";
  });

  $("#prevMonth")?.addEventListener("click", () => {
    const selected = getSelectedMonth();
    setSelectedMonth(new Date(selected.getFullYear(), selected.getMonth() - 1, 1));
  });

  $("#nextMonth")?.addEventListener("click", () => {
    const selected = getSelectedMonth();
    setSelectedMonth(new Date(selected.getFullYear(), selected.getMonth() + 1, 1));
  });

  $("#focusToday")?.addEventListener("click", () => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const todayCard = document.querySelectorAll(".day-card")[todayIndex];
    if (!todayCard) return;

    todayCard.scrollIntoView({ behavior: "smooth", block: "center" });
    todayCard.animate(
      [
        { transform: "scale(1)", boxShadow: "0 14px 36px rgba(159, 61, 96, 0.1)" },
        { transform: "scale(1.012)", boxShadow: "0 20px 50px rgba(159, 61, 96, 0.18)" },
        { transform: "scale(1)", boxShadow: "0 14px 36px rgba(159, 61, 96, 0.1)" },
      ],
      { duration: 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
    );
  });

  $("#resetPlanner")?.addEventListener("click", () => {
    document.querySelectorAll('input[type="checkbox"][data-store]').forEach((box) => {
      box.checked = false;
      writeValue(box.dataset.store, "false");
    });

    saveExtraTasks(readExtraTasks().map((task) => ({ ...task, done: false })));
    renderExtraTasks();
    updateProgress();
    showMessage("Checks limpos. Os textos foram mantidos.");
  });
}

function initializeMonthField() {
  const input = $("#plannerMonth");
  if (!input) return;

  const saved = readValue("plannerMonth");
  const value = /^\d{4}-\d{2}$/.test(saved) ? saved : monthValue(new Date());
  input.value = value;
  writeValue("plannerMonth", value);
}

function init() {
  initializeMonthField();
  renderDailyCheckins();
  renderWeek();
  renderQuestionRows();
  renderEssayRows();
  renderReviewRows();
  renderSimulateRows();
  renderCalendar();
  renderExtraTasks();
  hydrateStoredFields();
  setupActions();
  setupExtraTaskForm();
  updateQuestionBars();
  updateProgress();
}

init();
