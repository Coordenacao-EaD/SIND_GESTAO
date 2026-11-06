// Denúncias e Manifestações — Conselho de Ética / Conselho Fiscal (protótipo demonstrativo).
// Não confundir com Solicitações dos Filiados (T33) nem com documentos dos Conselhos (T31).
// O Conselho ativo é determinado EXCLUSIVAMENTE pelo perfil autenticado; não há seletor de Conselho.
// Presidência do Conselho / Membro do Conselho é uma autorização demonstrativa interna,
// não um perfil-base. Regras de acesso centralizadas em window.SindGestaoManifestacoes.
(() => {
  "use strict";

  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const PROFILE_LABELS = {
    administrador: "Administrador Geral",
    presidencia: "Presidência",
    diretoria: "Diretoria",
    secretaria: "Secretaria",
    tesouraria: "Tesouraria",
    conselhoEtica: "Conselho de Ética",
    conselhoFiscal: "Conselho Fiscal"
  };

  const ACTION_LABELS = {
    view: "Visualizar",
    iniciar: "Iniciar análise",
    andamento: "Registrar andamento",
    responder: "Registrar resposta formal",
    finalizar: "Finalizar",
    arquivar: "Arquivar"
  };

  const ACTION_TEXTS = {
    iniciar: "A manifestação passará de Recebida para Em análise. O manifestante verá apenas a alteração de situação.",
    andamento: "Observação interna do Conselho. Não é exibida ao manifestante e não altera a situação.",
    responder: "A resposta formal ficará disponível ao manifestante no acompanhamento por protocolo e chave. A situação passará para Respondida.",
    finalizar: "A manifestação passará para Finalizada. A resposta formal é preservada.",
    arquivar: "A manifestação passará para Arquivada. O registro continua existindo e não é excluído."
  };

  const VALIDATION_NOTICE =
    "Ambiente demonstrativo. O fluxo, as responsabilidades, a proteção de identidade e as regras de retenção dependem de validação institucional.";
  const PROTECTED_NOTICE =
    "Identidade protegida — dados pessoais do manifestante não são associados diretamente a este registro no protótipo.";

  let records = [];
  let lastFocused = null;

  /* ---------- Contexto (sempre relido) ---------- */

  function api() {
    return window.SindGestaoManifestacoes || null;
  }

  function currentProfile() {
    try {
      return window.localStorage.getItem(PROFILE_KEY) || "administrador";
    } catch {
      return "administrador";
    }
  }

  // Filtro no carregamento: a API devolve somente o Conselho do perfil ativo.
  function refresh() {
    const store = api();
    records = store ? store.lerDoConselhoAtivo() : [];
  }

  function recordById(protocolo) {
    const store = api();
    if (!store) return null;
    const record = store.lerDoConselhoAtivo().find((item) => item.protocolo === protocolo);
    return record && record.conselho === store.conselhoAtivo() ? record : null;
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

  const slug = (value) => normalize(value).replace(/\s+/g, "-");

  function formatDateTime(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso || ""));
    if (!match) return "—";
    return `${match[3]}/${match[2]}/${match[1]}${match[4] ? ` ${match[4]}:${match[5]}` : ""}`;
  }

  function optionList(values, selected, allLabel) {
    const first = allLabel === undefined ? "" : `<option value="">${allLabel}</option>`;
    return first + values.map(([value, label]) =>
      `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`
    ).join("");
  }

  function svgIcon(type) {
    const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    const paths = {
      view: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path><circle cx="12" cy="12" r="2.5"></circle>',
      iniciar: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
      andamento: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
      responder: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"></path>',
      finalizar: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>',
      arquivar: '<rect x="3" y="4" width="18" height="5" rx="1"></rect><path d="M5 9v10h14V9"></path><path d="M10 13h4"></path>'
    };
    return `<svg ${common}>${paths[type] || paths.view}</svg>`;
  }

  /* ---------- Renderização ---------- */

  function markNavigation() {
    document.querySelectorAll(".admin-nav__link").forEach((link) => {
      const current = link.getAttribute("href") === "admin-conselhos.html";
      link.classList.toggle("is-active", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderDenied(container, message) {
    container.innerHTML = `
      <div class="admin-docs__denied">
        <span aria-hidden="true">🔒</span>
        <h1 id="admin-content-title">Acesso restrito aos Conselhos</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>
    `;
  }

  const statusBadge = (status) =>
    `<span class="admin-docs__status admin-cons__status--${slug(status)}">${escapeHtml(status)}</span>`;

  function identityBadge(record) {
    const store = api();
    const protegida = record.identidade === "protegida";
    return `<span class="admin-cons__identity${protegida ? " admin-cons__identity--protegida" : ""}">${escapeHtml(store.IDENTIDADES[record.identidade])}</span>`;
  }

  function actionButtons(record) {
    return api().acoesPermitidas(record).map((action) => `
      <button
        type="button"
        class="admin-docs__icon-button"
        data-cons-action="${action}"
        data-id="${escapeHtml(record.protocolo)}"
        title="${ACTION_LABELS[action]}"
        aria-label="${ACTION_LABELS[action]}: ${escapeHtml(record.protocolo)}"
      >${svgIcon(action)}</button>
    `).join("");
  }

  function rowsMarkup(rows) {
    if (!rows.length) {
      return '<tr><td colspan="7" class="admin-docs__empty">Nenhuma manifestação encontrada.</td></tr>';
    }
    return rows.map((record) => `
      <tr>
        <td><span class="admin-docs__id">${escapeHtml(record.protocolo)}</span></td>
        <td>${formatDateTime(record.createdAt)}</td>
        <td>${escapeHtml(record.tipo)}</td>
        <td><strong>${escapeHtml(record.assunto)}</strong></td>
        <td>${identityBadge(record)}</td>
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

    const store = api();
    if (!store) {
      renderDenied(container, "Base demonstrativa de manifestações indisponível.");
      return;
    }

    const conselho = store.conselhoAtivo();
    if (!conselho) {
      records = [];
      const label = PROFILE_LABELS[currentProfile()] || "atual";
      renderDenied(container, `O perfil ${label} não possui acesso ao conteúdo das Denúncias e Manifestações. O acesso é restrito aos membros do Conselho destinatário, inclusive para o Administrador Geral.`);
      return;
    }

    refresh();
    const papel = store.papelAtivo();
    const conselhoLabel = store.CONSELHOS[conselho];
    const count = (status) => records.filter((r) => r.status === status).length;
    const stats = [
      ["Recebidas", store.STATUS.RECEIVED],
      ["Em análise", store.STATUS.ANALYSIS],
      ["Respondidas", store.STATUS.ANSWERED],
      ["Finalizadas", store.STATUS.FINALIZED],
      ["Arquivadas", store.STATUS.ARCHIVED]
    ].map(([label, status]) => `<article><span>${label}</span><strong>${count(status)}</strong></article>`).join("");

    const roleText = papel === "presidencia"
      ? "Consulta, inicia análise, registra andamento e resposta formal, finaliza e arquiva as manifestações deste Conselho."
      : "Consulta manifestações, detalhes e históricos deste Conselho. Não altera situação, não responde, não finaliza e não arquiva.";

    container.innerHTML = `
      <p class="admin-cons__validation" role="note"><strong>Ambiente demonstrativo.</strong> ${escapeHtml(VALIDATION_NOTICE.replace("Ambiente demonstrativo. ", ""))}</p>

      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">DENÚNCIAS E MANIFESTAÇÕES</span>
          <h1 id="admin-content-title">${escapeHtml(conselhoLabel.toUpperCase())}</h1>
          <p>Tratamento restrito das denúncias e manifestações encaminhadas a este Conselho.</p>
        </div>
        <div class="admin-docs__header-actions">
          <label class="admin-cons__role-switch">
            <span>AUTORIZAÇÃO DEMONSTRATIVA</span>
            <select data-cons-role aria-label="Autorização demonstrativa no Conselho">
              ${optionList(Object.entries(store.PAPEIS), papel)}
            </select>
          </label>
        </div>
      </header>

      <div class="admin-docs__role">
        <strong>${escapeHtml(store.PAPEIS[papel])}</strong>
        <span>${escapeHtml(roleText)}</span>
      </div>

      <div class="admin-docs__stats admin-cons__stats">${stats}</div>

      <section class="admin-docs__panel" aria-label="Manifestações do ${escapeHtml(conselhoLabel)}">
        <div class="admin-docs__filters admin-cons__filters" role="search">
          <label><span>Buscar</span><input type="search" placeholder="Protocolo ou assunto" data-cons-search></label>
          <label><span>Tipo</span><select data-cons-filter="tipo">${optionList(store.TIPOS.map((t) => [t, t]), "", "Todos")}</select></label>
          <label><span>Identidade</span><select data-cons-filter="identidade">${optionList(Object.entries(store.IDENTIDADES), "", "Todas")}</select></label>
          <label><span>Situação</span><select data-cons-filter="status">${optionList(store.FLUXO.map((s) => [s, s]), "", "Todas")}</select></label>
        </div>
        <p class="admin-docs__count" data-cons-count role="status" aria-live="polite"></p>
        <div class="admin-docs__table-wrap">
          <table class="admin-docs__table admin-cons__table">
            <thead>
              <tr>
                <th scope="col">Protocolo</th>
                <th scope="col">Data</th>
                <th scope="col">Tipo</th>
                <th scope="col">Assunto</th>
                <th scope="col">Identidade</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody data-cons-table></tbody>
          </table>
        </div>
      </section>

      <aside class="admin-docs__rule">
        <strong>Fluxo e escopo</strong>
        <p>Recebida → Em análise → Respondida → Finalizada → Arquivada. Somente a Presidência do Conselho executa as transições.
        Este módulo exibe apenas manifestações destinadas ao ${escapeHtml(conselhoLabel)}; o outro Conselho e os demais perfis administrativos não acessam este conteúdo.
        O aviso por e-mail aos membros é apenas representado no histórico. Não há exclusão de registros.</p>
      </aside>

      <div class="admin-docs__overlay" data-cons-overlay hidden></div>
      <aside class="admin-docs__drawer" data-cons-drawer role="dialog" aria-modal="true" aria-labelledby="cons-drawer-title" hidden></aside>
    `;

    filterRows();
    bindEvents(container);
  }

  function filterRows() {
    const term = normalize(document.querySelector("[data-cons-search]")?.value);
    const filters = [...document.querySelectorAll("[data-cons-filter]")];

    const filtered = records
      .filter((record) => {
        const text = normalize(`${record.protocolo} ${record.assunto}`);
        return (!term || text.includes(term))
          && filters.every((field) => !field.value || String(record[field.dataset.consFilter]) === field.value);
      })
      .sort((a, b) => b.protocolo.localeCompare(a.protocolo));

    const body = document.querySelector("[data-cons-table]");
    if (body) body.innerHTML = rowsMarkup(filtered);

    const countBox = document.querySelector("[data-cons-count]");
    if (countBox) countBox.textContent = `${filtered.length} manifestação(ões) demonstrativa(s)`;
  }

  /* ---------- Drawer ---------- */

  function openDrawer(markup) {
    const overlay = document.querySelector("[data-cons-overlay]");
    const drawer = document.querySelector("[data-cons-drawer]");
    if (!overlay || !drawer) return;

    if (drawer.hidden) lastFocused = document.activeElement;
    drawer.innerHTML = markup;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("textarea, button")?.focus();
  }

  function closeDrawer(restoreFocus = true) {
    const overlay = document.querySelector("[data-cons-overlay]");
    const drawer = document.querySelector("[data-cons-drawer]");
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
          <h2 id="cons-drawer-title">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="admin-docs__close" data-cons-close aria-label="Fechar">×</button>
      </header>
    `;
  }

  function historyMarkup(record) {
    return `
      <ol class="admin-docs__history">
        ${record.history.slice().reverse().map((entry) => `
          <li>
            <time datetime="${escapeHtml(entry.at)}">${formatDateTime(entry.at)}</time>
            <strong>${escapeHtml(entry.papel)} · ${escapeHtml(entry.conselho)}
              <span class="admin-cons__visibility${entry.visivelManifestante ? "" : " admin-cons__visibility--interno"}">${entry.visivelManifestante ? "Visível ao manifestante" : "Interno"}</span>
            </strong>
            <span>${escapeHtml(entry.action)}</span>
            ${entry.note ? `<em>${escapeHtml(entry.note)}</em>` : ""}
          </li>`).join("")}
      </ol>
    `;
  }

  function identityDetail(record) {
    if (record.identidade === "protegida") {
      return `<p class="admin-cons__protected">${escapeHtml(PROTECTED_NOTICE)}</p>`;
    }
    return `
      <dl class="admin-docs__details">
        <div><dt>Manifestante (demonstrativo)</dt><dd>${escapeHtml(record.manifestanteNome || "—")}</dd></div>
        <div><dt>Identificador demonstrativo</dt><dd>${escapeHtml(record.manifestanteId || "—")}</dd></div>
      </dl>`;
  }

  function detailMarkup(record) {
    const store = api();
    const actions = store.acoesPermitidas(record).filter((action) => action !== "view");

    return `
      ${drawerHeader(`MANIFESTAÇÃO · ${record.protocolo}`, record.assunto)}

      <div class="admin-docs__drawer-status">
        <span>Situação</span>
        <strong>${statusBadge(record.status)}</strong>
      </div>

      <dl class="admin-docs__details">
        <div><dt>Protocolo</dt><dd>${escapeHtml(record.protocolo)}</dd></div>
        <div><dt>Data</dt><dd>${formatDateTime(record.createdAt)}</dd></div>
        <div><dt>Tipo</dt><dd>${escapeHtml(record.tipo)}</dd></div>
        <div><dt>Conselho destinatário</dt><dd>${escapeHtml(store.CONSELHOS[record.conselho])}</dd></div>
        <div><dt>Identidade</dt><dd>${identityBadge(record)}</dd></div>
        <div><dt>Atualizada em</dt><dd>${formatDateTime(record.updatedAt)}</dd></div>
        <div><dt>Respondida em</dt><dd>${formatDateTime(record.respondedAt)}</dd></div>
        <div><dt>Finalizada em</dt><dd>${formatDateTime(record.finalizedAt)}</dd></div>
        <div><dt>Arquivada em</dt><dd>${formatDateTime(record.archivedAt)}</dd></div>
      </dl>

      <section class="admin-docs__drawer-section"><h3>Manifestante</h3>${identityDetail(record)}</section>
      <section class="admin-docs__drawer-section"><h3>Assunto</h3><p>${escapeHtml(record.assunto)}</p></section>
      <section class="admin-docs__drawer-section"><h3>Descrição</h3><p class="admin-cons__text">${escapeHtml(record.descricao)}</p></section>

      ${record.respostaFormal ? `
        <section class="admin-docs__drawer-section">
          <h3>Resposta formal</h3>
          <p class="admin-cons__text admin-cons__answer">${escapeHtml(record.respostaFormal)}</p>
        </section>` : ""}

      <section class="admin-docs__drawer-section">
        <h3>Histórico</h3>
        ${historyMarkup(record)}
        <p class="admin-docs__form-note">Eventos “Internos” não são exibidos no acompanhamento por protocolo e chave.</p>
      </section>

      ${actions.length ? `
        <div class="admin-docs__drawer-actions">
          ${actions.map((action) => `
            <button type="button" class="button ${action === "andamento" ? "button--secondary" : "button--primary"}"
              data-cons-action="${action}" data-id="${escapeHtml(record.protocolo)}">
              ${ACTION_LABELS[action].toUpperCase()}
            </button>`).join("")}
        </div>` : ""}
    `;
  }

  function actionFormMarkup(record, action) {
    let fields = "";
    if (action === "responder") {
      fields = `
        <label class="admin-docs__field">
          <span>Resposta formal *</span>
          <textarea name="resposta" rows="7" required maxlength="3000"></textarea>
        </label>`;
    } else if (action === "andamento") {
      fields = `
        <label class="admin-docs__field">
          <span>Observação interna * (não exibida ao manifestante)</span>
          <textarea name="nota" rows="4" required maxlength="1000"></textarea>
        </label>`;
    }

    return `
      ${drawerHeader(`MANIFESTAÇÃO · ${record.protocolo}`, ACTION_LABELS[action])}
      <p><strong>${escapeHtml(record.assunto)}</strong> · ${statusBadge(record.status)}</p>
      <p>${ACTION_TEXTS[action]}</p>
      <form data-cons-confirm="${action}" data-id="${escapeHtml(record.protocolo)}" novalidate>
        ${fields}
        <p class="admin-docs__form-error" data-cons-error role="alert" hidden></p>
        <div class="admin-docs__drawer-actions">
          <button type="button" class="button button--secondary" data-cons-back="${escapeHtml(record.protocolo)}">VOLTAR</button>
          <button type="submit" class="button button--primary">CONFIRMAR</button>
        </div>
      </form>
    `;
  }

  /* ---------- Ações ---------- */

  function showError(form, message) {
    const box = form.querySelector("[data-cons-error]");
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  }

  // A validação definitiva (perfil, Conselho, papel, registro, situação e transição)
  // é refeita dentro de executarAcao, relendo o storage.
  function applyAction(form) {
    const store = api();
    if (!store) return;
    const data = new FormData(form);
    const result = store.executarAcao(form.dataset.id, form.dataset.consConfirm, {
      resposta: String(data.get("resposta") ?? ""),
      nota: String(data.get("nota") ?? "")
    });
    if (!result.ok) {
      showError(form, result.erro);
      return;
    }
    renderModule();
  }

  function handleAction(action, protocolo) {
    const record = recordById(protocolo);
    if (!record || !api().acoesPermitidas(record).includes(action)) {
      renderModule();
      return;
    }
    if (action === "view") openDrawer(detailMarkup(record));
    else openDrawer(actionFormMarkup(record, action));
  }

  function bindEvents(container) {
    if (container.dataset.consEventsBound === "true") return;
    container.dataset.consEventsBound = "true";

    container.addEventListener("input", (event) => {
      if (event.target.matches("[data-cons-search]")) filterRows();
    });

    container.addEventListener("change", (event) => {
      if (event.target.matches("[data-cons-filter]")) filterRows();
      if (event.target.matches("[data-cons-role]")) {
        api()?.definirPapel(event.target.value);
        renderModule();
      }
    });

    container.addEventListener("click", (event) => {
      const target = event.target.closest("button, [data-cons-overlay]");
      if (!target) return;

      if (target.matches("[data-cons-close], [data-cons-overlay]")) {
        closeDrawer();
      } else if (target.matches("[data-cons-back]")) {
        const record = recordById(target.dataset.consBack);
        if (record) document.querySelector("[data-cons-drawer]").innerHTML = detailMarkup(record);
        else closeDrawer();
      } else if (target.matches("[data-cons-action]")) {
        handleAction(target.dataset.consAction, target.dataset.id);
      }
    });

    container.addEventListener("submit", (event) => {
      if (event.target.matches("[data-cons-confirm]")) {
        event.preventDefault();
        applyAction(event.target);
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

    // Nova manifestação registrada em outra aba aparece sem recarregar.
    window.addEventListener("storage", (event) => {
      const store = api();
      if (store && event.key === store.CHAVE && document.querySelector("[data-cons-drawer]")?.hidden) renderModule();
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
