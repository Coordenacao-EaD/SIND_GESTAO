// T34 — Enquetes e Votações (área administrativa, protótipo demonstrativo).
// Fluxo administrativo: Rascunho -> Liberada. Após a liberação, a situação temporal
// (Agendada / Aberta / Encerrada) é derivada de início e fim.
// Somente a Presidência cria, edita rascunhos e libera. A área administrativa NÃO registra votos.
// Base única compartilhada com a Área do Filiado: localStorage["sindGestao.votingDemo"],
// acessada pela API window.SindGestaoVotacoes (filiado-votacoes-dinamicas.js).
// Eleições sindicais formais não fazem parte deste módulo.
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

  /*
   * Matriz de permissões.
   * drafts: enxerga Rascunhos; manage: cria, edita Rascunho e libera;
   * participants: vê a lista de participantes de consultas Identificadas.
   * Perfis ausentes (Tesouraria, Conselhos) não acessam o módulo.
   */
  const PERMISSIONS = Object.freeze({
    presidencia: {
      role: ["Responsável pelo módulo", "Cria, configura e libera enquetes e votações; acompanha participação, resultados e histórico."],
      drafts: true, manage: true, participants: true
    },
    administrador: {
      role: ["Consulta técnica", "Consulta todas as consultas e históricos. Não cria, não edita, não libera e não registra votos."],
      drafts: true, manage: false, participants: true
    },
    diretoria: {
      role: ["Somente consulta", "Consulta as enquetes e votações já Liberadas, sem dados individuais de consultas sigilosas."],
      drafts: false, manage: false, participants: false
    },
    secretaria: {
      role: ["Consulta operacional", "Acompanha as enquetes e votações já Liberadas, sem dados individuais de consultas sigilosas."],
      drafts: false, manage: false, participants: false
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

  // Sempre relido no momento do uso.
  function perms() {
    return PERMISSIONS[currentProfile()] || null;
  }

  function api() {
    return window.SindGestaoVotacoes || null;
  }

  function situation(record) {
    return api().situacao(record);
  }

  function inScope(record, p = perms()) {
    return Boolean(p && record && (p.drafts || record.statusAdministrativo === api().STATUS_ADM.LIBERADA));
  }

  function canSeeResult(record, p = perms()) {
    return inScope(record, p) && situation(record) === api().SITUACAO.ENCERRADA;
  }

  function allowedActions(record) {
    const p = perms();
    if (!inScope(record, p)) return [];
    const actions = ["view"];
    const isDraft = record.statusAdministrativo === api().STATUS_ADM.RASCUNHO;
    if (p.manage && isDraft) actions.push("edit", "release");
    if (canSeeResult(record, p)) actions.push("result");
    return actions;
  }

  /* ---------- Armazenamento ---------- */

  function refresh() {
    const p = perms();
    records = p && api() ? api().lerTodas().filter((r) => inScope(r, p)) : [];
  }

  function recordById(id) {
    const record = records.find((item) => item.id === id);
    return inScope(record) ? record : null;
  }

  /* ---------- Utilidades ---------- */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function slug(value) {
    return normalize(value).replace(/\s+/g, "-");
  }

  function formatDateTime(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso || ""));
    if (!match) return "—";
    return `${match[3]}/${match[2]}/${match[1]}${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
  }

  function toInputValue(iso) {
    const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(String(iso || ""));
    return match ? match[1] : "";
  }

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
      release: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>',
      result: '<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M22 20H2"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  const ACTION_LABELS = {
    view: "Visualizar",
    edit: "Editar rascunho",
    release: "Liberar consulta",
    result: "Resultado"
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
      const current = link.getAttribute("href") === "admin-votacoes.html";
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderDenied(container, message) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Enquetes e Votações</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  function statusBadge(record) {
    const sit = situation(record);
    const admin = record.statusAdministrativo === api().STATUS_ADM.LIBERADA ? ' title="Liberada pela Presidência"' : "";
    return `<span class="admin-docs__status admin-docs__status--${slug(sit)}"${admin}>${escapeHtml(sit)}</span>`;
  }

  function chip(text, secret) {
    return `<span class="admin-vot__chip${secret ? " admin-vot__chip--sigilosa" : ""}">${escapeHtml(text)}</span>`;
  }

  function actionButtons(record) {
    return allowedActions(record).map((action) => `
      <button type="button" class="admin-docs__icon-button admin-docs__icon-button--${action}"
        data-vot-action="${action}" data-id="${escapeHtml(record.id)}"
        title="${ACTION_LABELS[action]}" aria-label="${ACTION_LABELS[action]}: ${escapeHtml(record.id)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function rowsMarkup(rows) {
    if (!rows.length) {
      return '<tr><td colspan="8" class="admin-docs__empty">Nenhuma consulta encontrada.</td></tr>';
    }
    return rows.map((record) => `
      <tr>
        <td><span class="admin-docs__id">${escapeHtml(record.id)}</span></td>
        <td>${escapeHtml(record.tipo)}</td>
        <td><strong>${escapeHtml(record.titulo)}</strong></td>
        <td>${chip(record.publico)}</td>
        <td>${formatDateTime(record.inicioAt)}<br>${formatDateTime(record.fimAt)}</td>
        <td>${statusBadge(record)}</td>
        <td>${record.statusAdministrativo === api().STATUS_ADM.LIBERADA ? record.participacoes.length : "—"}</td>
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
      renderDenied(container, `O perfil ${PROFILE_LABELS[currentProfile()]} não possui acesso a Enquetes e Votações.`);
      return;
    }
    if (!api()) {
      renderDenied(container, "Base demonstrativa de enquetes e votações indisponível.");
      return;
    }

    refresh();
    const S = api().SITUACAO;
    const count = (sit) => records.filter((r) => situation(r) === sit).length;
    const cards = [["Rascunhos", S.RASCUNHO], ["Agendadas", S.AGENDADA], ["Abertas", S.ABERTA], ["Encerradas", S.ENCERRADA]]
      .filter(([, sit]) => p.drafts || sit !== S.RASCUNHO)
      .map(([label, sit]) => `<article><span>${label}</span><strong>${count(sit)}</strong></article>`).join("");

    const drafts = records.filter((r) => r.statusAdministrativo === api().STATUS_ADM.RASCUNHO).length;
    const situations = p.drafts ? Object.values(S) : Object.values(S).filter((s) => s !== S.RASCUNHO);

    container.innerHTML = `
      <p class="admin-docs__notice">
        Conteúdo demonstrativo. Consultas fictícias mantidas apenas neste navegador e compartilhadas com a Área do Filiado.
      </p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">PARTICIPAÇÃO</span>
          <h1 id="admin-content-title">ENQUETES E VOTAÇÕES</h1>
          <p>Criação, liberação e acompanhamento de consultas destinadas aos públicos autorizados.</p>
        </div>
        <div class="admin-docs__header-actions">
          <span class="admin-docs__profile">${escapeHtml(PROFILE_LABELS[currentProfile()])}</span>
          ${p.manage ? '<button type="button" class="button button--primary" data-vot-new>NOVA ENQUETE / VOTAÇÃO</button>' : ""}
        </div>
      </header>

      <div class="admin-docs__role">
        <strong>${escapeHtml(p.role[0])}</strong>
        <span>${escapeHtml(p.role[1])}</span>
      </div>

      <div class="admin-docs__stats">${cards}</div>

      ${p.manage && drafts ? `
        <aside class="admin-docs__alert" role="note">
          <strong>${drafts} ${drafts === 1 ? "enquete aguardando" : "consultas aguardando"} liberação da Presidência</strong>
          <span>Revise o rascunho e utilize “Liberar consulta” para disponibilizá-lo ao público definido.</span>
        </aside>` : ""}

      <section class="admin-docs__panel" aria-label="Enquetes e Votações">
        <div class="admin-docs__filters admin-vot__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Título ou pergunta" data-vot-search></label>
          <label><span>Tipo</span><select data-vot-filter="tipo">${optionList(api().TIPOS, "", "Todos")}</select></label>
          <label><span>Público</span><select data-vot-filter="publico">${optionList(api().PUBLICOS, "", "Todos")}</select></label>
          <label><span>Situação</span><select data-vot-filter="situacao">${optionList(situations, "", "Todas")}</select></label>
        </div>
        <p class="admin-docs__count" data-vot-count role="status" aria-live="polite"></p>
        <div class="admin-docs__table-wrap">
          <table class="admin-docs__table admin-vot__table">
            <thead>
              <tr>
                <th scope="col">Identificação</th>
                <th scope="col">Tipo</th>
                <th scope="col">Título</th>
                <th scope="col">Público</th>
                <th scope="col">Período</th>
                <th scope="col">Situação</th>
                <th scope="col">Participações</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-vot-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-docs__rule">
        <strong>Fluxo e regras</strong>
        <p>Rascunho → Liberada. Após a liberação, a situação segue o período: Agendada antes do início, Aberta entre início e fim, Encerrada após o fim.
        Somente a Presidência cria e libera. Depois de liberada, a consulta não pode ser alterada. A área administrativa não registra votos em nome de usuários.
        Eleições sindicais formais não fazem parte deste módulo.</p>
      </aside>

      <div class="admin-docs__overlay" data-vot-overlay hidden></div>
      <aside class="admin-docs__drawer" data-vot-drawer role="dialog" aria-modal="true" aria-labelledby="vot-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const term = normalize(document.querySelector("[data-vot-search]")?.value);
    const filters = [...document.querySelectorAll("[data-vot-filter]")];

    const filtered = records
      .filter((record) => {
        const text = normalize(`${record.id} ${record.titulo} ${record.pergunta}`);
        const values = { tipo: record.tipo, publico: record.publico, situacao: situation(record) };
        return (!term || text.includes(term))
          && filters.every((field) => !field.value || values[field.dataset.votFilter] === field.value);
      })
      .sort((a, b) => b.id.localeCompare(a.id));

    const body = document.querySelector("[data-vot-table]");
    if (body) body.innerHTML = rowsMarkup(filtered);
    const countBox = document.querySelector("[data-vot-count]");
    if (countBox) countBox.textContent = `${filtered.length} consulta(s) demonstrativa(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-vot-overlay]");
    const drawer = document.querySelector("[data-vot-drawer]");
    if (!overlay || !drawer) return;
    if (drawer.hidden) lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("input, select, textarea, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-vot-overlay]");
    const drawer = document.querySelector("[data-vot-drawer]");
    const wasOpen = drawer && !drawer.hidden;
    if (overlay) overlay.hidden = true;
    if (drawer) {
      drawer.hidden = true;
      drawer.innerHTML = "";
    }
    document.body.style.overflow = "";
    if (wasOpen && restoreFocus && lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  }

  function drawerHeader(eyebrow, title) {
    return `
      <header class="admin-docs__drawer-header">
        <div>
          <span class="admin-docs__eyebrow">${escapeHtml(eyebrow)}</span>
          <h2 id="vot-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-docs__close" data-vot-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function historyMarkup(record) {
    return `
      <ol class="admin-docs__history">
        ${record.history.slice().reverse().map((entry) => `
          <li>
            <time datetime="${escapeHtml(entry.at)}">${formatDateTime(entry.at)}</time>
            <strong>${escapeHtml(entry.profile)}</strong>
            <span>${escapeHtml(entry.action)}</span>
          </li>`).join("")}
      </ol>
    `;
  }

  function resultMarkup(record) {
    const r = api().apurar(record);
    return `
      <div class="admin-vot__result">
        ${r.linhas.map((l) => `
          <div class="admin-vot__result-row">
            <div><strong>${escapeHtml(l.texto)}</strong><span>${l.votos} voto(s) · ${l.percentual}%</span></div>
            <progress max="100" value="${l.percentual}">${l.percentual}%</progress>
          </div>`).join("")}
      </div>
      <p><strong>Total de participações:</strong> ${r.participacoes}</p>
    `;
  }

  // Lista individual somente para consultas Identificadas e perfis autorizados.
  function participantsMarkup(record, p) {
    if (record.modalidade === "Sigilosa") {
      return '<p class="admin-vot__secret">Modalidade sigilosa: a associação entre participante e opção votada não é exibida.</p>';
    }
    if (!p.participants) {
      return "<p>Dados individuais de participação disponíveis somente para Presidência e Administrador Geral.</p>";
    }
    if (!record.votes.length) return "<p>Nenhuma participação registrada.</p>";
    const options = Object.fromEntries(record.opcoes.map((o) => [o.id, o.texto]));
    return `
      <ul class="admin-vot__options-list">
        ${record.votes.map((v) => `<li><span class="admin-docs__mono">${escapeHtml(v.participanteId || "—")}</span> · ${escapeHtml(options[v.opcaoId] || "—")}</li>`).join("")}
      </ul>`;
  }

  function detailMarkup(record) {
    const p = perms();
    const actions = allowedActions(record).filter((a) => a !== "view");
    const released = record.statusAdministrativo === api().STATUS_ADM.LIBERADA;

    return `
      ${drawerHeader(`${record.tipo.toUpperCase()} · ${record.id}`, record.titulo)}

      <div class="admin-docs__drawer-status">
        <span>Situação</span>
        <strong>${statusBadge(record)}</strong>
      </div>

      <dl class="admin-docs__details">
        <div><dt>Tipo</dt><dd>${escapeHtml(record.tipo)}</dd></div>
        <div><dt>Situação administrativa</dt><dd>${escapeHtml(record.statusAdministrativo)}</dd></div>
        <div><dt>Público</dt><dd>${chip(record.publico)}</dd></div>
        <div><dt>Modalidade</dt><dd>${chip(record.modalidade, record.modalidade === "Sigilosa")}</dd></div>
        <div><dt>Início</dt><dd>${formatDateTime(record.inicioAt)}</dd></div>
        <div><dt>Encerramento</dt><dd>${formatDateTime(record.fimAt)}</dd></div>
        <div><dt>Participantes</dt><dd>${released ? record.participacoes.length : "—"}</dd></div>
        <div><dt>Regra de resultado</dt><dd>${record.resultadoVisivelAoPublicoParticipante
          ? "Disponibilizado aos participantes após o encerramento"
          : "Não disponibilizado aos participantes"}</dd></div>
        <div><dt>Criada por</dt><dd>${escapeHtml(record.createdBy)} · ${formatDateTime(record.createdAt)}</dd></div>
        <div><dt>Liberada por</dt><dd>${released ? `${escapeHtml(record.releasedBy)} · ${formatDateTime(record.releasedAt)}` : "—"}</dd></div>
      </dl>

      ${record.descricao ? `<section class="admin-docs__drawer-section"><h3>Descrição</h3><p>${escapeHtml(record.descricao)}</p></section>` : ""}
      <section class="admin-docs__drawer-section"><h3>Pergunta</h3><p>${escapeHtml(record.pergunta)}</p></section>
      <section class="admin-docs__drawer-section">
        <h3>Opções</h3>
        <ol class="admin-vot__options-list">${record.opcoes.map((o) => `<li>${escapeHtml(o.texto)}</li>`).join("")}</ol>
      </section>

      ${canSeeResult(record, p) ? `
        <section class="admin-docs__drawer-section"><h3>Resultado consolidado</h3>${resultMarkup(record)}</section>` : released ? `
        <section class="admin-docs__drawer-section"><h3>Resultado</h3><p>O resultado é consolidado somente após o encerramento.</p></section>` : ""}

      ${released ? `<section class="admin-docs__drawer-section"><h3>Participação</h3>${participantsMarkup(record, p)}</section>` : ""}

      <section class="admin-docs__drawer-section">
        <h3>Histórico</h3>
        ${historyMarkup(record)}
      </section>

      ${actions.length ? `
        <div class="admin-docs__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "release" ? "button--primary" : "button--secondary"}"
              data-vot-action="${action}" data-id="${escapeHtml(record.id)}">${ACTION_LABELS[action].toUpperCase()}</button>`).join("")}
        </div>` : ""}
    `;
  }

  function optionRow(value = "") {
    return `
      <div class="admin-vot__option-row">
        <input type="text" name="opcao" maxlength="160" value="${escapeHtml(value)}" aria-label="Texto da opção">
        <button type="button" class="button button--secondary" data-vot-remove-option aria-label="Remover opção">×</button>
      </div>`;
  }

  function formMarkup(record) {
    const r = record || {};
    const A = api();
    const opcoes = r.opcoes && r.opcoes.length ? r.opcoes.map((o) => o.texto) : ["", ""];
    const resultChecked = record ? r.resultadoVisivelAoPublicoParticipante === true : true;

    return `
      ${drawerHeader(record ? `RASCUNHO · ${record.id}` : "PRESIDÊNCIA", record ? "Editar rascunho" : "Nova enquete / votação")}
      <form data-vot-form data-id="${escapeHtml(r.id || "")}" novalidate>
        <div class="admin-docs__form-grid">
          <label class="admin-docs__field"><span>Tipo *</span>
            <select name="tipo" required>${optionList(A.TIPOS, r.tipo, "Selecione")}</select></label>
          <label class="admin-docs__field"><span>Título *</span>
            <input type="text" name="titulo" maxlength="160" required value="${escapeHtml(r.titulo)}"></label>
        </div>
        <label class="admin-docs__field"><span>Descrição</span>
          <textarea name="descricao" rows="3" maxlength="1000">${escapeHtml(r.descricao)}</textarea></label>
        <label class="admin-docs__field"><span>Pergunta *</span>
          <input type="text" name="pergunta" maxlength="300" required value="${escapeHtml(r.pergunta)}"></label>

        <fieldset class="admin-docs__field">
          <legend><strong>Opções * (mínimo 2)</strong></legend>
          <div class="admin-vot__options-editor" data-vot-options>${opcoes.map(optionRow).join("")}</div>
          <button type="button" class="button button--secondary" data-vot-add-option>ADICIONAR OPÇÃO</button>
        </fieldset>

        <div class="admin-docs__form-grid">
          <label class="admin-docs__field"><span>Público *</span>
            <select name="publico" required>${optionList(A.PUBLICOS, r.publico, "Selecione")}</select></label>
          <label class="admin-docs__field"><span>Modalidade *</span>
            <select name="modalidade" required>${optionList(A.MODALIDADES, r.modalidade, "Selecione")}</select></label>
          <label class="admin-docs__field"><span>Início *</span>
            <input type="datetime-local" name="inicioAt" required value="${toInputValue(r.inicioAt)}"></label>
          <label class="admin-docs__field"><span>Fim *</span>
            <input type="datetime-local" name="fimAt" required value="${toInputValue(r.fimAt)}"></label>
        </div>

        <label class="admin-vot__check">
          <input type="checkbox" name="resultadoVisivel"${resultChecked ? " checked" : ""}>
          <span>Disponibilizar resultado aos participantes após o encerramento.</span>
        </label>

        <p class="admin-docs__form-note">A consulta é salva como Rascunho. Após a liberação, pergunta, opções, público, modalidade, período e regra de resultado não podem ser alterados.</p>
        <p class="admin-docs__form-error" data-vot-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-vot-close>CANCELAR</button>
          <button type="submit" class="button button--primary">SALVAR RASCUNHO</button>
        </div>
      </form>
    `;
  }

  function releaseMarkup(record) {
    return `
      ${drawerHeader(`RASCUNHO · ${record.id}`, "Liberar consulta")}
      <p><strong>${escapeHtml(record.titulo)}</strong></p>
      <p>A consulta será disponibilizada ao público <strong>${escapeHtml(record.publico)}</strong>, na modalidade
      <strong>${escapeHtml(record.modalidade)}</strong>, de ${formatDateTime(record.inicioAt)} a ${formatDateTime(record.fimAt)}.
      Após a liberação, a consulta não poderá ser alterada.</p>
      <form data-vot-release data-id="${escapeHtml(record.id)}" novalidate>
        <p class="admin-docs__form-error" data-vot-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-vot-back="${escapeHtml(record.id)}">VOLTAR</button>
          <button type="submit" class="button button--primary">LIBERAR CONSULTA</button>
        </div>
      </form>
    `;
  }

  /* ---------- Validação e ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-vot-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  // Validação única usada ao salvar e, novamente, no momento da liberação.
  function validate(data) {
    const A = api();
    if (!A.TIPOS.includes(data.tipo)) return "Selecione o tipo.";
    if (!data.titulo) return "Informe o título.";
    if (!data.pergunta) return "Informe a pergunta.";
    if (!Array.isArray(data.opcoes) || data.opcoes.filter((o) => String(o.texto || "").trim()).length < 2) {
      return "Informe ao menos 2 opções não vazias.";
    }
    if (!A.PUBLICOS.includes(data.publico)) return "Selecione o público.";
    if (!A.MODALIDADES.includes(data.modalidade)) return "Selecione a modalidade.";
    const inicio = A.parseData(data.inicioAt);
    const fim = A.parseData(data.fimAt);
    if (!inicio) return "Informe a data e o horário de início.";
    if (!fim) return "Informe a data e o horário de encerramento.";
    if (fim <= inicio) return "O encerramento deve ser posterior ao início.";
    return "";
  }

  function readForm(form) {
    const data = new FormData(form);
    const value = (name) => String(data.get(name) ?? "").trim();
    const withSeconds = (v) => (v && v.length === 16 ? `${v}:00` : v);
    const textos = data.getAll("opcao").map((t) => String(t).trim()).filter(Boolean);
    return {
      tipo: value("tipo"),
      titulo: value("titulo"),
      descricao: value("descricao"),
      pergunta: value("pergunta"),
      opcoes: textos.map((texto, i) => ({ id: `op-${i + 1}`, texto })),
      publico: value("publico"),
      modalidade: value("modalidade"),
      inicioAt: withSeconds(value("inicioAt")),
      fimAt: withSeconds(value("fimAt")),
      resultadoVisivelAoPublicoParticipante: data.get("resultadoVisivel") === "on"
    };
  }

  function requireManager(form) {
    // Revalidação do perfil no momento da execução: somente a Presidência gerencia.
    const p = perms();
    if (currentProfile() !== "presidencia" || !p || !p.manage) {
      showError(form, "Somente a Presidência pode criar, editar e liberar enquetes e votações.");
      return false;
    }
    return true;
  }

  function saveDraft(form) {
    if (!requireManager(form)) return;
    const A = api();
    const input = readForm(form);
    const error = validate(input);
    if (error) return showError(form, error);

    const all = A.lerTodas();
    const at = A.isoLocal();
    const id = form.dataset.id;

    if (id) {
      const record = all.find((r) => r.id === id);
      if (!record) return showError(form, "Consulta não encontrada.");
      if (record.statusAdministrativo !== A.STATUS_ADM.RASCUNHO) {
        return showError(form, "Consultas liberadas não podem ser alteradas.");
      }
      Object.assign(record, input);
      record.history.push({ at, profile: PROFILE_LABELS.presidencia, action: "Rascunho editado." });
    } else {
      all.push({
        id: A.proximoId(all),
        ...input,
        statusAdministrativo: A.STATUS_ADM.RASCUNHO,
        createdBy: PROFILE_LABELS.presidencia,
        createdAt: at,
        releasedBy: null,
        releasedAt: null,
        closedAt: null,
        votes: [],
        participacoes: [],
        history: [{ at, profile: PROFILE_LABELS.presidencia, action: "Consulta criada como Rascunho." }]
      });
    }

    if (!A.salvarTodas(all)) return showError(form, "Não foi possível gravar neste navegador.");
    renderModule();
  }

  function release(form) {
    if (!requireManager(form)) return;
    const A = api();
    const all = A.lerTodas();
    const record = all.find((r) => r.id === form.dataset.id);
    if (!record) return showError(form, "Consulta não encontrada.");
    if (record.statusAdministrativo !== A.STATUS_ADM.RASCUNHO) return showError(form, "A consulta já foi liberada.");

    const error = validate(record);
    if (error) return showError(form, `Revise o rascunho antes de liberar: ${error}`);
    if (A.parseData(record.fimAt) <= new Date()) {
      return showError(form, "O período de encerramento já passou. Edite o rascunho antes de liberar.");
    }

    const at = A.isoLocal();
    record.statusAdministrativo = A.STATUS_ADM.LIBERADA;
    record.releasedBy = PROFILE_LABELS.presidencia;
    record.releasedAt = at;
    record.history.push({ at, profile: PROFILE_LABELS.presidencia, action: "Consulta liberada." });

    if (!A.salvarTodas(all)) return showError(form, "Não foi possível gravar neste navegador.");
    renderModule();
  }

  function handleAction(action, id) {
    refresh();
    const record = recordById(id);
    if (!record || !allowedActions(record).includes(action)) {
      renderModule();
      return;
    }
    if (action === "edit") openDrawer(formMarkup(record));
    else if (action === "release") openDrawer(releaseMarkup(record));
    else openDrawer(detailMarkup(record));
    if (action === "result") document.querySelector("[data-vot-drawer] .admin-vot__result")?.scrollIntoView({ block: "center" });
  }

  function bindEvents(container) {
    if (container.dataset.votEventsBound === "true") return;
    container.dataset.votEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-vot-search]")) filterRows();
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-vot-filter]")) filterRows();
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-vot-overlay]");
      if (!target) return;

      if (target.matches("[data-vot-close], [data-vot-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-vot-new]")) {
        const p = perms();
        if (p && p.manage) openDrawer(formMarkup(null));
        else renderModule();
      } else if (target.matches("[data-vot-add-option]")) {
        const list = target.closest("form").querySelector("[data-vot-options]");
        list.insertAdjacentHTML("beforeend", optionRow());
        list.lastElementChild.querySelector("input").focus();
      } else if (target.matches("[data-vot-remove-option]")) {
        const list = target.closest("[data-vot-options]");
        if (list.children.length > 2) target.closest(".admin-vot__option-row").remove();
      } else if (target.matches("[data-vot-back]")) {
        refresh();
        const record = recordById(target.dataset.votBack);
        if (record) document.querySelector("[data-vot-drawer]").innerHTML = detailMarkup(record);
        else closeDrawer();
      } else if (target.matches("[data-vot-action]")) {
        handleAction(target.dataset.votAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-vot-form]")) {
        event.preventDefault();
        saveDraft(event.target);
      } else if (event.target.matches("[data-vot-release]")) {
        event.preventDefault();
        release(event.target);
      }
    });
  }

  function init() {
    if (!document.querySelector("[data-admin-content]")) return;

    renderModule();

    // area-admin.js grava o novo perfil e re-renderiza o shell no mesmo evento.
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-admin-profile-select]")) window.setTimeout(renderModule, 0);
    });

    // Participação registrada em outra aba atualiza a contagem sem recarregar.
    window.addEventListener("storage", (event) => {
      const A = api();
      if (A && event.key === A.CHAVE && document.querySelector("[data-vot-drawer]")?.hidden) renderModule();
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
