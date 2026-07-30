const contactFieldMessages = {
  "contato-nome": "Informe seu nome completo.",
  "contato-email": "Informe um endereço de e-mail válido.",
  "contato-telefone": "Informe um telefone válido.",
  "contato-categoria": "Selecione a categoria do solicitante.",
  "contato-assunto": "Selecione o assunto da mensagem.",
  "contato-titulo": "Informe o título da mensagem.",
  "contato-mensagem": "Escreva uma mensagem com pelo menos 20 caracteres.",
  "contato-retorno": "Selecione a forma preferencial de retorno.",
  "contato-privacidade": "Você precisa aceitar a Política de Privacidade.",
  "contato-seguranca": "Confirme que não inseriu informações sigilosas."
};

const contactFieldLabels = {
  "contato-nome": "Nome completo",
  "contato-email": "E-mail",
  "contato-telefone": "Telefone",
  "contato-categoria": "Categoria do solicitante",
  "contato-assunto": "Assunto",
  "contato-titulo": "Título da mensagem",
  "contato-mensagem": "Mensagem",
  "contato-retorno": "Forma preferencial de retorno",
  "contato-privacidade": "Aceite da Política de Privacidade",
  "contato-seguranca": "Declaração de segurança"
};

const MESSAGE_MAX_LENGTH = 1500;

function onlyDigitsContact(value = "") {
  return value.replace(/\D/g, "");
}

function formatTelefoneContact(value) {
  const digits = onlyDigitsContact(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function setContactFieldError(form, fieldId, message) {
  const errorEl = form.querySelector(`#${fieldId}-erro`);
  const wrapper = errorEl?.closest(".contact-field, .contact-radio-group, .contact-checkbox-field");
  const inputs = form.querySelectorAll(`#${fieldId}, [name="${fieldId.replace("contato-", "")}"]`);

  if (!errorEl) return;

  if (message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    wrapper?.classList.add("is-invalid");
    inputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
  } else {
    errorEl.textContent = "";
    errorEl.hidden = true;
    wrapper?.classList.remove("is-invalid");
    inputs.forEach((input) => input.removeAttribute("aria-invalid"));
  }
}

function validateContactForm(form) {
  const errors = [];
  const value = (id) => form.querySelector(`#${id}`)?.value.trim() || "";
  const checked = (id) => Boolean(form.querySelector(`#${id}`)?.checked);

  const nome = value("contato-nome");
  if (!nome || nome.length < 3) {
    errors.push({ id: "contato-nome", message: contactFieldMessages["contato-nome"] });
  }

  const email = value("contato-email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ id: "contato-email", message: contactFieldMessages["contato-email"] });
  }

  const telefone = value("contato-telefone");
  if (telefone && onlyDigitsContact(telefone).length < 10) {
    errors.push({ id: "contato-telefone", message: contactFieldMessages["contato-telefone"] });
  }

  if (!value("contato-categoria")) {
    errors.push({ id: "contato-categoria", message: contactFieldMessages["contato-categoria"] });
  }

  if (!value("contato-assunto")) {
    errors.push({ id: "contato-assunto", message: contactFieldMessages["contato-assunto"] });
  }

  const titulo = value("contato-titulo");
  if (!titulo || titulo.length < 5 || titulo.length > 120) {
    errors.push({ id: "contato-titulo", message: contactFieldMessages["contato-titulo"] });
  }

  const mensagem = value("contato-mensagem");
  if (!mensagem || mensagem.length < 20 || mensagem.length > MESSAGE_MAX_LENGTH) {
    errors.push({ id: "contato-mensagem", message: contactFieldMessages["contato-mensagem"] });
  }

  if (!form.querySelector('[name="retorno"]:checked')) {
    errors.push({ id: "contato-retorno", message: contactFieldMessages["contato-retorno"] });
  }

  if (!checked("contato-privacidade")) {
    errors.push({ id: "contato-privacidade", message: contactFieldMessages["contato-privacidade"] });
  }

  if (!checked("contato-seguranca")) {
    errors.push({ id: "contato-seguranca", message: contactFieldMessages["contato-seguranca"] });
  }

  return errors;
}

function renderContactErrorSummary(form, errors) {
  const summary = form.querySelector("[data-contato-error-summary]");
  const list = form.querySelector("[data-contato-error-list]");
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
    link.textContent = `${contactFieldLabels[id] || "Campo"}: ${message}`;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      focusField(form, id);
    });
    item.append(link);
    return item;
  }));
  summary.hidden = false;
}

function focusField(form, fieldId) {
  const direct = form.querySelector(`#${fieldId}`);
  if (direct) {
    direct.focus();
    return;
  }
  const group = form.querySelector(`[name="${fieldId.replace("contato-", "")}"]`);
  group?.focus();
}

function clearAllContactErrors(form) {
  Object.keys(contactFieldMessages).forEach((id) => setContactFieldError(form, id, ""));
  renderContactErrorSummary(form, []);
}

function initializePhoneMask(form) {
  const telefone = form.querySelector("#contato-telefone");
  telefone?.addEventListener("input", () => {
    telefone.value = formatTelefoneContact(telefone.value);
  });
}

function initializeCharCounter(form) {
  const mensagem = form.querySelector("#contato-mensagem");
  const counter = form.querySelector("[data-contato-counter]");
  if (!mensagem || !counter) return;

  function update() {
    const length = mensagem.value.length;
    counter.textContent = `${length} de ${MESSAGE_MAX_LENGTH} caracteres`;
  }

  mensagem.addEventListener("input", update);
  update();
}

function initializePrivacyModal() {
  const modal = document.querySelector("[data-contato-privacy-modal]");
  if (!modal) return;
  let lastTrigger = null;

  function open(trigger) {
    lastTrigger = trigger;
    document.body.classList.add("modal-open");
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    modal.querySelector("[data-contato-privacy-close]")?.focus();
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

  document.querySelectorAll("[data-contato-privacy-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger);
    });
  });

  modal.querySelectorAll("[data-contato-privacy-close]").forEach((button) => {
    button.addEventListener("click", close);
  });

  modal.querySelector("[data-contato-privacy-accept]")?.addEventListener("click", () => {
    const checkbox = document.querySelector("#contato-privacidade");
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

function initializeConfirmationModal(form) {
  const modal = document.querySelector("[data-contato-confirmation-modal]");
  if (!modal) return;
  let lastTrigger = null;

  function open(trigger) {
    lastTrigger = trigger;
    document.body.classList.add("modal-open");
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
    modal.querySelector("h2")?.focus();
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

  function resetAndClose() {
    form.reset();
    clearAllContactErrors(form);
    const counter = form.querySelector("[data-contato-counter]");
    if (counter) counter.textContent = `0 de ${MESSAGE_MAX_LENGTH} caracteres`;
    close();
  }

  modal.querySelectorAll("[data-contato-confirmation-close]").forEach((button) => {
    button.addEventListener("click", close);
  });

  modal.querySelector("[data-contato-confirmation-restart]")?.addEventListener("click", resetAndClose);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastTrigger?.focus();
  });

  return { open };
}

function initializeAccordion() {
  document.querySelectorAll("[data-contato-accordion-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      const panelId = trigger.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (panel) panel.hidden = expanded;
    });
  });
}

function initializeContactForm() {
  const form = document.querySelector("[data-contato-form]");
  if (!form) return;

  initializePhoneMask(form);
  initializeCharCounter(form);
  const confirmationModal = initializeConfirmationModal(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = validateContactForm(form);
    clearAllContactErrors(form);
    errors.forEach(({ id, message }) => setContactFieldError(form, id, message));
    renderContactErrorSummary(form, errors);

    if (errors.length) {
      const summary = form.querySelector("[data-contato-error-summary]");
      summary?.scrollIntoView({ behavior: "smooth", block: "start" });
      focusField(form, errors[0].id);
      return;
    }

    const submitButton = form.querySelector("[data-contato-submit]");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Validando mensagem...";

    window.setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      confirmationModal?.open(submitButton);
    }, 900);
  });

  form.querySelectorAll("[data-contato-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("Deseja realmente limpar todos os campos preenchidos?")) return;
      form.reset();
      clearAllContactErrors(form);
      const counter = form.querySelector("[data-contato-counter]");
      if (counter) counter.textContent = `0 de ${MESSAGE_MAX_LENGTH} caracteres`;
      form.querySelector("#contato-nome")?.focus();
    });
  });
}

initializeContactForm();
initializePrivacyModal();
initializeAccordion();
