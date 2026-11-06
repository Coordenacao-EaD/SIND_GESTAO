(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const STORAGE_KEY = "sindGestao.affiliatesDemo";
  const REQUESTS_KEY = "sindGestao.affiliationRequestsDemo";

  const ALLOWED_PROFILES = [
    "administrador",
    "secretaria",
    "presidencia",
    "diretoria"
  ];

  const MANAGE_PROFILES = [
    "administrador",
    "secretaria"
  ];

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    secretaria: "Secretaria",
    presidencia: "Presidência",
    diretoria: "Diretoria"
  };

  const DEFAULT_AFFILIATES = [
    {
      id: "FIL-0001",
      name: "Filiado demonstrativo 01",
      cpf: "***.***.111-**",
      email: "filiado01@exemplo.local",
      phone: "(65) 99999-1101",
      unit: "Unidade Administrativa",
      role: "Servidor Técnico",
      affiliationDate: "15/02/2023",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0002",
      name: "Filiada demonstrativa 02",
      cpf: "***.***.222-**",
      email: "filiado02@exemplo.local",
      phone: "(65) 99999-2202",
      unit: "Unidade Regional",
      role: "Analista",
      affiliationDate: "08/05/2023",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0003",
      name: "Filiado demonstrativo 03",
      cpf: "***.***.333-**",
      email: "filiado03@exemplo.local",
      phone: "(65) 99999-3303",
      unit: "Sede Administrativa",
      role: "Técnico Administrativo",
      affiliationDate: "19/09/2023",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0004",
      name: "Filiada demonstrativa 04",
      cpf: "***.***.444-**",
      email: "filiado04@exemplo.local",
      phone: "(65) 99999-4404",
      unit: "Unidade Regional",
      role: "Assistente Administrativo",
      affiliationDate: "12/01/2024",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0005",
      name: "Filiado demonstrativo 05",
      cpf: "***.***.555-**",
      email: "filiado05@exemplo.local",
      phone: "(65) 99999-5505",
      unit: "Sede Administrativa",
      role: "Servidor Técnico",
      affiliationDate: "27/03/2024",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0006",
      name: "Filiada demonstrativa 06",
      cpf: "***.***.666-**",
      email: "filiado06@exemplo.local",
      phone: "(65) 99999-6606",
      unit: "Unidade Administrativa",
      role: "Analista",
      affiliationDate: "10/06/2024",
      status: "Inativo",
      originProtocol: ""
    },
    {
      id: "FIL-0007",
      name: "Filiado demonstrativo 07",
      cpf: "***.***.777-**",
      email: "filiado07@exemplo.local",
      phone: "(65) 99999-7707",
      unit: "Unidade Regional",
      role: "Técnico Administrativo",
      affiliationDate: "21/10/2024",
      status: "Ativo",
      originProtocol: ""
    },
    {
      id: "FIL-0008",
      name: "Filiada demonstrativa 08",
      cpf: "***.***.888-**",
      email: "filiado08@exemplo.local",
      phone: "(65) 99999-8808",
      unit: "Sede Administrativa",
      role: "Assistente Administrativo",
      affiliationDate: "17/02/2025",
      status: "Ativo",
      originProtocol: ""
    }
  ];

  let affiliates = loadAffiliates();
  let editingId = null;

  function getCurrentProfile() {
    try {
      return (
        sessionStorage.getItem(PROFILE_KEY) ||
        localStorage.getItem(PROFILE_KEY) ||
        "administrador"
      );
    } catch {
      return "administrador";
    }
  }

  function canAccess() {
    return ALLOWED_PROFILES.includes(
      getCurrentProfile()
    );
  }

  function canManage() {
    return MANAGE_PROFILES.includes(
      getCurrentProfile()
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cloneDefaultData() {
    return DEFAULT_AFFILIATES.map(
      (item) => ({
        ...item
      })
    );
  }

  function loadAffiliates() {
    try {
      const saved =
        sessionStorage.getItem(STORAGE_KEY);

      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Mantem dados demonstrativos iniciais.
    }

    return cloneDefaultData();
  }

  function saveAffiliates() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(affiliates)
      );
    } catch {
      // Estado demonstrativo opcional.
    }
  }

  function loadAffiliationRequests() {
    try {
      const saved =
        sessionStorage.getItem(REQUESTS_KEY);

      if (!saved) return [];

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  function approvedWaitingRegistration() {
    const alreadyRegistered =
      new Set(
        affiliates
          .map((item) => item.originProtocol)
          .filter(Boolean)
      );

    return loadAffiliationRequests().filter(
      (request) =>
        request.status === "Aprovada" &&
        !alreadyRegistered.has(request.protocol)
    );
  }

  function nextId() {
    const highest = affiliates.reduce(
      (max, item) => {
        const number =
          Number(item.id.replace(/\D/g, ""));

        return Math.max(max, number);
      },
      0
    );

    return `FIL-${String(highest + 1).padStart(4, "0")}`;
  }

  function svgIcon(type) {
    const common =
      'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

    if (type === "view") {
      return `
        <svg ${common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path>
          <circle cx="12" cy="12" r="2.5"></circle>
        </svg>
      `;
    }

    if (type === "edit") {
      return `
        <svg ${common}>
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
        </svg>
      `;
    }

    return `
      <svg ${common}>
        <path d="M12 2v10"></path>
        <path d="M6.4 5.6a8 8 0 1 0 11.2 0"></path>
      </svg>
    `;
  }

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-affiliates__denied">
        <span
          class="admin-affiliates__denied-icon"
          aria-hidden="true"
        >
          🔒
        </span>

        <h1>Filiados</h1>

        <p>
          Este perfil não possui acesso ao cadastro de filiados.
        </p>

        <a
          class="button button--primary"
          href="admin-painel.html"
        >
          Voltar ao painel
        </a>
      </div>
    `;
  }

  function modeMarkup() {
    if (canManage()) {
      return `
        <div class="admin-affiliates__role">
          <strong>Gestão cadastral</strong>

          <span>
            Este perfil pode cadastrar, editar e atualizar
            a situação cadastral dos filiados.
          </span>
        </div>
      `;
    }

    return `
      <div class="admin-affiliates__role admin-affiliates__role--readonly">
        <strong>Modo de consulta</strong>

        <span>
          Presidência e Diretoria podem consultar o cadastro,
          mas não alterar informações cadastrais.
        </span>
      </div>
    `;
  }

  function approvedRequestsMarkup() {
    const pending =
      approvedWaitingRegistration();

    if (!pending.length) {
      return "";
    }

    if (!canManage()) {
      return `
        <aside class="admin-affiliates__approved">
          <div>
            <strong>
              ${pending.length}
              ${pending.length === 1
                ? "filiação aprovada aguarda"
                : "filiações aprovadas aguardam"}
              cadastro definitivo
            </strong>

            <span>
              O cadastro será concluído pela equipe responsável.
            </span>
          </div>
        </aside>
      `;
    }

    return `
      <aside class="admin-affiliates__approved">

        <div class="admin-affiliates__approved-heading">
          <div>
            <strong>
              Filiações aprovadas aguardando cadastro
            </strong>

            <span>
              A aprovação não cria o filiado automaticamente.
            </span>
          </div>

          <span class="admin-affiliates__approved-count">
            ${pending.length}
          </span>
        </div>

        <div class="admin-affiliates__approved-list">

          ${pending.map((request) => `
            <div class="admin-affiliates__approved-item">

              <div>
                <strong>
                  ${escapeHtml(request.applicant)}
                </strong>

                <span>
                  ${escapeHtml(request.protocol)}
                </span>
              </div>

              <button
                type="button"
                class="button button--secondary"
                data-register-approved="${escapeHtml(request.protocol)}"
              >
                CADASTRAR FILIADO
              </button>

            </div>
          `).join("")}

        </div>

      </aside>
    `;
  }

  function rowsMarkup(list) {
    if (!list.length) {
      return `
        <tr>
          <td
            colspan="7"
            class="admin-affiliates__empty"
          >
            Nenhum filiado encontrado.
          </td>
        </tr>
      `;
    }

    return list.map((affiliate) => `
      <tr>

        <td>
          <strong>
            ${escapeHtml(affiliate.id)}
          </strong>

          <small>
            Desde ${escapeHtml(affiliate.affiliationDate)}
          </small>
        </td>

        <td>
          <strong>
            ${escapeHtml(affiliate.name)}
          </strong>

          <small>
            ${escapeHtml(affiliate.email)}
          </small>
        </td>

        <td>
          ${escapeHtml(affiliate.cpf)}
        </td>

        <td>
          ${escapeHtml(affiliate.unit)}
        </td>

        <td>
          ${escapeHtml(affiliate.role)}
        </td>

        <td>
          <span
            class="admin-affiliates__status admin-affiliates__status--${affiliate.status.toLowerCase()}"
          >
            ${escapeHtml(affiliate.status)}
          </span>
        </td>

        <td>
          <div class="admin-affiliates__actions">

            <button
              type="button"
              class="admin-affiliates__icon-button"
              data-view-affiliate="${escapeHtml(affiliate.id)}"
              title="Visualizar"
              aria-label="Visualizar cadastro de ${escapeHtml(affiliate.name)}"
            >
              ${svgIcon("view")}
            </button>

            ${
              canManage()
                ? `
                  <button
                    type="button"
                    class="admin-affiliates__icon-button"
                    data-edit-affiliate="${escapeHtml(affiliate.id)}"
                    title="Editar"
                    aria-label="Editar cadastro de ${escapeHtml(affiliate.name)}"
                  >
                    ${svgIcon("edit")}
                  </button>

                  <button
                    type="button"
                    class="admin-affiliates__icon-button"
                    data-toggle-affiliate="${escapeHtml(affiliate.id)}"
                    title="${affiliate.status === "Ativo" ? "Inativar" : "Ativar"}"
                    aria-label="${affiliate.status === "Ativo" ? "Inativar" : "Ativar"} ${escapeHtml(affiliate.name)}"
                  >
                    ${svgIcon("power")}
                  </button>
                `
                : ""
            }

          </div>
        </td>

      </tr>
    `).join("");
  }

  function renderModule() {
    const container =
      document.querySelector(
        "[data-admin-affiliates]"
      );

    if (!container) return;

    document.body.style.overflow = "";

    markNavigation();

    if (!canAccess()) {
      renderDenied(container);
      return;
    }

    const activeSample =
      affiliates.filter(
        (item) => item.status === "Ativo"
      ).length;

    const inactiveSample =
      affiliates.length - activeSample;

    const pendingApproved =
      approvedWaitingRegistration().length;

    container.innerHTML = `
      <p class="admin-affiliates__notice">
        Dados demonstrativos do protótipo — nenhum registro representa filiado real.
      </p>

      <header class="admin-affiliates__header">

        <div>
          <span class="admin-affiliates__eyebrow">
            PESSOAS / FILIADOS
          </span>

          <h1 id="admin-affiliates-title">
            Filiados
          </h1>

          <p>
            Cadastro e acompanhamento dos vínculos sindicais.
          </p>
        </div>

        <div class="admin-affiliates__header-actions">

          <span class="admin-affiliates__profile">
            ${escapeHtml(
              PROFILE_LABELS[getCurrentProfile()]
            )}
          </span>

          ${
            canManage()
              ? `
                <button
                  type="button"
                  class="button button--primary"
                  data-new-affiliate
                >
                  NOVO FILIADO
                </button>
              `
              : ""
          }

        </div>

      </header>

      ${modeMarkup()}

      <div class="admin-affiliates__stats">

        <article>
          <span>Filiados ativos</span>
          <strong>428</strong>
          <small>
            Indicador geral demonstrativo
          </small>
        </article>

        <article>
          <span>Registros na amostra</span>
          <strong>${affiliates.length}</strong>
          <small>
            Dados fictícios exibidos
          </small>
        </article>

        <article>
          <span>Inativos na amostra</span>
          <strong>${inactiveSample}</strong>
          <small>
            Situação cadastral
          </small>
        </article>

        <article>
          <span>Aprovados aguardando cadastro</span>
          <strong>${pendingApproved}</strong>
          <small>
            Originados do fluxo de filiação
          </small>
        </article>

      </div>

      ${approvedRequestsMarkup()}

      <section class="admin-affiliates__panel">

        <div class="admin-affiliates__filters">

          <label>
            <span>Buscar</span>

            <input
              type="search"
              placeholder="Nome, matrícula, CPF ou e-mail"
              data-affiliate-search
            >
          </label>

          <label>
            <span>Situação</span>

            <select data-affiliate-status>
              <option value="">
                Todas
              </option>

              <option value="Ativo">
                Ativos
              </option>

              <option value="Inativo">
                Inativos
              </option>
            </select>
          </label>

        </div>

        <div class="admin-affiliates__table-wrap">

          <table class="admin-affiliates__table">

            <thead>
              <tr>
                <th>Matrícula sindical</th>
                <th>Filiado</th>
                <th>CPF</th>
                <th>Unidade</th>
                <th>Cargo/Função</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody data-affiliate-table>
              ${rowsMarkup(affiliates)}
            </tbody>

          </table>

        </div>

      </section>

      <aside class="admin-affiliates__rule">

        <strong>
          Integração com Solicitações de Filiação
        </strong>

        <p>
          Uma solicitação aprovada não cria automaticamente
          um cadastro de filiado. A aprovação encerra a análise
          da solicitação e autoriza a etapa de cadastro definitivo.
        </p>

      </aside>

      <div
        class="admin-affiliates__overlay"
        data-affiliate-overlay
        hidden
      ></div>

      <aside
        class="admin-affiliates__drawer"
        data-affiliate-drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliate-drawer-title"
        hidden
      ></aside>
    `;

    bindEvents();
  }

  function filterAffiliates() {
    const search =
      document.querySelector(
        "[data-affiliate-search]"
      )?.value
        .trim()
        .toLowerCase() || "";

    const status =
      document.querySelector(
        "[data-affiliate-status]"
      )?.value || "";

    const filtered =
      affiliates.filter((affiliate) => {

        const searchable =
          [
            affiliate.id,
            affiliate.name,
            affiliate.cpf,
            affiliate.email,
            affiliate.unit,
            affiliate.role
          ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          !search ||
          searchable.includes(search);

        const matchesStatus =
          !status ||
          affiliate.status === status;

        return (
          matchesSearch &&
          matchesStatus
        );
      });

    const body =
      document.querySelector(
        "[data-affiliate-table]"
      );

    if (body) {
      body.innerHTML =
        rowsMarkup(filtered);
    }
  }

  function detailMarkup(affiliate) {
    return `
      <header class="admin-affiliates__drawer-header">

        <div>
          <span class="admin-affiliates__eyebrow">
            ${escapeHtml(affiliate.id)}
          </span>

          <h2 id="affiliate-drawer-title">
            Cadastro do filiado
          </h2>
        </div>

        <button
          type="button"
          class="admin-affiliates__close"
          data-close-affiliate
          aria-label="Fechar"
        >
          ×
        </button>

      </header>

      <div class="admin-affiliates__drawer-status">
        <span>Situação cadastral</span>

        <strong>
          ${escapeHtml(affiliate.status)}
        </strong>
      </div>

      <dl class="admin-affiliates__details">

        <div>
          <dt>Nome</dt>
          <dd>${escapeHtml(affiliate.name)}</dd>
        </div>

        <div>
          <dt>CPF</dt>
          <dd>${escapeHtml(affiliate.cpf)}</dd>
        </div>

        <div>
          <dt>E-mail</dt>
          <dd>${escapeHtml(affiliate.email)}</dd>
        </div>

        <div>
          <dt>Telefone</dt>
          <dd>${escapeHtml(affiliate.phone)}</dd>
        </div>

        <div>
          <dt>Unidade / Lotação</dt>
          <dd>${escapeHtml(affiliate.unit)}</dd>
        </div>

        <div>
          <dt>Cargo / Função</dt>
          <dd>${escapeHtml(affiliate.role)}</dd>
        </div>

        <div>
          <dt>Data de filiação</dt>
          <dd>${escapeHtml(affiliate.affiliationDate)}</dd>
        </div>

        <div>
          <dt>Origem</dt>

          <dd>
            ${
              affiliate.originProtocol
                ? `Solicitação ${escapeHtml(affiliate.originProtocol)}`
                : "Cadastro administrativo demonstrativo"
            }
          </dd>
        </div>

      </dl>

      ${
        !canManage()
          ? `
            <div class="admin-affiliates__readonly">
              <strong>Somente consulta</strong>

              <span>
                Este perfil não pode alterar
                informações cadastrais.
              </span>
            </div>
          `
          : ""
      }
    `;
  }

  function formMarkup(
    affiliate = null,
    sourceRequest = null
  ) {
    const isEditing =
      Boolean(affiliate);

    const name =
      affiliate?.name ||
      sourceRequest?.applicant ||
      "";

    const cpf =
      affiliate?.cpf ||
      sourceRequest?.cpf ||
      "";

    const email =
      affiliate?.email ||
      sourceRequest?.email ||
      "";

    const protocol =
      affiliate?.originProtocol ||
      sourceRequest?.protocol ||
      "";

    return `
      <header class="admin-affiliates__drawer-header">

        <div>
          <span class="admin-affiliates__eyebrow">
            ${
              isEditing
                ? "EDIÇÃO CADASTRAL"
                : protocol
                  ? `ORIGEM ${escapeHtml(protocol)}`
                  : "NOVO CADASTRO"
            }
          </span>

          <h2 id="affiliate-drawer-title">
            ${
              isEditing
                ? "Editar filiado"
                : "Cadastrar filiado"
            }
          </h2>
        </div>

        <button
          type="button"
          class="admin-affiliates__close"
          data-close-affiliate
          aria-label="Fechar"
        >
          ×
        </button>

      </header>

      ${
        protocol
          ? `
            <div class="admin-affiliates__source">
              <strong>
                Solicitação de filiação aprovada
              </strong>

              <span>
                ${escapeHtml(protocol)}
              </span>
            </div>
          `
          : ""
      }

      <form data-affiliate-form>

        <input
          type="hidden"
          name="originProtocol"
          value="${escapeHtml(protocol)}"
        >

        <label class="admin-affiliates__field">
          <span>Nome completo *</span>

          <input
            type="text"
            name="name"
            value="${escapeHtml(name)}"
            required
          >
        </label>

        <div class="admin-affiliates__form-grid">

          <label class="admin-affiliates__field">
            <span>CPF *</span>

            <input
              type="text"
              name="cpf"
              value="${escapeHtml(cpf)}"
              required
            >
          </label>

          <label class="admin-affiliates__field">
            <span>Data de filiação *</span>

            <input
              type="text"
              name="affiliationDate"
              value="${escapeHtml(
                affiliate?.affiliationDate ||
                "05/11/2026"
              )}"
              placeholder="dd/mm/aaaa"
              required
            >
          </label>

        </div>

        <label class="admin-affiliates__field">
          <span>E-mail *</span>

          <input
            type="email"
            name="email"
            value="${escapeHtml(email)}"
            required
          >
        </label>

        <label class="admin-affiliates__field">
          <span>Telefone</span>

          <input
            type="text"
            name="phone"
            value="${escapeHtml(
              affiliate?.phone || ""
            )}"
          >
        </label>

        <label class="admin-affiliates__field">
          <span>Unidade / Lotação *</span>

          <input
            type="text"
            name="unit"
            value="${escapeHtml(
              affiliate?.unit || ""
            )}"
            required
          >
        </label>

        <label class="admin-affiliates__field">
          <span>Cargo / Função *</span>

          <input
            type="text"
            name="role"
            value="${escapeHtml(
              affiliate?.role || ""
            )}"
            required
          >
        </label>

        <label class="admin-affiliates__field">
          <span>Situação *</span>

          <select
            name="status"
            required
          >

            <option
              value="Ativo"
              ${
                affiliate?.status !== "Inativo"
                  ? "selected"
                  : ""
              }
            >
              Ativo
            </option>

            <option
              value="Inativo"
              ${
                affiliate?.status === "Inativo"
                  ? "selected"
                  : ""
              }
            >
              Inativo
            </option>

          </select>
        </label>

        <div class="admin-affiliates__form-note">
          Cadastro exclusivamente demonstrativo.
          Nenhuma informação pessoal real deve ser inserida.
        </div>

        <div class="admin-affiliates__drawer-actions">

          <button
            type="button"
            class="button button--secondary"
            data-close-affiliate
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

  function openDrawer(markup) {
    const overlay =
      document.querySelector(
        "[data-affiliate-overlay]"
      );

    const drawer =
      document.querySelector(
        "[data-affiliate-drawer]"
      );

    if (!overlay || !drawer) return;

    drawer.innerHTML = markup;

    overlay.hidden = false;
    drawer.hidden = false;

    document.body.style.overflow =
      "hidden";
  }

  function closeDrawer() {
    const overlay =
      document.querySelector(
        "[data-affiliate-overlay]"
      );

    const drawer =
      document.querySelector(
        "[data-affiliate-drawer]"
      );

    if (overlay) {
      overlay.hidden = true;
    }

    if (drawer) {
      drawer.hidden = true;
    }

    document.body.style.overflow = "";
    editingId = null;
  }

  function openDetails(id) {
    const affiliate =
      affiliates.find(
        (item) => item.id === id
      );

    if (!affiliate) return;

    openDrawer(
      detailMarkup(affiliate)
    );
  }

  function openNew() {
    if (!canManage()) return;

    editingId = null;

    openDrawer(
      formMarkup()
    );
  }

  function openEdit(id) {
    if (!canManage()) return;

    const affiliate =
      affiliates.find(
        (item) => item.id === id
      );

    if (!affiliate) return;

    editingId = id;

    openDrawer(
      formMarkup(affiliate)
    );
  }

  function openApproved(protocol) {
    if (!canManage()) return;

    const request =
      approvedWaitingRegistration()
        .find(
          (item) =>
            item.protocol === protocol
        );

    if (!request) return;

    editingId = null;

    openDrawer(
      formMarkup(null, request)
    );
  }

  function saveForm(form) {
    if (!canManage()) return;

    const data =
      new FormData(form);

    const payload = {
      name:
        String(data.get("name")).trim(),

      cpf:
        String(data.get("cpf")).trim(),

      email:
        String(data.get("email")).trim(),

      phone:
        String(data.get("phone")).trim(),

      unit:
        String(data.get("unit")).trim(),

      role:
        String(data.get("role")).trim(),

      affiliationDate:
        String(
          data.get("affiliationDate")
        ).trim(),

      status:
        String(data.get("status")),

      originProtocol:
        String(
          data.get("originProtocol")
        ).trim()
    };

    if (editingId) {
      const affiliate =
        affiliates.find(
          (item) =>
            item.id === editingId
        );

      if (!affiliate) return;

      Object.assign(
        affiliate,
        payload
      );
    } else {
      affiliates.push({
        id: nextId(),
        ...payload
      });
    }

    saveAffiliates();
    closeDrawer();
    renderModule();
  }

  function toggleStatus(id) {
    if (!canManage()) return;

    const affiliate =
      affiliates.find(
        (item) => item.id === id
      );

    if (!affiliate) return;

    affiliate.status =
      affiliate.status === "Ativo"
        ? "Inativo"
        : "Ativo";

    saveAffiliates();
    renderModule();
  }

  function bindEvents() {
    const container =
      document.querySelector(
        "[data-admin-affiliates]"
      );

    if (!container) return;

    container
      .querySelector(
        "[data-affiliate-search]"
      )
      ?.addEventListener(
        "input",
        filterAffiliates
      );

    container
      .querySelector(
        "[data-affiliate-status]"
      )
      ?.addEventListener(
        "change",
        filterAffiliates
      );

    container.addEventListener(
      "click",
      (event) => {

        const newButton =
          event.target.closest(
            "[data-new-affiliate]"
          );

        const viewButton =
          event.target.closest(
            "[data-view-affiliate]"
          );

        const editButton =
          event.target.closest(
            "[data-edit-affiliate]"
          );

        const toggleButton =
          event.target.closest(
            "[data-toggle-affiliate]"
          );

        const approvedButton =
          event.target.closest(
            "[data-register-approved]"
          );

        const closeButton =
          event.target.closest(
            "[data-close-affiliate]"
          );

        if (newButton) {
          openNew();
        }

        if (viewButton) {
          openDetails(
            viewButton.dataset.viewAffiliate
          );
        }

        if (editButton) {
          openEdit(
            editButton.dataset.editAffiliate
          );
        }

        if (toggleButton) {
          toggleStatus(
            toggleButton.dataset.toggleAffiliate
          );
        }

        if (approvedButton) {
          openApproved(
            approvedButton.dataset.registerApproved
          );
        }

        if (closeButton) {
          closeDrawer();
        }
      }
    );

    container.addEventListener(
      "submit",
      (event) => {
        if (
          event.target.matches(
            "[data-affiliate-form]"
          )
        ) {
          event.preventDefault();
          saveForm(event.target);
        }
      }
    );

    container
      .querySelector(
        "[data-affiliate-overlay]"
      )
      ?.addEventListener(
        "click",
        closeDrawer
      );
  }

  function markNavigation() {
    document
      .querySelectorAll(
        ".admin-nav__link"
      )
      .forEach((link) => {
        link.classList.remove(
          "is-active"
        );

        link.removeAttribute(
          "aria-current"
        );
      });

    const current =
      [
        ...document.querySelectorAll(
          ".admin-nav__link"
        )
      ].find(
        (link) =>
          link.getAttribute("href") ===
          "admin-filiados.html"
      );

    if (current) {
      current.classList.add(
        "is-active"
      );

      current.setAttribute(
        "aria-current",
        "page"
      );
    }
  }

  function init() {
    if (
      !document.querySelector(
        "[data-admin-affiliates]"
      )
    ) {
      return;
    }

    renderModule();

    document.addEventListener(
      "change",
      (event) => {
        if (
          event.target.matches(
            "[data-admin-profile-select]"
          )
        ) {
          setTimeout(
            renderModule,
            0
          );
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") {
          closeDrawer();
        }
      }
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();