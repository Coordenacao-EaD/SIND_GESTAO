const ADMIN_PROFILE_STORAGE_KEY = "sindGestao.adminDemoProfile";
// Estado exclusivo da demonstração visual: não é autenticação, senha nem token.
const DEMO_ACCESS_STORAGE_KEY = "sindGestao.demoAccessType";

const PROFILE_DESTINATIONS = {
  filiado: { type: "filiado" },
  servidorCadastrado: { type: "servidorCadastrado" },
  administrador: { type: "admin", adminProfile: "administrador" },
  diretoria: { type: "admin", adminProfile: "diretoria" },
  presidencia: { type: "admin", adminProfile: "presidencia" },
  tesouraria: { type: "admin", adminProfile: "tesouraria" },
  secretaria: { type: "admin", adminProfile: "secretaria" },
  conselhoEtica: { type: "admin", adminProfile: "conselhoEtica" },
  conselhoFiscal: { type: "admin", adminProfile: "conselhoFiscal" }
};

const authFieldMessages = {
  "login-email": { empty: "Informe seu e-mail.", invalid: "Informe um endereço de e-mail válido." },
  "login-senha": { empty: "Informe sua senha.", invalid: "A senha deve possuir pelo menos 6 caracteres." },
  "recuperar-email": { empty: "Informe seu e-mail.", invalid: "Informe um endereço de e-mail válido." }
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setAuthFieldError(form, fieldId, message) {
  const field = form.querySelector(`#${fieldId}`);
  const errorEl = form.querySelector(`#${fieldId}-erro`);
  const wrapper = field?.closest(".auth-field");
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

function initializePasswordToggle() {
  document.querySelectorAll("[data-auth-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-auth-toggle-password");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.setAttribute("aria-pressed", String(isHidden));
      button.setAttribute("aria-label", isHidden ? "Ocultar senha" : "Mostrar senha");
      const icon = button.querySelector(".bi");
      if (icon) {
        icon.classList.toggle("bi-eye", !isHidden);
        icon.classList.toggle("bi-eye-slash", isHidden);
      }
    });
  });
}

function preselectStoredAdminProfile(form) {
  const perfilSelect = form.querySelector("#login-perfil");
  if (!perfilSelect) return;

  try {
    const storedProfile = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
    if (PROFILE_DESTINATIONS[storedProfile]?.type === "admin") {
      perfilSelect.value = storedProfile;
    }
  } catch (error) {
    // A persistência é apenas uma conveniência do protótipo.
  }
}

function initializeLoginForm() {
  const form = document.querySelector("[data-auth-login-form]");
  if (!form) return;

  const summary = document.querySelector("[data-auth-login-summary]");
  const summaryList = document.querySelector("[data-auth-login-summary-list]");
  const message = document.querySelector("[data-auth-login-message]");
  const submitButton = form.querySelector("[data-auth-login-submit]");

  preselectStoredAdminProfile(form);

  function clearMessage() {
    if (!message) return;
    message.hidden = true;
    message.textContent = "";
    message.classList.remove("auth-message--error");
  }

  function showMessage(text) {
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
    message.classList.add("auth-message--error");
  }

  function renderSummary(errors) {
    if (!summary || !summaryList) return;
    if (!errors.length) {
      summary.hidden = true;
      summaryList.replaceChildren();
      return;
    }
    summaryList.replaceChildren(...errors.map(({ id, text }) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = text;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        form.querySelector(`#${id}`)?.focus();
      });
      item.append(link);
      return item;
    }));
    summary.hidden = false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    const emailInput = form.querySelector("#login-email");
    const senhaInput = form.querySelector("#login-senha");
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    const errors = [];

    setAuthFieldError(form, "login-email", "");
    setAuthFieldError(form, "login-senha", "");

    if (!email) {
      setAuthFieldError(form, "login-email", authFieldMessages["login-email"].empty);
      errors.push({ id: "login-email", text: authFieldMessages["login-email"].empty });
    } else if (!isValidEmail(email)) {
      setAuthFieldError(form, "login-email", authFieldMessages["login-email"].invalid);
      errors.push({ id: "login-email", text: authFieldMessages["login-email"].invalid });
    }

    if (!senha) {
      setAuthFieldError(form, "login-senha", authFieldMessages["login-senha"].empty);
      errors.push({ id: "login-senha", text: authFieldMessages["login-senha"].empty });
    } else if (senha.length < 6) {
      setAuthFieldError(form, "login-senha", authFieldMessages["login-senha"].invalid);
      errors.push({ id: "login-senha", text: authFieldMessages["login-senha"].invalid });
    }

    renderSummary(errors);

    if (errors.length) {
      summary?.scrollIntoView({ behavior: "smooth", block: "start" });
      summary?.focus({ preventScroll: true });
      return;
    }

    const perfilSelect = form.querySelector("#login-perfil");
    const perfilId = perfilSelect ? perfilSelect.value : "filiado";
    const destination = PROFILE_DESTINATIONS[perfilId] || PROFILE_DESTINATIONS.filiado;

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Validando acesso...";

    window.setTimeout(() => {
      senhaInput.value = "";

      if (destination.type === "admin") {
        try {
          window.localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, destination.adminProfile);
          window.localStorage.setItem(DEMO_ACCESS_STORAGE_KEY, "administrativo");
        } catch (error) {
          // A persistência é apenas uma conveniência do protótipo.
        }
        window.location.href = "admin-painel.html";
        return;
      }

      // Servidor cadastrado não possui área própria: permanece na Home pública.
      if (destination.type === "servidorCadastrado") {
        try {
          window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
          window.localStorage.setItem(DEMO_ACCESS_STORAGE_KEY, "servidorCadastrado");
        } catch (error) {
          // A persistência é apenas uma conveniência do protótipo.
        }
        window.location.href = "../index.html";
        return;
      }

      try {
        window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
        window.localStorage.setItem(DEMO_ACCESS_STORAGE_KEY, "filiado");
      } catch (error) {
        // A persistência é apenas uma conveniência do protótipo.
      }

      window.location.href = "area-filiado-demo.html";
    }, 900);
  });
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
}

function initializeRecoverForm() {
  const form = document.querySelector("[data-auth-recover-form]");
  if (!form) return;

  const formSection = document.querySelector("[data-auth-recover-form-section]");
  const confirmationSection = document.querySelector("[data-auth-recover-confirmation]");
  const maskedEmailEl = document.querySelector("[data-auth-recover-masked-email]");
  const summary = document.querySelector("[data-auth-recover-summary]");
  const summaryList = document.querySelector("[data-auth-recover-summary-list]");

  function renderSummary(errors) {
    if (!summary || !summaryList) return;
    if (!errors.length) {
      summary.hidden = true;
      summaryList.replaceChildren();
      return;
    }
    summaryList.replaceChildren(...errors.map(({ id, text }) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = text;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        form.querySelector(`#${id}`)?.focus();
      });
      item.append(link);
      return item;
    }));
    summary.hidden = false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = form.querySelector("#recuperar-email");
    const email = emailInput.value.trim();
    const errors = [];

    setAuthFieldError(form, "recuperar-email", "");

    if (!email) {
      setAuthFieldError(form, "recuperar-email", authFieldMessages["recuperar-email"].empty);
      errors.push({ id: "recuperar-email", text: authFieldMessages["recuperar-email"].empty });
    } else if (!isValidEmail(email)) {
      setAuthFieldError(form, "recuperar-email", authFieldMessages["recuperar-email"].invalid);
      errors.push({ id: "recuperar-email", text: authFieldMessages["recuperar-email"].invalid });
    }

    renderSummary(errors);

    if (errors.length) {
      summary?.scrollIntoView({ behavior: "smooth", block: "start" });
      summary?.focus({ preventScroll: true });
      return;
    }

    if (maskedEmailEl) maskedEmailEl.textContent = maskEmail(email);
    formSection.hidden = true;
    confirmationSection.hidden = false;
    confirmationSection.scrollIntoView({ behavior: "smooth", block: "start" });
    confirmationSection.querySelector("h2")?.focus();
  });

  document.querySelectorAll("[data-auth-recover-restart]").forEach((button) => {
    button.addEventListener("click", () => {
      form.reset();
      renderSummary([]);
      confirmationSection.hidden = true;
      formSection.hidden = false;
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      form.querySelector("#recuperar-email")?.focus();
    });
  });
}

initializePasswordToggle();
initializeLoginForm();
initializeRecoverForm();
