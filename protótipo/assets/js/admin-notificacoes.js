(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const STORAGE_KEY = "sindGestao.notificationsDemo";

  const ALLOWED_PROFILES = [
    "administrador",
    "diretoria",
    "secretaria",
    "presidencia"
  ];

  const CREATE_PROFILES = [
    "administrador",
    "diretoria",
    "secretaria"
  ];

  const SEND_PROFILES = [
    "administrador",
    "secretaria"
  ];

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    diretoria: "Diretoria",
    secretaria: "Secretaria",
    presidencia: "Presidência"
  };

  const DEFAULT_NOTIFICATIONS = [
    {
      id: "NTF-0001",
      title: "Atualização cadastral em preparação",
      category: "Cadastro",
      audience: "Filiados",
      priority: "Normal",
      message:
        "Lembrete demonstrativo para revisão dos dados cadastrais na Área do Filiado.",
      startDate: "2026-11-05",
      endDate: "",
      status: "Rascunho",
      author: "Secretaria-Geral",
      createdAt: "05/11/2026",
      createdAtISO: "2026-11-05",
      updatedAt: "05/11/2026",
      sentAt: "",
      sentAtISO: "",
      history: [
        {
          action: "Notificação criada",
          actor: "Secretaria-Geral",
          date: "05/11/2026"
        }
      ]
    },

    {
      id: "NTF-0002",
      title: "Prazo para envio de documento",
      category: "Documentos",
      audience: "Filiados",
      priority: "Alta",
      message:
        "Aviso demonstrativo preparado pela Diretoria e aguardando envio aos filiados.",
      startDate: "2026-11-05",
      endDate: "",
      status: "Aguardando envio",
      author: "Diretoria Executiva",
      createdAt: "05/11/2026",
      createdAtISO: "2026-11-05",
      updatedAt: "05/11/2026",
      sentAt: "",
      sentAtISO: "",
      history: [
        {
          action: "Notificação criada",
          actor: "Diretoria Executiva",
          date: "05/11/2026"
        },
        {
          action: "Encaminhada para envio",
          actor: "Diretoria Executiva",
          date: "05/11/2026"
        }
      ]
    },

    {
      id: "NTF-0003",
      title: "Reunião interna da Diretoria",
      category: "Institucional",
      audience: "Diretoria",
      priority: "Normal",
      message:
        "Notificação interna demonstrativa já enviada à Diretoria.",
      startDate: "2026-11-04",
      endDate: "",
      status: "Enviada",
      author: "Secretaria-Geral",
      createdAt: "04/11/2026",
      createdAtISO: "2026-11-04",
      updatedAt: "04/11/2026",
      sentAt: "04/11/2026",
      sentAtISO: "2026-11-04",
      history: [
        {
          action: "Notificação criada",
          actor: "Secretaria-Geral",
          date: "04/11/2026"
        },
        {
          action: "Notificação enviada",
          actor: "Secretaria-Geral",
          date: "04/11/2026"
        }
      ]
    }
  ];

  let notifications =
    deduplicate(
      loadNotifications()
    );

  let drawerMode = "";
  let activeId = null;

  saveNotifications();

  function currentProfile() {
    try {
      // Mesma fonte usada por area-admin.js (localStorage),
      // evitando divergência entre o perfil exibido no shell e o do módulo.
      return (
        localStorage.getItem(PROFILE_KEY) ||
        "administrador"
      );
    } catch {
      return "administrador";
    }
  }

  function profileLabel() {
    return (
      PROFILE_LABELS[currentProfile()] ||
      currentProfile()
    );
  }

  function canAccess() {
    return ALLOWED_PROFILES.includes(
      currentProfile()
    );
  }

  function canCreate() {
    return CREATE_PROFILES.includes(
      currentProfile()
    );
  }

  function canSend() {
    return SEND_PROFILES.includes(
      currentProfile()
    );
  }

  function canForward() {
    return currentProfile() === "diretoria";
  }

  function canEditItem(item) {
    if (
      !item ||
      !canCreate() ||
      item.status === "Enviada"
    ) {
      return false;
    }

    if (
      currentProfile() === "diretoria"
    ) {
      return item.status === "Rascunho";
    }

    return true;
  }

  function cloneDefaults() {
    return DEFAULT_NOTIFICATIONS.map(
      (item) => ({
        ...item,
        history: item.history.map(
          (entry) => ({ ...entry })
        )
      })
    );
  }

  function deduplicate(items) {
    const seen = new Set();

    return items.filter((item) => {

      const signature = [
        item.title,
        item.category,
        item.audience,
        item.priority,
        item.message,
        item.createdAt
      ]
        .map(
          (value) =>
            String(value || "")
              .trim()
              .toLowerCase()
        )
        .join("|");

      if (
        seen.has(signature)
      ) {
        return false;
      }

      seen.add(signature);
      return true;
    });
  }

  function loadNotifications() {
    try {
      const saved =
        sessionStorage.getItem(
          STORAGE_KEY
        );

      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Mantém os dados demonstrativos.
    }

    return cloneDefaults();
  }

  function saveNotifications() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch {
      // Estado demonstrativo.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function statusClass(status) {
    return String(status || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function todayData() {
    const now = new Date();

    const yyyy =
      now.getFullYear();

    const mm =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const dd =
      String(
        now.getDate()
      ).padStart(2, "0");

    return {
      iso: `${yyyy}-${mm}-${dd}`,
      label: `${dd}/${mm}/${yyyy}`
    };
  }

  function nextId() {
    const max =
      notifications.reduce(
        (current, item) => {

          const number =
            Number(
              String(
                item.id || ""
              ).replace(/\D/g, "")
            );

          return Number.isFinite(number)
            ? Math.max(
                current,
                number
              )
            : current;
        },
        0
      );

    return (
      `NTF-${String(max + 1)
        .padStart(4, "0")}`
    );
  }

  function svgIcon(name) {
    const icons = {
      eye:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',

      edit:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',

      send:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>',

      forward:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 7 5 5-5 5"/><path d="M4 12h16"/></svg>',

      close:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
    };

    return icons[name] || "";
  }

  function roleDescription() {
    switch (currentProfile()) {

      case "administrador":
        return "Pode criar, editar e enviar notificações.";

      case "secretaria":
        return "Pode criar, editar e enviar notificações.";

      case "diretoria":
        return "Pode criar, editar rascunhos e encaminhar notificações para envio.";

      case "presidencia":
        return "Consulta o histórico e as notificações cadastradas, sem editar ou enviar.";

      default:
        return "Perfil demonstrativo.";
    }
  }

  function statsMarkup() {
    const drafts =
      notifications.filter(
        (item) =>
          item.status === "Rascunho"
      ).length;

    const waiting =
      notifications.filter(
        (item) =>
          item.status === "Aguardando envio"
      ).length;

    const sent =
      notifications.filter(
        (item) =>
          item.status === "Enviada"
      ).length;

    const urgent =
      notifications.filter(
        (item) =>
          item.priority === "Urgente" &&
          item.status !== "Enviada"
      ).length;

    return `
      <section class="admin-notifications__stats">
        <article>
          <span>Rascunhos</span>
          <strong>${drafts}</strong>
        </article>

        <article>
          <span>Aguardando envio</span>
          <strong>${waiting}</strong>
        </article>

        <article>
          <span>Enviadas</span>
          <strong>${sent}</strong>
        </article>

        <article>
          <span>Urgentes pendentes</span>
          <strong>${urgent}</strong>
        </article>
      </section>
    `;
  }

  function rowActions(item) {
    const actions = [];

    actions.push(`
      <button
        type="button"
        class="admin-notifications__icon-button"
        data-view-notification="${escapeHtml(item.id)}"
        title="Visualizar"
        aria-label="Visualizar ${escapeHtml(item.title)}"
      >
        ${svgIcon("eye")}
      </button>
    `);

    if (
      canEditItem(item)
    ) {
      actions.push(`
        <button
          type="button"
          class="admin-notifications__icon-button"
          data-edit-notification="${escapeHtml(item.id)}"
          title="Editar"
          aria-label="Editar ${escapeHtml(item.title)}"
        >
          ${svgIcon("edit")}
        </button>
      `);
    }

    if (
      canForward() &&
      item.status === "Rascunho"
    ) {
      actions.push(`
        <button
          type="button"
          class="admin-notifications__icon-button"
          data-forward-notification="${escapeHtml(item.id)}"
          title="Encaminhar para envio"
          aria-label="Encaminhar ${escapeHtml(item.title)} para envio"
        >
          ${svgIcon("forward")}
        </button>
      `);
    }

    if (
      canSend() &&
      item.status !== "Enviada"
    ) {
      actions.push(`
        <button
          type="button"
          class="admin-notifications__icon-button"
          data-send-notification="${escapeHtml(item.id)}"
          title="Enviar notificação"
          aria-label="Enviar ${escapeHtml(item.title)}"
        >
          ${svgIcon("send")}
        </button>
      `);
    }

    return actions.join("");
  }

  function tableMarkup() {
    const rows =
      [...notifications]
        .sort(
          (a, b) =>
            String(b.id)
              .localeCompare(
                String(a.id),
                "pt-BR"
              )
        )
        .map(
          (item) => `
            <tr
              data-notification-row
              data-search-text="${escapeHtml(
                `${item.title} ${item.category} ${item.audience} ${item.priority} ${item.message}`
              )}"
              data-status="${escapeHtml(item.status)}"
              data-audience="${escapeHtml(item.audience)}"
              data-priority="${escapeHtml(item.priority)}"
            >
              <td>
                <strong>${escapeHtml(item.title)}</strong>
                <small>
                  ${escapeHtml(item.id)}
                  ·
                  ${escapeHtml(item.category)}
                </small>
              </td>

              <td>
                ${escapeHtml(item.audience)}
              </td>

              <td>
                <span
                  class="admin-notifications__priority admin-notifications__priority--${statusClass(item.priority)}"
                >
                  ${escapeHtml(item.priority)}
                </span>
              </td>

              <td>
                <span
                  class="admin-content__status admin-content__status--${statusClass(item.status)}"
                >
                  ${escapeHtml(item.status)}
                </span>
              </td>

              <td>
                ${escapeHtml(
                  item.updatedAt ||
                  item.createdAt
                )}
              </td>

              <td>
                <div class="admin-notifications__actions">
                  ${rowActions(item)}
                </div>
              </td>
            </tr>
          `
        )
        .join("");

    return `
      <div class="admin-notifications__table-wrap">
        <table class="admin-notifications__table">
          <thead>
            <tr>
              <th>Notificação</th>
              <th>Público</th>
              <th>Prioridade</th>
              <th>Situação</th>
              <th>Atualização</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <p
        class="admin-notifications__count"
        data-notification-count
        aria-live="polite"
      ></p>

      <p
        class="admin-notifications__empty"
        data-notification-empty
        hidden
      >
        Nenhuma notificação encontrada com os filtros informados.
      </p>
    `;
  }

  function formMarkup(item = null) {
    const editing =
      Boolean(item);

    const categories = [
      "Institucional",
      "Cadastro",
      "Assembleias",
      "Documentos",
      "Financeiro",
      "Geral"
    ];

    const audiences = [
      "Filiados",
      "Diretoria",
      "Todos os usuários internos"
    ];

    const priorities = [
      "Normal",
      "Alta",
      "Urgente"
    ];

    return `
      <form
        class="admin-notifications__form"
        data-notification-form
      >
        <div class="admin-notifications__form-grid">

          <label
            class="admin-notifications__field admin-notifications__field--full"
          >
            <span>Título *</span>

            <input
              name="title"
              type="text"
              maxlength="120"
              required
              value="${escapeHtml(item?.title || "")}"
            >
          </label>

          <label class="admin-notifications__field">
            <span>Categoria *</span>

            <select
              name="category"
              required
            >
              ${categories
                .map(
                  (value) => `
                    <option
                      value="${value}"
                      ${
                        item?.category === value
                          ? "selected"
                          : ""
                      }
                    >
                      ${value}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>

          <label class="admin-notifications__field">
            <span>Público-alvo *</span>

            <select
              name="audience"
              required
            >
              ${audiences
                .map(
                  (value) => `
                    <option
                      value="${value}"
                      ${
                        item?.audience === value
                          ? "selected"
                          : ""
                      }
                    >
                      ${value}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>

          <label class="admin-notifications__field">
            <span>Prioridade *</span>

            <select
              name="priority"
              required
            >
              ${priorities
                .map(
                  (value) => `
                    <option
                      value="${value}"
                      ${
                        item?.priority === value
                          ? "selected"
                          : ""
                      }
                    >
                      ${value}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>

          <label class="admin-notifications__field">
            <span>Início da vigência</span>

            <input
              name="startDate"
              type="date"
              value="${escapeHtml(item?.startDate || "")}"
            >
          </label>

          <label class="admin-notifications__field">
            <span>Fim da vigência</span>

            <input
              name="endDate"
              type="date"
              value="${escapeHtml(item?.endDate || "")}"
            >
          </label>

          <label
            class="admin-notifications__field admin-notifications__field--full"
          >
            <span>Mensagem *</span>

            <textarea
              name="message"
              rows="7"
              maxlength="1200"
              required
            >${escapeHtml(item?.message || "")}</textarea>
          </label>

        </div>

        <div class="admin-notifications__form-actions">
          <button
            type="button"
            class="button button--secondary"
            data-close-notification
          >
            CANCELAR
          </button>

          <button
            type="submit"
            class="button button--primary"
          >
            ${
              editing
                ? "SALVAR ALTERAÇÕES"
                : "SALVAR RASCUNHO"
            }
          </button>
        </div>
      </form>
    `;
  }

  function historyMarkup(item) {
    const history =
      Array.isArray(item.history)
        ? item.history
        : [];

    return `
      <section class="admin-notifications__history">
        <h3>Histórico</h3>

        ${history
          .slice()
          .reverse()
          .map(
            (entry) => `
              <article>
                <strong>
                  ${escapeHtml(entry.action)}
                </strong>

                <span>
                  ${escapeHtml(entry.actor)}
                  ·
                  ${escapeHtml(entry.date)}
                </span>
              </article>
            `
          )
          .join("")}
      </section>
    `;
  }

  function detailMarkup(item) {
    return `
      <div class="admin-notifications__detail">

        <div class="admin-notifications__detail-badges">

          <span
            class="admin-content__status admin-content__status--${statusClass(item.status)}"
          >
            ${escapeHtml(item.status)}
          </span>

          <span
            class="admin-notifications__priority admin-notifications__priority--${statusClass(item.priority)}"
          >
            ${escapeHtml(item.priority)}
          </span>

        </div>

        <dl class="admin-notifications__data">

          <div>
            <dt>Protocolo</dt>
            <dd>${escapeHtml(item.id)}</dd>
          </div>

          <div>
            <dt>Categoria</dt>
            <dd>${escapeHtml(item.category)}</dd>
          </div>

          <div>
            <dt>Público</dt>
            <dd>${escapeHtml(item.audience)}</dd>
          </div>

          <div>
            <dt>Autor</dt>
            <dd>${escapeHtml(item.author)}</dd>
          </div>

          <div>
            <dt>Início da vigência</dt>
            <dd>
              ${escapeHtml(
                item.startDate ||
                "Não definido"
              )}
            </dd>
          </div>

          <div>
            <dt>Fim da vigência</dt>
            <dd>
              ${escapeHtml(
                item.endDate ||
                "Não definido"
              )}
            </dd>
          </div>

        </dl>

        <section class="admin-notifications__message">
          <h3>Mensagem</h3>
          <p>${escapeHtml(item.message)}</p>
        </section>

        ${historyMarkup(item)}

        <div class="admin-notifications__drawer-actions">

          ${
            canEditItem(item)
              ? `
                <button
                  type="button"
                  class="button button--secondary"
                  data-edit-notification="${escapeHtml(item.id)}"
                >
                  EDITAR
                </button>
              `
              : ""
          }

          ${
            canForward() &&
            item.status === "Rascunho"
              ? `
                <button
                  type="button"
                  class="button button--primary"
                  data-forward-notification="${escapeHtml(item.id)}"
                >
                  ENCAMINHAR PARA ENVIO
                </button>
              `
              : ""
          }

          ${
            canSend() &&
            item.status !== "Enviada"
              ? `
                <button
                  type="button"
                  class="button button--primary"
                  data-send-notification="${escapeHtml(item.id)}"
                >
                  ENVIAR NOTIFICAÇÃO
                </button>
              `
              : ""
          }

        </div>
      </div>
    `;
  }

  function drawerMarkup() {
    if (!drawerMode) {
      return "";
    }

    const item =
      notifications.find(
        (entry) =>
          entry.id === activeId
      ) || null;

    const title =
      drawerMode === "new"
        ? "Nova notificação"
        : drawerMode === "edit"
          ? "Editar notificação"
          : item?.title ||
            "Notificação";

    return `
      <div
        class="admin-notifications__overlay"
        data-notification-overlay
      ></div>

      <aside
        class="admin-notifications__drawer"
        aria-label="${escapeHtml(title)}"
      >

        <header class="admin-notifications__drawer-header">

          <div>
            <span>NOTIFICAÇÕES</span>
            <h2>${escapeHtml(title)}</h2>
          </div>

          <button
            type="button"
            class="admin-notifications__icon-button"
            data-close-notification
            aria-label="Fechar"
          >
            ${svgIcon("close")}
          </button>

        </header>

        ${
          drawerMode === "new"
            ? formMarkup()
            : drawerMode === "edit"
              ? formMarkup(item)
              : detailMarkup(item)
        }

      </aside>
    `;
  }

  function render() {
    const container =
      document.querySelector(
        "[data-admin-content]"
      );

    if (!container) {
      return;
    }

    if (!canAccess()) {

      container.innerHTML = `
        <section class="admin-notifications">

          <p class="admin-dashboard__eyebrow">
            ÁREA ADMINISTRATIVA
          </p>

          <h1>Notificações</h1>

          <div class="admin-notifications__denied">
            <strong>
              Acesso não autorizado
            </strong>

            <p>
              O perfil
              ${escapeHtml(profileLabel())}
              não possui permissão para acessar este módulo.
            </p>
          </div>

        </section>
      `;

      markNavigation();
      return;
    }

    container.innerHTML = `
      <section class="admin-notifications">

        <header class="admin-notifications__header">

          <div>
            <p class="admin-dashboard__eyebrow">
              ÁREA ADMINISTRATIVA / NOTIFICAÇÕES
            </p>

            <h1>Notificações</h1>

            <p>
              Criação, encaminhamento, envio e histórico de avisos institucionais.
            </p>
          </div>

          ${
            canCreate()
              ? `
                <button
                  type="button"
                  class="button button--primary"
                  data-new-notification
                >
                  NOVA NOTIFICAÇÃO
                </button>
              `
              : ""
          }

        </header>

        <aside class="admin-notifications__role-note">
          <strong>
            ${escapeHtml(profileLabel())}
          </strong>

          <span>
            ${escapeHtml(roleDescription())}
          </span>
        </aside>

        ${statsMarkup()}

        <section class="admin-notifications__panel">

          <div class="admin-notifications__filters">

            <label>
              <span>Buscar</span>

              <input
                type="search"
                placeholder="Título, categoria ou mensagem"
                data-notification-search
              >
            </label>

            <label>
              <span>Situação</span>

              <select data-notification-status>
                <option value="">Todas</option>
                <option>Rascunho</option>
                <option>Aguardando envio</option>
                <option>Enviada</option>
              </select>
            </label>

            <label>
              <span>Público</span>

              <select data-notification-audience>
                <option value="">Todos</option>
                <option>Filiados</option>
                <option>Diretoria</option>
                <option>Todos os usuários internos</option>
              </select>
            </label>

            <label>
              <span>Prioridade</span>

              <select data-notification-priority>
                <option value="">Todas</option>
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </label>

          </div>

          ${tableMarkup()}

        </section>

        ${drawerMarkup()}

      </section>
    `;

    markNavigation();
    applyFilters();
  }

  function applyFilters() {
    const container =
      document.querySelector(
        "[data-admin-content]"
      );

    if (!container) {
      return;
    }

    const term =
      (
        container.querySelector(
          "[data-notification-search]"
        )?.value || ""
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase()
        .trim();

    const status =
      container.querySelector(
        "[data-notification-status]"
      )?.value || "";

    const audience =
      container.querySelector(
        "[data-notification-audience]"
      )?.value || "";

    const priority =
      container.querySelector(
        "[data-notification-priority]"
      )?.value || "";

    let count = 0;

    container
      .querySelectorAll(
        "[data-notification-row]"
      )
      .forEach((row) => {

        const searchable =
          String(
            row.dataset.searchText || ""
          )
            .normalize("NFD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .toLowerCase();

        const visible =
          (
            !term ||
            searchable.includes(term)
          ) &&
          (
            !status ||
            row.dataset.status === status
          ) &&
          (
            !audience ||
            row.dataset.audience === audience
          ) &&
          (
            !priority ||
            row.dataset.priority === priority
          );

        row.hidden = !visible;

        if (visible) {
          count += 1;
        }
      });

    const counter =
      container.querySelector(
        "[data-notification-count]"
      );

    const empty =
      container.querySelector(
        "[data-notification-empty]"
      );

    if (counter) {
      counter.textContent =
        `${count} notificação(ões) encontrada(s)`;
    }

    if (empty) {
      empty.hidden =
        count !== 0;
    }
  }

  function openNew() {
    if (!canCreate()) {
      return;
    }

    drawerMode = "new";
    activeId = null;

    render();
  }

  function openView(id) {
    const item =
      notifications.find(
        (entry) =>
          entry.id === id
      );

    if (!item) {
      return;
    }

    drawerMode = "view";
    activeId = id;

    render();
  }

  function openEdit(id) {
    const item =
      notifications.find(
        (entry) =>
          entry.id === id
      );

    if (
      !canEditItem(item)
    ) {
      return;
    }

    drawerMode = "edit";
    activeId = id;

    render();
  }

  function closeDrawer() {
    drawerMode = "";
    activeId = null;

    render();
  }

  function saveForm(form) {
    if (!canCreate()) {
      return;
    }

    const data =
      new FormData(form);

    const title =
      String(
        data.get("title") || ""
      ).trim();

    const category =
      String(
        data.get("category") || ""
      ).trim();

    const audience =
      String(
        data.get("audience") || ""
      ).trim();

    const priority =
      String(
        data.get("priority") || ""
      ).trim();

    const startDate =
      String(
        data.get("startDate") || ""
      ).trim();

    const endDate =
      String(
        data.get("endDate") || ""
      ).trim();

    const message =
      String(
        data.get("message") || ""
      ).trim();

    if (
      !title ||
      !category ||
      !audience ||
      !priority ||
      !message
    ) {
      window.alert(
        "Preencha os campos obrigatórios."
      );

      return;
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      window.alert(
        "O fim da vigência não pode ser anterior ao início."
      );

      return;
    }

    const today =
      todayData();

    if (
      drawerMode === "edit" &&
      activeId
    ) {
      const item =
        notifications.find(
          (entry) =>
            entry.id === activeId
        );

      if (
        !canEditItem(item)
      ) {
        return;
      }

      Object.assign(
        item,
        {
          title,
          category,
          audience,
          priority,
          startDate,
          endDate,
          message,
          updatedAt: today.label
        }
      );

      item.history =
        Array.isArray(item.history)
          ? item.history
          : [];

      item.history.push({
        action:
          "Notificação atualizada",
        actor:
          profileLabel(),
        date:
          today.label
      });

    } else {

      notifications.push({
        id:
          nextId(),

        title,
        category,
        audience,
        priority,
        message,
        startDate,
        endDate,

        status:
          "Rascunho",

        author:
          profileLabel(),

        createdAt:
          today.label,

        createdAtISO:
          today.iso,

        updatedAt:
          today.label,

        sentAt:
          "",

        sentAtISO:
          "",

        history: [
          {
            action:
              "Notificação criada",

            actor:
              profileLabel(),

            date:
              today.label
          }
        ]
      });
    }

    saveNotifications();

    drawerMode = "";
    activeId = null;

    render();
  }

  function forwardNotification(id) {
    if (!canForward()) {
      return;
    }

    const item =
      notifications.find(
        (entry) =>
          entry.id === id
      );

    if (
      !item ||
      item.status !== "Rascunho"
    ) {
      return;
    }

    const today =
      todayData();

    item.status =
      "Aguardando envio";

    item.updatedAt =
      today.label;

    item.history =
      Array.isArray(item.history)
        ? item.history
        : [];

    item.history.push({
      action:
        "Encaminhada para envio",

      actor:
        profileLabel(),

      date:
        today.label
    });

    saveNotifications();

    drawerMode =
      "view";

    activeId =
      id;

    render();
  }

  function sendNotification(id) {
    if (!canSend()) {
      return;
    }

    const item =
      notifications.find(
        (entry) =>
          entry.id === id
      );

    if (
      !item ||
      item.status === "Enviada"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Enviar a notificação "${item.title}" para ${item.audience}?`
      );

    if (!confirmed) {
      return;
    }

    const today =
      todayData();

    item.status =
      "Enviada";

    item.sentAt =
      today.label;

    item.sentAtISO =
      today.iso;

    item.updatedAt =
      today.label;

    item.history =
      Array.isArray(item.history)
        ? item.history
        : [];

    item.history.push({
      action:
        "Notificação enviada",

      actor:
        profileLabel(),

      date:
        today.label
    });

    saveNotifications();

    drawerMode =
      "view";

    activeId =
      id;

    render();
  }

  function markNavigation() {
    document
      .querySelectorAll(".admin-nav__link")
      .forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

    const current = [
      ...document.querySelectorAll(".admin-nav__link")
    ].find(
      (link) =>
        link.getAttribute("href") ===
        "admin-notificacoes.html"
    );

    if (current) {
      current.classList.add("is-active");
      current.setAttribute(
        "aria-current",
        "page"
      );
    }
  }

  function bindEvents() {
    const container =
      document.querySelector(
        "[data-admin-content]"
      );

    if (
      !container ||
      container.dataset.notificationEventsBound ===
        "true"
    ) {
      return;
    }

    container.dataset.notificationEventsBound =
      "true";

    container.addEventListener(
      "input",
      (event) => {

        if (
          event.target.matches(
            "[data-notification-search]"
          )
        ) {
          applyFilters();
        }

      }
    );

    container.addEventListener(
      "change",
      (event) => {

        if (
          event.target.matches(
            "[data-notification-status], [data-notification-audience], [data-notification-priority]"
          )
        ) {
          applyFilters();
        }

      }
    );

    container.addEventListener(
      "click",
      (event) => {

        if (
          event.target.matches(
            "[data-notification-overlay]"
          )
        ) {
          closeDrawer();
          return;
        }

        const newButton =
          event.target.closest(
            "[data-new-notification]"
          );

        const viewButton =
          event.target.closest(
            "[data-view-notification]"
          );

        const editButton =
          event.target.closest(
            "[data-edit-notification]"
          );

        const forwardButton =
          event.target.closest(
            "[data-forward-notification]"
          );

        const sendButton =
          event.target.closest(
            "[data-send-notification]"
          );

        const closeButton =
          event.target.closest(
            "[data-close-notification]"
          );

        if (newButton) {
          openNew();
          return;
        }

        if (viewButton) {
          openView(
            viewButton.dataset
              .viewNotification
          );
          return;
        }

        if (editButton) {
          openEdit(
            editButton.dataset
              .editNotification
          );
          return;
        }

        if (forwardButton) {
          forwardNotification(
            forwardButton.dataset
              .forwardNotification
          );
          return;
        }

        if (sendButton) {
          sendNotification(
            sendButton.dataset
              .sendNotification
          );
          return;
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
          !event.target.matches(
            "[data-notification-form]"
          )
        ) {
          return;
        }

        event.preventDefault();

        saveForm(
          event.target
        );

      }
    );
  }

  render();
  bindEvents();

})();