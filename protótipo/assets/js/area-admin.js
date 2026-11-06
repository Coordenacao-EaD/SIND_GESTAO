(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.adminDemoProfile";
  // Estado exclusivo da demonstração visual: não é autenticação, senha nem token.
  const DEMO_ACCESS_STORAGE_KEY = "sindGestao.demoAccessType";
  const DEFAULT_PROFILE_ID = "administrador";

  const PROFILES = Object.freeze({
    administrador: {
      id: "administrador",
      label: "Administrador Geral",
      shortLabel: "Administrador",
      mode: "administrative",
      permissions: [
        "users",
        "usersView",
        "affiliates",
        "affiliatesManage",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests",
        // "finance": consulta técnica no T32; não valida nem publica.
        "finance",
        // "votingView": T34, consulta técnica; não cria nem libera.
        "votingView",
        "reports",
        "settings",
        // "institutionalContent": T36, cria/edita e encaminha conteúdo institucional.
        "institutionalContent"
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
        // "finance": somente consulta no T32.
        "finance",
        // "votingView": T34, somente consultas já Liberadas.
        "votingView",
        "reports",
        // "institutionalContent": T36, cria/edita e encaminha conteúdo institucional.
        "institutionalContent"
      ]
    },

    presidencia: {
      id: "presidencia",
      label: "Presidência",
      shortLabel: "Presidência",
      mode: "administrative",
      permissions: [
        "usersView",
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
        "reports",
        // "institutionalContent": T36, revisa, aprova e publica conteúdo institucional.
        "institutionalContent"
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
        // "requests": T33, somente solicitações encaminhadas à Tesouraria.
        "requests",
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
        "affiliatesManage",
        "affiliationRequests",
        "assemblies",
        "minutes",
        "documents",
        "news",
        "notifications",
        "requests",
        // "votingView": T34, consulta operacional das consultas já Liberadas.
        "votingView",
        // "institutionalContent": T36, cria/edita e encaminha conteúdo institucional.
        "institutionalContent"
      ]
    },

    conselhoEtica: {
      id: "conselhoEtica",
      label: "Conselho de Ética",
      shortLabel: "Conselho de Ética",
      mode: "council",
      council: "ethics",
      // "documents": acesso ao T31 restrito ao escopo do próprio Conselho.
      permissions: ["councilEthics", "documents"]
    },

    conselhoFiscal: {
      id: "conselhoFiscal",
      label: "Conselho Fiscal",
      shortLabel: "Conselho Fiscal",
      mode: "council",
      council: "fiscal",
      // "documents": acesso ao T31 restrito ao escopo do próprio Conselho.
      // "finance": consulta/fiscalização no T32, sem criar, validar ou arquivar.
      permissions: ["councilFiscal", "documents", "finance"]
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

  function clearDemoAccess() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(DEMO_ACCESS_STORAGE_KEY);
    } catch (error) {
      // A persistência é apenas uma conveniência do protótipo.
    }
  }

  let activeProfileId = readStoredProfileId();

  // T36: consulta somente leitura das permissões, para que Relatórios e Configurações
  // apliquem exatamente a mesma matriz do menu (sem cópia paralela de perfis).
  window.SindGestaoAdminPerfis = Object.freeze({
    ids: () => Object.keys(PROFILES),
    label: (profileId) => (isValidProfileId(profileId) ? PROFILES[profileId].label : ""),
    isCouncil: (profileId) => isValidProfileId(profileId) && PROFILES[profileId].mode === "council",
    hasPermission: (profileId, permission) =>
      isValidProfileId(profileId) && PROFILES[profileId].permissions.includes(permission),
    current: () => readStoredProfileId()
  });

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

        <a class="button button--secondary admin-topbar__logout" href="../index.html" data-demo-logout>
          Sair
        </a>
      </div>
    `;

    topbar.querySelector("[data-demo-logout]")?.addEventListener("click", clearDemoAccess);

    const select = topbar.querySelector("[data-admin-profile-select]");

    select?.addEventListener("change", (event) => {
      setActiveProfile(event.target.value);
    });

    const menuToggle = topbar.querySelector("[data-admin-menu-toggle]");

    menuToggle?.setAttribute("aria-expanded", String(isSidebarDrawerOpen));
    menuToggle?.addEventListener("click", toggleSidebarDrawer);
  }

  const DEMO_DATA_NOTICE =
    "Dados demonstrativos do protótipo — não representam informações reais do sindicato.";

  const DASHBOARD_STATS = Object.freeze([
    { id: "affiliates", label: "Filiados ativos", value: "428", permission: "affiliates" },
    { id: "affiliationRequests", label: "Filiações pendentes", value: "6", permission: "affiliationRequests" },
    { id: "requests", label: "Solicitações abertas", value: "12", permission: "requests" },
    { id: "assemblies", label: "Próximas assembleias", value: "2", permission: "assemblies" },
    { id: "finance", label: "Prestações aguardando conferência", value: "4", permission: "finance" }
  ]);

  const DASHBOARD_PENDING_ITEMS = Object.freeze([
    { id: "affiliationRequests", label: "6 filiações aguardando análise.", permissions: ["affiliationRequests"] },
    { id: "news", label: "1 comunicado aguardando revisão.", permissions: ["news"] },
    { id: "documents", label: "2 documentos pendentes de publicação.", permissions: ["documents"] },
    { id: "requests", label: "5 solicitações em análise.", permissions: ["requests"] },
    { id: "finance", label: "4 prestações de contas aguardando conferência.", permissions: ["finance"] },
    {
      id: "financePresidency",
      label: "1 prestação de contas aguardando validação da Presidência.",
      permissions: ["finance", "voting"]
    },
    { id: "voting", label: "1 enquete aguardando liberação da Presidência.", permissions: ["voting"] }
  ]);

  const DASHBOARD_EVENTS = Object.freeze([
    { date: "28/09", label: "Assembleia geral ordinária", permission: "assemblies" },
    { date: "05/10", label: "Reunião de diretoria", permission: "assemblies" }
  ]);

  const DASHBOARD_ACTIVITY = Object.freeze([
    { label: "Ata da assembleia de junho foi atualizada.", permission: "minutes" },
    { label: "Solicitação de declaração foi respondida.", permission: "requests" },
    { label: "Comunicado sobre reajuste salarial foi publicado.", permission: "news" },
    { label: "Prestação de contas de agosto foi enviada para conferência.", permission: "finance" }
  ]);

  const DASHBOARD_QUICK_ACCESS = Object.freeze([
    { label: "Cadastrar filiado", permission: "affiliatesManage" },
    { label: "Criar assembleia", permission: "assemblies" },
    { label: "Novo documento", permission: "documents" },
    { label: "Novo comunicado", permission: "news" },
    { label: "Gerenciar usuários e permissões", permission: "users" }
  ]);

  function profileHasAllPermissions(profile, permissions) {
    return permissions.every((permission) => hasPermission(profile, permission));
  }

  function renderAdministrativeDashboard(profile) {
    const stats = DASHBOARD_STATS.filter((stat) => hasPermission(profile, stat.permission));

    const pendingItems = DASHBOARD_PENDING_ITEMS.filter((item) =>
      profileHasAllPermissions(profile, item.permissions)
    );

    const events = DASHBOARD_EVENTS.filter((event) => hasPermission(profile, event.permission));

    const activity = DASHBOARD_ACTIVITY.filter((entry) => hasPermission(profile, entry.permission));

    const quickAccess = DASHBOARD_QUICK_ACCESS.filter((entry) => hasPermission(profile, entry.permission));

    const statsMarkup = stats.length
      ? stats
          .map(
            (stat) => `
              <li class="admin-stat-card">
                <span class="admin-stat-card__label">${stat.label}</span>
                <strong class="admin-stat-card__value">${stat.value}</strong>
              </li>
            `
          )
          .join("")
      : `<li class="admin-empty-state">Nenhum indicador disponível para este perfil de demonstração.</li>`;

    const pendingMarkup = pendingItems.length
      ? pendingItems.map((item) => `<li class="admin-list__item">${item.label}</li>`).join("")
      : `<li class="admin-empty-state">Nenhuma pendência para este perfil de demonstração.</li>`;

    const eventsMarkup = events.length
      ? events
          .map(
            (event) => `
              <li class="admin-list__item">
                <span class="admin-list__meta">${event.date}</span>
                ${event.label}
              </li>
            `
          )
          .join("")
      : `<li class="admin-empty-state">Nenhum evento próximo para este perfil de demonstração.</li>`;

    const activityMarkup = activity.length
      ? activity.map((entry) => `<li class="admin-list__item">${entry.label}</li>`).join("")
      : `<li class="admin-empty-state">Nenhuma atividade recente para este perfil de demonstração.</li>`;

    const quickAccessMarkup = quickAccess.length
      ? quickAccess
          .map(
            (entry) => `
              <li>
                <button class="admin-quick-access__button" type="button">${entry.label}</button>
              </li>
            `
          )
          .join("")
      : `<li class="admin-empty-state">Nenhum atalho disponível para este perfil de demonstração.</li>`;

    return `
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

      <p class="admin-demo-notice" role="note">${DEMO_DATA_NOTICE}</p>

      <ul class="admin-stat-cards">
        ${statsMarkup}
      </ul>

      <div class="admin-dashboard__grid">
        <section class="admin-panel admin-panel--primary" aria-labelledby="admin-pending-title">
          <h2 id="admin-pending-title">Pendências que exigem ação</h2>
          <ul class="admin-list">${pendingMarkup}</ul>
        </section>

        <div class="admin-dashboard__side">
          <section class="admin-panel" aria-labelledby="admin-events-title">
            <h2 id="admin-events-title">Próximos eventos</h2>
            <ul class="admin-list">${eventsMarkup}</ul>
          </section>

          <section class="admin-panel" aria-labelledby="admin-activity-title">
            <h2 id="admin-activity-title">Atividade recente</h2>
            <ul class="admin-list">${activityMarkup}</ul>
          </section>

          <section class="admin-panel" aria-labelledby="admin-quick-access-title">
            <h2 id="admin-quick-access-title">Acesso rápido</h2>
            <ul class="admin-quick-access">${quickAccessMarkup}</ul>
          </section>
        </div>
      </div>
    `;
  }

  const COUNCIL_CONTENT = Object.freeze({
    ethics: {
      title: "Conselho de Ética",
      description:
        "Visão restrita a este Conselho. Nenhum conteúdo de outro Conselho ou da administração geral é exibido neste painel."
    },
    fiscal: {
      title: "Conselho Fiscal",
      description:
        "Visão restrita a este Conselho. Nenhum conteúdo de outro Conselho ou da administração geral é exibido neste painel."
    }
  });

  function renderCouncilDashboard(profile) {
    const council = COUNCIL_CONTENT[profile.council];

    return `
      <header class="admin-page-heading">
        <div>
          <span class="admin-page-heading__eyebrow">Painel do Conselho</span>

          <h1 id="admin-dashboard-title">
            ${council.title}
          </h1>

          <p>${council.description}</p>
        </div>
      </header>

      <p class="admin-demo-notice" role="note">${DEMO_DATA_NOTICE}</p>

      <div class="admin-dashboard__grid admin-dashboard__grid--council">
        <section class="admin-panel admin-panel--primary" aria-labelledby="admin-council-manifestations-title">
          <h2 id="admin-council-manifestations-title">Manifestações recebidas</h2>

          <ul class="admin-stat-cards">
            <li class="admin-stat-card">
              <span class="admin-stat-card__label">Aguardando análise</span>
              <strong class="admin-stat-card__value">—</strong>
            </li>
            <li class="admin-stat-card">
              <span class="admin-stat-card__label">Em andamento</span>
              <strong class="admin-stat-card__value">—</strong>
            </li>
            <li class="admin-stat-card">
              <span class="admin-stat-card__label">Concluídas</span>
              <strong class="admin-stat-card__value">—</strong>
            </li>
          </ul>

          <p class="admin-empty-state">
            Os quantitativos deste protótipo ainda não foram definidos e são
            exibidos como “—”.
          </p>
        </section>

        <div class="admin-dashboard__side">
          <section class="admin-panel" aria-labelledby="admin-council-documents-title">
            <h2 id="admin-council-documents-title">Documentos relacionados</h2>
            <ul class="admin-list">
              <li class="admin-empty-state">Nenhum documento demonstrativo cadastrado.</li>
            </ul>
          </section>

          <section class="admin-panel" aria-labelledby="admin-council-history-title">
            <h2 id="admin-council-history-title">Histórico</h2>
            <ul class="admin-list">
              <li class="admin-empty-state">Nenhum histórico demonstrativo cadastrado.</li>
            </ul>
          </section>
        </div>
      </div>
    `;
  }

  function renderDashboard(profileId) {
    const dashboard = document.querySelector("[data-admin-dashboard]");

    if (!dashboard) {
      return;
    }

    const profile = PROFILES[profileId];

    dashboard.innerHTML = isCouncilProfile(profile)
      ? renderCouncilDashboard(profile)
      : renderAdministrativeDashboard(profile);
  }

  const NAV_GROUPS = Object.freeze([
    {
      label: "",
      items: [
        {
          id: "publicHome",
          label: "Início",
          href: "../index.html",
          icon: "⌂",
          alwaysAvailable: true
        },
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
          href: "admin-usuarios.html",
          icon: "👥",
          permission: "usersView"
        },
        {
          id: "affiliates",
          label: "Filiados",
          href: "admin-filiados.html",
          icon: "◉",
          permission: "affiliates"
        },
        {
          id: "affiliationRequests",
          label: "Solicitações de filiação",
          href: "admin-filiacoes.html",
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
          href: "admin-assembleias.html",
          icon: "◫",
          permission: "assemblies"
        },
        {
          id: "minutes",
          label: "Atas",
          href: "admin-documentos.html#atas",
          icon: "≡",
          permission: "minutes"
        },
        {
          id: "documents",
          label: "Documentos",
          href: "admin-documentos.html#documentos",
          icon: "▤",
          permission: "documents"
        },
        {
          id: "news",
          label: "Notícias e comunicados",
          href: "admin-comunicacao.html",
          icon: "✦",
          permission: "news"
        },
        {
          id: "notifications",
          label: "Notificações",
          href: "admin-notificacoes.html",
          icon: "●",
          permission: "notifications"
        },
        {
          id: "requests",
          label: "Solicitações dos Filiados",
          href: "admin-solicitacoes.html",
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
          href: "admin-prestacao-contas.html",
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
          href: "admin-votacoes.html",
          icon: "✓",
          permission: "voting",
          // T34: "voting" (Presidência) cria e libera; "votingView" apenas consulta.
          anyPermission: ["voting", "votingView"]
        }
      ]
    },

    {
      label: "Conselhos",
      items: [
        {
          id: "councilEthics",
          label: "Conselho de Ética",
          href: "admin-conselhos.html",
          icon: "◇",
          permission: "councilEthics",
          confidentialScope: "ethics"
        },
        {
          id: "councilFiscal",
          label: "Conselho Fiscal",
          href: "admin-conselhos.html",
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
          href: "admin-relatorios.html",
          icon: "▥",
          permission: "reports"
        },
        {
          id: "settings",
          label: "Configurações",
          href: "admin-configuracoes.html",
          icon: "⚙",
          // T36: parâmetros exigem "settings"; o conteúdo institucional exige
          // "institutionalContent". Tesouraria e Conselhos não possuem nenhuma das duas.
          anyPermission: ["settings", "institutionalContent"]
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

  function isNavItemVisible(profile, item) {
    if (item.alwaysAvailable) {
      return true;
    }

    if (item.confidentialScope) {
      return profile.council === item.confidentialScope;
    }

    if (Array.isArray(item.anyPermission)) {
      return item.anyPermission.some((permission) => hasPermission(profile, permission));
    }

    return hasPermission(profile, item.permission);
  }

  function currentPageFile() {
    const file = window.location.pathname.split("/").pop();

    return file ? decodeURIComponent(file) : "admin-painel.html";
  }

  function isNavItemCurrent(item) {
    const page = currentPageFile();
    const hrefFile = (href) => String(href).split("#")[0];
    const isKnownModule = NAV_GROUPS.some((group) =>
      group.items.some((entry) => hrefFile(entry.href) === page)
    );

    // Páginas sem item próprio no menu mantêm o Painel como referência.
    if (!isKnownModule) {
      return item.id === "dashboard";
    }

    if (hrefFile(item.href) !== page) {
      return false;
    }

    // Vários itens podem abrir a mesma página (ex.: Atas/Documentos por hash):
    // destaca somente o item cujo hash corresponde ao atual.
    const itemHash = item.href.includes("#") ? `#${item.href.split("#")[1]}` : "";
    const siblings = NAV_GROUPS.flatMap((group) => group.items)
      .filter((entry) => hrefFile(entry.href) === page);

    if (siblings.length < 2 || !itemHash) {
      return true;
    }

    const currentHash = window.location.hash;
    const matchesSibling = siblings.some((entry) => entry.href.endsWith(currentHash) && currentHash);

    return matchesSibling ? itemHash === currentHash : siblings[0] === item;
  }

  function navItemMarkup(item) {
    const isCurrent = isNavItemCurrent(item);

    return `
      <li class="admin-nav__item">
        <a
          class="admin-nav__link${isCurrent ? " is-active" : ""}"
          href="${item.href}"
          ${isCurrent ? 'aria-current="page"' : ""}
        >
          <span class="admin-nav__icon" aria-hidden="true">${item.icon}</span>
          <span>${item.label}</span>
        </a>
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
        const visibleItems = group.items.filter((item) =>
          isNavItemVisible(profile, item)
        );

        if (!visibleItems.length) {
          return "";
        }

        const label = group.label
          ? `<p class="admin-nav__group-label">${group.label}</p>`
          : "";

        return `
          <section class="admin-nav__group">
            ${label}
            <ul class="admin-nav__list">
              ${visibleItems.map(navItemMarkup).join("")}
            </ul>
          </section>
        `;
      })
      .join("");

    sidebar.id = "admin-sidebar";

    sidebar.innerHTML = `
      <div class="admin-sidebar__brand">
        <img
          class="admin-sidebar__brand-logo"
          src="../assets/images/logo.png"
          alt=""
          width="56"
          height="56"
        >

        <div class="admin-sidebar__brand-copy">
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

  let isSidebarDrawerOpen = false;
  let lastFocusedMenuToggle = null;

  const SIDEBAR_DRAWER_QUERY = "(max-width: 1024px)";

  function openSidebarDrawer() {
    const sidebar = document.querySelector("[data-admin-sidebar]");
    const backdrop = document.querySelector("[data-admin-sidebar-backdrop]");
    const menuToggle = document.querySelector("[data-admin-menu-toggle]");

    if (!sidebar) {
      return;
    }

    isSidebarDrawerOpen = true;
    lastFocusedMenuToggle = menuToggle || null;

    sidebar.classList.add("is-open");
    document.body.classList.add("admin-menu-open");

    if (backdrop) {
      backdrop.hidden = false;
    }

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "true");
    }

    const firstFocusable = sidebar.querySelector("a, button");
    firstFocusable?.focus();
  }

  function closeSidebarDrawer() {
    const sidebar = document.querySelector("[data-admin-sidebar]");
    const backdrop = document.querySelector("[data-admin-sidebar-backdrop]");
    const menuToggle = document.querySelector("[data-admin-menu-toggle]");

    if (!sidebar) {
      return;
    }

    const wasOpen = isSidebarDrawerOpen;

    isSidebarDrawerOpen = false;

    sidebar.classList.remove("is-open");
    document.body.classList.remove("admin-menu-open");

    if (backdrop) {
      backdrop.hidden = true;
    }

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }

    if (wasOpen && lastFocusedMenuToggle && typeof lastFocusedMenuToggle.focus === "function") {
      lastFocusedMenuToggle.focus();
    }
  }

  function toggleSidebarDrawer() {
    if (isSidebarDrawerOpen) {
      closeSidebarDrawer();
    } else {
      openSidebarDrawer();
    }
  }

  function bindGlobalAdminEvents() {
    const backdrop = document.querySelector("[data-admin-sidebar-backdrop]");

    backdrop?.addEventListener("click", closeSidebarDrawer);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSidebarDrawer();
      }
    });

    if (typeof window.matchMedia === "function") {
      const desktopQuery = window.matchMedia(SIDEBAR_DRAWER_QUERY);

      const handleViewportChange = (event) => {
        if (!event.matches) {
          closeSidebarDrawer();
        }
      };

      if (typeof desktopQuery.addEventListener === "function") {
        desktopQuery.addEventListener("change", handleViewportChange);
      }
    }
  }

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
  }

  function init() {
    renderAdminShell();
    bindGlobalAdminEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
