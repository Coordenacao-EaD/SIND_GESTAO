// T36 — Relatórios administrativos (protótipo demonstrativo).
// Consolida SOMENTE os dados já mantidos pelos módulos validados (T28–T33); não existe
// base própria de relatórios. Chaves lidas (somente leitura):
//   sessionStorage  sindGestao.affiliatesDemo     (T28 Filiados)
//   sessionStorage  sindGestao.assembliesDemo     (T30 Assembleias e Reuniões)
//   sessionStorage  sindGestao.documentsDemo      (T31 Atas e Documentos)
//   sessionStorage  sindGestao.notificationsDemo  (T29 Notificações)
//   localStorage    sindGestao.requestsDemo       (T33 Solicitações, via window.SindGestaoSolicitacoes)
//   localStorage    sindGestao.financeDemo        (T32 Prestação de Contas)
// Acesso: permissão "reports" + permissão funcional de cada seção (reports + módulo).
// Denúncias/manifestações dos Conselhos (sindGestao.manifestationsDemo) NUNCA são lidas,
// e documentos de escopo dos Conselhos são descartados antes de qualquer agregação.
(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE = "administrador";
  const PAGE_FILE = "admin-relatorios.html";

  const CONFIDENTIAL_SCOPES = ["Conselho de Ética", "Conselho Fiscal"];

  // Escopo de relatório mais restrito que a permissão funcional: a Tesouraria possui
  // "documents"/"requests" apenas para itens financeiros encaminhados a ela (T31/T33),
  // o que não a autoriza a consultar relatórios gerais desses módulos.
  const REPORT_SCOPE_RESTRICTIONS = Object.freeze({
    tesouraria: ["financeiro"]
  });

  // Espelho das regras de visibilidade já validadas em cada módulo.
  const DOC_SCOPES_BY_PROFILE = Object.freeze({
    administrador: ["Público", "Filiados", "Diretoria", "Financeiro"],
    presidencia: ["Público", "Filiados", "Diretoria", "Financeiro"],
    diretoria: ["Público", "Filiados", "Diretoria"],
    secretaria: ["Público", "Filiados", "Diretoria"]
  });
  const REQUEST_AREA_SCOPE = Object.freeze({ diretoria: "Diretoria", tesouraria: "Tesouraria" });
  const FINANCE_OVERSIGHT_ONLY = ["diretoria"]; // T32: Diretoria não consulta Rascunhos.

  const UNAVAILABLE = "Não disponível no protótipo";

  /* ---------- Fontes de dados (bases reais dos módulos) ---------- */

  function readJson(storageName, key) {
    try {
      const storage = window[storageName];
      const raw = storage && storage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object") : null;
    } catch {
      return null;
    }
  }

  function readRequests() {
    const api = window.SindGestaoSolicitacoes;
    if (api && typeof api.lerTodas === "function") return api.lerTodas();
    return readJson("localStorage", "sindGestao.requestsDemo");
  }

  const datePart = (value) => {
    const text = String(value || "");
    const iso = /^(\d{4}-\d{2}-\d{2})/.exec(text);
    if (iso) return iso[1];
    const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
    return br ? `${br[3]}-${br[2]}-${br[1]}` : "";
  };

  /*
   * Definição das seções. Cada seção declara: permissão funcional, fonte, módulo de origem,
   * filtros aplicáveis, acessores e agrupamentos. "scopeFilter" aplica o mesmo recorte de
   * visibilidade do módulo de origem para o perfil.
   */
  const SECTIONS = [
    {
      id: "filiados",
      label: "Filiados",
      permission: "affiliates",
      source: { storage: "sessionStorage", key: "sindGestao.affiliatesDemo", module: "admin-filiados.html", moduleLabel: "Filiados" },
      read: () => readJson("sessionStorage", "sindGestao.affiliatesDemo"),
      filters: ["unit", "role", "status"],
      status: (r) => r.status,
      fields: { unit: (r) => r.unit, role: (r) => r.role },
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por unidade de lotação", by: (r) => r.unit },
        { label: "Por cargo", by: (r) => r.role }
      ],
      cards: (rows) => [
        ["Total de filiados", rows.length],
        ["Ativos", rows.filter((r) => r.status === "Ativo").length],
        ["Por município", UNAVAILABLE]
      ],
      notes: ["Município e categoria não fazem parte do cadastro demonstrativo de Filiados; os agrupamentos usam unidade de lotação e cargo."]
    },
    {
      id: "assembleias",
      label: "Assembleias e Reuniões",
      permission: "assemblies",
      source: { storage: "sessionStorage", key: "sindGestao.assembliesDemo", module: "admin-assembleias.html", moduleLabel: "Assembleias e Reuniões" },
      read: () => readJson("sessionStorage", "sindGestao.assembliesDemo"),
      filters: ["period", "category", "status"],
      categoryLabel: "Tipo",
      status: (r) => r.status,
      category: (r) => r.type,
      date: (r) => datePart(r.date),
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por tipo", by: (r) => r.type },
        { label: "Por modalidade", by: (r) => r.modality }
      ],
      cards: (rows) => [
        ["Total", rows.length],
        ["Agendadas", rows.filter((r) => r.status === "Agendada").length],
        ["Encerradas", rows.filter((r) => r.status === "Encerrada").length],
        ["Presença", UNAVAILABLE]
      ],
      notes: ["O módulo de Assembleias não registra presença; o indicador não é calculado."]
    },
    {
      id: "documentos",
      label: "Documentos",
      permission: "documents",
      source: { storage: "sessionStorage", key: "sindGestao.documentsDemo", module: "admin-documentos.html#documentos", moduleLabel: "Atas e Documentos" },
      read: () => readJson("sessionStorage", "sindGestao.documentsDemo"),
      scopeFilter: (rows, profile) => {
        const allowed = DOC_SCOPES_BY_PROFILE[profile] || [];
        return rows.filter((r) => !CONFIDENTIAL_SCOPES.includes(r.scope)
          && !CONFIDENTIAL_SCOPES.includes(r.category)
          && allowed.includes(r.scope));
      },
      filters: ["period", "category", "status"],
      categoryLabel: "Categoria",
      status: (r) => r.status,
      category: (r) => r.category,
      date: (r) => datePart(r.date || r.createdAt),
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por categoria", by: (r) => r.category },
        { label: "Por visibilidade", by: (r) => r.scope },
        { label: "Por tipo de registro", by: (r) => (r.kind === "atas" ? "Ata" : "Documento") }
      ],
      cards: (rows) => [
        ["Total", rows.length],
        ["Publicados", rows.filter((r) => r.status === "Publicado").length],
        ["Em revisão", rows.filter((r) => r.status === "Em revisão").length],
        ["Arquivados", rows.filter((r) => r.status === "Arquivado").length]
      ],
      notes: ["Documentos de escopo dos Conselhos de Ética e Fiscal são excluídos deste relatório."]
    },
    {
      id: "notificacoes",
      label: "Notificações",
      permission: "notifications",
      source: { storage: "sessionStorage", key: "sindGestao.notificationsDemo", module: "admin-notificacoes.html", moduleLabel: "Notificações" },
      read: () => readJson("sessionStorage", "sindGestao.notificationsDemo"),
      filters: ["period", "category", "status"],
      categoryLabel: "Categoria",
      status: (r) => r.status,
      category: (r) => r.category,
      date: (r) => datePart(r.createdAtISO || r.createdAt),
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por categoria", by: (r) => r.category },
        { label: "Por público", by: (r) => r.audience }
      ],
      cards: (rows) => [
        ["Total", rows.length],
        ["Enviadas", rows.filter((r) => r.status === "Enviada").length],
        ["Aguardando envio", rows.filter((r) => r.status === "Aguardando envio").length],
        ["Rascunhos", rows.filter((r) => r.status === "Rascunho").length]
      ]
    },
    {
      id: "solicitacoes",
      label: "Solicitações dos Filiados",
      permission: "requests",
      source: { storage: "localStorage", key: "sindGestao.requestsDemo", module: "admin-solicitacoes.html", moduleLabel: "Solicitações dos Filiados" },
      read: readRequests,
      scopeFilter: (rows, profile) => {
        const area = REQUEST_AREA_SCOPE[profile];
        return area ? rows.filter((r) => r.areaResponsavel === area) : rows;
      },
      filters: ["period", "category", "status"],
      categoryLabel: "Categoria",
      status: (r) => r.status,
      category: (r) => r.categoria,
      date: (r) => datePart(r.data),
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por área responsável", by: (r) => r.areaResponsavel },
        { label: "Por categoria", by: (r) => r.categoria }
      ],
      cards: (rows) => [
        ["Total", rows.length],
        ["Recebidas", rows.filter((r) => r.status === "Recebida").length],
        ["Em análise", rows.filter((r) => r.status === "Em análise").length],
        ["Respondidas", rows.filter((r) => r.status === "Respondida").length],
        ["Finalizadas", rows.filter((r) => r.status === "Finalizada").length]
      ],
      notes: ["Denúncias e manifestações dos Conselhos seguem fluxo próprio e não integram este relatório."]
    },
    {
      id: "financeiro",
      label: "Financeiro / Prestação de Contas",
      permission: "finance",
      source: { storage: "localStorage", key: "sindGestao.financeDemo", module: "admin-prestacao-contas.html", moduleLabel: "Prestação de Contas" },
      read: () => readJson("localStorage", "sindGestao.financeDemo"),
      scopeFilter: (rows, profile) => (FINANCE_OVERSIGHT_ONLY.includes(profile)
        ? rows.filter((r) => r.status !== "Rascunho")
        : rows),
      filters: ["period", "category", "status"],
      categoryLabel: "Tipo",
      status: (r) => r.status,
      category: (r) => r.type,
      date: (r) => datePart(r.createdAt),
      money: true,
      groups: [
        { label: "Por situação", by: (r) => r.status },
        { label: "Por tipo", by: (r) => r.type }
      ],
      cards: (rows) => {
        const sum = (field) => rows.reduce((total, r) => total + (Number(r[field]) || 0), 0);
        return [
          ["Prestações", rows.length],
          ["Publicadas", rows.filter((r) => r.status === "Publicada").length],
          ["Aguardando validação", rows.filter((r) => r.status === "Aguardando validação").length],
          ["Receitas (soma)", formatMoney(sum("revenue"))],
          ["Despesas (soma)", formatMoney(sum("expense"))]
        ];
      },
      notes: ["Valores fictícios registrados pela Tesouraria no módulo de Prestação de Contas."]
    }
  ];

  /* ---------- Regras de acesso ---------- */

  function perfis() {
    return window.SindGestaoAdminPerfis || null;
  }

  function currentProfile() {
    const api = perfis();
    if (api) return api.current();
    try {
      return window.localStorage.getItem(PROFILE_KEY) || DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  function canOpenModule(profile) {
    const api = perfis();
    return Boolean(api && !api.isCouncil(profile) && api.hasPermission(profile, "reports"));
  }

  function allowedSections(profile) {
    if (!canOpenModule(profile)) return [];
    const restriction = REPORT_SCOPE_RESTRICTIONS[profile];
    return SECTIONS.filter((section) => perfis().hasPermission(profile, section.permission)
      && (!restriction || restriction.includes(section.id)));
  }

  /* ---------- Consolidação ---------- */

  // Retorna { available, rows } já recortado pelo escopo do perfil; nunca inventa dados.
  function sectionRows(section, profile) {
    if (!allowedSections(profile).includes(section)) return { available: false, denied: true, rows: [] };
    const raw = section.read();
    if (!Array.isArray(raw)) return { available: false, rows: [] };
    const rows = section.scopeFilter ? section.scopeFilter(raw, profile) : raw;
    return { available: true, rows };
  }

  function applyFilters(section, rows, filters) {
    const f = filters || {};
    return rows.filter((r) => {
      if (f.status && section.status(r) !== f.status) return false;
      if (f.category && section.category && section.category(r) !== f.category) return false;
      if (f.unit && section.fields && section.fields.unit(r) !== f.unit) return false;
      if (f.role && section.fields && section.fields.role(r) !== f.role) return false;
      if ((f.from || f.to) && section.date) {
        const d = section.date(r);
        if (!d) return false;
        if (f.from && d < f.from) return false;
        if (f.to && d > f.to) return false;
      }
      return true;
    });
  }

  function groupCount(rows, by, money) {
    const map = new Map();
    rows.forEach((r) => {
      const key = String(by(r) || "Não informado");
      const entry = map.get(key) || { label: key, count: 0, revenue: 0, expense: 0 };
      entry.count += 1;
      if (money) {
        entry.revenue += Number(r.revenue) || 0;
        entry.expense += Number(r.expense) || 0;
      }
      map.set(key, entry);
    });
    return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  }

  function buildReport(sectionId, profile, filters) {
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section) return null;
    const base = sectionRows(section, profile);
    if (base.denied) return { section, denied: true };
    if (!base.available) return { section, available: false };
    const rows = applyFilters(section, base.rows, filters);
    return {
      section,
      available: true,
      total: base.rows.length,
      rows,
      cards: section.cards(rows),
      groups: section.groups.map((g) => ({ label: g.label, items: groupCount(rows, g.by, section.money) })),
      options: {
        status: distinct(base.rows, section.status),
        category: section.category ? distinct(base.rows, section.category) : [],
        unit: section.fields ? distinct(base.rows, section.fields.unit) : [],
        role: section.fields ? distinct(base.rows, section.fields.role) : []
      }
    };
  }

  function distinct(rows, accessor) {
    return [...new Set(rows.map(accessor).filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  /* ---------- Utilidades ---------- */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatMoney(value) {
    try {
      return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch {
      return `R$ ${Number(value).toFixed(2)}`;
    }
  }

  function optionList(values, selected, allLabel) {
    return `<option value="">${escapeHtml(allLabel)}</option>` + values.map((value) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`
    ).join("");
  }

  /* ---------- Estado da página ---------- */

  const state = { section: "", filters: {} };

  function markNavigation() {
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === PAGE_FILE;
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderDenied(container, message) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Relatórios</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function filtersMarkup(report) {
    const { section, options } = report;
    const f = state.filters;
    const parts = [];
    if (section.filters.includes("period")) {
      parts.push(`<label><span>Período — de</span><input type="date" data-rep-filter="from" value="${escapeHtml(f.from || "")}"></label>`);
      parts.push(`<label><span>Período — até</span><input type="date" data-rep-filter="to" value="${escapeHtml(f.to || "")}"></label>`);
    }
    if (section.filters.includes("unit")) {
      parts.push(`<label><span>Unidade de lotação</span><select data-rep-filter="unit">${optionList(options.unit, f.unit, "Todas")}</select></label>`);
      parts.push(`<label><span>Município</span><select disabled aria-describedby="rep-municipio-nota"><option>${UNAVAILABLE}</option></select><small id="rep-municipio-nota" class="admin-rep__hint">Campo inexistente no cadastro demonstrativo.</small></label>`);
    }
    if (section.filters.includes("role")) {
      parts.push(`<label><span>Cargo</span><select data-rep-filter="role">${optionList(options.role, f.role, "Todos")}</select></label>`);
    }
    if (section.filters.includes("category")) {
      parts.push(`<label><span>${escapeHtml(section.categoryLabel || "Categoria")}</span><select data-rep-filter="category">${optionList(options.category, f.category, "Todas")}</select></label>`);
    }
    if (section.filters.includes("status")) {
      parts.push(`<label><span>Situação</span><select data-rep-filter="status">${optionList(options.status, f.status, "Todas")}</select></label>`);
    }
    return parts.join("");
  }

  function groupTable(group, report) {
    const money = report.section.money;
    const total = report.rows.length || 1;
    const body = group.items.length
      ? group.items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        return `
          <tr>
            <th scope="row">${escapeHtml(item.label)}</th>
            <td>${item.count}</td>
            <td><span class="admin-rep__bar" aria-hidden="true"><span style="width:${pct}%"></span></span> ${pct}%</td>
            ${money ? `<td>${formatMoney(item.revenue)}</td><td>${formatMoney(item.expense)}</td>` : ""}
          </tr>`;
      }).join("")
      : `<tr><td colspan="${money ? 5 : 3}" class="admin-docs__empty">Nenhum registro para os filtros selecionados.</td></tr>`;

    return `
      <div class="admin-docs__table-wrap admin-rep__group">
        <table class="admin-docs__table admin-rep__table">
          <caption>${escapeHtml(group.label)}</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Quantidade</th>
              <th scope="col">Percentual</th>
              ${money ? '<th scope="col">Receitas</th><th scope="col">Despesas</th>' : ""}
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }

  function reportBody(report) {
    const { section } = report;
    if (!report.available) {
      return `
        <div class="admin-docs__alert" role="status">
          <strong>Base demonstrativa ainda não carregada neste navegador.</strong>
          <span>O relatório lê a base do módulo ${escapeHtml(section.source.moduleLabel)} (${escapeHtml(section.source.storage)} “${escapeHtml(section.source.key)}”).
          Abra <a href="${escapeHtml(section.source.module)}">${escapeHtml(section.source.moduleLabel)}</a> para inicializá-la e retorne a esta página. Nenhum dado é inventado pelo relatório.</span>
        </div>`;
    }

    const cards = report.cards.map(([label, value]) =>
      `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
    const notes = (section.notes || []).map((n) => `<li>${escapeHtml(n)}</li>`).join("");

    return `
      <div class="admin-docs__filters admin-rep__filters" role="search" aria-label="Filtros do relatório">
        ${filtersMarkup(report)}
        <div class="admin-rep__filter-actions">
          <button type="button" class="button button--secondary" data-rep-clear>Limpar filtros</button>
        </div>
      </div>
      <p class="admin-docs__count" role="status" aria-live="polite">
        ${report.rows.length} de ${report.total} ${report.total === 1 ? "registro considerado" : "registros considerados"} —
        fonte: ${escapeHtml(section.source.storage)} “${escapeHtml(section.source.key)}”.
      </p>
      <div class="admin-docs__stats admin-rep__stats">${cards}</div>
      <div class="admin-rep__groups">${report.groups.map((g) => groupTable(g, report)).join("")}</div>
      ${notes ? `<ul class="admin-rep__notes">${notes}</ul>` : ""}`;
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;
    markNavigation();

    const profile = currentProfile();
    const label = perfis() ? perfis().label(profile) : profile;

    if (!perfis()) {
      renderDenied(container, "Matriz de perfis indisponível.");
      return;
    }
    if (!canOpenModule(profile)) {
      renderDenied(container, perfis().isCouncil(profile)
        ? `O perfil ${label} não acessa os Relatórios administrativos gerais. As informações dos Conselhos permanecem restritas ao respectivo módulo.`
        : `O perfil ${label} não possui a permissão de Relatórios.`);
      return;
    }

    const sections = allowedSections(profile);
    if (!sections.length) {
      renderDenied(container, `O perfil ${label} não possui permissão funcional para nenhuma seção de relatório.`);
      return;
    }
    if (!sections.some((s) => s.id === state.section)) {
      state.section = sections[0].id;
      state.filters = {};
    }

    const report = buildReport(state.section, profile, state.filters);
    const tabs = sections.map((s) => `
      <option value="${s.id}"${s.id === state.section ? " selected" : ""}>${escapeHtml(s.label)}</option>`).join("");

    container.innerHTML = `
      <p class="admin-docs__notice">
        Relatórios demonstrativos calculados a partir das bases fictícias dos módulos administrativos, mantidas apenas neste navegador.
      </p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">CONSULTAS ADMINISTRATIVAS</span>
          <h1 id="admin-content-title">RELATÓRIOS</h1>
          <p>Consolidação dos dados dos módulos aos quais este perfil já tem acesso. Cada seção exige a permissão de Relatórios e a permissão do módulo correspondente.</p>
        </div>
        <div class="admin-docs__header-actions admin-rep__actions">
          <span class="admin-docs__profile">${escapeHtml(label)}</span>
          <button type="button" class="button button--secondary" data-rep-csv${report.available ? "" : " disabled"}>Exportar CSV</button>
          <button type="button" class="button button--primary" data-rep-print>Imprimir / Salvar em PDF</button>
        </div>
      </header>

      <section class="admin-docs__panel admin-rep__panel" aria-labelledby="rep-titulo">
        <div class="admin-rep__selector">
          <label for="rep-tipo"><span>Tipo de relatório</span></label>
          <select id="rep-tipo" data-rep-section>${tabs}</select>
          <h2 id="rep-titulo" class="admin-rep__title">${escapeHtml(report.section.label)}</h2>
          <p class="admin-rep__emitted">Emitido em ${escapeHtml(new Date().toLocaleString("pt-BR"))} — perfil ${escapeHtml(label)}.</p>
        </div>
        ${reportBody(report)}
      </section>
    `;
  }

  function exportCsv() {
    const profile = currentProfile();
    const report = buildReport(state.section, profile, state.filters);
    if (!report || !report.available) return;
    const quote = (v) => `"${String(v).replaceAll('"', '""')}"`;
    const lines = [[quote("Relatório"), quote(report.section.label)].join(";")];
    report.cards.forEach(([l, v]) => lines.push([quote(l), quote(v)].join(";")));
    report.groups.forEach((g) => {
      lines.push("");
      lines.push([quote(g.label), quote("Quantidade")].concat(report.section.money ? [quote("Receitas"), quote("Despesas")] : []).join(";"));
      g.items.forEach((i) => lines.push([quote(i.label), i.count].concat(report.section.money ? [i.revenue.toFixed(2), i.expense.toFixed(2)] : []).join(";")));
    });
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${report.section.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function bindEvents() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    container.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches("[data-rep-section]")) {
        state.section = target.value;
        state.filters = {};
        renderModule();
        container.querySelector("[data-rep-section]")?.focus();
        return;
      }
      if (target.matches("[data-rep-filter]")) {
        state.filters[target.dataset.repFilter] = target.value;
        renderModule();
        container.querySelector(`[data-rep-filter="${target.dataset.repFilter}"]`)?.focus();
      }
    });

    container.addEventListener("click", (event) => {
      if (event.target.closest("[data-rep-clear]")) {
        state.filters = {};
        renderModule();
        container.querySelector("[data-rep-clear]")?.focus();
      } else if (event.target.closest("[data-rep-print]")) {
        window.print();
      } else if (event.target.closest("[data-rep-csv]")) {
        exportCsv();
      }
    });

    // Troca de perfil: nenhuma permissão do perfil anterior é mantida.
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-admin-profile-select]")) window.setTimeout(renderModule, 0);
    });
  }

  // API somente leitura para validação automatizada (sem acesso a DOM).
  window.SindGestaoRelatorios = Object.freeze({
    SECTION_IDS: SECTIONS.map((s) => s.id),
    canOpenModule,
    allowedSectionIds: (profile) => allowedSections(profile).map((s) => s.id),
    buildReport: (sectionId, profile, filters) => {
      const report = buildReport(sectionId, profile, filters);
      if (!report) return null;
      const { section, ...rest } = report;
      return { id: section.id, ...rest };
    }
  });

  function init() {
    if (!document.querySelector("[data-admin-content]")) return;
    renderModule();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
