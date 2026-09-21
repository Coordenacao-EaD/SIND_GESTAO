(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE_ID = "administrador";

  const PROFILES = Object.freeze({
    administrador: {
      id: "administrador",
      label: "Administrador Geral",
      shortLabel: "Administrador",
      mode: "administrative",
      permissions: [
        "users",
        "affiliates",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests",
        "reports",
        "settings"
      ]
    },

    diretoria: {
      id: "diretoria",
      label: "Diretoria",
      shortLabel: "Diretoria",
      mode: "administrative",
      permissions: [
        "affiliates",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests",
        "reports"
      ]
    },

    presidencia: {
      id: "presidencia",
      label: "Presidência",
      shortLabel: "Presidência",
      mode: "administrative",
      permissions: [
        "affiliates",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests",
        "finance",
        "voting",
        "reports"
      ]
    },

    tesouraria: {
      id: "tesouraria",
      label: "Tesouraria",
      shortLabel: "Tesouraria",
      mode: "administrative",
      permissions: [
        "finance",
        "documents",
        "reports"
      ]
    },

    secretaria: {
      id: "secretaria",
      label: "Secretaria",
      shortLabel: "Secretaria",
      mode: "administrative",
      permissions: [
        "affiliates",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests"
      ]
    },

    conselhoEtica: {
      id: "conselhoEtica",
      label: "Conselho de Ética",
      shortLabel: "Conselho de Ética",
      mode: "council",
      council: "ethics",
      permissions: ["councilEthics"]
    },

    conselhoFiscal: {
      id: "conselhoFiscal",
      label: "Conselho Fiscal",
      shortLabel: "Conselho Fiscal",
      mode: "council",
      council: "fiscal",
      permissions: ["councilFiscal"]
    }
  });

  function isValidProfileId(profileId) {
    return Object.prototype.hasOwnProperty.call(PROFILES, profileId);
  }

  function readStoredProfileId() {
    try {
      const storedProfileId = window.localStorage.getItem(STORAGE_KEY);

      return isValidProfileId(storedProfileId)
        ? storedProfileId
        : DEFAULT_PROFILE_ID;
    } catch (error) {
      return DEFAULT_PROFILE_ID;
    }
  }

  function storeProfileId(profileId) {
    try {
      window.localStorage.setItem(STORAGE_KEY, profileId);
    } catch (error) {
      // A persistência é apenas uma conveniência do protótipo.
      // A interface deve continuar funcionando caso seja bloqueada.
    }
  }

  let activeProfileId = readStoredProfileId();

  function getActiveProfileId() {
    return activeProfileId;
  }

  function profileOptionsMarkup(activeId) {
    return Object.values(PROFILES)
      .map((profile) => {
        const selected = profile.id === activeId ? " selected" : "";

        return `
          <option value="${profile.id}"${selected}>
            ${profile.label}
          </option>
        `;
      })
      .join("");
  }

  function renderTopbar(profileId) {
    const topbar = document.querySelector("[data-admin-topbar]");

    if (!topbar) {
      return;
    }

    const profile = PROFILES[profileId];

    topbar.innerHTML = `
      <div class="admin-topbar__inner">
        <button
          class="admin-menu-toggle"
          type="button"
          data-admin-menu-toggle
          aria-controls="admin-sidebar"
          aria-expanded="false"
          aria-label="Abrir menu administrativo"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <div class="admin-topbar__context">
          <span class="admin-topbar__eyebrow">Área Administrativa</span>
          <strong>${profile.shortLabel}</strong>
        </div>

        <label class="admin-profile-switcher">
          <span>PERFIL DE DEMONSTRAÇÃO</span>

          <select
            data-admin-profile-select
            aria-label="Perfil de demonstração"
          >
            ${profileOptionsMarkup(profileId)}
          </select>
        </label>
      </div>
    `;

    const select = topbar.querySelector("[data-admin-profile-select]");

    select?.addEventListener("change", (event) => {
      setActiveProfile(event.target.value);
    });
  }

  function renderDashboard(profileId) {
    const dashboard = document.querySelector("[data-admin-dashboard]");

    if (!dashboard) {
      return;
    }

    const profile = PROFILES[profileId];

    dashboard.innerHTML = `
      <header class="admin-page-heading">
        <div>
          <span class="admin-page-heading__eyebrow">Painel</span>

          <h1 id="admin-dashboard-title">
            Olá, ${profile.shortLabel}
          </h1>

          <p>
            Visão demonstrativa do ambiente administrativo conforme
            o perfil selecionado.
          </p>
        </div>
      </header>
    `;
  }

  /*
   * Estas duas funções serão preenchidas nas próximas etapas.
   * Mantemos os pontos de integração desde agora para que o shell
   * administrativo já tenha uma estrutura estável.
   */
  function renderNavigation() {}

  function bindMobileNavigation() {}

  function setActiveProfile(profileId) {
    const nextProfileId = isValidProfileId(profileId)
      ? profileId
      : DEFAULT_PROFILE_ID;

    activeProfileId = nextProfileId;

    storeProfileId(nextProfileId);
    renderAdminShell();
  }

  function renderAdminShell() {
    const profileId = getActiveProfileId();

    renderNavigation(profileId);
    renderTopbar(profileId);
    renderDashboard(profileId);
    bindMobileNavigation();
  }

  function init() {
    renderAdminShell();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
