// T31 — Atas e Documentos (protótipo demonstrativo).
// Uma única página com duas abas (Atas / Documentos), aberta por hash:
//   admin-documentos.html#atas  |  admin-documentos.html#documentos
// Sem banco/API: o estado vive apenas em sessionStorage. Arquivos não são
// armazenados (somente nome, tipo e tamanho); na versão definitiva seriam
// enviados ao backend/storage.
(() => {
  "use strict";

  // Mesma fonte de verdade de perfil utilizada por area-admin.js.
  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE = "administrador";
  const STORAGE_KEY = "sindGestao.documentsDemo";
  const ASSEMBLIES_KEY = "sindGestao.assembliesDemo"; // T30 (somente leitura)
  const PAGE_FILE = "admin-documentos.html";

  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    presidencia: "Presidência",
    diretoria: "Diretoria",
    secretaria: "Secretaria",
    tesouraria: "Tesouraria",
    conselhoEtica: "Conselho de Ética",
    conselhoFiscal: "Conselho Fiscal"
  };

  const STATUS = Object.freeze({
    DRAFT: "Rascunho",
    REVIEW: "Em revisão",
    PUBLISHED: "Publicado",
    ARCHIVED: "Arquivado"
  });

  const SCOPE = Object.freeze({
    PUBLIC: "Público",
    MEMBERS: "Filiados",
    BOARD: "Diretoria",
    FINANCE: "Financeiro",
    ETHICS: "Conselho de Ética",
    FISCAL: "Conselho Fiscal"
  });

  const ATA_SCOPES = [SCOPE.PUBLIC, SCOPE.MEMBERS, SCOPE.BOARD];
  const DOC_SCOPES = Object.values(SCOPE);

  const CATEGORIES = [
    "Pauta",
    "Estatuto",
    "Regulamento",
    "Relatório",
    "Comunicado interno",
    "Documento financeiro",
    "Documento institucional",
    "Conselho de Ética",
    "Conselho Fiscal",
    "Outros"
  ];

  // Categorias confidenciais ligadas obrigatoriamente a um escopo.
  const BOUND_CATEGORY_SCOPE = {
    "Documento financeiro": SCOPE.FINANCE,
    "Conselho de Ética": SCOPE.ETHICS,
    "Conselho Fiscal": SCOPE.FISCAL
  };

  const INSTITUTIONAL_CATEGORIES = CATEGORIES.filter((c) => !BOUND_CATEGORY_SCOPE[c]);

  // PDFs demonstrativos já existentes no protótipo.
  const DEMO_FILES = [
    { href: "../assets/docs/ata-assembleia-demonstrativa.pdf", name: "ata-assembleia-demonstrativa.pdf", type: "application/pdf" },
    { href: "../assets/docs/pauta-assembleia-geral-demonstrativa.pdf", name: "pauta-assembleia-geral-demonstrativa.pdf", type: "application/pdf" }
  ];

  /*
   * Matriz de permissões do módulo.
   * tabs: abas acessíveis; scopes: escopos visíveis/editáveis;
   * categories: categorias permitidas na aba Documentos;
   * edit: "open" = Rascunho e Em revisão; "draft" = apenas Rascunho;
   * review: publicar e devolver "Em revisão" para Rascunho; archive: arquivar Publicado.
   * internalOnly: publicação restrita ao próprio escopo (Conselhos).
   */
  const INSTITUTIONAL_SCOPES = [SCOPE.PUBLIC, SCOPE.MEMBERS, SCOPE.BOARD];

  const PERMISSIONS = Object.freeze({
    administrador: {
      role: ["Administração técnica", "Acesso completo ao fluxo: cria, edita, encaminha, publica, devolve e arquiva. Documentos confidenciais dos Conselhos não são exibidos fora do respectivo escopo."],
      tabs: ["atas", "documentos"], scopes: [...INSTITUTIONAL_SCOPES, SCOPE.FINANCE],
      categories: INSTITUTIONAL_CATEGORIES.concat("Documento financeiro"),
      create: true, edit: "open", forward: true, review: true, archive: true
    },
    presidencia: {
      role: ["Revisão e publicação", "A Presidência cria, edita, revisa, publica, devolve para ajustes e arquiva."],
      tabs: ["atas", "documentos"], scopes: [...INSTITUTIONAL_SCOPES, SCOPE.FINANCE],
      categories: INSTITUTIONAL_CATEGORIES.concat("Documento financeiro"),
      create: true, edit: "open", forward: true, review: true, archive: true
    },
    diretoria: {
      role: ["Elaboração", "A Diretoria cria, edita enquanto Rascunho e encaminha para revisão. Não publica."],
      tabs: ["atas", "documentos"], scopes: INSTITUTIONAL_SCOPES, categories: INSTITUTIONAL_CATEGORIES,
      create: true, edit: "draft", forward: true, review: false, archive: false
    },
    secretaria: {
      role: ["Organização documental", "A Secretaria cria, edita, organiza e encaminha para revisão. Não publica."],
      tabs: ["atas", "documentos"], scopes: INSTITUTIONAL_SCOPES, categories: INSTITUTIONAL_CATEGORIES,
      create: true, edit: "open", forward: true, review: false, archive: false
    },
    tesouraria: {
      role: ["Documentos financeiros", "A Tesouraria acessa somente documentos de escopo Financeiro: cria, edita Rascunho e encaminha para revisão."],
      tabs: ["documentos"], scopes: [SCOPE.FINANCE], categories: ["Documento financeiro"],
      create: true, edit: "draft", forward: true, review: false, archive: false
    },
    conselhoEtica: {
      role: ["Escopo do Conselho de Ética", "Somente documentos do Conselho de Ética. A aprovação é interna e nunca publica na Área do Filiado."],
      tabs: ["documentos"], scopes: [SCOPE.ETHICS], categories: ["Conselho de Ética"],
      create: true, edit: "draft", forward: true, review: true, archive: true, internalOnly: true
    },
    conselhoFiscal: {
      role: ["Escopo do Conselho Fiscal", "Somente documentos do Conselho Fiscal. A aprovação é interna e nunca publica na Área do Filiado."],
      tabs: ["documentos"], scopes: [SCOPE.FISCAL], categories: ["Conselho Fiscal"],
      create: true, edit: "draft", forward: true, review: true, archive: true, internalOnly: true
    }
  });

  const TABS = {
    atas: { label: "Atas", singular: "Ata", prefix: "ATA" },
    documentos: { label: "Documentos", singular: "Documento", prefix: "DOC" }
  };

  function h(at, profile, action, note) {
    return note ? { at, profile, action, note } : { at, profile, action };
  }

  const DEFAULT_RECORDS = [
    {
      id: "ATA-2026-0001", kind: "atas",
      title: "Ata da Reunião Demonstrativa com Filiados — Outubro",
      assembly: { id: "ASM-0004", title: "Reunião Demonstrativa com Filiados — Outubro" },
      date: "2026-10-15", year: "2026", scope: SCOPE.MEMBERS, category: "Ata",
      summary: "Registro demonstrativo dos informes e encaminhamentos da reunião.",
      content: "Conteúdo fictício. Nenhuma deliberação real foi registrada.",
      file: { name: "ata-assembleia-demonstrativa.pdf", type: "application/pdf", size: 0, href: DEMO_FILES[0].href },
      status: STATUS.PUBLISHED, author: "Secretaria",
      createdAt: "2026-10-16T09:00:00", updatedAt: "2026-10-20T15:00:00",
      history: [
        h("2026-10-16T09:00:00", "Secretaria", "Registro criado como Rascunho."),
        h("2026-10-17T10:00:00", "Secretaria", "Encaminhado para revisão."),
        h("2026-10-20T15:00:00", "Presidência", "Publicado.")
      ]
    },
    {
      id: "ATA-2026-0002", kind: "atas",
      title: "Ata da Assembleia Ordinária Demonstrativa de Novembro",
      assembly: { id: "ASM-0003", title: "Assembleia Ordinária Demonstrativa de Novembro" },
      date: "2026-11-26", year: "2026", scope: SCOPE.MEMBERS, category: "Ata",
      summary: "Minuta demonstrativa aguardando revisão da Presidência.",
      content: "Texto fictício da minuta.",
      file: null,
      status: STATUS.REVIEW, author: "Diretoria",
      createdAt: "2026-11-03T14:00:00", updatedAt: "2026-11-04T09:30:00",
      history: [
        h("2026-11-03T14:00:00", "Diretoria", "Registro criado como Rascunho."),
        h("2026-11-04T09:30:00", "Diretoria", "Encaminhado para revisão.")
      ]
    },
    {
      id: "ATA-2026-0003", kind: "atas",
      title: "Ata de reunião interna da Diretoria (demonstrativa)",
      assembly: null,
      date: "2026-11-02", year: "2026", scope: SCOPE.BOARD, category: "Ata",
      summary: "Rascunho demonstrativo de uso interno da Diretoria.",
      content: "",
      file: null,
      status: STATUS.DRAFT, author: "Secretaria",
      createdAt: "2026-11-02T17:00:00", updatedAt: "2026-11-02T17:00:00",
      history: [h("2026-11-02T17:00:00", "Secretaria", "Registro criado como Rascunho.")]
    },
    {
      id: "DOC-2026-0001", kind: "documentos",
      title: "Regimento interno demonstrativo",
      category: "Documento institucional", scope: SCOPE.PUBLIC,
      description: "Documento institucional fictício disponibilizado ao público.",
      date: "2026-08-10", year: "2026", file: null,
      status: STATUS.PUBLISHED, author: "Secretaria",
      createdAt: "2026-08-05T10:00:00", updatedAt: "2026-08-10T16:00:00",
      history: [
        h("2026-08-05T10:00:00", "Secretaria", "Registro criado como Rascunho."),
        h("2026-08-06T11:00:00", "Secretaria", "Encaminhado para revisão."),
        h("2026-08-10T16:00:00", "Presidência", "Publicado.")
      ]
    },
    {
      id: "DOC-2026-0002", kind: "documentos",
      title: "Pauta demonstrativa da Assembleia de Novembro",
      category: "Pauta", scope: SCOPE.MEMBERS,
      description: "Pauta fictícia restrita a filiados.",
      date: "2026-11-05", year: "2026",
      file: { name: "pauta-assembleia-geral-demonstrativa.pdf", type: "application/pdf", size: 0, href: DEMO_FILES[1].href },
      status: STATUS.PUBLISHED, author: "Diretoria",
      createdAt: "2026-11-01T08:00:00", updatedAt: "2026-11-05T12:00:00",
      history: [
        h("2026-11-01T08:00:00", "Diretoria", "Registro criado como Rascunho."),
        h("2026-11-02T08:30:00", "Diretoria", "Encaminhado para revisão."),
        h("2026-11-05T12:00:00", "Administrador Geral", "Publicado.")
      ]
    },
    {
      id: "DOC-2026-0003", kind: "documentos",
      title: "Balancete interno demonstrativo — 3º trimestre",
      category: "Documento financeiro", scope: SCOPE.FINANCE,
      description: "Documento financeiro interno fictício. Nunca é exibido na Área do Filiado.",
      date: "2026-10-30", year: "2026", file: null,
      status: STATUS.REVIEW, author: "Tesouraria",
      createdAt: "2026-10-28T09:00:00", updatedAt: "2026-10-30T10:00:00",
      history: [
        h("2026-10-28T09:00:00", "Tesouraria", "Registro criado como Rascunho."),
        h("2026-10-30T10:00:00", "Tesouraria", "Encaminhado para revisão.")
      ]
    },
    {
      id: "DOC-2026-0004", kind: "documentos",
      title: "Parecer demonstrativo do Conselho de Ética",
      category: "Conselho de Ética", scope: SCOPE.ETHICS,
      description: "Conteúdo confidencial fictício do Conselho de Ética.",
      date: "2026-10-22", year: "2026", file: null,
      status: STATUS.DRAFT, author: "Conselho de Ética",
      createdAt: "2026-10-22T14:00:00", updatedAt: "2026-10-22T14:00:00",
      history: [h("2026-10-22T14:00:00", "Conselho de Ética", "Registro criado como Rascunho.")]
    },
    {
      id: "DOC-2026-0005", kind: "documentos",
      title: "Parecer demonstrativo do Conselho Fiscal sobre as contas",
      category: "Conselho Fiscal", scope: SCOPE.FISCAL,
      description: "Conteúdo confidencial fictício do Conselho Fiscal (aprovado internamente).",
      date: "2026-10-25", year: "2026", file: null,
      status: STATUS.PUBLISHED, author: "Conselho Fiscal",
      createdAt: "2026-10-20T09:00:00", updatedAt: "2026-10-25T11:00:00",
      history: [
        h("2026-10-20T09:00:00", "Conselho Fiscal", "Registro criado como Rascunho."),
        h("2026-10-21T09:00:00", "Conselho Fiscal", "Encaminhado para revisão."),
        h("2026-10-25T11:00:00", "Conselho Fiscal", "Aprovado internamente (escopo do Conselho).")
      ]
    },
    {
      id: "DOC-2025-0006", kind: "documentos",
      title: "Relatório anual demonstrativo 2025",
      category: "Relatório", scope: SCOPE.MEMBERS,
      description: "Relatório fictício substituído e arquivado.",
      date: "2025-12-15", year: "2025", file: null,
      status: STATUS.ARCHIVED, author: "Secretaria",
      createdAt: "2025-12-01T09:00:00", updatedAt: "2026-03-01T09:00:00",
      history: [
        h("2025-12-01T09:00:00", "Secretaria", "Registro criado como Rascunho."),
        h("2025-12-05T09:00:00", "Secretaria", "Encaminhado para revisão."),
        h("2025-12-15T09:00:00", "Presidência", "Publicado."),
        h("2026-03-01T09:00:00", "Presidência", "Arquivado.", "Substituído por nova versão demonstrativa.")
      ]
    }
  ];

  let records = deduplicate(loadRecords());
  let lastFocused = null;
  let pendingFile = null;

  saveRecords();

  /* ---------- Perfil e permissões ---------- */

  function currentProfile() {
    try {
      const stored = window.localStorage.getItem(PROFILE_KEY);
      return Object.prototype.hasOwnProperty.call(PROFILE_LABELS, stored) ? stored : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  // Sempre lido no momento do uso: nenhuma permissão do perfil anterior é mantida.
  function perms() {
    return PERMISSIONS[currentProfile()] || null;
  }

  function isVisible(record) {
    const p = perms();
    return Boolean(p && record && p.tabs.includes(record.kind) && p.scopes.includes(record.scope));
  }

  function visibleRecords(kind) {
    return records.filter((r) => r.kind === kind && isVisible(r));
  }

  function canEdit(record) {
    const p = perms();
    if (!p || !isVisible(record)) return false;
    if (p.edit === "open") return record.status === STATUS.DRAFT || record.status === STATUS.REVIEW;
    return record.status === STATUS.DRAFT;
  }

  function allowedActions(record) {
    const p = perms();
    if (!p || !isVisible(record)) return [];

    const actions = ["view"];
    if (canEdit(record)) actions.push("edit");
    if (p.forward && record.status === STATUS.DRAFT) actions.push("forward");
    if (p.review && record.status === STATUS.REVIEW) actions.push("publish", "return");
    if (p.archive && record.status === STATUS.PUBLISHED) actions.push("archive");
    return actions;
  }

  function scopesFor(kind) {
    const allowed = perms()?.scopes || [];
    return (kind === "atas" ? ATA_SCOPES : DOC_SCOPES).filter((s) => allowed.includes(s));
  }

  /* ---------- Armazenamento ---------- */

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_RECORDS));
  }

  function loadRecords() {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => item && typeof item === "object" && item.id && TABS[item.kind]);
        }
      }
    } catch {
      // Mantém os dados iniciais.
    }
    return cloneDefaults();
  }

  function saveRecords() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // Estado apenas demonstrativo.
    }
  }

  function deduplicate(items) {
    const ids = new Set();
    return items.filter((item) => {
      if (ids.has(item.id)) return false;
      ids.add(item.id);
      if (!Array.isArray(item.history)) item.history = [];
      return true;
    });
  }

  function nextId(kind, year) {
    const prefix = TABS[kind].prefix;
    const max = records
      .filter((r) => String(r.id).startsWith(`${prefix}-`))
      .reduce((acc, r) => {
        const n = Number(String(r.id).split("-").pop());
        return Number.isFinite(n) && n > acc ? n : acc;
      }, 0);
    return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
  }

  // Busca restrita aos registros visíveis ao perfil atual.
  function recordById(id) {
    const record = records.find((item) => item.id === id);
    return isVisible(record) ? record : null;
  }

  function loadAssemblies() {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(ASSEMBLIES_KEY) || "[]");
      return Array.isArray(parsed)
        ? parsed.filter((a) => a && a.id && a.title && a.status !== "Cancelada")
        : [];
    } catch {
      return [];
    }
  }

  /* ---------- Utilitários ---------- */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function nowIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
  }

  function formatDateTime(iso) {
    const time = /T(\d{2}):(\d{2})/.exec(String(iso || ""));
    return `${formatDate(iso)}${time ? ` ${time[1]}:${time[2]}` : ""}`;
  }

  function formatSize(bytes) {
    const n = Number(bytes) || 0;
    if (!n) return "tamanho não informado";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace(".", ",")} KB`;
    return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  function slug(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function isDemoFileHref(href) {
    return DEMO_FILES.some((f) => f.href === href);
  }

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>',
      forward: '<path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path>',
      publish: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>',
      return: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 0 10h-3"></path>',
      archive: '<rect x="3" y="4" width="18" height="4" rx="1"></rect><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"></path><path d="M10 12h4"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  function actionLabel(action) {
    const internal = perms()?.internalOnly;
    return {
      view: "Visualizar",
      edit: "Editar",
      forward: "Encaminhar para revisão",
      publish: internal ? "Aprovar internamente" : "Publicar",
      return: "Devolver para ajustes",
      archive: "Arquivar"
    }[action];
  }

  /* ---------- Abas / hash ---------- */

  function currentTab() {
    const p = perms();
    const requested = window.location.hash.replace("#", "");
    if (!p) return requested === "documentos" ? "documentos" : "atas";
    return p.tabs.includes(requested) ? requested : p.tabs[0];
  }

  function syncHash(tab) {
    if (window.location.hash !== `#${tab}`) {
      window.history.replaceState(null, "", `#${tab}`);
    }
  }

  function markNavigation(tab) {
    const target = `${PAGE_FILE}#${tab}`;
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === target;
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  /* ---------- Renderização ---------- */

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Atas e Documentos</h1>
        <p>O perfil ${escapeHtml(PROFILE_LABELS[currentProfile()])} não possui acesso a este módulo.</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function actionButtons(record) {
    return allowedActions(record).map((action) => `
      <button
        type="button"
        class="admin-docs__icon-button admin-docs__icon-button--${action}"
        data-doc-action="${action}"
        data-id="${escapeHtml(record.id)}"
        title="${actionLabel(action)}"
        aria-label="${actionLabel(action)}: ${escapeHtml(record.title)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function scopeBadge(scope) {
    return `<span class="admin-docs__scope admin-docs__scope--${slug(scope)}">${escapeHtml(scope)}</span>`;
  }

  function rowsMarkup(rows, tab) {
    if (!rows.length) {
      return '<tr><td colspan="7" class="admin-docs__empty">Nenhum registro encontrado.</td></tr>';
    }

    return rows.map((record) => `
      <tr>
        <td><span class="admin-docs__id">${escapeHtml(record.id)}</span><small>${escapeHtml(record.year || "")}</small></td>
        <td><strong>${escapeHtml(record.title)}</strong><small>${tab === "atas"
          ? escapeHtml(record.assembly ? `Origem: ${record.assembly.id} — ${record.assembly.title}` : "Sem assembleia/reunião vinculada")
          : escapeHtml(record.category)}</small></td>
        <td>${formatDate(record.date)}</td>
        <td>${scopeBadge(record.scope)}</td>
        <td>${escapeHtml(record.author || "—")}</td>
        <td><span class="admin-docs__status admin-docs__status--${slug(record.status)}">${escapeHtml(record.status)}</span></td>
        <td><div class="admin-docs__actions">${actionButtons(record)}</div></td>
      </tr>
    `).join("");
  }

  function optionList(values, selected, allLabel) {
    const first = allLabel === undefined ? "" : `<option value="">${allLabel}</option>`;
    return first + values.map((value) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`
    ).join("");
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    closeDrawer(false);
    pendingFile = null;

    const p = perms();
    const tab = currentTab();
    markNavigation(tab);

    if (!p) {
      renderDenied(container);
      return;
    }

    syncHash(tab);

    const rows = visibleRecords(tab);
    const count = (status) => rows.filter((r) => r.status === status).length;
    const years = [...new Set(rows.map((r) => r.year).filter(Boolean))].sort().reverse();
    const typeFilter = tab === "atas"
      ? `<label><span>Tipo</span><select data-doc-filter="link">${optionList(["Vinculada a assembleia/reunião", "Sem vínculo"], "", "Todos")}</select></label>`
      : `<label><span>Categoria</span><select data-doc-filter="category">${optionList(p.categories, "", "Todas")}</select></label>`;
    const councilNote = p.internalOnly
      ? "Documentos deste Conselho permanecem no próprio escopo e nunca são enviados à Área do Filiado."
      : "Documentos confidenciais dos Conselhos não são exibidos fora do respectivo escopo.";

    container.innerHTML = `
      <p class="admin-docs__notice">
        Conteúdo demonstrativo. Registros fictícios mantidos apenas nesta sessão do navegador.
      </p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">GESTÃO INSTITUCIONAL</span>
          <h1 id="admin-content-title">Atas e Documentos</h1>
          <p>Elaboração, revisão, publicação e arquivamento.</p>
        </div>
        <div class="admin-docs__header-actions">
          <span class="admin-docs__profile">${escapeHtml(PROFILE_LABELS[currentProfile()])}</span>
          ${p.create ? `<button type="button" class="button button--primary" data-doc-new>${tab === "atas" ? "NOVA ATA" : "NOVO DOCUMENTO"}</button>` : ""}
        </div>
      </header>

      <div class="admin-docs__role">
        <strong>${escapeHtml(p.role[0])}</strong>
        <span>${escapeHtml(p.role[1])}</span>
      </div>

      <div class="admin-docs__tabs" role="tablist" aria-label="Atas e Documentos">
        ${p.tabs.map((key) => `
          <button type="button" role="tab" class="admin-docs__tab" id="doc-tab-${key}"
            aria-selected="${key === tab}" aria-controls="doc-panel" tabindex="${key === tab ? "0" : "-1"}"
            data-doc-tab="${key}">${TABS[key].label.toUpperCase()}</button>`).join("")}
      </div>

      <div class="admin-docs__stats">
        <article><span>Rascunhos</span><strong>${count(STATUS.DRAFT)}</strong></article>
        <article><span>Em revisão</span><strong>${count(STATUS.REVIEW)}</strong></article>
        <article><span>Publicados</span><strong>${count(STATUS.PUBLISHED)}</strong></article>
        <article><span>Arquivados</span><strong>${count(STATUS.ARCHIVED)}</strong></article>
      </div>

      ${p.review && count(STATUS.REVIEW) ? `
        <aside class="admin-docs__alert" role="note">
          <strong>${count(STATUS.REVIEW)} ${count(STATUS.REVIEW) === 1 ? "registro aguarda" : "registros aguardam"} revisão</strong>
          <span>Use os ícones de publicar ou devolver na tabela.</span>
        </aside>` : ""}

      <section class="admin-docs__panel" id="doc-panel" role="tabpanel" aria-labelledby="doc-tab-${tab}">
        <div class="admin-docs__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Título, protocolo, descrição ou autor" data-doc-search></label>
          ${typeFilter}
          <label><span>Situação</span><select data-doc-filter="status">${optionList(Object.values(STATUS), "", "Todas")}</select></label>
          <label><span>Escopo</span><select data-doc-filter="scope">${optionList(scopesFor(tab), "", "Todos")}</select></label>
          <label><span>Ano</span><select data-doc-filter="year">${optionList(years, "", "Todos")}</select></label>
        </div>
        <p class="admin-docs__count" data-doc-count role="status" aria-live="polite"></p>
        <div class="admin-docs__table-wrap">
          <table class="admin-docs__table">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">${tab === "atas" ? "Título / origem" : "Título / categoria"}</th>
                <th scope="col">Data</th>
                <th scope="col">${tab === "atas" ? "Público" : "Escopo"}</th>
                <th scope="col">Autor</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-doc-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-docs__rule">
        <strong>Fluxo</strong>
        <p>Rascunho → Em revisão → Publicado → Arquivado. A revisão pode devolver o registro para Rascunho.
        Somente registros Publicados com escopo Público ou Filiados aparecem na Área do Filiado.
        ${escapeHtml(councilNote)}</p>
      </aside>

      <div class="admin-docs__overlay" data-doc-overlay hidden></div>
      <aside class="admin-docs__drawer" data-doc-drawer role="dialog" aria-modal="true" aria-labelledby="doc-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const tab = currentTab();
    const term = normalize(document.querySelector("[data-doc-search]")?.value);
    const filters = [...document.querySelectorAll("[data-doc-filter]")];

    const filtered = visibleRecords(tab)
      .filter((record) => {
        const text = normalize([record.id, record.title, record.description, record.summary, record.author, record.category,
          record.assembly?.title].join(" "));
        return (!term || text.includes(term)) && filters.every((field) => {
          if (!field.value) return true;
          const key = field.dataset.docFilter;
          if (key === "link") return (field.value === "Sem vínculo") === !record.assembly;
          return String(record[key]) === field.value;
        });
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const body = document.querySelector("[data-doc-table]");
    if (body) body.innerHTML = rowsMarkup(filtered, tab);

    const countBox = document.querySelector("[data-doc-count]");
    if (countBox) countBox.textContent = `${filtered.length} registro(s) demonstrativo(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-doc-overlay]");
    const drawer = document.querySelector("[data-doc-drawer]");
    if (!overlay || !drawer) return;

    if (drawer.hidden) lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("input, select, textarea, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-doc-overlay]");
    const drawer = document.querySelector("[data-doc-drawer]");
    const wasOpen = drawer && !drawer.hidden;

    if (overlay) overlay.hidden = true;
    if (drawer) {
      drawer.hidden = true;
      drawer.innerHTML = "";
    }
    document.body.style.overflow = "";
    pendingFile = null;

    if (wasOpen && restoreFocus && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function drawerHeader(eyebrow, title) {
    return `
      <header class="admin-docs__drawer-header">
        <div>
          <span class="admin-docs__eyebrow">${escapeHtml(eyebrow)}</span>
          <h2 id="doc-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-docs__close" data-doc-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function fileMarkup(file) {
    if (!file) return "Nenhum arquivo";
    const info = `${escapeHtml(file.name)} <small>(${escapeHtml(file.type || "tipo não informado")} · ${escapeHtml(formatSize(file.size))})</small>`;
    if (file.href && isDemoFileHref(file.href)) {
      return `<a class="admin-docs__mono" href="${escapeHtml(file.href)}" target="_blank" rel="noopener noreferrer">${info}</a>`;
    }
    return `${info}<br><small>Arquivo demonstrativo selecionado — não armazenado no protótipo.</small>`;
  }

  function detailMarkup(record) {
    const actions = allowedActions(record).filter((action) => action !== "view");
    const isAta = record.kind === "atas";

    return `
      ${drawerHeader(`${TABS[record.kind].singular} · ${record.id}`, record.title)}

      <div class="admin-docs__drawer-status">
        <span>Situação</span>
        <strong><span class="admin-docs__status admin-docs__status--${slug(record.status)}">${escapeHtml(record.status)}</span></strong>
      </div>

      <dl class="admin-docs__details">
        <div><dt>Protocolo</dt><dd>${escapeHtml(record.id)}</dd></div>
        <div><dt>Data</dt><dd>${formatDate(record.date)}</dd></div>
        ${isAta
          ? `<div class="admin-docs__details-wide"><dt>Assembleia/reunião relacionada</dt><dd>${escapeHtml(record.assembly ? `${record.assembly.id} — ${record.assembly.title}` : "—")}</dd></div>`
          : `<div><dt>Categoria</dt><dd>${escapeHtml(record.category)}</dd></div><div><dt>Ano</dt><dd>${escapeHtml(record.year)}</dd></div>`}
        <div><dt>${isAta ? "Público" : "Escopo"}</dt><dd>${scopeBadge(record.scope)}</dd></div>
        <div><dt>Autor</dt><dd>${escapeHtml(record.author || "—")}</dd></div>
        <div class="admin-docs__details-wide"><dt>Arquivo</dt><dd>${fileMarkup(record.file)}</dd></div>
        <div><dt>Criado em</dt><dd>${formatDateTime(record.createdAt)}</dd></div>
        <div><dt>Atualizado em</dt><dd>${formatDateTime(record.updatedAt)}</dd></div>
      </dl>

      ${isAta
        ? `<section class="admin-docs__drawer-section"><h3>Resumo</h3><p>${escapeHtml(record.summary || "—")}</p></section>
           <section class="admin-docs__drawer-section"><h3>Conteúdo / observações</h3><p>${escapeHtml(record.content || "—")}</p></section>`
        : `<section class="admin-docs__drawer-section"><h3>Descrição</h3><p>${escapeHtml(record.description || "—")}</p></section>`}

      <section class="admin-docs__drawer-section">
        <h3>Histórico</h3>
        <ol class="admin-docs__history">
          ${record.history.slice().reverse().map((entry) => `
            <li>
              <time datetime="${escapeHtml(entry.at)}">${formatDateTime(entry.at)}</time>
              <strong>${escapeHtml(entry.profile)}</strong>
              <span>${escapeHtml(entry.action)}</span>
              ${entry.note ? `<em>${escapeHtml(entry.note)}</em>` : ""}
            </li>`).join("")}
        </ol>
      </section>

      ${record.status === STATUS.ARCHIVED ? '<p class="admin-docs__form-note">Registro arquivado: não pode mais ser editado.</p>' : ""}
      ${record.status === STATUS.PUBLISHED ? '<p class="admin-docs__form-note">Registro publicado: para alterar, arquive e crie nova versão.</p>' : ""}

      ${actions.length ? `
        <div class="admin-docs__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "return" || action === "archive" ? "button--secondary" : "button--primary"}"
              data-doc-action="${action}" data-id="${escapeHtml(record.id)}">
              ${actionLabel(action).toUpperCase()}
            </button>`).join("")}
        </div>` : ""}
    `;
  }

  function field(label, control) {
    return `<label class="admin-docs__field"><span>${label}</span>${control}</label>`;
  }

  function assemblyOptions(selectedId) {
    const list = loadAssemblies();
    const selected = list.some((a) => a.id === selectedId) ? selectedId : "";
    // Mantém o vínculo salvo mesmo que o T30 ainda não tenha sido carregado nesta sessão.
    const extra = selectedId && !selected ? `<option value="${escapeHtml(selectedId)}" selected>${escapeHtml(selectedId)} (registro salvo)</option>` : "";
    return `<option value="">Sem vínculo</option>${extra}${list.map((a) =>
      `<option value="${escapeHtml(a.id)}"${a.id === selected ? " selected" : ""}>${escapeHtml(`${a.id} — ${a.title} (${formatDate(a.date)})`)}</option>`).join("")}`;
  }

  function formMarkup(kind, record = null) {
    const p = perms();
    const isAta = kind === "atas";
    const scopes = scopesFor(kind);
    const r = record || { scope: scopes.includes(SCOPE.MEMBERS) ? SCOPE.MEMBERS : scopes[0], category: p.categories[0], date: nowIso().slice(0, 10) };
    const assemblyHint = loadAssemblies().length ? "" :
      '<small>Nenhuma assembleia do T30 nesta sessão. Abra “Assembleias e reuniões” para carregar os registros demonstrativos.</small>';

    return `
      ${drawerHeader(record ? `EDIÇÃO · ${record.id}` : "NOVO REGISTRO", record ? `Editar ${TABS[kind].singular.toLowerCase()}` : `${isAta ? "Nova ata" : "Novo documento"}`)}

      <form data-doc-form data-kind="${kind}" ${record ? `data-id="${escapeHtml(record.id)}"` : ""} novalidate>
        ${record ? field("Protocolo", `<input value="${escapeHtml(record.id)}" disabled>`) : ""}
        ${field("Título *", `<input name="title" required maxlength="160" value="${escapeHtml(r.title || "")}">`)}
        ${isAta ? field("Assembleia/reunião relacionada (opcional)", `<select name="assemblyId">${assemblyOptions(r.assembly?.id || "")}</select>${assemblyHint}`) : ""}
        <div class="admin-docs__form-grid${isAta ? "" : " admin-docs__form-grid--3"}">
          ${isAta ? "" : field("Categoria *", `<select name="category" required>${optionList(p.categories, r.category)}</select>`)}
          ${field("Data *", `<input type="date" name="date" required value="${escapeHtml(r.date || "")}">`)}
          ${isAta ? "" : field("Ano *", `<input name="year" inputmode="numeric" maxlength="4" pattern="\\d{4}" value="${escapeHtml(r.year || "")}" placeholder="Ano da data">`)}
          ${field(isAta ? "Público *" : "Público/escopo *", `<select name="scope" required>${optionList(scopes, r.scope)}</select>`)}
        </div>
        ${isAta
          ? field("Resumo *", `<textarea name="summary" rows="3" required maxlength="600">${escapeHtml(r.summary || "")}</textarea>`)
            + field("Conteúdo / observações", `<textarea name="content" rows="5" maxlength="4000">${escapeHtml(r.content || "")}</textarea>`)
          : field("Descrição *", `<textarea name="description" rows="4" required maxlength="2000">${escapeHtml(r.description || "")}</textarea>`)}

        <fieldset class="admin-docs__field">
          <span>Arquivo ${isAta ? "PDF demonstrativo (opcional)" : "(opcional)"}</span>
          <select name="fileChoice">
            <option value="">${r.file ? `Manter arquivo atual (${escapeHtml(r.file.name)})` : "Sem arquivo"}</option>
            ${r.file ? '<option value="none">Remover arquivo</option>' : ""}
            ${DEMO_FILES.map((f) => `<option value="${escapeHtml(f.href)}">PDF demonstrativo existente: ${escapeHtml(f.name)}</option>`).join("")}
          </select>
          <input type="file" name="upload" accept="${isAta ? "application/pdf,.pdf" : ".pdf,.doc,.docx,.odt,.xls,.xlsx,.ods,application/pdf"}" data-doc-upload aria-label="Selecionar arquivo demonstrativo">
          <p class="admin-docs__file-info" data-doc-file-info role="status" aria-live="polite"></p>
          <small>O conteúdo do arquivo não é armazenado: registra-se apenas nome, tipo e tamanho. Na versão definitiva o arquivo seria enviado ao backend/storage.</small>
        </fieldset>

        <p class="admin-docs__form-error" data-doc-error role="alert" hidden></p>

        <p class="admin-docs__form-note">
          ${record ? `Situação atual: <strong>${escapeHtml(record.status)}</strong>.` : "O registro será salvo como <strong>Rascunho</strong>."}
          Não há envio a servidor: os dados ficam somente nesta sessão.
        </p>

        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-doc-close>CANCELAR</button>
          <button type="submit" class="button button--primary">SALVAR</button>
        </div>
      </form>
    `;
  }

  function confirmMarkup(record, action) {
    const internal = perms()?.internalOnly;
    const texts = {
      forward: "O registro será encaminhado para revisão.",
      publish: internal
        ? "O registro será aprovado internamente. Permanecerá restrito ao escopo do Conselho e nunca será enviado à Área do Filiado."
        : ([SCOPE.PUBLIC, SCOPE.MEMBERS].includes(record.scope)
          ? "O registro será publicado e passará a aparecer na Área do Filiado."
          : "O registro será publicado no escopo interno indicado e não aparecerá na Área do Filiado."),
      return: "O registro voltará para Rascunho para ajustes. Informe o motivo.",
      archive: "O registro será arquivado, deixará de aparecer na Área do Filiado e não poderá mais ser editado."
    };
    const required = action === "return";

    return `
      ${drawerHeader(`${TABS[record.kind].singular} · ${record.id}`, actionLabel(action))}
      <p><strong>${escapeHtml(record.title)}</strong></p>
      <p>${texts[action]}</p>
      <form data-doc-confirm="${action}" data-id="${escapeHtml(record.id)}">
        <label class="admin-docs__field">
          <span>Observação para o histórico${required ? " *" : " (opcional)"}</span>
          <textarea name="note" rows="3" maxlength="500"${required ? " required" : ""}></textarea>
        </label>
        <p class="admin-docs__form-error" data-doc-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-doc-back="${escapeHtml(record.id)}">VOLTAR</button>
          <button type="submit" class="button button--primary">CONFIRMAR</button>
        </div>
      </form>
    `;
  }

  /* ---------- Ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-doc-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function addHistory(record, action, note = "") {
    const at = nowIso();
    record.history.push(h(at, PROFILE_LABELS[currentProfile()], action, note));
    record.updatedAt = at;
  }

  function resolveFile(form, current) {
    if (pendingFile) return { ...pendingFile };
    const choice = String(new FormData(form).get("fileChoice") || "");
    if (choice === "none") return null;
    const demo = DEMO_FILES.find((f) => f.href === choice);
    if (demo) return { name: demo.name, type: demo.type, size: 0, href: demo.href };
    return current || null;
  }

  function saveForm(form) {
    const p = perms();
    const kind = form.dataset.kind;
    const id = form.dataset.id || "";
    const existing = id ? recordById(id) : null;

    // Revalida a permissão no momento da ação (o perfil pode ter mudado).
    if (!p || !p.tabs.includes(kind) || (id ? !existing || !canEdit(existing) : !p.create)) {
      showError(form, "O perfil atual não pode realizar esta ação.");
      return;
    }

    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? "").trim();
    const isAta = kind === "atas";

    const next = {
      title: value("title"),
      date: value("date"),
      scope: value("scope")
    };

    if (!next.title || !/^\d{4}-\d{2}-\d{2}$/.test(next.date)) {
      showError(form, "Preencha título e data válidos.");
      return;
    }
    if (!scopesFor(kind).includes(next.scope)) {
      showError(form, "Selecione um público/escopo permitido para o seu perfil.");
      return;
    }

    if (isAta) {
      next.category = "Ata";
      next.year = next.date.slice(0, 4);
      next.summary = value("summary");
      next.content = value("content");
      if (!next.summary) {
        showError(form, "Informe o resumo da ata.");
        return;
      }
      const assemblyId = value("assemblyId");
      if (assemblyId) {
        const found = loadAssemblies().find((a) => a.id === assemblyId);
        next.assembly = found
          ? { id: found.id, title: found.title }
          : (existing?.assembly?.id === assemblyId ? existing.assembly : null);
      } else {
        next.assembly = null;
      }
    } else {
      next.category = value("category");
      next.description = value("description");
      next.year = value("year") || next.date.slice(0, 4);
      if (!p.categories.includes(next.category)) {
        showError(form, "Selecione uma categoria permitida para o seu perfil.");
        return;
      }
      if (!/^\d{4}$/.test(next.year)) {
        showError(form, "Informe o ano com quatro dígitos.");
        return;
      }
      if (!next.description) {
        showError(form, "Informe a descrição do documento.");
        return;
      }
      // Não mistura escopos confidenciais: categoria e escopo precisam ser coerentes.
      const bound = BOUND_CATEGORY_SCOPE[next.category];
      const boundCategory = Object.keys(BOUND_CATEGORY_SCOPE).find((c) => BOUND_CATEGORY_SCOPE[c] === next.scope);
      if ((bound && bound !== next.scope) || (boundCategory && boundCategory !== next.category)) {
        showError(form, `A categoria “${next.category}” exige o escopo correspondente (${bound || boundCategory}).`);
        return;
      }
    }

    next.file = resolveFile(form, existing?.file);

    if (existing) {
      Object.assign(existing, next);
      addHistory(existing, "Registro editado.");
    } else {
      const duplicated = records.some((item) =>
        item.kind === kind && normalize(item.title) === normalize(next.title)
        && item.date === next.date && item.status !== STATUS.ARCHIVED);
      if (duplicated) {
        showError(form, "Já existe um registro ativo com o mesmo título e data.");
        return;
      }

      const at = nowIso();
      const author = PROFILE_LABELS[currentProfile()];
      records.push({
        id: nextId(kind, next.year),
        kind,
        ...next,
        status: STATUS.DRAFT,
        author,
        createdAt: at,
        updatedAt: at,
        history: [h(at, author, "Registro criado como Rascunho.")]
      });
    }

    records = deduplicate(records);
    saveRecords();
    renderModule();
  }

  const TRANSITIONS = {
    forward: { from: STATUS.DRAFT, to: STATUS.REVIEW, log: "Encaminhado para revisão." },
    publish: { from: STATUS.REVIEW, to: STATUS.PUBLISHED, log: "Publicado." },
    return: { from: STATUS.REVIEW, to: STATUS.DRAFT, log: "Devolvido para ajustes." },
    archive: { from: STATUS.PUBLISHED, to: STATUS.ARCHIVED, log: "Arquivado." }
  };

  function applyTransition(form) {
    const action = form.dataset.docConfirm;
    const record = recordById(form.dataset.id);
    const transition = TRANSITIONS[action];
    const note = String(new FormData(form).get("note") || "").trim();

    if (!record || !transition || !allowedActions(record).includes(action) || transition.from !== record.status) {
      showError(form, "Esta ação não está disponível para o perfil ou a situação atual.");
      return;
    }
    if (action === "return" && !note) {
      showError(form, "Informe o motivo da devolução.");
      return;
    }

    record.status = transition.to;
    const log = action === "publish" && perms().internalOnly
      ? "Aprovado internamente (escopo do Conselho)."
      : transition.log;
    addHistory(record, log, note);
    saveRecords();
    renderModule();
  }

  function handleAction(action, id) {
    if (action === "new") {
      if (perms()?.create) openDrawer(formMarkup(currentTab()));
      return;
    }

    const record = recordById(id);
    if (!record || !allowedActions(record).includes(action)) {
      renderModule();
      return;
    }

    if (action === "view") openDrawer(detailMarkup(record));
    else if (action === "edit") openDrawer(formMarkup(record.kind, record));
    else openDrawer(confirmMarkup(record, action));
  }

  function handleUpload(input) {
    const file = input.files && input.files[0];
    const info = input.closest("form")?.querySelector("[data-doc-file-info]");
    if (!file) {
      pendingFile = null;
      if (info) info.textContent = "";
      return;
    }
    // Apenas metadados: o conteúdo não é lido nem gravado (sem base64).
    pendingFile = { name: file.name, type: file.type || "não informado", size: file.size, demo: true };
    if (info) info.textContent = `Arquivo demonstrativo selecionado: ${file.name} (${pendingFile.type} · ${formatSize(file.size)})`;
  }

  function bindEvents(container) {
    // O container permanece entre renderizações: registra os eventos uma única vez.
    if (container.dataset.docsEventsBound === "true") return;
    container.dataset.docsEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-doc-search]")) filterRows();
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-doc-filter]")) filterRows();
      else if (event.target.matches("[data-doc-upload]")) handleUpload(event.target);
    });

    container.addEventListener("keydown", (event) => {
      const tab = event.target.closest("[data-doc-tab]");
      if (!tab || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const tabs = [...container.querySelectorAll("[data-doc-tab]")];
      const index = tabs.indexOf(tab);
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      if (next && next !== tab) {
        window.location.hash = next.dataset.docTab;
      }
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-doc-overlay]");
      if (!target) return;

      if (target.matches("[data-doc-close], [data-doc-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-doc-tab]")) {
        if (target.dataset.docTab !== currentTab()) window.location.hash = target.dataset.docTab;
      } else if (target.matches("[data-doc-new]")) {
        handleAction("new");
      } else if (target.matches("[data-doc-back]")) {
        const record = recordById(target.dataset.docBack);
        if (record) document.querySelector("[data-doc-drawer]").innerHTML = detailMarkup(record);
      } else if (target.matches("[data-doc-action]")) {
        handleAction(target.dataset.docAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-doc-form]")) {
        event.preventDefault();
        saveForm(event.target);
      } else if (event.target.matches("[data-doc-confirm]")) {
        event.preventDefault();
        applyTransition(event.target);
      }
    });
  }

  function init() {
    if (!document.querySelector("[data-admin-content]")) return;

    renderModule();

    window.addEventListener("hashchange", () => {
      renderModule();
      document.querySelector(`[data-doc-tab="${currentTab()}"]`)?.focus();
    });

    // area-admin.js grava o novo perfil e re-renderiza o shell no mesmo evento;
    // o setTimeout garante a leitura do perfil já atualizado.
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-admin-profile-select]")) {
        window.setTimeout(renderModule, 0);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
