// T33 — Solicitações dos Filiados (área administrativa, protótipo demonstrativo).
// Não confundir com Solicitações de Filiação (admin-filiacoes.js): este módulo trata das
// demandas abertas por filiados em "Minhas Solicitações".
// Fluxo: Recebida -> Em análise -> Respondida -> Finalizada. O encaminhamento entre áreas
// mantém "Em análise" e altera apenas a área responsável.
// Base única compartilhada com a Área do Filiado: localStorage["sindGestao.requestsDemo"],
// acessada pela API window.SindGestaoSolicitacoes (filiado-solicitacoes.js).
(() => {
  "use strict";

  // Mesma fonte de verdade de perfil utilizada por area-admin.js.
  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const DEFAULT_PROFILE = "administrador";

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
    RECEIVED: "Recebida",
    ANALYSIS: "Em análise",
    ANSWERED: "Respondida",
    FINALIZED: "Finalizada"
  });

  const ALL_STATUSES = Object.values(STATUS);
  const AREAS = ["Secretaria", "Diretoria", "Tesouraria"];
  const CATEGORIES = ["Cadastro", "Documentos", "Benefícios", "Atendimento", "Outros"];

  /*
   * Matriz de permissões.
   * scope: "all" ou a área própria; start: iniciar análise; forward: encaminhar;
   * respond: "any" (qualquer área) | "own" (somente a própria área) | false; finalize.
   * Perfis ausentes (Conselho de Ética, Conselho Fiscal) não acessam o módulo.
   */
  const PERMISSIONS = Object.freeze({
    administrador: {
      role: ["Gestão geral", "Consulta todas as solicitações, inicia análise, encaminha, responde e finaliza."],
      scope: "all", start: true, forward: true, respond: "any", finalize: true
    },
    secretaria: {
      role: ["Porta de entrada do atendimento", "Recebe as solicitações, inicia a análise, encaminha às áreas, responde as que estão sob sua responsabilidade e finaliza as respondidas."],
      scope: "all", area: "Secretaria", start: true, forward: true, respond: "own", finalize: true
    },
    diretoria: {
      role: ["Área responsável", "Consulta e responde somente as solicitações encaminhadas à Diretoria. Não encaminha nem finaliza."],
      scope: "Diretoria", area: "Diretoria", start: false, forward: false, respond: "own", finalize: false
    },
    tesouraria: {
      role: ["Área responsável", "Consulta e responde somente as solicitações financeiras encaminhadas à Tesouraria. Não encaminha nem finaliza."],
      scope: "Tesouraria", area: "Tesouraria", start: false, forward: false, respond: "own", finalize: false
    },
    presidencia: {
      role: ["Consulta estratégica", "Consulta todas as solicitações e seus históricos, sem editar, encaminhar, responder ou finalizar."],
      scope: "all", start: false, forward: false, respond: false, finalize: false
    }
  });

  let records = [];
  let lastFocused = null;

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

  function inScope(record, p = perms()) {
    return Boolean(p && record && (p.scope === "all" || record.areaResponsavel === p.scope));
  }

  function canRespond(record, p) {
    if (p.respond === "any") return true;
    return p.respond === "own" && record.areaResponsavel === p.area;
  }

  function allowedActions(record) {
    const p = perms();
    if (!inScope(record, p)) return [];

    const actions = ["view"];
    if (p.start && record.status === STATUS.RECEIVED) actions.push("start");
    if (p.forward && (record.status === STATUS.RECEIVED || record.status === STATUS.ANALYSIS)) actions.push("forward");
    if (record.status === STATUS.ANALYSIS && canRespond(record, p)) actions.push("respond");
    if (p.finalize && record.status === STATUS.ANSWERED) actions.push("finalize");
    return actions;
  }

  /* ---------- Armazenamento (fonte compartilhada) ---------- */

  function store() {
    return window.SindGestaoSolicitacoes || null;
  }

  // O filtro de escopo é aplicado no próprio carregamento: registros de outra área
  // nunca chegam à memória do módulo para Diretoria/Tesouraria.
  function loadRecords() {
    const api = store();
    const p = perms();
    if (!api || !p) return [];
    return api.lerTodas().filter((record) => inScope(record, p));
  }

  function refresh() {
    records = loadRecords();
  }

  function recordById(protocolo) {
    const record = records.find((item) => item.protocolo === protocolo);
    return inScope(record) ? record : null;
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

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      start: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
      forward: '<path d="M15 4l5 5-5 5"></path><path d="M20 9H9a5 5 0 0 0 0 10h2"></path>',
      respond: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>',
      finalize: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  const ACTION_LABELS = {
    view: "Visualizar",
    start: "Iniciar análise",
    forward: "Encaminhar",
    respond: "Responder",
    finalize: "Finalizar"
  };

  function optionList(values, selected, allLabel) {
    const first = allLabel === undefined ? "" : `<option value="">${allLabel}</option>`;
    return first + values.map((value) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`
    ).join("");
  }

  /* ---------- Renderização ---------- */

  function markNavigation() {
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === "admin-solicitacoes.html";
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderDenied(container, message) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Solicitações dos Filiados</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function statusBadge(status) {
    return `<span class="admin-docs__status admin-docs__status--${slug(status)}">${escapeHtml(status)}</span>`;
  }

  function areaBadge(area) {
    return `<span class="admin-sol__area">${escapeHtml(area)}</span>`;
  }

  function actionButtons(record) {
    return allowedActions(record).map((action) => `
      <button
        type="button"
        class="admin-docs__icon-button admin-docs__icon-button--${action}"
        data-sol-action="${action}"
        data-id="${escapeHtml(record.protocolo)}"
        title="${ACTION_LABELS[action]}"
        aria-label="${ACTION_LABELS[action]}: ${escapeHtml(record.protocolo)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function rowsMarkup(rows) {
    if (!rows.length) {
      return '<tr><td colspan="7" class="admin-docs__empty">Nenhuma solicitação encontrada.</td></tr>';
    }

    return rows.map((record) => `
      <tr>
        <td><span class="admin-docs__id">${escapeHtml(record.protocolo)}</span></td>
        <td>${formatDateTime(record.data)}</td>
        <td>${escapeHtml(record.categoria)}</td>
        <td><strong>${escapeHtml(record.assunto)}</strong></td>
        <td>${areaBadge(record.areaResponsavel)}</td>
        <td>${statusBadge(record.status)}</td>
        <td><div class="admin-docs__actions">${actionButtons(record)}</div></td>
      </tr>
    `).join("");
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    closeDrawer(false);
    markNavigation();

    const p = perms();
    if (!p) {
      renderDenied(container, `O perfil ${PROFILE_LABELS[currentProfile()]} não possui acesso às Solicitações dos Filiados. Denúncias e manifestações seguem fluxo próprio dos Conselhos.`);
      return;
    }
    if (!store()) {
      renderDenied(container, "Base demonstrativa de solicitações indisponível.");
      return;
    }

    refresh();
    const count = (status) => records.filter((r) => r.status === status).length;
    const stats = [
      ["Recebidas", STATUS.RECEIVED],
      ["Em análise", STATUS.ANALYSIS],
      ["Respondidas", STATUS.ANSWERED],
      ["Finalizadas", STATUS.FINALIZED]
    ].map(([label, status]) => `<article><span>${label}</span><strong>${count(status)}</strong></article>`).join("");

    const pending = records.filter((r) => allowedActions(r).some((a) => a !== "view")).length;
    const areaFilter = p.scope === "all"
      ? `<label><span>Área responsável</span><select data-sol-filter="areaResponsavel">${optionList(AREAS, "", "Todas")}</select></label>`
      : `<label><span>Área responsável</span><select data-sol-filter="areaResponsavel" disabled>${optionList([p.scope], p.scope)}</select></label>`;

    container.innerHTML = `
      <p class="admin-docs__notice">
        Conteúdo demonstrativo. Solicitações fictícias mantidas apenas neste navegador e compartilhadas com a Área do Filiado.
      </p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">ATENDIMENTO</span>
          <h1 id="admin-content-title">SOLICITAÇÕES DOS FILIADOS</h1>
          <p>Acompanhamento das demandas abertas pelos filiados e encaminhamento às áreas responsáveis.</p>
        </div>
        <div class="admin-docs__header-actions">
          <span class="admin-docs__profile">${escapeHtml(PROFILE_LABELS[currentProfile()])}</span>
        </div>
      </header>

      <div class="admin-docs__role">
        <strong>${escapeHtml(p.role[0])}</strong>
        <span>${escapeHtml(p.role[1])}</span>
      </div>

      <div class="admin-docs__stats">${stats}</div>

      ${pending ? `
        <aside class="admin-docs__alert" role="note">
          <strong>${pending} ${pending === 1 ? "solicitação aguarda" : "solicitações aguardam"} ação deste perfil</strong>
          <span>Abra o registro para consultar o histórico e realizar a próxima etapa.</span>
        </aside>` : ""}

      <section class="admin-docs__panel" aria-label="Solicitações dos Filiados">
        <div class="admin-docs__filters admin-sol__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Protocolo ou assunto" data-sol-search></label>
          <label><span>Situação</span><select data-sol-filter="status">${optionList(ALL_STATUSES, "", "Todas")}</select></label>
          <label><span>Categoria</span><select data-sol-filter="categoria">${optionList(CATEGORIES, "", "Todas")}</select></label>
          ${areaFilter}
        </div>
        <p class="admin-docs__count" data-sol-count role="status" aria-live="polite"></p>
        <div class="admin-docs__table-wrap">
          <table class="admin-docs__table admin-sol__table">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Data</th>
                <th scope="col">Categoria</th>
                <th scope="col">Assunto</th>
                <th scope="col">Área responsável</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-sol-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-docs__rule">
        <strong>Fluxo e áreas responsáveis</strong>
        <p>Recebida → Em análise → Respondida → Finalizada. Toda solicitação entra pela Secretaria, que pode encaminhá-la à Diretoria ou à Tesouraria;
        o encaminhamento mantém a situação Em análise. Somente Administrador Geral e Secretaria finalizam. Denúncias e manifestações não integram este módulo.</p>
      </aside>

      <div class="admin-docs__overlay" data-sol-overlay hidden></div>
      <aside class="admin-docs__drawer" data-sol-drawer role="dialog" aria-modal="true" aria-labelledby="sol-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const term = normalize(document.querySelector("[data-sol-search]")?.value);
    const filters = [...document.querySelectorAll("[data-sol-filter]")].filter((field) => !field.disabled);

    const filtered = records
      .filter((record) => {
        const text = normalize(`${record.protocolo} ${record.assunto}`);
        return (!term || text.includes(term))
          && filters.every((field) => !field.value || String(record[field.dataset.solFilter]) === field.value);
      })
      .sort((a, b) => b.protocolo.localeCompare(a.protocolo));

    const body = document.querySelector("[data-sol-table]");
    if (body) body.innerHTML = rowsMarkup(filtered);

    const countBox = document.querySelector("[data-sol-count]");
    if (countBox) countBox.textContent = `${filtered.length} solicitação(ões) demonstrativa(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-sol-overlay]");
    const drawer = document.querySelector("[data-sol-drawer]");
    if (!overlay || !drawer) return;

    if (drawer.hidden) lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("textarea, select, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-sol-overlay]");
    const drawer = document.querySelector("[data-sol-drawer]");
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
      <header class="admin-docs__drawer-header">
        <div>
          <span class="admin-docs__eyebrow">${escapeHtml(eyebrow)}</span>
          <h2 id="sol-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-docs__close" data-sol-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function historyMarkup(record) {
    return `
      <ol class="admin-docs__history">
        ${record.history.slice().reverse().map((entry) => `
          <li>
            <time datetime="${escapeHtml(entry.at)}">${formatDateTime(entry.at)}</time>
            <strong>${escapeHtml(entry.profile)}${entry.visibleToMember === false ? '<span class="admin-sol__internal">Interno</span>' : ""}</strong>
            <span>${escapeHtml(entry.action)}</span>
            ${entry.note ? `<em>${escapeHtml(entry.note)}</em>` : ""}
          </li>`).join("")}
      </ol>
    `;
  }

  function detailMarkup(record) {
    const actions = allowedActions(record).filter((action) => action !== "view");

    return `
      ${drawerHeader(`SOLICITAÇÃO · ${record.protocolo}`, record.assunto)}

      <div class="admin-docs__drawer-status">
        <span>Situação</span>
        <strong>${statusBadge(record.status)}</strong>
      </div>

      <dl class="admin-docs__details">
        <div><dt>Protocolo</dt><dd>${escapeHtml(record.protocolo)}</dd></div>
        <div><dt>Data</dt><dd>${formatDateTime(record.data)}</dd></div>
        <div><dt>Categoria</dt><dd>${escapeHtml(record.categoria)}</dd></div>
        <div><dt>Área responsável</dt><dd>${areaBadge(record.areaResponsavel)}</dd></div>
        <div><dt>Solicitante</dt><dd>${escapeHtml(record.solicitante)}</dd></div>
        <div><dt>Atualizada em</dt><dd>${formatDateTime(record.updatedAt)}</dd></div>
        <div><dt>Respondida em</dt><dd>${formatDateTime(record.respondedAt)}${record.respondedBy ? ` · ${escapeHtml(record.respondedBy)}` : ""}</dd></div>
        <div><dt>Finalizada em</dt><dd>${formatDateTime(record.finalizedAt)}${record.finalizedBy ? ` · ${escapeHtml(record.finalizedBy)}` : ""}</dd></div>
      </dl>

      <section class="admin-docs__drawer-section"><h3>Assunto</h3><p>${escapeHtml(record.assunto)}</p></section>
      <section class="admin-docs__drawer-section"><h3>Descrição</h3><p class="admin-sol__description">${escapeHtml(record.descricao)}</p></section>

      ${record.resposta ? `
        <section class="admin-docs__drawer-section">
          <h3>Resposta ao filiado</h3>
          <p class="admin-sol__answer">${escapeHtml(record.resposta)}</p>
        </section>` : ""}

      <section class="admin-docs__drawer-section">
        <h3>Histórico</h3>
        ${historyMarkup(record)}
        <p class="admin-docs__form-note">Eventos marcados como “Interno” não são exibidos na Área do Filiado.</p>
      </section>

      ${actions.length ? `
        <div class="admin-docs__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "forward" ? "button--secondary" : "button--primary"}"
              data-sol-action="${action}" data-id="${escapeHtml(record.protocolo)}">
              ${ACTION_LABELS[action].toUpperCase()}
            </button>`).join("")}
        </div>` : ""}
    `;
  }

  function actionFormMarkup(record, action) {
    const texts = {
      start: "A solicitação passará para a situação Em análise. A mudança será exibida ao filiado.",
      forward: record.status === STATUS.RECEIVED
        ? "A solicitação será encaminhada à área selecionada e passará para Em análise."
        : "A solicitação será encaminhada à área selecionada e permanecerá Em análise.",
      respond: "A resposta será exibida imediatamente ao filiado e a solicitação passará para Respondida.",
      finalize: "A solicitação será finalizada. A resposta permanece disponível para consulta do filiado."
    };

    let fields = "";
    if (action === "forward") {
      const targets = AREAS.filter((area) => area !== record.areaResponsavel);
      fields = `
        <p>Área atual: ${areaBadge(record.areaResponsavel)}</p>
        <label class="admin-docs__field">
          <span>Área responsável *</span>
          <select name="area" required>${optionList(targets, "", "Selecione")}</select>
        </label>
        <label class="admin-docs__field">
          <span>Observação interna (opcional — não exibida ao filiado)</span>
          <textarea name="note" rows="3" maxlength="500"></textarea>
        </label>`;
    } else if (action === "respond") {
      fields = `
        <label class="admin-docs__field">
          <span>Resposta ao filiado *</span>
          <textarea name="answer" rows="6" required maxlength="2000"></textarea>
        </label>`;
    }

    return `
      ${drawerHeader(`SOLICITAÇÃO · ${record.protocolo}`, ACTION_LABELS[action])}
      <p><strong>${escapeHtml(record.assunto)}</strong> · ${statusBadge(record.status)}</p>
      <p>${texts[action]}</p>
      <form data-sol-confirm="${action}" data-id="${escapeHtml(record.protocolo)}" novalidate>
        ${fields}
        <p class="admin-docs__form-error" data-sol-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-sol-back="${escapeHtml(record.protocolo)}">VOLTAR</button>
          <button type="submit" class="button button--primary">CONFIRMAR</button>
        </div>
      </form>
    `;
  }

  /* ---------- Ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-sol-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  function pushHistory(record, entry) {
    const at = nowIso();
    record.history.push({
      at,
      profile: PROFILE_LABELS[currentProfile()],
      note: "",
      visibleToMember: true,
      ...entry
    });
    record.updatedAt = at;
    return at;
  }

  function applyAction(form) {
    const action = form.dataset.solConfirm;
    const protocolo = form.dataset.id;
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? "").trim();

    // Revalidação completa no momento da execução: perfil ativo, registro persistido,
    // escopo da área, situação atual e transição permitida.
    const api = store();
    const p = perms();
    if (!api || !p) {
      showError(form, "O perfil atual não possui acesso a este módulo.");
      return;
    }
    const all = api.lerTodas();
    const record = all.find((item) => item.protocolo === protocolo);
    if (!record || !inScope(record, p)) {
      showError(form, "Solicitação não encontrada no escopo do perfil atual.");
      return;
    }
    if (!allowedActions(record).includes(action)) {
      showError(form, "Esta ação não está disponível para o perfil ou a situação atual.");
      return;
    }

    const label = PROFILE_LABELS[currentProfile()];

    if (action === "start") {
      if (record.status !== STATUS.RECEIVED) return showError(form, "Somente solicitações Recebidas podem iniciar análise.");
      record.status = STATUS.ANALYSIS;
      record.responsavelAtual = label;
      pushHistory(record, { action: "Análise iniciada.", status: STATUS.ANALYSIS });
    } else if (action === "forward") {
      const target = value("area");
      const note = value("note");
      if (![STATUS.RECEIVED, STATUS.ANALYSIS].includes(record.status)) {
        return showError(form, "Solicitações Respondidas ou Finalizadas não podem ser encaminhadas.");
      }
      if (!AREAS.includes(target) || target === record.areaResponsavel) {
        return showError(form, "Selecione uma área responsável diferente da atual.");
      }
      if (record.status === STATUS.RECEIVED) {
        record.status = STATUS.ANALYSIS;
        pushHistory(record, { action: "Análise iniciada.", status: STATUS.ANALYSIS });
      }
      const from = record.areaResponsavel;
      record.areaResponsavel = target;
      record.responsavelAtual = target;
      pushHistory(record, {
        action: `Encaminhada de ${from} para ${target}.`,
        note,
        from,
        to: target,
        visibleToMember: false
      });
    } else if (action === "respond") {
      const answer = value("answer");
      if (record.status !== STATUS.ANALYSIS) return showError(form, "Somente solicitações Em análise podem ser respondidas.");
      if (!canRespond(record, p)) return showError(form, "A solicitação não está sob a responsabilidade deste perfil.");
      if (!answer) return showError(form, "Informe o texto da resposta.");
      record.status = STATUS.ANSWERED;
      record.resposta = answer;
      record.respondedBy = label;
      record.responsavelAtual = label;
      record.respondedAt = pushHistory(record, { action: "Resposta registrada.", status: STATUS.ANSWERED });
    } else if (action === "finalize") {
      if (record.status !== STATUS.ANSWERED) return showError(form, "Somente solicitações Respondidas podem ser finalizadas.");
      if (!["administrador", "secretaria"].includes(currentProfile())) {
        return showError(form, "Somente Administrador Geral ou Secretaria podem finalizar.");
      }
      record.status = STATUS.FINALIZED;
      record.finalizedBy = label;
      record.finalizedAt = pushHistory(record, { action: "Solicitação finalizada.", status: STATUS.FINALIZED });
    } else {
      return showError(form, "Ação desconhecida.");
    }

    api.salvarTodas(all);
    renderModule();
  }

  function handleAction(action, protocolo) {
    refresh();
    const record = recordById(protocolo);
    if (!record || !allowedActions(record).includes(action)) {
      renderModule();
      return;
    }

    if (action === "view") openDrawer(detailMarkup(record));
    else openDrawer(actionFormMarkup(record, action));
  }

  function bindEvents(container) {
    if (container.dataset.solEventsBound === "true") return;
    container.dataset.solEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-sol-search]")) filterRows();
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-sol-filter]")) filterRows();
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-sol-overlay]");
      if (!target) return;

      if (target.matches("[data-sol-close], [data-sol-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-sol-back]")) {
        refresh();
        const record = recordById(target.dataset.solBack);
        if (record) document.querySelector("[data-sol-drawer]").innerHTML = detailMarkup(record);
        else closeDrawer();
      } else if (target.matches("[data-sol-action]")) {
        handleAction(target.dataset.solAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-sol-confirm]")) {
        event.preventDefault();
        applyAction(event.target);
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

    // Nova solicitação aberta pelo filiado em outra aba aparece sem recarregar.
    window.addEventListener("storage", (event) => {
      const api = store();
      if (api && event.key === api.CHAVE && document.querySelector("[data-sol-drawer]")?.hidden) renderModule();
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
