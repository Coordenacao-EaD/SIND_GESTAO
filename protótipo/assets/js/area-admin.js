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
  const NAV_GROUPS = Object.freeze([
    {
      label: "",
      items: [
        {
          id: "dashboard",
          label: "Painel",
          href: "admin-painel.html",
          icon: "▦",
          alwaysAvailable: true
        }
      ]
    },

    {
      label: "Pessoas",
      items: [
        {
          id: "users",
          label: "Usuários e permissões",
          href: "#usuarios",
          icon: "👥",
          permission: "users"
        },
        {
          id: "affiliates",
          label: "Filiados",
          href: "#filiados",
          icon: "◉",
          permission: "affiliates"
        },
        {
          id: "affiliationRequests",
          label: "Solicitações de filiação",
          href: "#solicitacoes-filiacao",
          icon: "✓",
          permission: "affiliationRequests"
        }
      ]
    },

    {
      label: "Gestão institucional",
      items: [
        {
          id: "assemblies",
          label: "Assembleias e reuniões",
          href: "#assembleias",
          icon: "◫",
          permission: "assemblies"
        },
        {
          id: "minutes",
          label: "Atas",
          href: "#atas",
          icon: "≡",
          permission: "minutes"
        },
        {
          id: "documents",
          label: "Documentos",
          href: "#documentos",
          icon: "▤",
          permission: "documents"
        },
        {
          id: "news",
          label: "Notícias e comunicados",
          href: "#comunicados",
          icon: "✦",
          permission: "news"
        },
        {
          id: "notifications",
          label: "Notificações",
          href: "#notificacoes",
          icon: "●",
          permission: "notifications"
        },
        {
          id: "requests",
          label: "Solicitações",
          href: "#solicitacoes",
          icon: "↔",
          permission: "requests"
        }
      ]
    },

    {
      label: "Financeiro",
      items: [
        {
          id: "finance",
          label: "Prestação de contas",
          href: "#prestacao-contas",
          icon: "$",
          permission: "finance"
        }
      ]
    },

    {
      label: "Participação",
      items: [
        {
          id: "voting",
          label: "Enquetes e votações",
          href: "#votacoes",
          icon: "✓",
          permission: "voting"
        }
      ]
    },

    {
      label: "Conselhos",
      items: [
        {
          id: "councilEthics",
          label: "Conselho de Ética",
          href: "#conselho-etica",
          icon: "◇",
          permission: "councilEthics",
          confidentialScope: "ethics"
        },
        {
          id: "councilFiscal",
          label: "Conselho Fiscal",
          href: "#conselho-fiscal",
          icon: "◇",
          permission: "councilFiscal",
          confidentialScope: "fiscal"
        }
      ]
    },

    {
      label: "Gestão",
      items: [
        {
          id: "reports",
          label: "Relatórios",
          href: "#relatorios",
          icon: "▥",
          permission: "reports"
        },
        {
          id: "settings",
          label: "Configurações",
          href: "#configuracoes",
          icon: "⚙",
          permission: "settings"
        }
      ]
    }
  ]);

  function hasPermission(profile, permission) {
    return profile.permissions.includes(permission);
  }

  function isCouncilProfile(profile) {
    return profile.mode === "council";
  }

  function navItemState(profile, item) {
    if (item.alwaysAvailable) {
      return "allowed";
    }

    if (item.confidentialScope) {
      return profile.council === item.confidentialScope
        ? "allowed"
        : "disabled";
    }

    return hasPermission(profile, item.permission)
      ? "allowed"
      : "disabled";
  }

  function navItemMarkup(profile, item) {
    const state = navItemState(profile, item);

    if (state === "allowed") {
      return `
        <li class="admin-nav__item">
          <a
            class="admin-nav__link${item.id === "dashboard" ? " is-active" : ""}"
            href="${item.href}"
            ${item.id === "dashboard" ? 'aria-current="page"' : ""}
          >
            <span class="admin-nav__icon" aria-hidden="true">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }

    return `
      <li class="admin-nav__item">
        <span
          class="admin-nav__link is-disabled"
          aria-disabled="true"
          title="Sem permissão neste perfil de demonstração"
        >
          <span class="admin-nav__icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
          <span class="admin-nav__lock" aria-hidden="true">🔒</span>
          <span class="sr-only">
            Sem permissão neste perfil de demonstração
          </span>
        </span>
      </li>
    `;
  }

  function renderNavigation(profileId) {
    const sidebar = document.querySelector("[data-admin-sidebar]");

    if (!sidebar) {
      return;
    }

    const profile = PROFILES[profileId];

    const groupsMarkup = NAV_GROUPS
      .map((group) => {
        const label = group.label
          ? `<p class="admin-nav__group-label">${group.label}</p>`
          : "";

        return `
          <section class="admin-nav__group">
            ${label}
            <ul class="admin-nav__list">
              ${group.items
                .map((item) => navItemMarkup(profile, item))
                .join("")}
            </ul>
          </section>
        `;
      })
      .join("");

    sidebar.id = "admin-sidebar";

    sidebar.innerHTML = `
      <div class="admin-sidebar__brand">
        <span class="admin-sidebar__brand-mark" aria-hidden="true">S</span>

        <div>
          <strong>SINPROTEC/MT</strong>
          <span>Administração</span>
        </div>
      </div>

      <nav class="admin-nav" aria-label="Menu administrativo">
        ${groupsMarkup}
      </nav>

      <div class="admin-sidebar__user">
        <span class="admin-sidebar__user-label">
          Usuário de demonstração
        </span>

        <strong>Maria Silva</strong>
        <span>${profile.label}</span>
        <small>Ambiente de protótipo</small>
      </div>
    `;
  }

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
