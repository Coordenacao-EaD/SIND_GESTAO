// T32 — Prestação de Contas (protótipo demonstrativo).
// Fluxo oficial: TESOURARIA prepara -> PRESIDÊNCIA confere e VALIDA E PUBLICA -> FILIADOS consultam.
// Independente do T31: documentos financeiros internos do T31 nunca são usados aqui.
// Sem banco/API: estado em localStorage (sindGestao.financeDemo). Arquivos guardam
// apenas metadados (nome, tipo, tamanho e href de demonstrativo existente) — sem base64.
(() => {
  "use strict";

  // Mesma fonte de verdade de perfil utilizada por area-admin.js.
  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE = "administrador";
  const STORAGE_KEY = "sindGestao.financeDemo";

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
    REVIEW: "Aguardando validação",
    PUBLISHED: "Publicada",
    ARCHIVED: "Arquivada"
  });

  const TYPES = ["Mensal", "Trimestral", "Anual", "Extraordinária"];

  // Formato da competência conforme o tipo.
  const COMPETENCE_RULES = {
    Mensal: { pattern: /^(0[1-9]|1[0-2])\/(\d{4})$/, hint: "MM/AAAA (ex.: 09/2026)" },
    Extraordinária: { pattern: /^(0[1-9]|1[0-2])\/(\d{4})$/, hint: "MM/AAAA (ex.: 12/2026)" },
    Trimestral: { pattern: /^([1-4])º tri\/(\d{4})$/, hint: "Nº tri/AAAA (ex.: 3º tri/2026)" },
    Anual: { pattern: /^(\d{4})$/, hint: "AAAA (ex.: 2025)" }
  };

  // Demonstrativos já existentes no protótipo (únicos que geram link).
  const DEMO_FILES = [
    { href: "../assets/docs/financeiro/demonstrativo-financeiro-2026.html", name: "demonstrativo-financeiro-2026.html", type: "text/html" },
    { href: "../assets/docs/financeiro/comprovante-demonstrativo.html", name: "comprovante-demonstrativo.html", type: "text/html" },
    { href: "../assets/docs/financeiro/relatorio-sintetico-2025.html", name: "relatorio-sintetico-2025.html", type: "text/html" }
  ];

  const ALL_STATUSES = Object.values(STATUS);
  const OVERSIGHT_STATUSES = [STATUS.REVIEW, STATUS.PUBLISHED, STATUS.ARCHIVED];

  /*
   * Matriz de permissões (segregação de funções).
   * prepare: criar, editar Rascunho e encaminhar; validate: devolver e VALIDAR E PUBLICAR;
   * archive: arquivar Publicada; statuses: situações visíveis.
   * Perfis ausentes (Secretaria, Conselho de Ética) não acessam o módulo.
   */
  const PERMISSIONS = Object.freeze({
    tesouraria: {
      role: ["Elaboração", "A Tesouraria cria, edita enquanto Rascunho e encaminha para validação. Não valida, não publica e não arquiva."],
      statuses: ALL_STATUSES, prepare: true, validate: false, archive: false
    },
    presidencia: {
      role: ["Conferência e validação", "A Presidência confere, devolve para ajustes ou valida e publica. Não cria nem altera os valores preparados pela Tesouraria."],
      statuses: ALL_STATUSES, prepare: false, validate: true, archive: true
    },
    administrador: {
      role: ["Acesso técnico", "Consulta a todos os registros e históricos. Não substitui a autorização financeira da Presidência."],
      statuses: ALL_STATUSES, prepare: false, validate: false, archive: false
    },
    diretoria: {
      role: ["Consulta", "A Diretoria consulta as prestações encaminhadas, publicadas e arquivadas."],
      statuses: OVERSIGHT_STATUSES, prepare: false, validate: false, archive: false
    },
    conselhoFiscal: {
      role: ["Fiscalização", "O Conselho Fiscal consulta as prestações encaminhadas, publicadas e arquivadas, sem alterar registros."],
      statuses: OVERSIGHT_STATUSES, prepare: false, validate: false, archive: false
    }
  });

  function h(at, profile, action, note) {
    return note ? { at, profile, action, note } : { at, profile, action };
  }

  const DEFAULT_RECORDS = [
    {
      id: "PC-2026-0001",
      title: "Prestação de contas anual — exercício 2025",
      competence: "2025", type: "Anual", year: "2025",
      revenue: 512340.0, expense: 489115.6,
      summary: "Consolidação demonstrativa das receitas e despesas do exercício 2025.",
      notes: "Mantida em arquivo após o encerramento do ciclo de consulta.",
      statement: { name: "relatorio-sintetico-2025.html", type: "text/html", size: 0, href: DEMO_FILES[2].href },
      attachments: [],
      status: STATUS.ARCHIVED,
      createdBy: "Tesouraria", createdByProfile: "tesouraria",
      createdAt: "2026-01-20T09:00:00", updatedAt: "2026-10-15T10:00:00",
      validatedBy: "Presidência", validatedAt: "2026-02-10T16:00:00", publishedAt: "2026-02-10T16:00:00",
      history: [
        h("2026-01-20T09:00:00", "Tesouraria", "Prestação criada como Rascunho."),
        h("2026-01-28T11:00:00", "Tesouraria", "Encaminhada para validação da Presidência."),
        h("2026-02-10T16:00:00", "Presidência", "Validada e publicada para os filiados."),
        h("2026-10-15T10:00:00", "Presidência", "Arquivada.", "Ciclo de consulta do exercício 2025 encerrado.")
      ]
    },
    {
      id: "PC-2026-0002",
      title: "Prestação de contas mensal — setembro/2026",
      competence: "09/2026", type: "Mensal", year: "2026",
      revenue: 42300.0, expense: 37150.0,
      summary: "Receitas de contribuições e despesas administrativas, de assessoria e eventos do mês.",
      notes: "Valores fictícios utilizados apenas para validação do protótipo.",
      statement: { name: "demonstrativo-financeiro-2026.html", type: "text/html", size: 0, href: DEMO_FILES[0].href },
      attachments: [{ name: "comprovante-demonstrativo.html", type: "text/html", size: 0, href: DEMO_FILES[1].href }],
      status: STATUS.PUBLISHED,
      createdBy: "Tesouraria", createdByProfile: "tesouraria",
      createdAt: "2026-10-03T09:00:00", updatedAt: "2026-10-10T15:00:00",
      validatedBy: "Presidência", validatedAt: "2026-10-10T15:00:00", publishedAt: "2026-10-10T15:00:00",
      history: [
        h("2026-10-03T09:00:00", "Tesouraria", "Prestação criada como Rascunho."),
        h("2026-10-05T14:00:00", "Tesouraria", "Encaminhada para validação da Presidência."),
        h("2026-10-10T15:00:00", "Presidência", "Validada e publicada para os filiados.")
      ]
    },
    {
      id: "PC-2026-0003",
      title: "Prestação de contas mensal — outubro/2026",
      competence: "10/2026", type: "Mensal", year: "2026",
      revenue: 44120.5, expense: 39870.25,
      summary: "Movimentação demonstrativa de outubro, incluindo despesas da reunião com filiados.",
      notes: "",
      statement: null, attachments: [],
      status: STATUS.REVIEW,
      createdBy: "Tesouraria", createdByProfile: "tesouraria",
      createdAt: "2026-11-02T10:00:00", updatedAt: "2026-11-04T09:00:00",
      validatedBy: "", validatedAt: "", publishedAt: "",
      history: [
        h("2026-11-02T10:00:00", "Tesouraria", "Prestação criada como Rascunho."),
        h("2026-11-04T09:00:00", "Tesouraria", "Encaminhada para validação da Presidência.")
      ]
    },
    {
      id: "PC-2026-0004",
      title: "Prestação de contas mensal — novembro/2026",
      competence: "11/2026", type: "Mensal", year: "2026",
      revenue: 15400.0, expense: 9230.4,
      summary: "Lançamentos parciais demonstrativos do mês em andamento.",
      notes: "Rascunho em elaboração pela Tesouraria.",
      statement: null, attachments: [],
      status: STATUS.DRAFT,
      createdBy: "Tesouraria", createdByProfile: "tesouraria",
      createdAt: "2026-11-05T17:00:00", updatedAt: "2026-11-05T17:00:00",
      validatedBy: "", validatedAt: "", publishedAt: "",
      history: [h("2026-11-05T17:00:00", "Tesouraria", "Prestação criada como Rascunho.")]
    }
  ];

  let records = deduplicate(loadRecords());
  let lastFocused = null;
  let pendingStatement = null;
  let pendingAttachments = null;

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

  // Sempre relido no momento do uso: nenhuma permissão do perfil anterior é mantida.
  function perms() {
    return PERMISSIONS[currentProfile()] || null;
  }

  function isVisible(record) {
    const p = perms();
    return Boolean(p && record && p.statuses.includes(record.status));
  }

  function visibleRecords() {
    return records.filter(isVisible);
  }

  function allowedActions(record) {
    const p = perms();
    if (!p || !isVisible(record)) return [];

    const actions = ["view"];
    if (p.prepare && record.status === STATUS.DRAFT) actions.push("edit", "forward");
    // Segregação: quem preparou nunca valida o próprio registro.
    if (p.validate && record.status === STATUS.REVIEW && record.createdByProfile !== currentProfile()) {
      actions.push("return", "validate");
    }
    if (p.archive && record.status === STATUS.PUBLISHED) actions.push("archive");
    return actions;
  }

  /* ---------- Armazenamento ---------- */

  function loadRecords() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => item && typeof item === "object" && /^PC-\d{4}-\d{4}$/.test(item.id));
        }
      }
    } catch {
      // Mantém os dados iniciais.
    }
    return JSON.parse(JSON.stringify(DEFAULT_RECORDS));
  }

  function saveRecords() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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
      if (!Array.isArray(item.attachments)) item.attachments = [];
      item.revenue = toCents(item.revenue) / 100;
      item.expense = toCents(item.expense) / 100;
      return true;
    });
  }

  function nextId() {
    const year = nowIso().slice(0, 4);
    const max = records.reduce((acc, r) => {
      const n = Number(String(r.id).split("-").pop());
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `PC-${year}-${String(max + 1).padStart(4, "0")}`;
  }

  function recordById(id) {
    const record = records.find((item) => item.id === id);
    return isVisible(record) ? record : null;
  }

  /* ---------- Valores monetários ---------- */

  function toCents(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }

  // Aceita "1.234,56", "1234,56", "1234.56" e "R$ 1.234,56". Retorna número ou NaN.
  function parseMoney(text) {
    let raw = String(text ?? "").replace(/R\$/gi, "").replace(/\s/g, "");
    if (!raw) return NaN;
    if (raw.includes(",")) raw = raw.replace(/\./g, "").replace(",", ".");
    else if ((raw.match(/\./g) || []).length > 1 || /^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) return NaN;
    return Math.round(Number(raw) * 100) / 100;
  }

  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function formatMoney(value) {
    return BRL.format(toCents(value) / 100);
  }

  function balanceOf(record) {
    return (toCents(record.revenue) - toCents(record.expense)) / 100;
  }

  function moneyInput(value) {
    return value === undefined || value === null || value === "" ? "" : (toCents(value) / 100).toFixed(2).replace(".", ",");
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

  function slug(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function nowIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function formatDateTime(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso || ""));
    if (!match) return "—";
    return `${match[3]}/${match[2]}/${match[1]}${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
  }

  function formatSize(bytes) {
    const n = Number(bytes) || 0;
    if (!n) return "tamanho não informado";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace(".", ",")} KB`;
    return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  // Chave de ordenação da competência (ano * 100 + mês de referência).
  function competenceKey(record) {
    const rule = COMPETENCE_RULES[record.type];
    const match = rule ? rule.pattern.exec(record.competence || "") : null;
    if (!match) return Number(record.year || 0) * 100;
    if (record.type === "Anual") return Number(match[1]) * 100 + 12;
    if (record.type === "Trimestral") return Number(match[2]) * 100 + Number(match[1]) * 3;
    return Number(match[2]) * 100 + Number(match[1]);
  }

  function isDemoHref(href) {
    return DEMO_FILES.some((f) => f.href === href);
  }

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>',
      forward: '<path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path>',
      validate: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>',
      return: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 0 10h-3"></path>',
      archive: '<rect x="3" y="4" width="18" height="4" rx="1"></rect><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"></path><path d="M10 12h4"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  const ACTION_LABELS = {
    view: "Visualizar",
    edit: "Editar",
    forward: "Encaminhar para validação",
    return: "Devolver para ajustes",
    validate: "Validar e publicar",
    archive: "Arquivar"
  };

  // Classe de hover reaproveitada do T31.
  const ACTION_STYLE = { validate: "publish", return: "return", archive: "archive" };

  function optionList(values, selected, allLabel) {
    const first = allLabel === undefined ? "" : `<option value="">${allLabel}</option>`;
    return first + values.map((value) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`
    ).join("");
  }

  /* ---------- Renderização ---------- */

  function markNavigation() {
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === "admin-prestacao-contas.html";
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Prestação de Contas</h1>
        <p>O perfil ${escapeHtml(PROFILE_LABELS[currentProfile()])} não possui acesso ao módulo financeiro.</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function statusBadge(status) {
    return `<span class="admin-docs__status admin-docs__status--${slug(status)}">${escapeHtml(status)}</span>`;
  }

  function actionButtons(record) {
    return allowedActions(record).map((action) => `
      <button
        type="button"
        class="admin-docs__icon-button admin-docs__icon-button--${ACTION_STYLE[action] || action}"
        data-pc-action="${action}"
        data-id="${escapeHtml(record.id)}"
        title="${ACTION_LABELS[action]}"
        aria-label="${ACTION_LABELS[action]}: ${escapeHtml(record.title)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function rowsMarkup(rows) {
    if (!rows.length) {
      return '<tr><td colspan="8" class="admin-docs__empty">Nenhuma prestação encontrada.</td></tr>';
    }

    return rows.map((record) => {
      const balance = balanceOf(record);
      return `
        <tr>
          <td><span class="admin-docs__id">${escapeHtml(record.id)}</span></td>
          <td><strong>${escapeHtml(record.competence)}</strong><small>${escapeHtml(record.type)}</small></td>
          <td><strong>${escapeHtml(record.title)}</strong></td>
          <td class="admin-pc__money">${formatMoney(record.revenue)}</td>
          <td class="admin-pc__money">${formatMoney(record.expense)}</td>
          <td class="admin-pc__money admin-pc__money--${balance < 0 ? "negative" : "positive"}">${formatMoney(balance)}</td>
          <td>${statusBadge(record.status)}</td>
          <td><div class="admin-docs__actions">${actionButtons(record)}</div></td>
        </tr>
      `;
    }).join("");
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    closeDrawer(false);
    markNavigation();

    const p = perms();
    if (!p) {
      renderDenied(container);
      return;
    }

    const rows = visibleRecords();
    const count = (status) => rows.filter((r) => r.status === status).length;
    const years = [...new Set(rows.map((r) => r.year).filter(Boolean))].sort().reverse();
    const statsMarkup = ALL_STATUSES
      .filter((status) => p.statuses.includes(status))
      .map((status) => {
        const label = { [STATUS.DRAFT]: "Rascunhos", [STATUS.REVIEW]: "Aguardando validação", [STATUS.PUBLISHED]: "Publicadas", [STATUS.ARCHIVED]: "Arquivadas" }[status];
        return `<article><span>${label}</span><strong>${count(status)}</strong></article>`;
      }).join("");
    const pendingValidation = p.validate
      ? rows.filter((r) => r.status === STATUS.REVIEW && r.createdByProfile !== currentProfile()).length
      : 0;

    container.innerHTML = `
      <p class="admin-docs__notice">
        Conteúdo demonstrativo. Valores fictícios mantidos apenas neste navegador.
      </p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">FINANCEIRO</span>
          <h1 id="admin-content-title">PRESTAÇÃO DE CONTAS</h1>
          <p>Elaboração pela Tesouraria e validação pela Presidência antes da disponibilização aos filiados.</p>
        </div>
        <div class="admin-docs__header-actions">
          <span class="admin-docs__profile">${escapeHtml(PROFILE_LABELS[currentProfile()])}</span>
          ${p.prepare ? '<button type="button" class="button button--primary" data-pc-new>NOVA PRESTAÇÃO</button>' : ""}
        </div>
      </header>

      <div class="admin-docs__role">
        <strong>${escapeHtml(p.role[0])}</strong>
        <span>${escapeHtml(p.role[1])}</span>
      </div>

      <div class="admin-docs__stats">${statsMarkup}</div>

      ${pendingValidation ? `
        <aside class="admin-docs__alert" role="note">
          <strong>${pendingValidation} ${pendingValidation === 1 ? "prestação aguarda" : "prestações aguardam"} validação da Presidência</strong>
          <span>Abra o registro para conferir, devolver para ajustes ou validar e publicar.</span>
        </aside>` : ""}

      <section class="admin-docs__panel" aria-label="Prestações de contas">
        <div class="admin-docs__filters admin-pc__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Protocolo, título, competência ou resumo" data-pc-search></label>
          <label><span>Situação</span><select data-pc-filter="status">${optionList(p.statuses, "", "Todas")}</select></label>
          <label><span>Ano/competência</span><select data-pc-filter="year">${optionList(years, "", "Todos")}</select></label>
        </div>
        <p class="admin-docs__count" data-pc-count role="status" aria-live="polite"></p>
        <div class="admin-docs__table-wrap">
          <table class="admin-docs__table admin-pc__table">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Competência</th>
                <th scope="col">Título</th>
                <th scope="col">Receitas</th>
                <th scope="col">Despesas</th>
                <th scope="col">Saldo</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-pc-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-docs__rule">
        <strong>Fluxo e segregação de funções</strong>
        <p>Rascunho → Aguardando validação → Publicada → Arquivada. A Presidência pode devolver para Rascunho, com motivo obrigatório.
        Quem prepara a prestação não pode validá-la. Somente prestações Publicadas aparecem na Área do Filiado; a área pública não exibe valores.</p>
      </aside>

      <div class="admin-docs__overlay" data-pc-overlay hidden></div>
      <aside class="admin-docs__drawer" data-pc-drawer role="dialog" aria-modal="true" aria-labelledby="pc-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const term = normalize(document.querySelector("[data-pc-search]")?.value);
    const filters = [...document.querySelectorAll("[data-pc-filter]")];

    const filtered = visibleRecords()
      .filter((record) => {
        const text = normalize([record.id, record.title, record.competence, record.type, record.summary, record.status].join(" "));
        return (!term || text.includes(term))
          && filters.every((field) => !field.value || String(record[field.dataset.pcFilter]) === field.value);
      })
      .sort((a, b) => competenceKey(b) - competenceKey(a));

    const body = document.querySelector("[data-pc-table]");
    if (body) body.innerHTML = rowsMarkup(filtered);

    const countBox = document.querySelector("[data-pc-count]");
    if (countBox) countBox.textContent = `${filtered.length} prestação(ões) demonstrativa(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-pc-overlay]");
    const drawer = document.querySelector("[data-pc-drawer]");
    if (!overlay || !drawer) return;

    if (drawer.hidden) lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("input, select, textarea, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-pc-overlay]");
    const drawer = document.querySelector("[data-pc-drawer]");
    const wasOpen = drawer && !drawer.hidden;

    if (overlay) overlay.hidden = true;
    if (drawer) {
      drawer.hidden = true;
      drawer.innerHTML = "";
    }
    document.body.style.overflow = "";
    pendingStatement = null;
    pendingAttachments = null;

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
          <h2 id="pc-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-docs__close" data-pc-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function fileMarkup(file) {
    if (!file) return "Nenhum arquivo";
    const info = `${escapeHtml(file.name)} <small>(${escapeHtml(file.type || "tipo não informado")} · ${escapeHtml(formatSize(file.size))})</small>`;
    if (file.href && isDemoHref(file.href)) {
      return `<a class="admin-docs__mono" href="${escapeHtml(file.href)}" target="_blank" rel="noopener noreferrer">${info}</a>`;
    }
    return `${info}<br><small>Arquivo demonstrativo selecionado — não armazenado no protótipo.</small>`;
  }

  function valuesMarkup(record) {
    const balance = balanceOf(record);
    return `
      <div class="admin-pc__values">
        <div><span>Total de receitas</span><strong>${formatMoney(record.revenue)}</strong></div>
        <div><span>Total de despesas</span><strong>${formatMoney(record.expense)}</strong></div>
        <div class="admin-pc__values-balance admin-pc__money--${balance < 0 ? "negative" : "positive"}"><span>Saldo do período</span><strong>${formatMoney(balance)}</strong></div>
      </div>
    `;
  }

  function detailMarkup(record) {
    const actions = allowedActions(record).filter((action) => action !== "view");
    const segregationNote = perms()?.validate && record.status === STATUS.REVIEW && record.createdByProfile === currentProfile()
      ? '<p class="admin-docs__form-note">Este perfil preparou a prestação e, por segregação de funções, não pode validá-la.</p>' : "";

    return `
      ${drawerHeader(`PRESTAÇÃO · ${record.id}`, record.title)}

      <div class="admin-docs__drawer-status">
        <span>Situação</span>
        <strong>${statusBadge(record.status)}</strong>
      </div>

      ${valuesMarkup(record)}

      <dl class="admin-docs__details">
        <div><dt>Protocolo</dt><dd>${escapeHtml(record.id)}</dd></div>
        <div><dt>Competência</dt><dd>${escapeHtml(record.competence)} · ${escapeHtml(record.type)}</dd></div>
        <div><dt>Elaborada por</dt><dd>${escapeHtml(record.createdBy || "—")}</dd></div>
        <div><dt>Validada por</dt><dd>${escapeHtml(record.validatedBy || "—")}${record.validatedAt ? ` · ${formatDateTime(record.validatedAt)}` : ""}</dd></div>
        <div><dt>Criada em</dt><dd>${formatDateTime(record.createdAt)}</dd></div>
        <div><dt>Atualizada em</dt><dd>${formatDateTime(record.updatedAt)}</dd></div>
        <div><dt>Publicada em</dt><dd>${formatDateTime(record.publishedAt)}</dd></div>
        <div class="admin-docs__details-wide"><dt>Demonstrativo financeiro</dt><dd>${fileMarkup(record.statement)}</dd></div>
        <div class="admin-docs__details-wide"><dt>Documentos/comprovantes complementares</dt><dd>${record.attachments.length
          ? record.attachments.map(fileMarkup).join("<br>") : "Nenhum documento"}</dd></div>
      </dl>

      <section class="admin-docs__drawer-section"><h3>Resumo</h3><p>${escapeHtml(record.summary || "—")}</p></section>
      <section class="admin-docs__drawer-section"><h3>Observações</h3><p>${escapeHtml(record.notes || "—")}</p></section>

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

      ${segregationNote}
      ${record.status === STATUS.PUBLISHED ? '<p class="admin-docs__form-note">Prestação publicada: valores bloqueados para edição.</p>' : ""}
      ${record.status === STATUS.ARCHIVED ? '<p class="admin-docs__form-note">Prestação arquivada: não aparece mais na Área do Filiado.</p>' : ""}

      ${actions.length ? `
        <div class="admin-docs__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "return" || action === "archive" ? "button--secondary" : "button--primary"}"
              data-pc-action="${action}" data-id="${escapeHtml(record.id)}">
              ${ACTION_LABELS[action].toUpperCase()}
            </button>`).join("")}
        </div>` : ""}
    `;
  }

  function field(label, control) {
    return `<label class="admin-docs__field"><span>${label}</span>${control}</label>`;
  }

  function demoOptions(current, allowRemove) {
    return `
      <option value="">${current ? `Manter atual (${escapeHtml(current)})` : "Sem arquivo"}</option>
      ${allowRemove ? '<option value="none">Remover</option>' : ""}
      ${DEMO_FILES.map((f) => `<option value="${escapeHtml(f.href)}">Demonstrativo existente: ${escapeHtml(f.name)}</option>`).join("")}
    `;
  }

  function formMarkup(record = null) {
    const r = record || { type: "Mensal", revenue: "", expense: "", attachments: [] };
    const hint = COMPETENCE_RULES[r.type]?.hint || "";
    const currentAttachments = (r.attachments || []).map((f) => f.name).join(", ");

    return `
      ${drawerHeader(record ? `EDIÇÃO · ${record.id}` : "NOVO REGISTRO", record ? "Editar prestação" : "Nova prestação")}

      <form data-pc-form ${record ? `data-id="${escapeHtml(record.id)}"` : ""} novalidate>
        ${record ? field("Protocolo", `<input value="${escapeHtml(record.id)}" disabled>`) : ""}
        ${field("Título *", `<input name="title" required maxlength="160" value="${escapeHtml(r.title || "")}">`)}
        <div class="admin-docs__form-grid">
          ${field("Tipo *", `<select name="type" required data-pc-type>${optionList(TYPES, r.type)}</select>`)}
          ${field("Competência *", `<input name="competence" required maxlength="20" value="${escapeHtml(r.competence || "")}" placeholder="${escapeHtml(hint)}" data-pc-competence><small data-pc-competence-hint>Formato: ${escapeHtml(hint)}</small>`)}
        </div>
        <div class="admin-docs__form-grid admin-docs__form-grid--3">
          ${field("Total de receitas (R$) *", `<input name="revenue" required inputmode="decimal" placeholder="0,00" value="${escapeHtml(moneyInput(r.revenue))}" data-pc-money>`)}
          ${field("Total de despesas (R$) *", `<input name="expense" required inputmode="decimal" placeholder="0,00" value="${escapeHtml(moneyInput(r.expense))}" data-pc-money>`)}
          <div class="admin-docs__field"><span>Saldo do período</span><output class="admin-pc__balance-output" data-pc-balance aria-live="polite">—</output></div>
        </div>
        ${field("Resumo *", `<textarea name="summary" rows="3" required maxlength="800">${escapeHtml(r.summary || "")}</textarea>`)}
        ${field("Observações", `<textarea name="notes" rows="3" maxlength="2000">${escapeHtml(r.notes || "")}</textarea>`)}

        <fieldset class="admin-docs__field">
          <span>Demonstrativo financeiro (opcional)</span>
          <select name="statementChoice">${demoOptions(r.statement?.name, Boolean(r.statement))}</select>
          <input type="file" name="statementUpload" accept=".pdf,.xls,.xlsx,.ods,.csv,.html,application/pdf" data-pc-upload="statement" aria-label="Selecionar demonstrativo financeiro">
          <p class="admin-docs__file-info" data-pc-file-info="statement" role="status" aria-live="polite"></p>
        </fieldset>

        <fieldset class="admin-docs__field">
          <span>Documentos/comprovantes complementares (opcional)</span>
          <select name="attachmentsChoice">${demoOptions(currentAttachments, Boolean(currentAttachments))}</select>
          <input type="file" name="attachmentsUpload" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.ods,.doc,.docx,application/pdf" data-pc-upload="attachments" aria-label="Selecionar comprovantes complementares">
          <p class="admin-docs__file-info" data-pc-file-info="attachments" role="status" aria-live="polite"></p>
          <small>O conteúdo dos arquivos não é armazenado: registra-se apenas nome, tipo e tamanho. Na versão definitiva seriam enviados ao backend/storage.</small>
        </fieldset>

        <p class="admin-docs__form-error" data-pc-error role="alert" hidden></p>

        <p class="admin-docs__form-note">
          ${record ? `Situação atual: <strong>${escapeHtml(record.status)}</strong>.` : "A prestação será salva como <strong>Rascunho</strong>."}
          Após encaminhada, somente a Presidência poderá validá-la.
        </p>

        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-pc-close>CANCELAR</button>
          <button type="submit" class="button button--primary">SALVAR</button>
        </div>
      </form>
    `;
  }

  function confirmMarkup(record, action) {
    const texts = {
      forward: "A prestação será encaminhada para validação da Presidência e não poderá mais ser editada pela Tesouraria, salvo devolução.",
      return: "A prestação voltará para Rascunho para ajustes da Tesouraria. O motivo é obrigatório e ficará no histórico.",
      validate: "Confira os valores preparados pela Tesouraria. Ao confirmar, a prestação será validada pela Presidência e publicada na Área do Filiado. Os valores não podem ser alterados nesta etapa.",
      archive: "A prestação será arquivada e deixará de aparecer na Área do Filiado."
    };
    const required = action === "return";

    return `
      ${drawerHeader(`PRESTAÇÃO · ${record.id}`, ACTION_LABELS[action])}
      <p><strong>${escapeHtml(record.title)}</strong> · ${escapeHtml(record.competence)}</p>
      ${valuesMarkup(record)}
      <p>${texts[action]}</p>
      <form data-pc-confirm="${action}" data-id="${escapeHtml(record.id)}" novalidate>
        <label class="admin-docs__field">
          <span>${required ? "Motivo da devolução *" : "Observação para o histórico (opcional)"}</span>
          <textarea name="note" rows="3" maxlength="500"${required ? " required" : ""}></textarea>
        </label>
        <p class="admin-docs__form-error" data-pc-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-pc-back="${escapeHtml(record.id)}">VOLTAR</button>
          <button type="submit" class="button button--primary">${action === "validate" ? "CONFIRMAR: VALIDAR E PUBLICAR" : "CONFIRMAR"}</button>
        </div>
      </form>
    `;
  }

  /* ---------- Ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-pc-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function addHistory(record, action, note = "") {
    const at = nowIso();
    record.history.push(h(at, PROFILE_LABELS[currentProfile()], action, note));
    record.updatedAt = at;
    return at;
  }

  function demoFile(href) {
    const demo = DEMO_FILES.find((f) => f.href === href);
    return demo ? { name: demo.name, type: demo.type, size: 0, href: demo.href } : null;
  }

  function resolveStatement(form, current) {
    if (pendingStatement) return { ...pendingStatement };
    const choice = String(new FormData(form).get("statementChoice") || "");
    if (choice === "none") return null;
    return demoFile(choice) || current || null;
  }

  function resolveAttachments(form, current) {
    if (pendingAttachments) return pendingAttachments.map((f) => ({ ...f }));
    const choice = String(new FormData(form).get("attachmentsChoice") || "");
    if (choice === "none") return [];
    const demo = demoFile(choice);
    return demo ? [demo] : (current || []);
  }

  function updateBalancePreview(form) {
    const output = form.querySelector("[data-pc-balance]");
    if (!output) return;
    const revenue = parseMoney(form.elements.revenue.value);
    const expense = parseMoney(form.elements.expense.value);
    if (Number.isNaN(revenue) || Number.isNaN(expense)) {
      output.textContent = "—";
      output.className = "admin-pc__balance-output";
      return;
    }
    const balance = (toCents(revenue) - toCents(expense)) / 100;
    output.textContent = formatMoney(balance);
    output.className = `admin-pc__balance-output admin-pc__money--${balance < 0 ? "negative" : "positive"}`;
  }

  function saveForm(form) {
    const p = perms();
    const id = form.dataset.id || "";
    const existing = id ? recordById(id) : null;

    // Revalida perfil, permissão e situação no momento da ação.
    if (!p || !p.prepare || (id && (!existing || existing.status !== STATUS.DRAFT))) {
      showError(form, "O perfil atual não pode realizar esta ação ou a prestação não está mais em Rascunho.");
      return;
    }

    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? "").trim();
    const next = {
      title: value("title"),
      type: value("type"),
      competence: value("competence"),
      summary: value("summary"),
      notes: value("notes"),
      revenue: parseMoney(value("revenue")),
      expense: parseMoney(value("expense"))
    };

    if (!next.title || !next.summary) {
      showError(form, "Preencha título e resumo.");
      return;
    }
    const rule = COMPETENCE_RULES[next.type];
    if (!rule) {
      showError(form, "Selecione um tipo válido.");
      return;
    }
    const match = rule.pattern.exec(next.competence);
    if (!match) {
      showError(form, `Informe a competência no formato ${rule.hint}.`);
      return;
    }
    if (Number.isNaN(next.revenue) || Number.isNaN(next.expense)) {
      showError(form, "Informe receitas e despesas como valores monetários válidos (ex.: 12.345,67).");
      return;
    }
    next.year = match[match.length - 1];
    next.statement = resolveStatement(form, existing?.statement);
    next.attachments = resolveAttachments(form, existing?.attachments);

    const duplicated = records.some((item) => item.id !== id && item.type === next.type
      && item.competence === next.competence && item.status !== STATUS.ARCHIVED);
    if (duplicated) {
      showError(form, "Já existe uma prestação ativa deste tipo para a mesma competência.");
      return;
    }

    if (existing) {
      Object.assign(existing, next);
      addHistory(existing, "Prestação editada.");
    } else {
      const at = nowIso();
      const label = PROFILE_LABELS[currentProfile()];
      records.push({
        id: nextId(),
        ...next,
        status: STATUS.DRAFT,
        createdBy: label,
        createdByProfile: currentProfile(),
        createdAt: at,
        updatedAt: at,
        validatedBy: "", validatedAt: "", publishedAt: "",
        history: [h(at, label, "Prestação criada como Rascunho.")]
      });
    }

    records = deduplicate(records);
    saveRecords();
    renderModule();
  }

  const TRANSITIONS = {
    forward: { from: STATUS.DRAFT, to: STATUS.REVIEW, log: "Encaminhada para validação da Presidência." },
    return: { from: STATUS.REVIEW, to: STATUS.DRAFT, log: "Devolvida para ajustes." },
    validate: { from: STATUS.REVIEW, to: STATUS.PUBLISHED, log: "Validada e publicada para os filiados." },
    archive: { from: STATUS.PUBLISHED, to: STATUS.ARCHIVED, log: "Arquivada." }
  };

  function applyTransition(form) {
    // Relê dados persistidos e o perfil ativo antes de qualquer transição.
    records = deduplicate(loadRecords());
    const action = form.dataset.pcConfirm;
    const record = recordById(form.dataset.id);
    const transition = TRANSITIONS[action];
    const note = String(new FormData(form).get("note") || "").trim();
    const profile = currentProfile();

    if (!record || !transition || transition.from !== record.status || !allowedActions(record).includes(action)) {
      showError(form, "Esta ação não está disponível para o perfil ou a situação atual.");
      return;
    }
    // Defesa adicional: somente a Presidência valida, e nunca o próprio preparador.
    if (action === "validate" && (profile !== "presidencia" || record.createdByProfile === profile)) {
      showError(form, "Somente a Presidência pode validar e publicar, e quem preparou não pode validar.");
      return;
    }
    if (action === "return" && !note) {
      showError(form, "Informe o motivo da devolução.");
      return;
    }

    record.status = transition.to;
    const at = addHistory(record, transition.log, note);
    if (action === "validate") {
      record.validatedBy = PROFILE_LABELS[profile];
      record.validatedAt = at;
      record.publishedAt = at;
    }
    saveRecords();
    renderModule();
  }

  function handleAction(action, id) {
    if (action === "new") {
      if (perms()?.prepare) {
        openDrawer(formMarkup());
        updateBalancePreview(document.querySelector("[data-pc-form]"));
      }
      return;
    }

    const record = recordById(id);
    if (!record || !allowedActions(record).includes(action)) {
      renderModule();
      return;
    }

    if (action === "view") openDrawer(detailMarkup(record));
    else if (action === "edit") {
      openDrawer(formMarkup(record));
      updateBalancePreview(document.querySelector("[data-pc-form]"));
    } else openDrawer(confirmMarkup(record, action));
  }

  function handleUpload(input) {
    const kind = input.dataset.pcUpload;
    const files = [...(input.files || [])];
    const info = input.closest("form")?.querySelector(`[data-pc-file-info="${kind}"]`);
    // Apenas metadados: o conteúdo não é lido nem gravado (sem base64).
    const meta = files.map((file) => ({ name: file.name, type: file.type || "não informado", size: file.size, demo: true }));

    if (kind === "statement") pendingStatement = meta[0] || null;
    else pendingAttachments = meta.length ? meta : null;

    if (info) {
      info.textContent = meta.length
        ? `Selecionado(s): ${meta.map((f) => `${f.name} (${formatSize(f.size)})`).join(", ")}`
        : "";
    }
  }

  function bindEvents(container) {
    if (container.dataset.pcEventsBound === "true") return;
    container.dataset.pcEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-pc-search]")) filterRows();
      else if (event.target.matches("[data-pc-money]")) updateBalancePreview(event.target.form);
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-pc-filter]")) filterRows();
      else if (event.target.matches("[data-pc-upload]")) handleUpload(event.target);
      else if (event.target.matches("[data-pc-type]")) {
        const hint = COMPETENCE_RULES[event.target.value]?.hint || "";
        const form = event.target.form;
        form.querySelector("[data-pc-competence]").placeholder = hint;
        form.querySelector("[data-pc-competence-hint]").textContent = `Formato: ${hint}`;
      }
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-pc-overlay]");
      if (!target) return;

      if (target.matches("[data-pc-close], [data-pc-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-pc-new]")) {
        handleAction("new");
      } else if (target.matches("[data-pc-back]")) {
        const record = recordById(target.dataset.pcBack);
        if (record) document.querySelector("[data-pc-drawer]").innerHTML = detailMarkup(record);
        else closeDrawer();
      } else if (target.matches("[data-pc-action]")) {
        handleAction(target.dataset.pcAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-pc-form]")) {
        event.preventDefault();
        saveForm(event.target);
      } else if (event.target.matches("[data-pc-confirm]")) {
        event.preventDefault();
        applyTransition(event.target);
      }
    });
  }

  function init() {
    if (!document.querySelector("[data-admin-content]")) return;

    renderModule();

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
