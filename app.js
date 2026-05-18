const STORAGE_KEY = "use-case-template-state";
const EMPTY_TEXT = "Pendiente de completar";

const FIELD_DEFAULTS = {
  courseName: "",
  studentName: "",
  studentId: "",
  teacherName: "",
  date: "",
  systemName: "",
  useCaseId: "",
  useCaseName: "",
  objective: "",
  briefDescription: "",
  primaryActor: "",
  secondaryActors: "",
  trigger: "",
  priority: "Alta",
  risk: "Medio",
  version: "1.0",
  preconditions: "",
  postconditions: "",
  assumptions: "",
  fulfilledRequirements: "",
  observations: "",
  analystNotes: "",
  validationLabel: "Firma del analista / Vo.Bo. docente"
};

const DEMO_DATA = {
  ...FIELD_DEFAULTS,
  courseName: "Analisis y Diseno de Sistemas",
  studentName: "Andrea Sofia Ramirez",
  studentId: "2024-11872",
  teacherName: "Ing. Marco Tulio Salazar",
  date: new Date().toISOString().split("T")[0],
  systemName: "Sistema de Control Academico",
  useCaseId: "CU-01",
  useCaseName: "Registrar estudiante",
  objective: "Permitir que el personal academico registre a un nuevo estudiante con sus datos personales y academicos para habilitar su participacion dentro del sistema institucional.",
  briefDescription: "El caso de uso inicia cuando secretaria academica recibe la solicitud de inscripcion y valida la informacion necesaria para crear el expediente digital del estudiante.",
  primaryActor: "Secretaria academica",
  secondaryActors: "Estudiante, sistema de matricula, coordinacion academica",
  trigger: "Recepcion de solicitud de ingreso de un nuevo estudiante.",
  priority: "Alta",
  risk: "Medio",
  version: "1.2",
  preconditions: "El periodo de inscripcion debe estar habilitado y el usuario debe contar con permisos de registro.",
  postconditions: "El estudiante queda registrado con expediente activo y disponible para procesos posteriores de matricula.",
  assumptions: "La documentacion entregada por el estudiante es autentica y el sistema se encuentra operativo.",
  fulfilledRequirements: "RF-01 registro de estudiantes, RF-03 validacion de campos obligatorios, RN-02 control de periodos academicos.",
  observations: "El flujo considera validacion documental previa y notificacion interna al finalizar el registro.",
  analystNotes: "Se recomienda integrar este caso con un futuro caso de uso de matricula para reducir duplicidad de datos.",
  validationLabel: "Firma del analista funcional"
};

const DEMO_MAIN_STEPS = [
  "La secretaria academica selecciona la opcion de registro de estudiante.",
  "El sistema presenta la plantilla de datos personales y academicos obligatorios.",
  "La secretaria ingresa la informacion proporcionada por el estudiante.",
  "El sistema valida campos requeridos, formato y existencia previa del registro.",
  "La secretaria confirma el registro.",
  "El sistema genera el expediente y muestra mensaje de confirmacion."
];

const DEMO_ALTERNATIVES = [
  {
    title: "Documentacion incompleta",
    condition: "El estudiante no entrega todos los documentos requeridos.",
    steps: [
      "La secretaria identifica la documentacion faltante.",
      "El sistema marca el registro como pendiente.",
      "Se informa al estudiante que debe completar requisitos para continuar."
    ]
  },
  {
    title: "Estudiante ya registrado",
    condition: "El sistema detecta coincidencia con expediente existente.",
    steps: [
      "El sistema muestra advertencia de duplicidad.",
      "La secretaria revisa el expediente existente.",
      "Se cancela la creacion de un nuevo registro y se actualiza el expediente actual si aplica."
    ]
  }
];

const state = loadState();

const elements = {
  form: document.getElementById("use-case-form"),
  alert: document.getElementById("validation-alert"),
  mainStepsEditor: document.getElementById("main-steps-editor"),
  alternativesEditor: document.getElementById("alternatives-editor"),
  addMainStepBtn: document.getElementById("add-main-step-btn"),
  addAlternativeBtn: document.getElementById("add-alternative-btn"),
  loadDemoBtn: document.getElementById("load-demo-btn"),
  clearFormBtn: document.getElementById("clear-form-btn"),
  printBtn: document.getElementById("print-btn")
};

const RENDERERS = {
  form: renderFormFields,
  mainStepsEditor: renderMainStepsEditor,
  alternativesEditor: renderAlternativesEditor,
  preview: renderPreview
};

function loadState() {
  const baseState = {
    fields: { ...FIELD_DEFAULTS, date: FIELD_DEFAULTS.date || getToday() },
    mainSteps: [""],
    alternatives: []
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) {
      return {
        ...baseState,
        fields: { ...baseState.fields, date: getToday() }
      };
    }

    return {
      fields: { ...baseState.fields, ...saved.fields, date: saved.fields?.date || getToday() },
      mainSteps: sanitizeSteps(saved.mainSteps),
      alternatives: sanitizeAlternatives(saved.alternatives)
    };
  } catch {
    return {
      ...baseState,
      fields: { ...baseState.fields, date: getToday() }
    };
  }
}

function sanitizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [""];
  }

  return steps.map((step) => String(step || ""));
}

function sanitizeAlternatives(alternatives) {
  if (!Array.isArray(alternatives)) {
    return [];
  }

  return alternatives.map((alternative) => ({
    title: String(alternative?.title || ""),
    condition: String(alternative?.condition || ""),
    steps: sanitizeSteps(alternative?.steps)
  }));
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function commit(...targets) {
  const queue = targets.length > 0 ? targets : Object.keys(RENDERERS);
  const uniqueTargets = [...new Set(queue)];

  uniqueTargets.forEach((target) => {
    const renderer = RENDERERS[target];
    if (typeof renderer === "function") {
      renderer();
    }
  });

  saveState();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function asParagraphs(value) {
  const lines = normalizeText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return EMPTY_TEXT;
  }

  return lines.map((line) => escapeHtml(line)).join("<br>");
}

function formatDate(value) {
  if (!value) {
    return EMPTY_TEXT;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function createPreviewMap() {
  return {
    courseName: document.getElementById("preview-course-name"),
    studentName: document.getElementById("preview-student-name"),
    studentId: document.getElementById("preview-student-id"),
    teacherName: document.getElementById("preview-teacher-name"),
    systemName: document.getElementById("preview-system-name"),
    useCaseId: document.getElementById("preview-use-case-id"),
    version: document.getElementById("preview-version"),
    date: document.getElementById("preview-date"),
    useCaseName: document.getElementById("preview-use-case-name"),
    objective: document.getElementById("preview-objective"),
    briefDescription: document.getElementById("preview-brief-description"),
    primaryActor: document.getElementById("preview-primary-actor"),
    secondaryActors: document.getElementById("preview-secondary-actors"),
    trigger: document.getElementById("preview-trigger"),
    preconditions: document.getElementById("preview-preconditions"),
    postconditions: document.getElementById("preview-postconditions"),
    assumptions: document.getElementById("preview-assumptions"),
    fulfilledRequirements: document.getElementById("preview-fulfilled-requirements"),
    observations: document.getElementById("preview-observations"),
    analystNotes: document.getElementById("preview-analyst-notes"),
    validationLabel: document.getElementById("preview-validation-label"),
    priorityBadge: document.getElementById("preview-priority-badge"),
    riskBadge: document.getElementById("preview-risk-badge"),
    mainSteps: document.getElementById("preview-main-steps"),
    alternatives: document.getElementById("preview-alternatives")
  };
}

const preview = createPreviewMap();

function getPriorityClasses(priority) {
  return {
    Alta: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
    Media: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
    Baja: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200"
  }[priority] || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

function getRiskClasses(risk) {
  return {
    Alto: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
    Medio: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
    Bajo: "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200"
  }[risk] || "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

function setTextContent(element, value, formatter = null) {
  const normalized = normalizeText(value);
  const finalValue = formatter ? formatter(normalized) : normalized || EMPTY_TEXT;
  element.textContent = finalValue;
  element.classList.toggle("text-slate-400", !normalized);
}

function setRichContent(element, value) {
  const normalized = normalizeText(value);
  element.innerHTML = asParagraphs(value);
  element.classList.toggle("text-slate-400", !normalized);
}

function renderMainStepsEditor() {
  elements.mainStepsEditor.innerHTML = state.mainSteps
    .map(
      (step, index) => `
        <div class="rounded-[24px] border border-cyan-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbfd_100%)] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-30px_rgba(14,116,144,0.25)]">
          <div class="mb-3 flex items-center justify-between gap-4">
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">Paso ${index + 1}</p>
            <button type="button" data-action="remove-main-step" data-index="${index}" class="action-btn border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45" ${state.mainSteps.length === 1 ? "disabled" : ""}>Eliminar</button>
          </div>
          <textarea data-action="main-step-input" data-index="${index}" class="textarea min-h-24" rows="3" placeholder="Describe la accion del paso">${escapeHtml(step)}</textarea>
        </div>
      `
    )
    .join("");
}

function renderAlternativesEditor() {
  if (state.alternatives.length === 0) {
    elements.alternativesEditor.innerHTML = `
      <div class="rounded-[24px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] px-4 py-5 text-sm text-slate-500">
        Aun no hay escenarios alternativos. Agrega uno para documentar extensiones o excepciones.
      </div>
    `;
    return;
  }

  elements.alternativesEditor.innerHTML = state.alternatives
    .map(
      (alternative, index) => `
        <div class="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-4 shadow-[0_20px_38px_-30px_rgba(15,23,42,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_48px_-32px_rgba(30,64,175,0.22)]">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-500">Alterno ${index + 1}</h3>
            <button type="button" data-action="remove-alternative" data-index="${index}" class="action-btn border border-red-200 bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-red-600 transition hover:bg-red-50">Eliminar</button>
          </div>
          <div class="mt-4 grid gap-4">
            <label class="field">
              <span>Titulo</span>
              <input data-action="alternative-title" data-index="${index}" type="text" class="input" value="${escapeAttribute(alternative.title)}" placeholder="Ejemplo: Validacion fallida">
            </label>
            <label class="field">
              <span>Condicion</span>
              <textarea data-action="alternative-condition" data-index="${index}" class="textarea" rows="2" placeholder="Condicion que activa este flujo">${escapeHtml(alternative.condition)}</textarea>
            </label>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm font-semibold text-slate-700">Pasos del alterno</span>
                <button type="button" data-action="add-alternative-step" data-index="${index}" class="action-btn action-btn-secondary">Agregar paso</button>
              </div>
              ${alternative.steps
                .map(
                  (step, stepIndex) => `
                    <div class="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.24)]">
                      <div class="mb-2 flex items-center justify-between gap-4">
                        <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Paso ${stepIndex + 1}</p>
                        <button type="button" data-action="remove-alternative-step" data-index="${index}" data-step-index="${stepIndex}" class="action-btn border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45" ${alternative.steps.length === 1 ? "disabled" : ""}>Eliminar</button>
                      </div>
                      <textarea data-action="alternative-step-input" data-index="${index}" data-step-index="${stepIndex}" class="textarea min-h-20" rows="2" placeholder="Describe el paso del flujo alterno">${escapeHtml(step)}</textarea>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function renderPreview() {
  const { fields } = state;

  setTextContent(preview.courseName, fields.courseName);
  setTextContent(preview.studentName, fields.studentName);
  setTextContent(preview.studentId, fields.studentId);
  setTextContent(preview.teacherName, fields.teacherName);
  setTextContent(preview.systemName, fields.systemName);
  setTextContent(preview.useCaseId, fields.useCaseId);
  setTextContent(preview.version, fields.version);
  setTextContent(preview.date, fields.date, formatDate);
  setTextContent(preview.useCaseName, fields.useCaseName);
  setTextContent(preview.primaryActor, fields.primaryActor);
  setTextContent(preview.secondaryActors, fields.secondaryActors);
  setTextContent(preview.trigger, fields.trigger);
  setTextContent(preview.validationLabel, fields.validationLabel);

  setRichContent(preview.objective, fields.objective);
  setRichContent(preview.briefDescription, fields.briefDescription);
  setRichContent(preview.preconditions, fields.preconditions);
  setRichContent(preview.postconditions, fields.postconditions);
  setRichContent(preview.assumptions, fields.assumptions);
  setRichContent(preview.fulfilledRequirements, fields.fulfilledRequirements);
  setRichContent(preview.observations, fields.observations);
  setRichContent(preview.analystNotes, fields.analystNotes);

  preview.priorityBadge.textContent = `Prioridad: ${fields.priority}`;
  preview.priorityBadge.className = `badge ${getPriorityClasses(fields.priority)}`;
  preview.riskBadge.textContent = `Riesgo: ${fields.risk}`;
  preview.riskBadge.className = `badge ${getRiskClasses(fields.risk)}`;

  preview.mainSteps.innerHTML = state.mainSteps
    .map((step, index) => {
      const content = normalizeText(step) || EMPTY_TEXT;
      return `
        <li class="step-card">
          <span class="step-index">${index + 1}</span>
          <p class="${normalizeText(step) ? "text-slate-700" : "text-slate-400"}">${escapeHtml(content)}</p>
        </li>
      `;
    })
    .join("");

  if (state.alternatives.length === 0) {
    preview.alternatives.innerHTML = `<div class="rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] p-5 text-slate-400">${EMPTY_TEXT}</div>`;
  } else {
    preview.alternatives.innerHTML = state.alternatives
      .map((alternative, index) => `
        <article class="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="font-[Merriweather] text-xl font-bold text-slate-950">${escapeHtml(normalizeText(alternative.title) || `Alterno ${index + 1}`)}</h3>
            <span class="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Extension ${index + 1}</span>
          </div>
          <p class="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Condicion</p>
          <p class="mt-2 ${normalizeText(alternative.condition) ? "text-slate-700" : "text-slate-400"}">${escapeHtml(normalizeText(alternative.condition) || EMPTY_TEXT)}</p>
          <ol class="mt-4 space-y-2">
            ${alternative.steps
              .map((step, stepIndex) => `
                <li class="flex gap-3 rounded-xl bg-white px-4 py-3 text-sm shadow-[0_10px_20px_-20px_rgba(15,23,42,0.25)]">
                  <span class="font-bold text-sky-700">${stepIndex + 1}.</span>
                  <span class="${normalizeText(step) ? "text-slate-700" : "text-slate-400"}">${escapeHtml(normalizeText(step) || EMPTY_TEXT)}</span>
                </li>
              `)
              .join("")}
          </ol>
        </article>
      `)
      .join("");
  }

  renderValidationAlert();
}

function renderFormFields() {
  document.querySelectorAll("[data-field]").forEach((field) => {
    const key = field.dataset.field;
    if (!key) {
      return;
    }

    field.value = state.fields[key] ?? "";
  });
}

function renderValidationAlert() {
  const errors = getValidationErrors();
  if (errors.length === 0) {
    elements.alert.classList.add("hidden");
    elements.alert.textContent = "";
    return;
  }

  elements.alert.classList.remove("hidden");
  elements.alert.innerHTML = `
    <p class="font-bold">Faltan datos esenciales para una entrega formal.</p>
    <p class="mt-1">${errors.join(" ")}</p>
  `;
}

function getValidationErrors() {
  const { fields } = state;
  const errors = [];

  if (!normalizeText(fields.useCaseName)) {
    errors.push("El nombre del caso de uso es obligatorio.");
  }
  if (!normalizeText(fields.objective)) {
    errors.push("El objetivo es obligatorio.");
  }
  if (!normalizeText(fields.primaryActor)) {
    errors.push("El actor principal es obligatorio.");
  }
  if (!state.mainSteps.some((step) => normalizeText(step))) {
    errors.push("Debes registrar al menos un paso en el flujo principal.");
  }

  return errors;
}

function syncAll() {
  commit();
}

function updateField(name, value) {
  state.fields[name] = value;
  commit("preview");
}

function addMainStep() {
  state.mainSteps.push("");
  commit("mainStepsEditor", "preview");
}

function removeMainStep(index) {
  if (state.mainSteps.length === 1) {
    return;
  }
  state.mainSteps.splice(index, 1);
  commit("mainStepsEditor", "preview");
}

function addAlternative() {
  state.alternatives.push({
    title: "",
    condition: "",
    steps: [""]
  });
  commit("alternativesEditor", "preview");
}

function removeAlternative(index) {
  state.alternatives.splice(index, 1);
  commit("alternativesEditor", "preview");
}

function addAlternativeStep(index) {
  state.alternatives[index].steps.push("");
  commit("alternativesEditor", "preview");
}

function removeAlternativeStep(index, stepIndex) {
  if (state.alternatives[index].steps.length === 1) {
    return;
  }
  state.alternatives[index].steps.splice(stepIndex, 1);
  commit("alternativesEditor", "preview");
}

function loadDemoData() {
  state.fields = { ...DEMO_DATA };
  state.mainSteps = [...DEMO_MAIN_STEPS];
  state.alternatives = DEMO_ALTERNATIVES.map((alternative) => ({
    title: alternative.title,
    condition: alternative.condition,
    steps: [...alternative.steps]
  }));
  syncAll();
}

function clearForm() {
  state.fields = { ...FIELD_DEFAULTS, date: getToday() };
  state.mainSteps = [""];
  state.alternatives = [];
  syncAll();
}

function handlePrint() {
  const errors = getValidationErrors();
  if (errors.length > 0) {
    renderValidationAlert();
    elements.alert.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  window.print();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function bindEvents() {
  elements.form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.matches("[data-field]")) {
      updateField(target.dataset.field, target.value);
      return;
    }

    if (target.matches('[data-action="main-step-input"]')) {
      state.mainSteps[Number(target.dataset.index)] = target.value;
      commit("preview");
      return;
    }

    if (target.matches('[data-action="alternative-title"]')) {
      state.alternatives[Number(target.dataset.index)].title = target.value;
      commit("preview");
      return;
    }

    if (target.matches('[data-action="alternative-condition"]')) {
      state.alternatives[Number(target.dataset.index)].condition = target.value;
      commit("preview");
      return;
    }

    if (target.matches('[data-action="alternative-step-input"]')) {
      state.alternatives[Number(target.dataset.index)].steps[Number(target.dataset.stepIndex)] = target.value;
      commit("preview");
    }
  });

  elements.form.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    if (!action) {
      return;
    }

    if (action === "remove-main-step") {
      removeMainStep(Number(target.dataset.index));
      return;
    }

    if (action === "remove-alternative") {
      removeAlternative(Number(target.dataset.index));
      return;
    }

    if (action === "add-alternative-step") {
      addAlternativeStep(Number(target.dataset.index));
      return;
    }

    if (action === "remove-alternative-step") {
      removeAlternativeStep(Number(target.dataset.index), Number(target.dataset.stepIndex));
    }
  });

  elements.addMainStepBtn.addEventListener("click", addMainStep);
  elements.addAlternativeBtn.addEventListener("click", addAlternative);
  elements.loadDemoBtn.addEventListener("click", loadDemoData);
  elements.clearFormBtn.addEventListener("click", clearForm);
  elements.printBtn.addEventListener("click", handlePrint);
}

function init() {
  bindEvents();
  syncAll();
}

init();
