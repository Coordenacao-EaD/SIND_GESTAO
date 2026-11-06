(() => {
  "use strict";

  const PROFILE_STORAGE_KEY = "sindGestao.adminDemoProfile";
  const USERS_STORAGE_KEY = "sindGestao.adminUsersDemo";

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    diretoria: "Diretoria",
    presidencia: "Presidência",
    tesouraria: "Tesouraria",
    secretaria: "Secretaria",
    conselhoEtica: "Conselho de Ética",
    conselhoFiscal: "Conselho Fiscal",
    filiado: "Filiado",
    servidorCadastrado: "Servidor cadastrado"
  };

  const DEFAULT_PERMISSIONS = {
    administrador: [
      "users",
      "usersView",
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
    ],

    diretoria: [
      "affiliates",
      "affiliationRequests",
      "assemblies",
      "minutes",
      "documents",
      "news",
      "notifications",
      "requests",
      "reports"
    ],

    presidencia: [
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
      "reports"
    ],

    tesouraria: [
      "finance",
      "documents",
      "reports"
    ],

    secretaria: [
      "affiliates",
      "affiliationRequests",
      "assemblies",
      "minutes",
      "documents",
      "news",
      "notifications",
      "requests"
    ],

    conselhoEtica: [
      "councilEthics"
    ],

    conselhoFiscal: [
      "councilFiscal"
    ],

    filiado: [],

    servidorCadastrado: []
  };

  const PERMISSION_OPTIONS = [
    ["affiliates", "Filiados"],
    ["affiliationRequests", "Solicitações de filiação"],
    ["assemblies", "Assembleias e reuniões"],
    ["minutes", "Atas"],
    ["documents", "Documentos"],
    ["news", "Notícias e comunicados"],
    ["notifications", "Notificações"],
    ["requests", "Solicitações"],
    ["finance", "Prestação de contas"],
    ["voting", "Enquetes e votações"],
    ["reports", "Relatórios"],
    ["settings", "Configurações"]
  ];

  const DEFAULT_USERS = [
    {
      id: "USR-0001",
      name: "Maria Silva",
      email: "maria.admin@exemplo.local",
      profile: "administrador",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.administrador]
    },
    {
      id: "USR-0002",
      name: "Carlos Andrade",
      email: "carlos.presidencia@exemplo.local",
      profile: "presidencia",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.presidencia]
    },
    {
      id: "USR-0003",
      name: "Ana Ribeiro",
      email: "ana.secretaria@exemplo.local",
      profile: "secretaria",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.secretaria]
    },
    {
      id: "USR-0004",
      name: "Paulo Mendes",
      email: "paulo.tesouraria@exemplo.local",
      profile: "tesouraria",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.tesouraria]
    },
    {
      id: "USR-0005",
      name: "Luciana Costa",
      email: "luciana.diretoria@exemplo.local",
      profile: "diretoria",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.diretoria]
    },
    {
      id: "USR-0006",
      name: "Roberto Nunes",
      email: "roberto.etica@exemplo.local",
      profile: "conselhoEtica",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.conselhoEtica]
    },
    {
      id: "USR-0007",
      name: "Fernanda Lima",
      email: "fernanda.fiscal@exemplo.local",
      profile: "conselhoFiscal",
      status: "ativo",
      permissions: [...DEFAULT_PERMISSIONS.conselhoFiscal]
    },
    {
      id: "USR-0008",
      name: "João Ferreira",
      email: "joao.filiado@exemplo.local",
      profile: "filiado",
      status: "ativo",
      permissions: []
    },
    {
      id: "USR-0009",
      name: "Mariana Alves",
      email: "mariana.servidor@exemplo.local",
      profile: "servidorCadastrado",
      status: "inativo",
      permissions: []
    }
  ];

  let users = loadUsers();
  let editingUserId = null;
  let permissionsUserId = null;

  function getActiveProfileId() {
    try {
      return (
        sessionStorage.getItem(PROFILE_STORAGE_KEY) ||
        localStorage.getItem(PROFILE_STORAGE_KEY) ||
        "administrador"
      );
    } catch {
      return "administrador";
    }
  }

  function canManageUsers() {
    return getActiveProfileId() === "administrador";
  }

  function canViewUsers() {
    return ["administrador", "presidencia"].includes(
      getActiveProfileId()
    );
  }

  function loadUsers() {
    try {
      const stored = sessionStorage.getItem(USERS_STORAGE_KEY);

      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Usa os dados iniciais da demonstracao.
    }

    return structuredClone(DEFAULT_USERS);
  }

  function saveUsers() {
    try {
      sessionStorage.setItem(
        USERS_STORAGE_KEY,
        JSON.stringify(users)
      );
    } catch {
      // Persistencia demonstrativa opcional.
    }
  }

  function nextUserId() {
    const max = users.reduce((current, user) => {
      const number = Number(user.id.replace(/\D/g, ""));
      return Math.max(current, number);
    }, 0);

    return `USR-${String(max + 1).padStart(4, "0")}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function profileLabel(profileId) {
    return PROFILE_LABELS[profileId] || profileId;
  }

  function renderAccessDenied(container) {
    container.innerHTML = `
      <div class="admin-users__denied">
        <span class="admin-users__denied-icon" aria-hidden="true">🔒</span>

        <h1>Usuários e permissões</h1>

        <p>
          Este perfil não possui acesso ao módulo de usuários e permissões.
        </p>

        <a class="button button--primary" href="admin-painel.html">
          Voltar ao painel
        </a>
      </div>
    `;
  }

  function userRowsMarkup(filteredUsers, manageMode) {
    if (!filteredUsers.length) {
      return `
        <tr>
          <td colspan="${manageMode ? 6 : 5}" class="admin-users__empty">
            Nenhum usuário encontrado com os filtros selecionados.
          </td>
        </tr>
      `;
    }

    return filteredUsers.map((user) => `
      <tr>
        <td>
          <strong>${escapeHtml(user.name)}</strong>
          <small>${escapeHtml(user.id)}</small>
        </td>

        <td>${escapeHtml(user.email)}</td>

        <td>
          <span class="admin-users__profile">
            ${escapeHtml(profileLabel(user.profile))}
          </span>
        </td>

        <td>
          <span class="admin-users__status admin-users__status--${user.status}">
            ${user.status === "ativo" ? "Ativo" : "Inativo"}
          </span>
        </td>

        <td>
          ${user.permissions.length}
          ${user.permissions.length === 1 ? "permissão" : "permissões"}
        </td>

        ${
          manageMode
            ? `
              <td>
                <div class="admin-users__row-actions">
                  <button
                    type="button"
                    class="admin-users__action-button"
                    data-edit-user="${escapeHtml(user.id)}"
                    aria-label="Editar usuário ${escapeHtml(user.name)}"
                    title="Editar usuário ${escapeHtml(user.name)}"
                  >
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="admin-users__action-button"
                    data-permissions-user="${escapeHtml(user.id)}"
                    aria-label="Gerenciar permissões de ${escapeHtml(user.name)}"
                    title="Gerenciar permissões de ${escapeHtml(user.name)}"
                  >
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3Z"></path>
                      <rect width="8" height="5" x="8" y="11" rx="1"></rect>
                      <path d="M10 11V9a2 2 0 1 1 4 0v2"></path>
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="admin-users__action-button"
                    data-toggle-user="${escapeHtml(user.id)}"
                    aria-label="${user.status === "ativo" ? "Desativar" : "Ativar"} usuário ${escapeHtml(user.name)}"
                    title="${user.status === "ativo" ? "Desativar" : "Ativar"} usuário ${escapeHtml(user.name)}"
                  >
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2v10"></path>
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    </svg>
                  </button>
                </div>
              </td>
            `
            : ""
        }
      </tr>
    `).join("");
  }

  function renderUsersModule() {
    const container = document.querySelector("[data-admin-users]");

    if (!container) return;

    markUsersNavigation();

    if (!canViewUsers()) {
      renderAccessDenied(container);
      return;
    }

    const manageMode = canManageUsers();

    const active = users.filter((user) => user.status === "ativo").length;
    const inactive = users.length - active;
    const administrative = users.filter((user) =>
      [
        "administrador",
        "diretoria",
        "presidencia",
        "tesouraria",
        "secretaria",
        "conselhoEtica",
        "conselhoFiscal"
      ].includes(user.profile)
    ).length;

    container.innerHTML = `
      <p class="admin-users__notice">
        Dados demonstrativos do protótipo — nenhuma conta exibida nesta tela
        representa usuário real.
      </p>

      <div class="admin-users__heading">
        <div>
          <span class="admin-users__eyebrow">
            PESSOAS / ACESSOS
          </span>

          <h1 id="admin-users-title">
            Usuários e permissões
          </h1>

          <p>
            Consulte contas, perfis e permissões de acesso ao sistema.
          </p>
        </div>

        ${
          manageMode
            ? `
              <button
                class="button button--primary"
                type="button"
                data-new-user
              >
                NOVO USUÁRIO
              </button>
            `
            : `
              <span class="admin-users__readonly">
                MODO DE CONSULTA
              </span>
            `
        }
      </div>

      ${
        manageMode
          ? `
            <div class="admin-users__access-info">
              <strong>Administrador Geral</strong>
              <span>
                Pode cadastrar, editar, ativar ou desativar contas e
                administrar permissões.
              </span>
            </div>
          `
          : `
            <div class="admin-users__access-info admin-users__access-info--readonly">
              <strong>Consulta da Presidência</strong>
              <span>
                Alterações de usuários, perfis e permissões são restritas
                ao Administrador Geral.
              </span>
            </div>
          `
      }

      <div class="admin-users__stats">
        <article>
          <span>Total de usuários</span>
          <strong>${users.length}</strong>
        </article>

        <article>
          <span>Ativos</span>
          <strong>${active}</strong>
        </article>

        <article>
          <span>Inativos</span>
          <strong>${inactive}</strong>
        </article>

        <article>
          <span>Perfis administrativos</span>
          <strong>${administrative}</strong>
        </article>
      </div>

      <section class="admin-users__panel">
        <div class="admin-users__filters">

          <label>
            <span>Buscar</span>
            <input
              type="search"
              placeholder="Nome, e-mail ou código"
              data-users-search
            >
          </label>

          <label>
            <span>Perfil</span>

            <select data-users-profile>
              <option value="">Todos</option>
              ${Object.entries(PROFILE_LABELS)
                .map(([value, label]) =>
                  `<option value="${value}">${label}</option>`
                )
                .join("")}
            </select>
          </label>

          <label>
            <span>Situação</span>

            <select data-users-status>
              <option value="">Todas</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </label>

        </div>

        <div class="admin-users__table-wrap">
          <table class="admin-users__table">

            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Permissões</th>
                ${manageMode ? "<th>Ações</th>" : ""}
              </tr>
            </thead>

            <tbody data-users-table-body>
              ${userRowsMarkup(users, manageMode)}
            </tbody>

          </table>
        </div>
      </section>

      <div
        class="admin-users__overlay"
        data-users-overlay
        hidden
      ></div>

      <aside
        class="admin-users__drawer"
        data-user-drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        hidden
      ></aside>

      <aside
        class="admin-users__drawer"
        data-permissions-drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-drawer-title"
        hidden
      ></aside>

      <aside class="admin-users__security-note">
        <strong>Separação de acesso</strong>

        <p>
          Administrar uma conta não concede ao Administrador Geral acesso
          automático ao conteúdo confidencial dos Conselhos. Conselho de Ética
          e Conselho Fiscal mantêm escopos próprios e isolados.
        </p>

        <p>
          Visitantes não aparecem nesta relação porque não possuem conta
          autenticada no sistema.
        </p>
      </aside>
    `;

    bindModuleEvents();
  }

  function filterUsers() {
    const search =
      document.querySelector("[data-users-search]")
        ?.value.trim()
        .toLowerCase() || "";

    const profile =
      document.querySelector("[data-users-profile]")?.value || "";

    const status =
      document.querySelector("[data-users-status]")?.value || "";

    const filtered = users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search);

      const matchesProfile =
        !profile || user.profile === profile;

      const matchesStatus =
        !status || user.status === status;

      return matchesSearch && matchesProfile && matchesStatus;
    });

    const body = document.querySelector("[data-users-table-body]");

    if (body) {
      body.innerHTML = userRowsMarkup(
        filtered,
        canManageUsers()
      );
    }
  }

  function openDrawer(drawer) {
    const overlay = document.querySelector("[data-users-overlay]");

    if (overlay) overlay.hidden = false;
    drawer.hidden = false;

    document.body.style.overflow = "hidden";
  }

  function closeDrawers() {
    const overlay = document.querySelector("[data-users-overlay]");
    const userDrawer = document.querySelector("[data-user-drawer]");
    const permissionsDrawer =
      document.querySelector("[data-permissions-drawer]");

    if (overlay) overlay.hidden = true;
    if (userDrawer) userDrawer.hidden = true;
    if (permissionsDrawer) permissionsDrawer.hidden = true;

    document.body.style.overflow = "";
  }

  function userFormMarkup(user = null) {
    const editing = Boolean(user);

    return `
      <div class="admin-users__drawer-header">
        <div>
          <span class="admin-users__eyebrow">
            ${editing ? "EDIÇÃO" : "CADASTRO"}
          </span>

          <h2 id="user-drawer-title">
            ${editing ? "Editar usuário" : "Novo usuário"}
          </h2>
        </div>

        <button
          type="button"
          class="admin-users__close"
          data-close-users-drawer
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <form data-user-form>

        <label class="admin-users__field">
          <span>Nome *</span>

          <input
            name="name"
            type="text"
            value="${escapeHtml(user?.name || "")}"
            required
          >
        </label>

        <label class="admin-users__field">
          <span>E-mail *</span>

          <input
            name="email"
            type="email"
            value="${escapeHtml(user?.email || "")}"
            required
          >
        </label>

        <label class="admin-users__field">
          <span>Perfil *</span>

          <select name="profile" required>
            ${Object.entries(PROFILE_LABELS)
              .map(([value, label]) => `
                <option
                  value="${value}"
                  ${user?.profile === value ? "selected" : ""}
                >
                  ${label}
                </option>
              `)
              .join("")}
          </select>
        </label>

        <label class="admin-users__field">
          <span>Situação *</span>

          <select name="status">
            <option
              value="ativo"
              ${user?.status !== "inativo" ? "selected" : ""}
            >
              Ativo
            </option>

            <option
              value="inativo"
              ${user?.status === "inativo" ? "selected" : ""}
            >
              Inativo
            </option>
          </select>
        </label>

        <div class="admin-users__form-note">
          Este protótipo não cria senha, token ou credencial de autenticação.
        </div>

        <div class="admin-users__drawer-actions">
          <button
            type="button"
            class="button button--secondary"
            data-close-users-drawer
          >
            CANCELAR
          </button>

          <button
            type="submit"
            class="button button--primary"
          >
            SALVAR
          </button>
        </div>

      </form>
    `;
  }

  function openNewUser() {
    if (!canManageUsers()) return;

    editingUserId = null;

    const drawer = document.querySelector("[data-user-drawer]");

    drawer.innerHTML = userFormMarkup();
    openDrawer(drawer);
  }

  function openEditUser(userId) {
    if (!canManageUsers()) return;

    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    editingUserId = userId;

    const drawer = document.querySelector("[data-user-drawer]");

    drawer.innerHTML = userFormMarkup(user);
    openDrawer(drawer);
  }

  function permissionMarkup(user) {
    const fixedPermission =
      user.profile === "administrador"
        ? "users"
        : user.profile === "presidencia"
          ? "usersView"
          : user.profile === "conselhoEtica"
            ? "councilEthics"
            : user.profile === "conselhoFiscal"
              ? "councilFiscal"
              : null;

    return `
      <div class="admin-users__drawer-header">
        <div>
          <span class="admin-users__eyebrow">
            PERFIL + PERMISSÕES ESPECÍFICAS
          </span>

          <h2 id="permissions-drawer-title">
            Permissões
          </h2>

          <p>
            ${escapeHtml(user.name)} ·
            ${escapeHtml(profileLabel(user.profile))}
          </p>
        </div>

        <button
          type="button"
          class="admin-users__close"
          data-close-users-drawer
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      ${
        fixedPermission
          ? `
            <div class="admin-users__fixed-permission">
              <strong>Permissão estrutural do perfil</strong>

              <span>
                ${
                  fixedPermission === "users"
                    ? "Gerenciamento de usuários"
                    : fixedPermission === "usersView"
                      ? "Consulta de usuários"
                      : fixedPermission === "councilEthics"
                        ? "Escopo exclusivo do Conselho de Ética"
                        : "Escopo exclusivo do Conselho Fiscal"
                }
              </span>
            </div>
          `
          : ""
      }

      <form data-permissions-form>

        <fieldset class="admin-users__permissions">
          <legend>Permissões adicionais</legend>

          ${PERMISSION_OPTIONS.map(([permission, label]) => `
            <label>
              <input
                type="checkbox"
                name="permission"
                value="${permission}"
                ${user.permissions.includes(permission) ? "checked" : ""}
              >

              <span>${label}</span>
            </label>
          `).join("")}

        </fieldset>

        <div class="admin-users__form-note">
          Os escopos confidenciais dos Conselhos não podem ser atribuídos
          como permissões adicionais nesta tela.
        </div>

        <div class="admin-users__drawer-actions">
          <button
            type="button"
            class="button button--secondary"
            data-close-users-drawer
          >
            CANCELAR
          </button>

          <button
            type="submit"
            class="button button--primary"
          >
            SALVAR PERMISSÕES
          </button>
        </div>

      </form>
    `;
  }

  function openPermissions(userId) {
    if (!canManageUsers()) return;

    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    permissionsUserId = userId;

    const drawer =
      document.querySelector("[data-permissions-drawer]");

    drawer.innerHTML = permissionMarkup(user);
    openDrawer(drawer);
  }

  function saveUser(form) {
    const data = new FormData(form);

    const profile = String(data.get("profile"));
    const basePermissions = [
      ...(DEFAULT_PERMISSIONS[profile] || [])
    ];

    if (editingUserId) {
      const user = users.find(
        (entry) => entry.id === editingUserId
      );

      if (!user) return;

      user.name = String(data.get("name")).trim();
      user.email = String(data.get("email")).trim();
      user.status = String(data.get("status"));

      if (user.profile !== profile) {
        user.profile = profile;
        user.permissions = basePermissions;
      }
    } else {
      users.push({
        id: nextUserId(),
        name: String(data.get("name")).trim(),
        email: String(data.get("email")).trim(),
        profile,
        status: String(data.get("status")),
        permissions: basePermissions
      });
    }

    saveUsers();
    closeDrawers();
    renderUsersModule();
  }

  function savePermissions(form) {
    const user = users.find(
      (entry) => entry.id === permissionsUserId
    );

    if (!user) return;

    const selected = [
      ...form.querySelectorAll(
        'input[name="permission"]:checked'
      )
    ].map((input) => input.value);

    const structural = [];

    if (user.profile === "administrador") {
      structural.push("users", "usersView");
    }

    if (user.profile === "presidencia") {
      structural.push("usersView");
    }

    if (user.profile === "conselhoEtica") {
      structural.push("councilEthics");
    }

    if (user.profile === "conselhoFiscal") {
      structural.push("councilFiscal");
    }

    user.permissions = [...new Set([
      ...structural,
      ...selected
    ])];

    saveUsers();
    closeDrawers();
    renderUsersModule();
  }

  function toggleUser(userId) {
    if (!canManageUsers()) return;

    const user = users.find((entry) => entry.id === userId);
    if (!user) return;

    user.status =
      user.status === "ativo"
        ? "inativo"
        : "ativo";

    saveUsers();
    renderUsersModule();
  }

  function bindModuleEvents() {
    const container = document.querySelector("[data-admin-users]");
    if (!container) return;

    container
      .querySelector("[data-users-search]")
      ?.addEventListener("input", filterUsers);

    container
      .querySelector("[data-users-profile]")
      ?.addEventListener("change", filterUsers);

    container
      .querySelector("[data-users-status]")
      ?.addEventListener("change", filterUsers);

    container
      .querySelector("[data-new-user]")
      ?.addEventListener("click", openNewUser);

    container.addEventListener("click", (event) => {
      const editButton =
        event.target.closest("[data-edit-user]");

      const permissionsButton =
        event.target.closest("[data-permissions-user]");

      const toggleButton =
        event.target.closest("[data-toggle-user]");

      const closeButton =
        event.target.closest("[data-close-users-drawer]");

      if (editButton) {
        openEditUser(editButton.dataset.editUser);
      }

      if (permissionsButton) {
        openPermissions(
          permissionsButton.dataset.permissionsUser
        );
      }

      if (toggleButton) {
        toggleUser(toggleButton.dataset.toggleUser);
      }

      if (closeButton) {
        closeDrawers();
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-user-form]")) {
        event.preventDefault();
        saveUser(event.target);
      }

      if (event.target.matches("[data-permissions-form]")) {
        event.preventDefault();
        savePermissions(event.target);
      }
    });

    container
      .querySelector("[data-users-overlay]")
      ?.addEventListener("click", closeDrawers);
  }

  function markUsersNavigation() {
    document
      .querySelectorAll(".admin-nav__link")
      .forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

    const usersLink = [
      ...document.querySelectorAll(".admin-nav__link")
    ].find((link) =>
      link.getAttribute("href") === "admin-usuarios.html"
    );

    if (usersLink) {
      usersLink.classList.add("is-active");
      usersLink.setAttribute("aria-current", "page");
    }
  }

  function init() {
    if (!document.querySelector("[data-admin-users]")) {
      return;
    }

    renderUsersModule();

    document.addEventListener("change", (event) => {
      if (
        event.target.matches("[data-admin-profile-select]")
      ) {
        setTimeout(renderUsersModule, 0);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawers();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
