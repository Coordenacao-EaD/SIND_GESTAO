// T30 — Assembleias e Reuniões (protótipo demonstrativo).
// Sem banco/API: o estado vive apenas em sessionStorage.
(() => {
  "use strict";

  // Mesma fonte de verdade de perfil utilizada por area-admin.js.
  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE = "administrador";
  const STORAGE_KEY = "sindGestao.assembliesDemo";
  const PAGE_FILE = "admin-assembleias.html";

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
    PENDING: "Aguardando autorização",
    SCHEDULED: "Agendada",
    CLOSED: "Encerrada",
    CANCELED: "Cancelada"
  });

  const TYPES = ["Assembleia", "Reunião"];
  const MODALITIES = ["Presencial", "Online", "Híbrida"];
  const AUDIENCES = ["Filiados", "Diretoria", "Todos os usuários internos"];

  // Campos que a Secretaria pode ajustar depois do encaminhamento.
  const OPERATIONAL_FIELDS = ["date", "time", "modality", "location", "accessLink", "notes", "document"];

  /*
   * Matriz de permissões do módulo.
   * edit: "all" = qualquer situação não final; "draft" = apenas Rascunho;
   *       "operational" = Rascunho completo e, depois, só campos operacionais.
   */
  const PERMISSIONS = Object.freeze({
    administrador: { create: true, edit: "all", forward: true, schedule: true, cancel: true, close: true, history: true },
    presidencia: { create: true, edit: "all", forward: false, schedule: true, cancel: true, close: true, history: true },
    diretoria: { create: true, edit: "draft", forward: true, schedule: false, cancel: false, close: false, history: true },
    secretaria: { create: true, edit: "operational", forward: true, schedule: false, cancel: false, close: false, history: true }
  });

  const DEFAULT_RECORDS = [
    {
      id: "ASM-0001",
      type: "Reunião",
      title: "Reunião de planejamento — rascunho demonstrativo",
      date: "2026-12-03",
      time: "10:00",
      modality: "Online",
      location: "",
      accessLink: "https://exemplo.invalid/reuniao-demonstrativa",
      audience: "Diretoria",
      agenda: "Planejamento demonstrativo das atividades do próximo semestre.",
      notes: "Registro fictício para demonstrar a etapa de rascunho.",
      document: "",
      status: STATUS.DRAFT,
      author: "Secretaria",
      createdAt: "2026-11-02T09:00:00",
      updatedAt: "2026-11-02T09:00:00",
      history: [
        { at: "2026-11-02T09:00:00", profile: "Secretaria", action: "Registro criado como Rascunho." }
      ]
    },
    {
      id: "ASM-0002",
      type: "Assembleia",
      title: "Assembleia Extraordinária Demonstrativa",
      date: "2026-12-10",
      time: "14:00",
      modality: "Híbrida",
      location: "Auditório demonstrativo, sem endereço real.",
      accessLink: "https://exemplo.invalid/assembleia-extraordinaria",
      audience: "Filiados",
      agenda: "Pauta fictícia: informes e deliberação demonstrativa.",
      notes: "Aguardando autorização da Presidência.",
      document: "filiado-documentos.html#pauta-assembleia",
      status: STATUS.PENDING,
      author: "Diretoria",
      createdAt: "2026-11-01T15:30:00",
      updatedAt: "2026-11-03T11:00:00",
      history: [
        { at: "2026-11-01T15:30:00", profile: "Diretoria", action: "Registro criado como Rascunho." },
        { at: "2026-11-03T11:00:00", profile: "Diretoria", action: "Encaminhado para autorização." }
      ]
    },
    {
      id: "ASM-0003",
      type: "Assembleia",
      title: "Assembleia Ordinária Demonstrativa de Novembro",
      date: "2026-11-26",
      time: "14:00",
      modality: "Presencial",
      location: "Sede demonstrativa, sem endereço real.",
      accessLink: "",
      audience: "Filiados",
      agenda: "Prestação de informes demonstrativos e escuta dos filiados.",
      notes: "",
      document: "filiado-documentos.html",
      status: STATUS.SCHEDULED,
      author: "Secretaria",
      createdAt: "2026-10-20T10:00:00",
      updatedAt: "2026-10-25T16:00:00",
      history: [
        { at: "2026-10-20T10:00:00", profile: "Secretaria", action: "Registro criado como Rascunho." },
        { at: "2026-10-22T09:00:00", profile: "Secretaria", action: "Encaminhado para autorização." },
        { at: "2026-10-25T16:00:00", profile: "Presidência", action: "Autorizado e agendado." }
      ]
    },
    {
      id: "ASM-0004",
      type: "Reunião",
      title: "Reunião Demonstrativa com Filiados — Outubro",
      date: "2026-10-15",
      time: "09:00",
      modality: "Online",
      location: "",
      accessLink: "https://exemplo.invalid/reuniao-outubro",
      audience: "Filiados",
      agenda: "Canais de atendimento demonstrativos e encaminhamentos.",
      notes: "Encerrada. A ata será tratada no módulo de Atas.",
      document: "",
      status: STATUS.CLOSED,
      author: "Diretoria",
      createdAt: "2026-09-28T08:00:00",
      updatedAt: "2026-10-15T11:30:00",
      history: [
        { at: "2026-09-28T08:00:00", profile: "Diretoria", action: "Registro criado como Rascunho." },
        { at: "2026-09-29T10:00:00", profile: "Diretoria", action: "Encaminhado para autorização." },
        { at: "2026-10-01T14:00:00", profile: "Presidência", action: "Autorizado e agendado." },
        { at: "2026-10-15T11:30:00", profile: "Presidência", action: "Encerrado." }
      ]
    }
  ];

  let records = deduplicate(loadRecords());
  let lastFocused = null;

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

  function perms() {
    return PERMISSIONS[currentProfile()] || null;
  }

  function isFinal(record) {
    return record.status === STATUS.CLOSED || record.status === STATUS.CANCELED;
  }

  function canEdit(record) {
    const p = perms();
    if (!p || isFinal(record)) return false;
    if (p.edit === "all") return true;
    if (p.edit === "draft") return record.status === STATUS.DRAFT;
    if (p.edit === "operational") return true;
    return false;
  }

  // Indica se o perfil atual só pode alterar campos operacionais neste registro.
  function isOperationalOnly(record) {
    const p = perms();
    return Boolean(p && p.edit === "operational" && record && record.status !== STATUS.DRAFT);
  }

  function allowedActions(record) {
    const p = perms();
    if (!p) return [];

    const actions = ["view"];
    if (canEdit(record)) actions.push("edit");
    if (p.forward && record.status === STATUS.DRAFT) actions.push("forward");
    if (p.schedule && record.status === STATUS.PENDING) actions.push("schedule");
    if (p.close && record.status === STATUS.SCHEDULED) actions.push("close");
    if (p.cancel && !isFinal(record)) actions.push("cancel");
    return actions;
  }

  /* ---------- Armazenamento ---------- */

  function cloneDefaults() {
    return DEFAULT_RECORDS.map((item) => ({ ...item, history: item.history.map((h) => ({ ...h })) }));
  }

  function loadRecords() {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object" && item.id);
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
    const signatures = new Set();

    return items.filter((item) => {
      const signature = [item.type, item.title, item.date, item.time, item.createdAt]
        .map((value) => String(value || "").trim().toLowerCase())
        .join("|");

      if (ids.has(item.id) || signatures.has(signature)) return false;

      ids.add(item.id);
      signatures.add(signature);
      if (!Array.isArray(item.history)) item.history = [];
      return true;
    });
  }

  function nextId() {
    const max = records.reduce((acc, item) => {
      const number = Number(String(item.id).replace(/\D/g, ""));
      return Number.isFinite(number) && number > acc ? number : acc;
    }, 0);
    return `ASM-${String(max + 1).padStart(4, "0")}`;
  }

  function recordById(id) {
    return records.find((item) => item.id === id);
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

  function slug(value) {
    return String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  // Documento relacionado: apenas referência interna demonstrativa (sem esquema/protocolo).
  function isSafeInternalRef(value) {
    return value === "" || (/^[\w\-./#?=&]+$/.test(value) && !value.includes("..") && !value.startsWith("//"));
  }

  function isSafeLink(value) {
    return value === "" || /^https:\/\/[^\s<>"']+$/i.test(value);
  }

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>',
      forward: '<path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path>',
      schedule: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path><path d="m9 16 2 2 4-4"></path>',
      close: '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M9 9h6v6H9z"></path>',
      cancel: '<circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6M9 9l6 6"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  const ACTION_META = {
    view: { label: "Visualizar" },
    edit: { label: "Editar" },
    forward: { label: "Encaminhar para autorização" },
    schedule: { label: "Autorizar e agendar" },
    close: { label: "Encerrar" },
    cancel: { label: "Cancelar" }
  };

  /* ---------- Renderização ---------- */

  function roleDescription() {
    switch (currentProfile()) {
      case "presidencia":
        return ["Autorização e agenda", "A Presidência cria, edita, autoriza/agenda, cancela e encerra assembleias e reuniões."];
      case "diretoria":
        return ["Elaboração", "A Diretoria cria registros, edita enquanto Rascunho e encaminha para autorização da Presidência."];
      case "secretaria":
        return ["Organização da agenda", "A Secretaria cria registros, ajusta informações operacionais e encaminha para autorização."];
      default:
        return ["Administração técnica", "O Administrador Geral possui acesso global ao fluxo, incluindo autorização, cancelamento e encerramento."];
    }
  }

  function renderDenied(container) {
    container.innerHTML = `
      <div class="admin-assemblies__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Assembleias e Reuniões</h1>
        <p>O perfil ${escapeHtml(PROFILE_LABELS[currentProfile()])} não possui acesso a este módulo.</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function actionButtons(record) {
    return allowedActions(record).map((action) => `
      <button
        type="button"
        class="admin-assemblies__icon-button admin-assemblies__icon-button--${action}"
        data-assembly-action="${action}"
        data-id="${escapeHtml(record.id)}"
        title="${ACTION_META[action].label}"
        aria-label="${ACTION_META[action].label}: ${escapeHtml(record.title)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function rowsMarkup(rows) {
    if (!rows.length) {
      return '<tr><td colspan="7" class="admin-assemblies__empty">Nenhum registro encontrado.</td></tr>';
    }

    return rows.map((record) => `
      <tr>
        <td><span class="admin-assemblies__id">${escapeHtml(record.id)}</span><small>${escapeHtml(record.type)}</small></td>
        <td><strong>${escapeHtml(record.title)}</strong><small>${escapeHtml(record.audience)}</small></td>
        <td>${formatDate(record.date)}<small>${escapeHtml(record.time || "—")}</small></td>
        <td>${escapeHtml(record.modality)}</td>
        <td>${escapeHtml(record.author || "—")}</td>
        <td><span class="admin-assemblies__status admin-assemblies__status--${slug(record.status)}">${escapeHtml(record.status)}</span></td>
        <td><div class="admin-assemblies__actions">${actionButtons(record)}</div></td>
      </tr>
    `).join("");
  }

  function optionList(values, selected, allLabel) {
    const first = allLabel === undefined ? "" : `<option value="">${allLabel}</option>`;
    return first + values.map((value) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`
    ).join("");
  }

  function countBy(status) {
    return records.filter((item) => item.status === status).length;
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    closeDrawer(false);
    markNavigation();

    if (!perms()) {
      renderDenied(container);
      return;
    }

    const [roleTitle, roleText] = roleDescription();
    const pending = countBy(STATUS.PENDING);

    container.innerHTML = `
      <p class="admin-assemblies__notice">
        Conteúdo demonstrativo. Registros fictícios mantidos apenas nesta sessão do navegador.
      </p>

      <header class="admin-assemblies__header">
        <div>
          <span class="admin-assemblies__eyebrow">GESTÃO INSTITUCIONAL</span>
          <h1 id="admin-content-title">Assembleias e Reuniões</h1>
          <p>Elaboração, autorização, agenda e encerramento.</p>
        </div>
        <div class="admin-assemblies__header-actions">
          <span class="admin-assemblies__profile">${escapeHtml(PROFILE_LABELS[currentProfile()])}</span>
          ${perms().create ? '<button type="button" class="button button--primary" data-assembly-new>NOVA ASSEMBLEIA / REUNIÃO</button>' : ""}
        </div>
      </header>

      <div class="admin-assemblies__role">
        <strong>${escapeHtml(roleTitle)}</strong>
        <span>${escapeHtml(roleText)}</span>
      </div>

      <div class="admin-assemblies__stats">
        <article><span>Rascunhos</span><strong>${countBy(STATUS.DRAFT)}</strong></article>
        <article><span>Aguardando autorização</span><strong>${pending}</strong></article>
        <article><span>Agendadas</span><strong>${countBy(STATUS.SCHEDULED)}</strong></article>
        <article><span>Encerradas</span><strong>${countBy(STATUS.CLOSED)}</strong></article>
      </div>

      ${perms().schedule && pending ? `
        <aside class="admin-assemblies__alert" role="note">
          <strong>${pending} ${pending === 1 ? "registro aguarda" : "registros aguardam"} autorização</strong>
          <span>Use o ícone de calendário na tabela para autorizar e agendar.</span>
        </aside>` : ""}

      <section class="admin-assemblies__panel" aria-label="Lista de assembleias e reuniões">
        <div class="admin-assemblies__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Título, protocolo, pauta ou autor" data-assembly-search></label>
          <label><span>Tipo</span><select data-assembly-filter="type">${optionList(TYPES, "", "Todos")}</select></label>
          <label><span>Situação</span><select data-assembly-filter="status">${optionList(Object.values(STATUS), "", "Todas")}</select></label>
          <label><span>Modalidade</span><select data-assembly-filter="modality">${optionList(MODALITIES, "", "Todas")}</select></label>
        </div>
        <p class="admin-assemblies__count" data-assembly-count role="status" aria-live="polite"></p>
        <div class="admin-assemblies__table-wrap">
          <table class="admin-assemblies__table">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Título / público</th>
                <th scope="col">Data</th>
                <th scope="col">Modalidade</th>
                <th scope="col">Autor</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-assembly-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-assemblies__rule">
        <strong>Fluxo</strong>
        <p>Rascunho → Aguardando autorização → Agendada → Encerrada (ou Cancelada).
        Somente registros Agendados ou Encerrados destinados a Filiados aparecem na Área do Filiado.
        Atas serão tratadas no módulo próprio.</p>
      </aside>

      <div class="admin-assemblies__overlay" data-assembly-overlay hidden></div>
      <aside class="admin-assemblies__drawer" data-assembly-drawer role="dialog" aria-modal="true" aria-labelledby="assembly-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const term = (document.querySelector("[data-assembly-search]")?.value || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

    const filters = [...document.querySelectorAll("[data-assembly-filter]")];

    const filtered = records
      .filter((record) => {
        const text = [record.id, record.title, record.agenda, record.author, record.location]
          .join(" ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        return (!term || text.includes(term))
          && filters.every((field) => !field.value || record[field.dataset.assemblyFilter] === field.value);
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const body = document.querySelector("[data-assembly-table]");
    if (body) body.innerHTML = rowsMarkup(filtered);

    const count = document.querySelector("[data-assembly-count]");
    if (count) count.textContent = `${filtered.length} registro(s) demonstrativo(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-assembly-overlay]");
    const drawer = document.querySelector("[data-assembly-drawer]");
    if (!overlay || !drawer) return;

    lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("input, select, textarea, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-assembly-overlay]");
    const drawer = document.querySelector("[data-assembly-drawer]");
    const wasOpen = drawer && !drawer.hidden;

    if (overlay) overlay.hidden = true;
    if (drawer) {
      drawer.hidden = true;
      drawer.innerHTML = "";
    }
    document.body.style.overflow = "";

    if (wasOpen && restoreFocus && lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function drawerHeader(eyebrow, title) {
    return `
      <header class="admin-assemblies__drawer-header">
        <div>
          <span class="admin-assemblies__eyebrow">${escapeHtml(eyebrow)}</span>
          <h2 id="assembly-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-assemblies__close" data-assembly-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function accessMarkup(record) {
    const parts = [];
    if (record.location) parts.push(escapeHtml(record.location));
    if (record.accessLink) parts.push(`Link: <span class="admin-assemblies__mono">${escapeHtml(record.accessLink)}</span>`);
    return parts.length ? parts.join("<br>") : "—";
  }

  function detailMarkup(record) {
    const actions = allowedActions(record).filter((action) => action !== "view");

    return `
      ${drawerHeader(`${record.type} · ${record.id}`, record.title)}

      <div class="admin-assemblies__drawer-status">
        <span>Situação</span>
        <strong><span class="admin-assemblies__status admin-assemblies__status--${slug(record.status)}">${escapeHtml(record.status)}</span></strong>
      </div>

      <dl class="admin-assemblies__details">
        <div><dt>Data</dt><dd>${formatDate(record.date)}</dd></div>
        <div><dt>Horário</dt><dd>${escapeHtml(record.time || "—")}</dd></div>
        <div><dt>Modalidade</dt><dd>${escapeHtml(record.modality)}</dd></div>
        <div><dt>Público-alvo</dt><dd>${escapeHtml(record.audience)}</dd></div>
        <div class="admin-assemblies__details-wide"><dt>Local / acesso</dt><dd>${accessMarkup(record)}</dd></div>
        <div><dt>Autor</dt><dd>${escapeHtml(record.author || "—")}</dd></div>
        <div><dt>Documento relacionado</dt><dd>${record.document ? `<span class="admin-assemblies__mono">${escapeHtml(record.document)}</span>` : "—"}</dd></div>
        <div><dt>Criado em</dt><dd>${formatDateTime(record.createdAt)}</dd></div>
        <div><dt>Atualizado em</dt><dd>${formatDateTime(record.updatedAt)}</dd></div>
      </dl>

      <section class="admin-assemblies__drawer-section"><h3>Pauta</h3><p>${escapeHtml(record.agenda || "—")}</p></section>
      <section class="admin-assemblies__drawer-section"><h3>Observações</h3><p>${escapeHtml(record.notes || "—")}</p></section>

      ${perms().history ? `
        <section class="admin-assemblies__drawer-section">
          <h3>Histórico</h3>
          <ol class="admin-assemblies__history">
            ${record.history.slice().reverse().map((entry) => `
              <li>
                <time datetime="${escapeHtml(entry.at)}">${formatDateTime(entry.at)}</time>
                <strong>${escapeHtml(entry.profile)}</strong>
                <span>${escapeHtml(entry.action)}</span>
                ${entry.note ? `<em>${escapeHtml(entry.note)}</em>` : ""}
              </li>`).join("")}
          </ol>
        </section>` : ""}

      ${isFinal(record) ? '<p class="admin-assemblies__form-note">Registro finalizado: não pode mais ser editado.</p>' : ""}

      ${actions.length ? `
        <div class="admin-assemblies__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "cancel" ? "button--secondary" : "button--primary"}"
              data-assembly-action="${action}" data-id="${escapeHtml(record.id)}">
              ${ACTION_META[action].label.toUpperCase()}
            </button>`).join("")}
        </div>` : ""}
    `;
  }

  function field(name, label, control, locked) {
    return `
      <label class="admin-assemblies__field${locked ? " is-locked" : ""}">
        <span>${label}</span>
        ${control}
      </label>
    `;
  }

  function formMarkup(record = null) {
    const r = record || { type: "Assembleia", modality: "Presencial", audience: "Filiados" };
    const locked = (name) => isOperationalOnly(record) && !OPERATIONAL_FIELDS.includes(name);
    const dis = (name) => (locked(name) ? " disabled" : "");

    return `
      ${drawerHeader(record ? `EDIÇÃO · ${record.id}` : "NOVO REGISTRO", record ? "Editar assembleia / reunião" : "Nova assembleia / reunião")}

      ${isOperationalOnly(record) ? '<p class="admin-assemblies__form-note">Após o encaminhamento, a Secretaria pode ajustar apenas informações operacionais (data, horário, modalidade, local, link, observações e documento).</p>' : ""}

      <form data-assembly-form novalidate>
        <div class="admin-assemblies__form-grid">
          ${field("type", "Tipo *", `<select name="type" required${dis("type")}>${optionList(TYPES, r.type)}</select>`, locked("type"))}
          ${field("audience", "Público-alvo *", `<select name="audience" required${dis("audience")}>${optionList(AUDIENCES, r.audience)}</select>`, locked("audience"))}
        </div>
        ${field("title", "Título *", `<input name="title" required maxlength="140" value="${escapeHtml(r.title || "")}"${dis("title")}>`, locked("title"))}
        <div class="admin-assemblies__form-grid admin-assemblies__form-grid--3">
          ${field("date", "Data *", `<input type="date" name="date" required value="${escapeHtml(r.date || "")}">`)}
          ${field("time", "Horário *", `<input type="time" name="time" required value="${escapeHtml(r.time || "")}">`)}
          ${field("modality", "Modalidade *", `<select name="modality" required>${optionList(MODALITIES, r.modality)}</select>`)}
        </div>
        ${field("location", "Local (presencial/híbrida)", `<input name="location" maxlength="200" value="${escapeHtml(r.location || "")}" placeholder="Local demonstrativo">`)}
        ${field("accessLink", "Link de acesso (online/híbrida)", `<input type="url" name="accessLink" maxlength="300" value="${escapeHtml(r.accessLink || "")}" placeholder="https://...">`)}
        ${field("agenda", "Pauta *", `<textarea name="agenda" rows="4" required maxlength="2000"${dis("agenda")}>${escapeHtml(r.agenda || "")}</textarea>`, locked("agenda"))}
        ${field("notes", "Observações", `<textarea name="notes" rows="3" maxlength="1000">${escapeHtml(r.notes || "")}</textarea>`)}
        ${field("document", "Documento relacionado (referência interna, opcional)", `<input name="document" maxlength="200" value="${escapeHtml(r.document || "")}" placeholder="filiado-documentos.html#pauta">`)}

        <p class="admin-assemblies__form-error" data-assembly-error role="alert" hidden></p>

        <p class="admin-assemblies__form-note">
          ${record ? `Situação atual: <strong>${escapeHtml(record.status)}</strong>.` : "O registro será salvo como <strong>Rascunho</strong>."}
          Não há envio a servidor: os dados ficam somente nesta sessão.
        </p>

        <div class="admin-assemblies__drawer-actions">
          <button type="button" class="button button--secondary" data-assembly-close>CANCELAR</button>
          <button type="submit" class="button button--primary">SALVAR</button>
        </div>
      </form>
    `;
  }

  function confirmMarkup(record, action) {
    const texts = {
      forward: "O registro será encaminhado para autorização da Presidência e não poderá ser editado pela Diretoria.",
      schedule: "O registro será autorizado e agendado, passando a aparecer na Área do Filiado quando o público incluir Filiados.",
      close: "O registro será encerrado e não poderá mais ser editado.",
      cancel: "O registro será cancelado, deixará de aparecer na Área do Filiado e não poderá mais ser editado."
    };

    return `
      ${drawerHeader(`${record.type} · ${record.id}`, ACTION_META[action].label)}
      <p><strong>${escapeHtml(record.title)}</strong></p>
      <p>${texts[action]}</p>
      <form data-assembly-confirm="${action}" data-id="${escapeHtml(record.id)}">
        <label class="admin-assemblies__field">
          <span>Observação para o histórico${action === "cancel" ? " *" : " (opcional)"}</span>
          <textarea name="note" rows="3" maxlength="500"${action === "cancel" ? " required" : ""}></textarea>
        </label>
        <p class="admin-assemblies__form-error" data-assembly-error role="alert" hidden></p>
        <div class="admin-assemblies__drawer-actions">
          <button type="button" class="button button--secondary" data-assembly-back="${escapeHtml(record.id)}">VOLTAR</button>
          <button type="submit" class="button button--primary">CONFIRMAR</button>
        </div>
      </form>
    `;
  }

  /* ---------- Ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-assembly-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function addHistory(record, action, note = "") {
    const at = nowIso();
    record.history.push({ at, profile: PROFILE_LABELS[currentProfile()], action, ...(note ? { note } : {}) });
    record.updatedAt = at;
  }

  function saveForm(form) {
    const id = form.dataset.id || "";
    const existing = id ? recordById(id) : null;

    // Revalida a permissão no momento da ação (o perfil pode ter mudado).
    if (existing ? !canEdit(existing) : !perms()?.create) {
      showError(form, "O perfil atual não pode realizar esta ação.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const value = (name) => String(data[name] ?? "").trim();
    const operationalOnly = isOperationalOnly(existing);

    const next = {
      type: value("type"),
      audience: value("audience"),
      title: value("title"),
      date: value("date"),
      time: value("time"),
      modality: value("modality"),
      location: value("location"),
      accessLink: value("accessLink"),
      agenda: value("agenda"),
      notes: value("notes"),
      document: value("document")
    };

    // Campos bloqueados (disabled) não são enviados: preserva os valores atuais.
    if (operationalOnly) {
      Object.keys(next).forEach((key) => {
        if (!OPERATIONAL_FIELDS.includes(key)) next[key] = existing[key];
      });
    }

    if (!TYPES.includes(next.type) || !AUDIENCES.includes(next.audience) || !MODALITIES.includes(next.modality)) {
      showError(form, "Selecione tipo, público-alvo e modalidade válidos.");
      return;
    }
    if (!next.title || !next.date || !next.time || !next.agenda) {
      showError(form, "Preencha título, data, horário e pauta.");
      return;
    }
    if (next.modality !== "Online" && !next.location) {
      showError(form, "Informe o local para modalidade presencial ou híbrida.");
      return;
    }
    if (next.modality !== "Presencial" && !next.accessLink) {
      showError(form, "Informe o link de acesso para modalidade online ou híbrida.");
      return;
    }
    if (!isSafeLink(next.accessLink)) {
      showError(form, "O link de acesso deve começar com https://.");
      return;
    }
    if (!isSafeInternalRef(next.document)) {
      showError(form, "O documento relacionado deve ser uma referência interna (ex.: filiado-documentos.html#pauta).");
      return;
    }

    if (existing) {
      Object.assign(existing, next);
      addHistory(existing, operationalOnly ? "Informações operacionais atualizadas." : "Registro editado.");
    } else {
      const at = nowIso();
      const duplicated = records.some((item) =>
        item.type === next.type && item.title.toLowerCase() === next.title.toLowerCase()
        && item.date === next.date && item.time === next.time && !isFinal(item));

      if (duplicated) {
        showError(form, "Já existe um registro ativo com o mesmo tipo, título, data e horário.");
        return;
      }

      records.push({
        id: nextId(),
        ...next,
        status: STATUS.DRAFT,
        author: PROFILE_LABELS[currentProfile()],
        createdAt: at,
        updatedAt: at,
        history: [{ at, profile: PROFILE_LABELS[currentProfile()], action: "Registro criado como Rascunho." }]
      });
    }

    records = deduplicate(records);
    saveRecords();
    renderModule();
  }

  const TRANSITIONS = {
    forward: { from: [STATUS.DRAFT], to: STATUS.PENDING, log: "Encaminhado para autorização." },
    schedule: { from: [STATUS.PENDING], to: STATUS.SCHEDULED, log: "Autorizado e agendado." },
    close: { from: [STATUS.SCHEDULED], to: STATUS.CLOSED, log: "Encerrado." },
    cancel: { from: [STATUS.DRAFT, STATUS.PENDING, STATUS.SCHEDULED], to: STATUS.CANCELED, log: "Cancelado." }
  };

  function applyTransition(form) {
    const action = form.dataset.assemblyConfirm;
    const record = recordById(form.dataset.id);
    const transition = TRANSITIONS[action];
    const note = String(new FormData(form).get("note") || "").trim();

    if (!record || !transition || !allowedActions(record).includes(action) || !transition.from.includes(record.status)) {
      showError(form, "Esta ação não está disponível para o perfil ou a situação atual.");
      return;
    }
    if (action === "cancel" && !note) {
      showError(form, "Informe o motivo do cancelamento.");
      return;
    }

    record.status = transition.to;
    addHistory(record, transition.log, note);
    saveRecords();
    renderModule();
  }

  function handleAction(action, id) {
    if (action === "new") {
      if (perms()?.create) openDrawer(formMarkup());
      return;
    }

    const record = recordById(id);
    if (!record || !allowedActions(record).includes(action)) {
      renderModule();
      return;
    }

    if (action === "view") {
      openDrawer(detailMarkup(record));
    } else if (action === "edit") {
      openDrawer(formMarkup(record));
      document.querySelector("[data-assembly-form]")?.setAttribute("data-id", record.id);
    } else {
      openDrawer(confirmMarkup(record, action));
    }
  }

  function bindEvents(container) {
    // O container permanece entre renderizações: registra os eventos uma única vez.
    if (container.dataset.assembliesEventsBound === "true") return;
    container.dataset.assembliesEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-assembly-search]")) filterRows();
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-assembly-filter]")) filterRows();
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-assembly-overlay]");
      if (!target) return;

      if (target.matches("[data-assembly-close], [data-assembly-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-assembly-new]")) {
        handleAction("new");
      } else if (target.matches("[data-assembly-back]")) {
        const record = recordById(target.dataset.assemblyBack);
        if (record) document.querySelector("[data-assembly-drawer]").innerHTML = detailMarkup(record);
      } else if (target.matches("[data-assembly-action]")) {
        handleAction(target.dataset.assemblyAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-assembly-form]")) {
        event.preventDefault();
        saveForm(event.target);
      } else if (event.target.matches("[data-assembly-confirm]")) {
        event.preventDefault();
        applyTransition(event.target);
      }
    });
  }

  function markNavigation() {
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === PAGE_FILE;
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
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
