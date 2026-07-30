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
  const summary = form.querySelector("[data-filiacao-error-summary]");
  const list = form.querySelector("[data-filiacao-error-list]");
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

function initializeFiliationForm() {
  const form = document.querySelector("[data-filiacao-form]");
  if (!form) return;

  const formSection = document.querySelector("[data-filiacao-form-section]");
  const confirmationSection = document.querySelector("[data-filiacao-confirmation]");

  initializeFieldMasks(form);
  initializeFileUploads(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = validateFiliationForm(form);
    clearAllErrors(form);
    errors.forEach(({ id, message }) => setFieldError(form, id, message));
    renderErrorSummary(form, errors);

    if (errors.length) {
      const summary = form.querySelector("[data-filiacao-error-summary]");
      summary?.scrollIntoView({ behavior: "smooth", block: "start" });
      form.querySelector(`#${errors[0].id}`)?.focus();
      return;
    }

    formSection.hidden = true;
    confirmationSection.hidden = false;
    confirmationSection.scrollIntoView({ behavior: "smooth", block: "start" });
    confirmationSection.querySelector("h2")?.focus();
  });

  form.querySelectorAll("[data-filiacao-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("Deseja realmente limpar todos os campos preenchidos?")) return;
      form.reset();
      resetUploads(form);
      clearAllErrors(form);
      form.querySelector("#filiacao-nome")?.focus();
    });
  });

  document.querySelectorAll("[data-filiacao-restart]").forEach((button) => {
    button.addEventListener("click", () => {
      form.reset();
      resetUploads(form);
      clearAllErrors(form);
      confirmationSection.hidden = true;
      formSection.hidden = false;
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      form.querySelector("#filiacao-nome")?.focus();
    });
  });
}

initializeFiliationForm();
initializePrivacyModal();
initializeAccordion();
