(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";

  const STORAGE_KEY =
    "sindGestao.communicationWorkflowDemo";

  const ALLOWED_PROFILES = [
    "administrador",
    "diretoria",
    "secretaria",
    "presidencia"
  ];

  const EDITOR_PROFILES = [
    "administrador",
    "diretoria",
    "secretaria"
  ];

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    diretoria: "Diretoria",
    secretaria: "Secretaria",
    presidencia: "Presidência"
  };

  const DEFAULT_WORKFLOW = [
    {
      id: "CNT-0001",
      publicId: 9001,
      type: "Notícia",
      title: "Nova ação institucional em preparação",
      category: "Institucional",
      categorySlug: "institucional",
      audience: "Público geral",
      summary:
        "Conteúdo demonstrativo em elaboração para representar o fluxo editorial.",
      body:
        "Texto demonstrativo da notícia em elaboração.",
      author: "Secretaria-Geral",
      status: "Rascunho",
      createdAt: "04/11/2026",
      updatedAt: "04/11/2026"
    },

    {
      id: "CNT-0002",
      publicId: 9002,
      type: "Comunicado",
      title: "Comunicado institucional aguardando revisão",
      category: "Informes",
      categorySlug: "informes",
      audience: "Filiados",
      summary:
        "Comunicado demonstrativo enviado para revisão editorial.",
      body:
        "Conteúdo demonstrativo aguardando avaliação da Presidência.",
      author: "Diretoria Executiva",
      status: "Em revisão",
      createdAt: "03/11/2026",
      updatedAt: "04/11/2026"
    }
  ];

  let workflow =
    deduplicateWorkflow(
      loadWorkflow()
    );

  let activeId = null;
  let editingId = null;

  saveWorkflow();

  function currentProfile() {
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
      currentProfile()
    );
  }

  function canEdit() {
    return EDITOR_PROFILES.includes(
      currentProfile()
    );
  }

  function canPublish() {
    return currentProfile() === "presidencia";
  }

  function cloneDefaultWorkflow() {
    return DEFAULT_WORKFLOW.map(
      (item) => ({ ...item })
    );
  }

  function deduplicateWorkflow(items) {
    const seen =
      new Set();

    return items.filter((item) => {

      const signature =
        [
          item.type,
          item.title,
          item.category,
          item.audience,
          item.author,
          item.summary,
          item.body,
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
  function loadWorkflow() {
    try {
      const saved =
        sessionStorage.getItem(STORAGE_KEY);

      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Mantém dados iniciais.
    }

    return cloneDefaultWorkflow();
  }

  function saveWorkflow() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workflow)
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

  function slugify(value) {
    return String(value || "institucional")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function publicNews() {
    if (typeof noticias === "undefined") {
      return [];
    }

    return noticias.map((item) => ({
      id: `PUB-N-${item.id}`,
      type: "Notícia",
      title: item.titulo,
      category: item.categoria,
      audience: "Público geral",
      author: item.autor,
      status: "Publicado",
      date: item.data,
      source: "public"
    }));
  }

  function publicCommunications() {
    if (typeof comunicados === "undefined") {
      return [];
    }

    return comunicados.map((item) => ({
      id: `PUB-C-${item.id}`,
      type: "Comunicado",
      title: item.titulo,
      category: item.categoria,
      audience: item.publicoAlvo,
      author: item.autor,
      status: "Publicado",
      date: item.data,
      source: "public"
    }));
  }

  function allRows() {
    const workflowRows =
      workflow.map((item) => ({
        ...item,
        date:
          item.publishedDateLabel ||
          item.updatedAt ||
          item.createdAt,
        source: "workflow"
      }));

    return [
      ...workflowRows,
      ...publicNews(),
      ...publicCommunications()
    ];
  }

  function nextId() {
    const max = workflow.reduce(
      (current, item) => {
        const number =
          Number(item.id.replace(/\D/g, ""));

        return Math.max(
          current,
          number
        );
      },
      0
    );

    return `CNT-${String(max + 1).padStart(4, "0")}`;
  }

  function nextPublicId() {
    const max =
      workflow.reduce(
        (current, item) =>
          Math.max(
            current,
            Number(item.publicId || 9000)
          ),
        9000
      );

    return max + 1;
  }

  function statusClass(status) {
    return status
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-");
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
        <path d="M22 2 11 13"></path>
        <path d="m22 2-7 20-4-9-9-4Z"></path>
      </svg>
    `;
  }

  function roleDescription() {
    const profile =
      currentProfile();

    if (profile === "presidencia") {
      return {
        title: "Revisão e publicação",
        text:
          "A Presidência revisa conteúdos encaminhados e registra a decisão editorial."
      };
    }

    if (profile === "diretoria") {
      return {
        title: "Produção editorial",
        text:
          "A Diretoria pode criar, editar e encaminhar conteúdos para revisão."
      };
    }

    if (profile === "secretaria") {
      return {
        title: "Produção e organização",
        text:
          "A Secretaria pode criar, editar e encaminhar conteúdos para revisão."
      };
    }

    return {
      title: "Administração técnica",
      text:
        "O Administrador Geral gerencia conteúdos e o fluxo, mas a publicação final permanece submetida à revisão da Presidência."
    };
  }

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-content__denied">
        <span aria-hidden="true">🔒</span>

        <h1>Notícias e Comunicados</h1>

        <p>
          Este perfil não possui acesso ao módulo editorial.
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

  function rowsMarkup(rows) {
    if (!rows.length) {
      return `
        <tr>
          <td colspan="7" class="admin-content__empty">
            Nenhum conteúdo encontrado.
          </td>
        </tr>
      `;
    }

    return rows.map((item) => {
      const workflowItem =
        item.source === "workflow";

      const editable =
        workflowItem &&
        canEdit() &&
        item.status !== "Publicado";

      return `
        <tr>

          <td>
            <span class="admin-content__type">
              ${escapeHtml(item.type)}
            </span>
          </td>

          <td>
            <strong>
              ${escapeHtml(item.title)}
            </strong>

            <small>
              ${escapeHtml(item.category)}
            </small>
          </td>

          <td>
            ${escapeHtml(item.audience || "Público geral")}
          </td>

          <td>
            ${escapeHtml(item.author || "—")}
          </td>

          <td>
            ${escapeHtml(item.date || "—")}
          </td>

          <td>
            <span
              class="admin-content__status admin-content__status--${statusClass(item.status)}"
            >
              ${escapeHtml(item.status)}
            </span>
          </td>

          <td>
            <div class="admin-content__actions">

              <button
                type="button"
                class="admin-content__icon-button"
                data-view-content="${escapeHtml(item.id)}"
                data-source="${escapeHtml(item.source)}"
                title="Visualizar"
                aria-label="Visualizar ${escapeHtml(item.title)}"
              >
                ${svgIcon("view")}
              </button>

              ${
                editable
                  ? `
                    <button
                      type="button"
                      class="admin-content__icon-button"
                      data-edit-content="${escapeHtml(item.id)}"
                      title="Editar"
                      aria-label="Editar ${escapeHtml(item.title)}"
                    >
                      ${svgIcon("edit")}
                    </button>
                  `
                  : ""
              }

              ${
                workflowItem &&
                canEdit() &&
                item.status === "Rascunho"
                  ? `
                    <button
                      type="button"
                      class="admin-content__icon-button"
                      data-send-review="${escapeHtml(item.id)}"
                      title="Enviar para revisão"
                      aria-label="Enviar ${escapeHtml(item.title)} para revisão"
                    >
                      ${svgIcon("send")}
                    </button>
                  `
                  : ""
              }

            </div>
          </td>

        </tr>
      `;
    }).join("");
  }

  function renderModule() {
    const container =
      document.querySelector(
        "[data-admin-content]"
      );

    if (!container) return;

    document.body.style.overflow = "";

    markNavigation();

    if (!canAccess()) {
      renderDenied(container);
      return;
    }

    const role =
      roleDescription();

    const rows =
      allRows();

    const draftCount =
      workflow.filter(
        (item) =>
          item.status === "Rascunho"
      ).length;

    const reviewCount =
      workflow.filter(
        (item) =>
          item.status === "Em revisão"
      ).length;

    const publishedWorkflow =
      workflow.filter(
        (item) =>
          item.status === "Publicado"
      ).length;

    const publishedBase =
      publicNews().length +
      publicCommunications().length;

    container.innerHTML = `
      <p class="admin-content__notice">
        Conteúdo demonstrativo. Notícias e comunicados públicos já existentes são carregados da própria base do protótipo.
      </p>

      <header class="admin-content__header">

        <div>
          <span class="admin-content__eyebrow">
            CONTEÚDO / COMUNICAÇÃO
          </span>

          <h1 id="admin-content-title">
            Notícias e Comunicados
          </h1>

          <p>
            Produção, revisão e publicação institucional.
          </p>
        </div>

        <div class="admin-content__header-actions">

          <span class="admin-content__profile">
            ${escapeHtml(
              PROFILE_LABELS[currentProfile()]
            )}
          </span>

          ${
            canEdit()
              ? `
                <button
                  type="button"
                  class="button button--primary"
                  data-new-content
                >
                  NOVO CONTEÚDO
                </button>
              `
              : ""
          }

        </div>

      </header>

      <div class="admin-content__role">
        <strong>
          ${escapeHtml(role.title)}
        </strong>

        <span>
          ${escapeHtml(role.text)}
        </span>
      </div>

      <div class="admin-content__stats">

        <article>
          <span>Rascunhos</span>
          <strong>${draftCount}</strong>
        </article>

        <article>
          <span>Aguardando revisão</span>
          <strong>${reviewCount}</strong>
        </article>

        <article>
          <span>Publicados na demonstração</span>
          <strong>${publishedWorkflow}</strong>
        </article>

        <article>
          <span>Conteúdos públicos existentes</span>
          <strong>${publishedBase}</strong>
        </article>

      </div>

      ${
        canPublish() && reviewCount
          ? `
            <aside class="admin-content__review-alert">
              <div>
                <strong>
                  ${reviewCount}
                  ${
                    reviewCount === 1
                      ? " conteúdo aguarda"
                      : " conteúdos aguardam"
                  }
                  revisão
                </strong>

                <span>
                  Abra o conteúdo para revisar e registrar a decisão editorial.
                </span>
              </div>
            </aside>
          `
          : ""
      }

      <section class="admin-content__panel">

        <div class="admin-content__filters">

          <label>
            <span>Buscar</span>

            <input
              type="search"
              placeholder="Título, categoria ou autor"
              data-content-search
            >
          </label>

          <label>
            <span>Tipo</span>

            <select data-content-type>
              <option value="">
                Todos
              </option>

              <option value="Notícia">
                Notícias
              </option>

              <option value="Comunicado">
                Comunicados
              </option>
            </select>
          </label>

          <label>
            <span>Situação</span>

            <select data-content-status>
              <option value="">
                Todas
              </option>

              <option value="Rascunho">
                Rascunho
              </option>

              <option value="Em revisão">
                Em revisão
              </option>

              <option value="Publicado">
                Publicado
              </option>
            </select>
          </label>

        </div>

        <div class="admin-content__table-wrap">

          <table class="admin-content__table">

            <thead>
              <tr>
                <th>Tipo</th>
                <th>Conteúdo</th>
                <th>Público</th>
                <th>Autor</th>
                <th>Data</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody data-content-table>
              ${rowsMarkup(rows)}
            </tbody>

          </table>

        </div>

      </section>

      <aside class="admin-content__rule">
        <strong>Fluxo editorial</strong>

        <p>
          Conteúdos são elaborados como rascunho e encaminhados para revisão.
          A publicação demonstrativa ocorre somente após a decisão editorial da Presidência.
        </p>
      </aside>

      <div
        class="admin-content__overlay"
        data-content-overlay
        hidden
      ></div>

      <aside
        class="admin-content__drawer"
        data-content-drawer
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-drawer-title"
        hidden
      ></aside>
    `;

    bindEvents();
  }

  function filterRows() {
    const search =
      document.querySelector(
        "[data-content-search]"
      )?.value
        .trim()
        .toLowerCase() || "";

    const type =
      document.querySelector(
        "[data-content-type]"
      )?.value || "";

    const status =
      document.querySelector(
        "[data-content-status]"
      )?.value || "";

    const filtered =
      allRows().filter((item) => {
        const searchable =
          [
            item.title,
            item.category,
            item.author,
            item.audience
          ]
            .join(" ")
            .toLowerCase();

        return (
          (!search ||
            searchable.includes(search)) &&
          (!type ||
            item.type === type) &&
          (!status ||
            item.status === status)
        );
      });

    const body =
      document.querySelector(
        "[data-content-table]"
      );

    if (body) {
      body.innerHTML =
        rowsMarkup(filtered);
    }
  }

  function openDrawer(markup) {
    const overlay =
      document.querySelector(
        "[data-content-overlay]"
      );

    const drawer =
      document.querySelector(
        "[data-content-drawer]"
      );

    if (!overlay || !drawer) {
      return;
    }

    drawer.innerHTML =
      markup;

    overlay.hidden = false;
    drawer.hidden = false;

    document.body.style.overflow =
      "hidden";
  }

  function closeDrawer() {
    const overlay =
      document.querySelector(
        "[data-content-overlay]"
      );

    const drawer =
      document.querySelector(
        "[data-content-drawer]"
      );

    if (overlay) {
      overlay.hidden = true;
    }

    if (drawer) {
      drawer.hidden = true;
    }

    document.body.style.overflow = "";

    activeId = null;
    editingId = null;
  }

  function publicItemById(id) {
    return allRows().find(
      (item) =>
        item.id === id &&
        item.source === "public"
    );
  }

  function workflowItemById(id) {
    return workflow.find(
      (item) =>
        item.id === id
    );
  }

  function detailMarkup(item) {
    const isWorkflow =
      item.source !== "public";

    return `
      <header class="admin-content__drawer-header">

        <div>
          <span class="admin-content__eyebrow">
            ${escapeHtml(item.type)}
          </span>

          <h2 id="content-drawer-title">
            ${escapeHtml(item.title)}
          </h2>
        </div>

        <button
          type="button"
          class="admin-content__close"
          data-close-content
          aria-label="Fechar"
        >
          ×
        </button>

      </header>

      <div class="admin-content__drawer-status">
        <span>Situação</span>

        <strong>
          ${escapeHtml(item.status)}
        </strong>
      </div>

      <dl class="admin-content__details">

        <div>
          <dt>Tipo</dt>
          <dd>${escapeHtml(item.type)}</dd>
        </div>

        <div>
          <dt>Categoria</dt>
          <dd>${escapeHtml(item.category)}</dd>
        </div>

        <div>
          <dt>Público</dt>
          <dd>${escapeHtml(item.audience || "Público geral")}</dd>
        </div>

        <div>
          <dt>Autor</dt>
          <dd>${escapeHtml(item.author || "—")}</dd>
        </div>

      </dl>

      ${
        item.type === "Notícia" &&
        item.image
          ? `
            <figure class="admin-content__detail-image">
              <img
                src="${escapeHtml(item.image)}"
                alt="Imagem de capa da notícia"
              >
            </figure>
          `
          : ""
      }

      ${
        isWorkflow
          ? `
            <section class="admin-content__drawer-section">
              <h3>Resumo</h3>
              <p>${escapeHtml(item.summary)}</p>
            </section>

            <section class="admin-content__drawer-section">
              <h3>Conteúdo</h3>
              <p>${escapeHtml(item.body)}</p>
            </section>
          `
          : `
            <div class="admin-content__public-source">
              <strong>Conteúdo público existente</strong>

              <span>
                Este registro vem diretamente da base pública já utilizada pelo protótipo.
              </span>
            </div>
          `
      }

      ${
        isWorkflow &&
        canPublish() &&
        item.status === "Em revisão"
          ? `
            <section class="admin-content__editorial">

              <label>
                <span>Observação da revisão</span>

                <textarea
                  rows="4"
                  data-editorial-note
                  placeholder="Observação demonstrativa..."
                ></textarea>
              </label>

              <div class="admin-content__drawer-actions">

                <button
                  type="button"
                  class="button button--secondary"
                  data-editorial-action="return"
                >
                  DEVOLVER PARA AJUSTES
                </button>

                <button
                  type="button"
                  class="button button--primary"
                  data-editorial-action="publish"
                >
                  APROVAR E PUBLICAR
                </button>

              </div>

            </section>
          `
          : ""
      }

      ${
        isWorkflow &&
        canEdit() &&
        item.status === "Rascunho"
          ? `
            <div class="admin-content__drawer-actions">

              <button
                type="button"
                class="button button--secondary"
                data-edit-from-detail="${escapeHtml(item.id)}"
              >
                EDITAR
              </button>

              <button
                type="button"
                class="button button--primary"
                data-send-review="${escapeHtml(item.id)}"
              >
                ENVIAR PARA REVISÃO
              </button>

            </div>
          `
          : ""
      }
    `;
  }

  function formMarkup(item = null) {
    const isCommunication =
      item?.type === "Comunicado";

    const existingImage =
      item?.image || "";

    return `
      <header class="admin-content__drawer-header">

        <div>
          <span class="admin-content__eyebrow">
            ${
              item
                ? "EDIÇÃO"
                : "NOVO CONTEÚDO"
            }
          </span>

          <h2 id="content-drawer-title">
            ${
              item
                ? "Editar conteúdo"
                : "Criar conteúdo"
            }
          </h2>
        </div>

        <button
          type="button"
          class="admin-content__close"
          data-close-content
          aria-label="Fechar"
        >
          ×
        </button>

      </header>

      <form data-content-form>

        <label class="admin-content__field">
          <span>Tipo *</span>

          <select
            name="type"
            required
          >
            <option
              value="Notícia"
              ${
                !isCommunication
                  ? "selected"
                  : ""
              }
            >
              Notícia
            </option>

            <option
              value="Comunicado"
              ${
                isCommunication
                  ? "selected"
                  : ""
              }
            >
              Comunicado
            </option>
          </select>
        </label>


        <div
          class="admin-content__image-field"
          data-news-image-field
          ${isCommunication ? "hidden" : ""}
        >

          <label class="admin-content__field">

            <span>Imagem de capa *</span>

            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
            >

          </label>

          <p class="admin-content__image-help">
            JPG, PNG ou WEBP — até 1,5 MB.
            A imagem é mantida apenas nesta sessão demonstrativa.
          </p>

          <div
            class="admin-content__image-preview"
            data-news-image-preview
            ${existingImage ? "" : "hidden"}
          >

            <img
              src="${escapeHtml(existingImage)}"
              alt="Pré-visualização da imagem de capa"
              data-news-image-preview-img
            >

          </div>

        </div>


        <label class="admin-content__field">
          <span>Título *</span>

          <input
            name="title"
            type="text"
            value="${escapeHtml(item?.title || "")}"
            required
          >
        </label>


        <label class="admin-content__field">
          <span>Categoria *</span>

          <input
            name="category"
            type="text"
            value="${escapeHtml(item?.category || "")}"
            placeholder="Ex.: Institucional, Direitos, Informes"
            required
          >
        </label>


        <label class="admin-content__field">
          <span>Público-alvo *</span>

          <select
            name="audience"
            required
          >

            ${
              [
                "Público geral",
                "Filiados",
                "Diretoria"
              ]
                .map(
                  (audience) => `
                    <option
                      value="${audience}"
                      ${
                        (item?.audience || "Público geral") === audience
                          ? "selected"
                          : ""
                      }
                    >
                      ${audience}
                    </option>
                  `
                )
                .join("")
            }

          </select>
        </label>


        <label class="admin-content__field">
          <span>Autor / setor responsável *</span>

          <input
            name="author"
            type="text"
            value="${escapeHtml(
              item?.author ||
              PROFILE_LABELS[currentProfile()]
            )}"
            required
          >
        </label>


        <label class="admin-content__field">
          <span>Resumo *</span>

          <textarea
            name="summary"
            rows="4"
            required
          >${escapeHtml(item?.summary || "")}</textarea>
        </label>


        <label class="admin-content__field">
          <span>Conteúdo *</span>

          <textarea
            name="body"
            rows="8"
            required
          >${escapeHtml(item?.body || "")}</textarea>
        </label>


        <div class="admin-content__form-note">

          O conteúdo será salvo como rascunho.

          ${
            isCommunication
              ? "Comunicados não utilizam imagem de capa neste protótipo."
              : "A imagem selecionada será usada como capa da notícia."
          }

          A publicação depende da etapa de revisão.

        </div>


        <div class="admin-content__drawer-actions">

          <button
            type="button"
            class="button button--secondary"
            data-close-content
          >
            CANCELAR
          </button>

          <button
            type="submit"
            class="button button--primary"
          >
            SALVAR RASCUNHO
          </button>

        </div>

      </form>
    `;
  }

  function openNew() {
    if (!canEdit()) return;

    editingId = null;

    openDrawer(
      formMarkup()
    );
  }

  function openEdit(id) {
    if (!canEdit()) return;

    const item =
      workflowItemById(id);

    if (
      !item ||
      item.status === "Publicado"
    ) {
      return;
    }

    editingId = id;

    openDrawer(
      formMarkup(item)
    );
  }

  function openDetails(id, source) {
    let item;

    if (source === "public") {
      item =
        publicItemById(id);
    } else {
      item =
        workflowItemById(id);

      if (item) {
        item = {
          ...item,
          source: "workflow"
        };
      }
    }

    if (!item) return;

    activeId = id;

    openDrawer(
      detailMarkup(item)
    );
  }

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader =
        new FileReader();

      reader.addEventListener(
        "load",
        () => resolve(
          String(reader.result || "")
        )
      );

      reader.addEventListener(
        "error",
        () => reject(
          new Error("Não foi possível ler a imagem.")
        )
      );

      reader.readAsDataURL(file);
    });
  }

  async function saveForm(form) {
    if (!canEdit()) return;

    const data =
      new FormData(form);

    const type =
      String(data.get("type"));

    const category =
      String(
        data.get("category")
      ).trim();

    const currentItem =
      editingId
        ? workflowItemById(editingId)
        : null;

    let image =
      currentItem?.image || "";

    const imageInput =
      form.querySelector(
        'input[name="image"]'
      );

    const imageFile =
      imageInput?.files?.[0] || null;


    if (type === "Notícia") {

      if (imageFile) {

        if (
          ![
            "image/jpeg",
            "image/png",
            "image/webp"
          ].includes(imageFile.type)
        ) {
          window.alert(
            "Selecione uma imagem JPG, PNG ou WEBP."
          );

          return;
        }


        const maxSize =
          1.5 * 1024 * 1024;

        if (
          imageFile.size > maxSize
        ) {
          window.alert(
            "A imagem deve ter no máximo 1,5 MB neste protótipo."
          );

          return;
        }


        try {
          image =
            await readImageAsDataUrl(
              imageFile
            );
        } catch {
          window.alert(
            "Não foi possível carregar a imagem selecionada."
          );

          return;
        }
      }


      if (!image) {
        window.alert(
          "Selecione uma imagem de capa para a notícia."
        );

        imageInput?.focus();

        return;
      }

    } else {
      image = "";
    }


    const payload = {
      type,

      title:
        String(
          data.get("title")
        ).trim(),

      category,

      categorySlug:
        slugify(category),

      audience:
        String(
          data.get("audience")
        ),

      author:
        String(
          data.get("author")
        ).trim(),

      summary:
        String(
          data.get("summary")
        ).trim(),

      body:
        String(
          data.get("body")
        ).trim(),

      image,

      status: "Rascunho",

      updatedAt: "05/11/2026"
    };


    if (editingId) {

      const item =
        workflowItemById(
          editingId
        );

      if (!item) return;

      Object.assign(
        item,
        payload
      );

    } else {

      workflow.push({
        id: nextId(),
        publicId: nextPublicId(),
        createdAt: "05/11/2026",
        ...payload
      });

    }


    saveWorkflow();

    closeDrawer();

    renderModule();
  }

  function sendToReview(id) {
    if (!canEdit()) return;

    const item =
      workflowItemById(id);

    if (
      !item ||
      item.status !== "Rascunho"
    ) {
      return;
    }

    item.status = "Em revisão";
    item.updatedAt = "05/11/2026";

    saveWorkflow();
    closeDrawer();
    renderModule();
  }

  function editorialDecision(action) {
    if (!canPublish()) return;

    const item =
      workflowItemById(
        activeId
      );

    if (
      !item ||
      item.status !== "Em revisão"
    ) {
      return;
    }

    if (action === "publish") {
      item.status = "Publicado";
      item.publishedDateISO =
        "2026-11-05";
      item.publishedDateLabel =
        "5 de novembro de 2026";
    } else {
      item.status = "Rascunho";
    }

    item.updatedAt =
      "05/11/2026";

    saveWorkflow();
    closeDrawer();
    renderModule();
  }

  function bindEvents() {
    const container =
      document.querySelector(
        "[data-admin-content]"
      );

    if (!container) return;


    /*
     * O próprio container permanece durante as renderizações.
     * Por isso os eventos devem ser registrados apenas uma vez.
     */
    if (
      container.dataset.communicationEventsBound ===
      "true"
    ) {
      return;
    }

    container.dataset.communicationEventsBound =
      "true";


    container.addEventListener(
      "input",
      (event) => {

        if (
          event.target.matches(
            "[data-content-search]"
          )
        ) {
          filterRows();
        }

      }
    );


    container.addEventListener(
      "change",
      (event) => {

        if (
          event.target.matches(
            "[data-content-type], [data-content-status]"
          )
        ) {
          filterRows();
        }


        if (
          event.target.matches(
            'select[name="type"]'
          )
        ) {
          const form =
            event.target.closest(
              "[data-content-form]"
            );

          const imageField =
            form?.querySelector(
              "[data-news-image-field]"
            );

          if (imageField) {
            imageField.hidden =
              event.target.value !==
              "Notícia";
          }
        }


        if (
          event.target.matches(
            'input[name="image"]'
          )
        ) {
          const file =
            event.target.files?.[0];

          const form =
            event.target.closest(
              "[data-content-form]"
            );

          const preview =
            form?.querySelector(
              "[data-news-image-preview]"
            );

          const previewImage =
            form?.querySelector(
              "[data-news-image-preview-img]"
            );

          if (
            !file ||
            !preview ||
            !previewImage
          ) {
            return;
          }


          const validTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
          ];

          if (
            !validTypes.includes(
              file.type
            )
          ) {
            window.alert(
              "Selecione uma imagem JPG, PNG ou WEBP."
            );

            event.target.value = "";

            return;
          }


          const maxSize =
            1.5 * 1024 * 1024;

          if (
            file.size > maxSize
          ) {
            window.alert(
              "A imagem deve ter no máximo 1,5 MB."
            );

            event.target.value = "";

            return;
          }


          const reader =
            new FileReader();

          reader.addEventListener(
            "load",
            () => {
              previewImage.src =
                String(
                  reader.result || ""
                );

              preview.hidden =
                false;
            }
          );

          reader.readAsDataURL(
            file
          );
        }

      }
    );


    container.addEventListener(
      "click",
      (event) => {

        if (
          event.target.matches(
            "[data-content-overlay]"
          )
        ) {
          closeDrawer();
          return;
        }


        const newButton =
          event.target.closest(
            "[data-new-content]"
          );

        const view =
          event.target.closest(
            "[data-view-content]"
          );

        const edit =
          event.target.closest(
            "[data-edit-content]"
          );

        const editDetail =
          event.target.closest(
            "[data-edit-from-detail]"
          );

        const review =
          event.target.closest(
            "[data-send-review]"
          );

        const editorial =
          event.target.closest(
            "[data-editorial-action]"
          );

        const close =
          event.target.closest(
            "[data-close-content]"
          );


        if (newButton) {
          openNew();
          return;
        }


        if (view) {
          openDetails(
            view.dataset.viewContent,
            view.dataset.source
          );

          return;
        }


        if (edit) {
          openEdit(
            edit.dataset.editContent
          );

          return;
        }


        if (editDetail) {
          openEdit(
            editDetail.dataset.editFromDetail
          );

          return;
        }


        if (review) {
          sendToReview(
            review.dataset.sendReview
          );

          return;
        }


        if (editorial) {
          editorialDecision(
            editorial.dataset.editorialAction
          );

          return;
        }


        if (close) {
          closeDrawer();
        }

      }
    );


    container.addEventListener(
      "submit",
      (event) => {

        if (
          !event.target.matches(
            "[data-content-form]"
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
          "admin-comunicacao.html"
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
        "[data-admin-content]"
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
        if (
          event.key === "Escape"
        ) {
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