const filiationFieldMessages = {
  "filiacao-nome": "Informe seu nome completo.",
  "filiacao-cpf": "Informe um CPF com 11 números.",
  "filiacao-nascimento": "Informe uma data de nascimento válida.",
  "filiacao-email": "Informe um endereço de e-mail válido.",
  "filiacao-telefone": "Informe um telefone válido.",
  "filiacao-endereco": "Informe seu endereço completo.",
  "filiacao-cidade": "Informe sua cidade.",
  "filiacao-estado": "Selecione seu estado.",
  "filiacao-cep": "Informe um CEP com 8 números.",
  "filiacao-matricula": "Informe sua matrícula funcional.",
  "filiacao-orgao": "Informe o órgão ou instituição.",
  "filiacao-unidade": "Informe a unidade ou setor.",
  "filiacao-cargo": "Informe seu cargo ou função.",
  "filiacao-situacao": "Selecione sua situação funcional.",
  "filiacao-municipio": "Informe o município de exercício.",
  "filiacao-vinculo": "Selecione o tipo de vínculo.",
  "filiacao-decl-veracidade": "Confirme as declarações obrigatórias.",
  "filiacao-decl-regras": "Confirme as declarações obrigatórias.",
  "filiacao-decl-privacidade": "Você precisa aceitar a política de privacidade para continuar.",
  "filiacao-decl-ciencia": "Confirme as declarações obrigatórias."
};

const filiationFieldLabels = {
  "filiacao-nome": "Nome completo",
  "filiacao-cpf": "CPF",
  "filiacao-nascimento": "Data de nascimento",
  "filiacao-email": "E-mail",
  "filiacao-telefone": "Telefone ou celular",
  "filiacao-endereco": "Endereço completo",
  "filiacao-cidade": "Cidade",
  "filiacao-estado": "Estado",
  "filiacao-cep": "CEP",
  "filiacao-matricula": "Matrícula funcional",
  "filiacao-orgao": "Órgão ou instituição",
  "filiacao-unidade": "Unidade ou setor",
  "filiacao-cargo": "Cargo ou função",
  "filiacao-situacao": "Situação funcional",
  "filiacao-municipio": "Município de exercício",
  "filiacao-vinculo": "Tipo de vínculo",
  "filiacao-decl-veracidade": "Declaração de veracidade",
  "filiacao-decl-regras": "Declaração de ciência das regras",
  "filiacao-decl-privacidade": "Autorização de tratamento de dados",
  "filiacao-decl-ciencia": "Ciência sobre a filiação não automática"
};

function onlyDigits(value = "") {
  return value.replace(/\D/g, "");
}

function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  let formatted = parts.join(".");
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  return formatted;
}

function formatTelefone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function formatCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function initializeFieldMasks(form) {
  const cpf = form.querySelector("#filiacao-cpf");
  const telefone = form.querySelector("#filiacao-telefone");
  const cep = form.querySelector("#filiacao-cep");
  cpf?.addEventListener("input", () => { cpf.value = formatCpf(cpf.value); });
  telefone?.addEventListener("input", () => { telefone.value = formatTelefone(telefone.value); });
  cep?.addEventListener("input", () => { cep.value = formatCep(cep.value); });
}

function setFieldError(form, fieldId, message) {
  const field = form.querySelector(`#${fieldId}`);
  const errorEl = form.querySelector(`#${fieldId}-erro`);
  const wrapper = field?.closest(".filiation-field");
  if (!field || !errorEl) return;
  if (message) {
    field.setAttribute("aria-invalid", "true");
    errorEl.textContent = message;
    errorEl.hidden = false;
    wrapper?.classList.add("is-invalid");
  } else {
    field.removeAttribute("aria-invalid");
    errorEl.textContent = "";
    errorEl.hidden = true;
    wrapper?.classList.remove("is-invalid");
  }
}

function validateFiliationForm(form) {
  const errors = [];
  const value = (id) => form.querySelector(`#${id}`)?.value.trim() || "";
  const checked = (id) => Boolean(form.querySelector(`#${id}`)?.checked);

  const requiredTextFields = [
    "filiacao-nome", "filiacao-endereco", "filiacao-cidade", "filiacao-estado", "filiacao-matricula",
    "filiacao-orgao", "filiacao-unidade", "filiacao-cargo", "filiacao-situacao", "filiacao-municipio",
    "filiacao-vinculo"
  ];

  requiredTextFields.forEach((id) => {
    if (!value(id)) errors.push({ id, message: filiationFieldMessages[id] });
  });

  if (value("filiacao-nome") && value("filiacao-nome").length < 3) {
    errors.push({ id: "filiacao-nome", message: filiationFieldMessages["filiacao-nome"] });
  }

  const cpfDigits = onlyDigits(value("filiacao-cpf"));
  if (cpfDigits.length !== 11) {
    errors.push({ id: "filiacao-cpf", message: filiationFieldMessages["filiacao-cpf"] });
  }

  const nascimento = value("filiacao-nascimento");
  const nascimentoDate = nascimento ? new Date(nascimento) : null;
  if (!nascimento || Number.isNaN(nascimentoDate?.getTime()) || nascimentoDate > new Date()) {
    errors.push({ id: "filiacao-nascimento", message: filiationFieldMessages["filiacao-nascimento"] });
  }

  const email = value("filiacao-email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ id: "filiacao-email", message: filiationFieldMessages["filiacao-email"] });
  }

  const telefoneDigits = onlyDigits(value("filiacao-telefone"));
  if (telefoneDigits.length < 10) {
    errors.push({ id: "filiacao-telefone", message: filiationFieldMessages["filiacao-telefone"] });
  }

  const cepDigits = onlyDigits(value("filiacao-cep"));
  if (cepDigits.length !== 8) {
    errors.push({ id: "filiacao-cep", message: filiationFieldMessages["filiacao-cep"] });
  }

  ["filiacao-decl-veracidade", "filiacao-decl-regras", "filiacao-decl-privacidade", "filiacao-decl-ciencia"].forEach((id) => {
    if (!checked(id)) errors.push({ id, message: filiationFieldMessages[id] });
  });

  return errors;
}

function renderErrorSummary(form, errors) {
  const summary = document.querySelector("[data-filiacao-error-summary]");
  const list = document.querySelector("[data-filiacao-error-list]");
  if (!summary || !list) return;
  if (!errors.length) {
    summary.hidden = true;
    list.replaceChildren();
    return;
  }
  list.replaceChildren(...errors.map(({ id, message }) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = `${filiationFieldLabels[id] || "Campo"}: ${message}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      form.querySelector(`#${id}`)?.focus();
    });
    item.append(link);
    return item;
  }));
  summary.hidden = false;
}

function initializeFileUploads(form) {
  form.querySelectorAll("[data-filiacao-upload]").forEach((wrapper) => {
    const input = wrapper.querySelector("input[type='file']");
    const nameEl = wrapper.querySelector("[data-filiacao-upload-name]");
    const removeButton = wrapper.querySelector("[data-filiacao-upload-remove]");
    const warningEl = wrapper.querySelector("[data-filiacao-upload-warning]");
    const maxBytes = 5 * 1024 * 1024;

    input?.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        nameEl.textContent = "Nenhum arquivo selecionado.";
        wrapper.classList.remove("has-file");
        warningEl.hidden = true;
        return;
      }
      nameEl.textContent = file.name;
      wrapper.classList.add("has-file");
      warningEl.hidden = file.size <= maxBytes;
    });

    removeButton?.addEventListener("click", () => {
      input.value = "";
      nameEl.textContent = "Nenhum arquivo selecionado.";
      wrapper.classList.remove("has-file");
      warningEl.hidden = true;
      input.focus();
    });
  });
}

function initializePrivacyModal() {
  const modal = document.querySelector("[data-filiacao-privacy-modal]");
  if (!modal) return;
  let lastTrigger = null;

  function open(trigger) {
    lastTrigger = trigger;
    document.body.classList.add("modal-open");
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    modal.querySelector("[data-filiacao-privacy-close]")?.focus();
  }

  function close() {
    if (!modal.hasAttribute("open")) return;
    if (typeof modal.close === "function") modal.close();
    else {
      modal.removeAttribute("open");
      document.body.classList.remove("modal-open");
      lastTrigger?.focus();
    }
  }

  document.querySelectorAll("[data-filiacao-privacy-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger);
    });
  });

  modal.querySelectorAll("[data-filiacao-privacy-close]").forEach((button) => {
    button.addEventListener("click", close);
  });

  modal.querySelector("[data-filiacao-privacy-accept]")?.addEventListener("click", () => {
    const checkbox = document.querySelector("#filiacao-decl-privacidade");
    if (checkbox) checkbox.checked = true;
    close();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastTrigger?.focus();
  });
}

function initializeAccordion() {
  document.querySelectorAll("[data-filiacao-accordion-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      const panelId = trigger.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (panel) panel.hidden = expanded;
    });
  });
}

function resetUploads(form) {
  form.querySelectorAll("[data-filiacao-upload]").forEach((wrapper) => {
    const nameEl = wrapper.querySelector("[data-filiacao-upload-name]");
    const warningEl = wrapper.querySelector("[data-filiacao-upload-warning]");
    wrapper.classList.remove("has-file");
    if (nameEl) nameEl.textContent = "Nenhum arquivo selecionado.";
    if (warningEl) warningEl.hidden = true;
  });
}

function clearAllErrors(form) {
  Object.keys(filiationFieldMessages).forEach((id) => setFieldError(form, id, ""));
  renderErrorSummary(form, []);
}

function getReviewLabel(form, field) {
  if (field.type === "file") {
    return field.closest("[data-filiacao-upload]")?.querySelector("strong")?.textContent || "";
  }
  const label = field.closest("label")?.querySelector("span") || form.querySelector(`label[for="${field.id}"]`);
  return (label?.textContent || "").replace(/\s*\*\s*$/, "");
}

function getReviewValue(field) {
  if (field.type === "file") return field.files?.[0]?.name || "Nenhum arquivo selecionado.";
  if (field.type === "checkbox") return field.checked ? "Sim" : "Não";
  if (!field.value.trim()) return "Não informado";
  if (field.tagName === "SELECT") return field.selectedOptions[0].textContent;
  if (field.type === "date") return field.value.split("-").reverse().join("/");
  return field.value.trim();
}

function renderFiliationReview(form, container, steps, goToStep) {
  container.replaceChildren(...steps.slice(0, -1).map((step, index) => {
    const group = document.createElement("section");
    group.className = "filiation-review__group";

    const header = document.createElement("div");
    header.className = "filiation-review__header";
    const title = document.createElement("h3");
    title.textContent = step.dataset.filiacaoStepTitle;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "filiation-review__edit";
    edit.textContent = "Alterar";
    edit.setAttribute("aria-label", `Alterar ${step.dataset.filiacaoStepTitle}`);
    edit.addEventListener("click", () => goToStep(index));
    header.append(title, edit);

    const list = document.createElement("dl");
    list.className = "filiation-review__list";
    step.querySelectorAll("input, select").forEach((field) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = getReviewLabel(form, field);
      detail.textContent = getReviewValue(field);
      row.append(term, detail);
      list.append(row);
    });

    group.append(header, list);
    return group;
  }));
}

// Estado exclusivo do protótipo: guarda apenas o protocolo e a situação demonstrativos.
// Nenhum dado pessoal do formulário ou da consulta é gravado no navegador.
const FILIATION_DEMO_STORAGE_KEY = "sinprotec.filiacao.demo";
const FILIATION_DEMO_REQUEST = { protocolo: "FIL-2026-0001", situacao: "Em análise" };
let filiationDemoRequestInMemory = null;

function saveFiliationDemoRequest() {
  filiationDemoRequestInMemory = FILIATION_DEMO_REQUEST;
  try {
    sessionStorage.setItem(FILIATION_DEMO_STORAGE_KEY, JSON.stringify(FILIATION_DEMO_REQUEST));
  } catch {
    // Sem sessionStorage, o estado permanece apenas em memória até recarregar a página.
  }
}

function loadFiliationDemoRequest() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(FILIATION_DEMO_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Mesmo fallback em memória de saveFiliationDemoRequest.
  }
  return filiationDemoRequestInMemory;
}

function initializeFiliationTracking() {
  const drawer = document.querySelector("[data-acompanhamento-drawer]");
  const trigger = document.querySelector("[data-acompanhamento-open]");
  if (!drawer || !trigger) return () => {};

  const form = drawer.querySelector("[data-acompanhamento-form]");
  const title = drawer.querySelector("[data-acompanhamento-title]");
  const protocolInput = drawer.querySelector("#acompanhamento-protocolo");
  const result = drawer.querySelector("[data-acompanhamento-result]");
  const notFound = drawer.querySelector("[data-acompanhamento-not-found]");
  let pressStartedOnOverlay = false;

  function showForm() {
    form.reset();
    setFieldError(form, "acompanhamento-protocolo", "");
    result.hidden = true;
    notFound.hidden = true;
    form.hidden = false;
  }

  function showResult(request) {
    drawer.querySelector("[data-acompanhamento-protocolo]").textContent = request.protocolo;
    drawer.querySelector("[data-acompanhamento-situacao]").textContent = request.situacao;
    form.reset();
    form.hidden = true;
    result.hidden = false;
    drawer.querySelector("[data-acompanhamento-result-title]").focus();
  }

  function showNotFound() {
    form.reset();
    form.hidden = true;
    notFound.hidden = false;
    drawer.querySelector("[data-acompanhamento-not-found-message]").focus();
  }

  function open() {
    document.body.classList.add("filiation-drawer-open");
    trigger.setAttribute("aria-expanded", "true");
    drawer.showModal();
    title.focus();
  }

  trigger.addEventListener("click", open);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const protocol = protocolInput.value.trim().toUpperCase();
    if (!protocol) {
      setFieldError(form, "acompanhamento-protocolo", "Informe o protocolo da solicitação.");
      protocolInput.focus();
      return;
    }
    setFieldError(form, "acompanhamento-protocolo", "");
    const request = loadFiliationDemoRequest();
    if (request?.protocolo === protocol) showResult(request);
    else showNotFound();
  });

  drawer.querySelectorAll("[data-acompanhamento-reset]").forEach((button) => {
    button.addEventListener("click", () => {
      showForm();
      protocolInput.focus();
    });
  });

  drawer.querySelector("[data-acompanhamento-close]")?.addEventListener("click", () => drawer.close());

  drawer.addEventListener("mousedown", (event) => {
    pressStartedOnOverlay = event.target === drawer;
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer && pressStartedOnOverlay) drawer.close();
  });

  drawer.addEventListener("close", () => {
    document.body.classList.remove("filiation-drawer-open");
    trigger.setAttribute("aria-expanded", "false");
    showForm();
    trigger.focus();
  });

  return () => {
    open();
    showResult(loadFiliationDemoRequest());
  };
}

function initializeFiliationForm(openTracking) {
  const form = document.querySelector("[data-filiacao-form]");
  const drawer = document.querySelector("[data-filiacao-drawer]");
  if (!form || !drawer) return;

  const confirmationSection = document.querySelector("[data-filiacao-confirmation]");
  const progress = drawer.querySelector("[data-filiacao-progress]");
  const stepper = drawer.querySelector("[data-filiacao-stepper]");
  const stepStatus = drawer.querySelector("[data-filiacao-step-status]");
  const drawerTitle = drawer.querySelector("[data-filiacao-drawer-title]");
  const formBody = drawer.querySelector("[data-filiacao-body]");
  const backButton = drawer.querySelector("[data-filiacao-back]");
  const nextButton = drawer.querySelector("[data-filiacao-next]");
  const review = drawer.querySelector("[data-filiacao-review]");
  const steps = [...form.querySelectorAll("[data-filiacao-step]")];
  const triggers = [...document.querySelectorAll("[data-filiacao-drawer-open]")];
  const lastStep = steps.length - 1;
  let currentStep = 0;
  let isCompleted = false;
  let lastTrigger = null;
  let pressStartedOnOverlay = false;

  initializeFieldMasks(form);
  initializeFileUploads(form);

  const stepItems = steps.map((step, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filiation-stepper__button";
    button.addEventListener("click", () => goToStep(index));
    item.className = "filiation-stepper__item";
    item.append(button);
    return item;
  });
  stepper.replaceChildren(...stepItems);

  function renderStep() {
    steps.forEach((step, index) => { step.hidden = index !== currentStep; });

    stepItems.forEach((item, index) => {
      const button = item.firstElementChild;
      const title = steps[index].dataset.filiacaoStepTitle;
      const isDone = index < currentStep;
      item.classList.toggle("is-current", index === currentStep);
      item.classList.toggle("is-done", isDone);
      button.disabled = index > currentStep;
      button.setAttribute("aria-label", `Etapa ${index + 1}: ${title}${isDone ? " (concluída)" : ""}`);
      button.title = title;
      if (index === currentStep) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      if (isDone) {
        const icon = document.createElement("i");
        icon.className = "bi bi-check-lg";
        icon.setAttribute("aria-hidden", "true");
        button.replaceChildren(icon);
      } else {
        button.textContent = String(index + 1);
      }
    });

    stepStatus.textContent = `Etapa ${currentStep + 1} de ${steps.length}: ${steps[currentStep].dataset.filiacaoStepTitle}`;
    backButton.hidden = currentStep === 0;
    if (currentStep === lastStep) {
      renderFiliationReview(form, review, steps, goToStep);
      nextButton.textContent = "Enviar solicitação";
    } else {
      nextButton.textContent = currentStep === lastStep - 1 ? "Revisar solicitação" : "Continuar";
    }
  }

  function goToStep(index) {
    currentStep = index;
    clearAllErrors(form);
    renderStep();
    formBody.scrollTop = 0;
    stepStatus.focus({ preventScroll: true });
  }

  function hasProgress() {
    if (currentStep > 0) return true;
    return [...form.elements].some((field) => {
      if (field.type === "checkbox") return field.checked;
      return ["INPUT", "SELECT"].includes(field.tagName) && Boolean(field.value);
    });
  }

  function updateTriggers(expanded) {
    const label = hasProgress() ? "Continuar solicitação" : "Iniciar solicitação";
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(expanded));
      trigger.querySelector("[data-filiacao-drawer-label]").textContent = label;
    });
  }

  function resetFlow() {
    form.reset();
    resetUploads(form);
    clearAllErrors(form);
    isCompleted = false;
    currentStep = 0;
    confirmationSection.hidden = true;
    progress.hidden = false;
    form.hidden = false;
    renderStep();
    formBody.scrollTop = 0;
  }

  function showErrors(errors) {
    clearAllErrors(form);
    errors.forEach(({ id, message }) => setFieldError(form, id, message));
    renderErrorSummary(form, errors);
    formBody.scrollTop = 0;
    document.querySelector("[data-filiacao-error-summary]")?.focus({ preventScroll: true });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = validateFiliationForm(form);
    const stepOf = ({ id }) => steps.findIndex((step) => step.querySelector(`#${id}`));

    if (currentStep < lastStep) {
      const stepErrors = errors.filter((error) => stepOf(error) === currentStep);
      if (stepErrors.length) showErrors(stepErrors);
      else goToStep(currentStep + 1);
      return;
    }

    if (errors.length) {
      const firstInvalidStep = Math.min(...errors.map(stepOf));
      if (firstInvalidStep !== currentStep) goToStep(firstInvalidStep);
      showErrors(errors.filter((error) => stepOf(error) === firstInvalidStep));
      return;
    }

    isCompleted = true;
    saveFiliationDemoRequest();
    progress.hidden = true;
    form.hidden = true;
    confirmationSection.hidden = false;
    confirmationSection.querySelector("h2")?.focus();
  });

  backButton.addEventListener("click", () => goToStep(currentStep - 1));

  form.querySelectorAll("[data-filiacao-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("Deseja realmente limpar todos os campos preenchidos?")) return;
      resetFlow();
      form.querySelector("#filiacao-nome")?.focus();
    });
  });

  drawer.querySelector("[data-filiacao-confirmation-close]")?.addEventListener("click", () => drawer.close());

  drawer.querySelector("[data-filiacao-track]")?.addEventListener("click", () => {
    // Abre após o evento close, que é assíncrono e restaura o estado da página.
    drawer.addEventListener("close", openTracking, { once: true });
    drawer.close();
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      lastTrigger = trigger;
      document.body.classList.add("filiation-drawer-open");
      updateTriggers(true);
      drawer.showModal();
      drawerTitle.focus();
    });
  });

  drawer.querySelector("[data-filiacao-drawer-close]")?.addEventListener("click", () => drawer.close());

  drawer.addEventListener("mousedown", (event) => {
    pressStartedOnOverlay = event.target === drawer;
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer && pressStartedOnOverlay) drawer.close();
  });

  drawer.addEventListener("close", () => {
    document.body.classList.remove("filiation-drawer-open");
    if (isCompleted) resetFlow();
    updateTriggers(false);
    lastTrigger?.focus();
  });

  renderStep();
}

function initializeFiliationTabs() {
  const tabs = [...document.querySelectorAll("[data-filiacao-tab]")];

  function selectTab(selected, moveFocus = false) {
    tabs.forEach((tab) => {
      const isSelected = tab === selected;
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !isSelected;
    });
    selected.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    if (moveFocus) selected.focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));
    tab.addEventListener("keydown", (event) => {
      const targets = {
        ArrowRight: tabs[(index + 1) % tabs.length],
        ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
        Home: tabs[0],
        End: tabs[tabs.length - 1]
      };
      if (!targets[event.key]) return;
      event.preventDefault();
      selectTab(targets[event.key], true);
    });
  });
}

initializeFiliationForm(initializeFiliationTracking());
initializeFiliationTabs();
initializePrivacyModal();
initializeAccordion();
