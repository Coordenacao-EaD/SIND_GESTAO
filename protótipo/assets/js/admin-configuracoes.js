// T36 — Configurações (protótipo demonstrativo).
// A. Parâmetros administrativos básicos (somente identificação institucional já pública).
// B. Conteúdo institucional com fluxo editorial versionado:
//    Rascunho → Em revisão → Aprovado → Publicado
//    Em revisão → Ajustes solicitados → Em edição → Em revisão
// Base única: localStorage["sindGestao.institutionalContentDemo"]. "Publicado" significa
// apenas autorizado neste fluxo administrativo: a área pública NÃO lê esta base ainda.
// Não há configurações técnicas (servidor, banco, e-mail, segurança) neste protótipo.
(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.institutionalContentDemo";
  const PAGE_FILE = "admin-configuracoes.html";

  const STATUS = Object.freeze({
    DRAFT: "Rascunho",
    REVIEW: "Em revisão",
    CHANGES: "Ajustes solicitados",
    EDITING: "Em edição",
    APPROVED: "Aprovado",
    PUBLISHED: "Publicado",
    SUPERSEDED: "Substituído"
  });

  const WORKING = [STATUS.DRAFT, STATUS.REVIEW, STATUS.CHANGES, STATUS.EDITING, STATUS.APPROVED];
  const EDITABLE = [STATUS.DRAFT, STATUS.CHANGES, STATUS.EDITING];

  // Papéis editoriais. Perfis ausentes (Tesouraria, Conselhos) não acessam o módulo.
  const ROLES = Object.freeze({
    administrador: { edit: true, review: false, publish: false, params: true, label: "Gestão técnica: cria, edita, encaminha para revisão e consulta o histórico. Não aprova." },
    diretoria: { edit: true, review: false, publish: false, params: false, label: "Cria, edita, encaminha para revisão e consulta." },
    secretaria: { edit: true, review: false, publish: false, params: false, label: "Cria, edita, encaminha para revisão e consulta." },
    presidencia: { edit: false, review: true, publish: true, params: false, label: "Revisa, devolve para ajustes, aprova e publica. Nunca aprova versão que tenha criado ou editado." }
  });

  const PUBLIC_NOTICE = "Conteúdo publicado no fluxo administrativo demonstrativo. A integração com a área pública será realizada na etapa final.";
  const PREVIEW_NOTICE = "Pré-visualização demonstrativa. O conteúdo ainda não está integrado à área pública.";

  /*
   * Seções e campos. Os valores iniciais reproduzem o conteúdo estático já existente
   * nas páginas públicas (index.html, sindicato.html, diretoria.html, galeria.js,
   * contato.html). Dados oficiais ainda inexistentes ficam vazios ("a confirmar").
   */
  const SECTIONS = [
    {
      id: "home", label: "Página Inicial", source: "index.html",
      fields: [
        { name: "heroTitle", label: "Chamada principal", required: true },
        { name: "heroSubtitle", label: "Chamada secundária" },
        { name: "heroText", label: "Texto de apresentação", type: "textarea" },
        { name: "ctaLabel", label: "Texto do botão principal (CTA)", required: true },
        { name: "aboutText", label: "Texto “Sobre o Sindicato”", type: "textarea" },
        { name: "highlights", label: "Destaques / atalhos (um por linha)", type: "list" }
      ],
      seed: {
        heroTitle: "Juntos somos mais fortes.",
        heroSubtitle: "Unidos, conquistamos direitos.",
        heroText: "Defendemos os direitos, valorizamos o servidor e construímos um serviço público cada vez melhor para toda a sociedade.",
        ctaLabel: "Filie-se",
        aboutText: "O SINPROTEC/MT atua na representação de seus filiados e na defesa de seus interesses coletivos, com diálogo e participação sindical.",
        highlights: "Convênios e Benefícios\nAssessoria Jurídica\nGuias e Requerimentos\nCalendário de Atividades\nFale com o Sindicato\nPerguntas Frequentes"
      }
    },
    {
      id: "institutional", label: "Institucional", source: "html/sindicato.html",
      fields: [
        { name: "title", label: "Título", required: true },
        { name: "summary", label: "Resumo", type: "textarea", required: true },
        { name: "mission", label: "Missão", type: "textarea" }
      ],
      seed: {
        title: "O Sindicato",
        summary: "O SINPROTEC/MT atua na representação de seus filiados e na defesa de seus interesses coletivos.",
        mission: "Representar e defender os servidores públicos, promovendo valorização profissional, participação coletiva, transparência e respeito aos direitos da categoria."
      }
    },
    {
      id: "board", label: "Diretoria", source: "html/diretoria.html",
      fields: [
        { name: "intro", label: "Apresentação", type: "textarea" },
        { name: "mandate", label: "Mandato oficial" },
        { name: "members", label: "Membros (um por linha: Cargo | Nome)", type: "list", required: true }
      ],
      seed: {
        intro: "A Diretoria é responsável pela representação institucional, pela condução das atividades administrativas e pela execução das decisões aprovadas pelas instâncias do sindicato.",
        mandate: "",
        members: "Presidente | Nome demonstrativo\nVice-Presidente | Nome demonstrativo\nSecretário-Geral | Nome demonstrativo\nTesoureiro | Nome demonstrativo\nSecretária de Formação | Nome demonstrativo\nSecretário de Comunicação | Nome demonstrativo"
      }
    },
    {
      id: "gallery", label: "Galeria", source: "assets/js/galeria.js",
      fields: [
        { name: "items", label: "Itens (um por linha: Título | Legenda | Referência da imagem)", type: "list", required: true }
      ],
      seed: {
        items: "Assembleia Geral dos Servidores | Votação das propostas pelo plenário. | assets/images/noticias/assembleia.png\nReunião da Diretoria | Análise dos documentos da pauta. | assets/images/noticias/negociacao.png\nEncontro com Filiados | Escuta e diálogo com os filiados. | assets/images/contato/atendimento.jpg"
      }
    },
    {
      id: "contacts", label: "Contatos", source: "html/contato.html",
      fields: [
        { name: "address", label: "Endereço" },
        { name: "phone", label: "Telefone" },
        { name: "email", label: "E-mail institucional", type: "email" },
        { name: "hours", label: "Horário de atendimento" },
        { name: "social", label: "Redes sociais (uma por linha)", type: "list" }
      ],
      // A área pública ainda exibe "a confirmar" para todos os canais: nada é inventado.
      seed: { address: "", phone: "", email: "", hours: "", social: "" }
    }
  ];

  const PARAM_FIELDS = [
    { name: "acronym", label: "Sigla", required: true },
    { name: "officialName", label: "Nome institucional por extenso" },
    { name: "tagline", label: "Frase institucional (rodapé)" }
  ];
  const PARAM_SEED = { acronym: "SINPROTEC/MT", officialName: "", tagline: "Em defesa dos servidores, em benefício da sociedade." };

  /* ---------- Perfis ---------- */

  function perfis() {
    return window.SindGestaoAdminPerfis || null;
  }

  function currentProfile() {
    return perfis() ? perfis().current() : "";
  }

  function profileLabel(profile) {
    return perfis() ? perfis().label(profile) : profile;
  }

  function canOpenModule(profile) {
    const api = perfis();
    if (!api || api.isCouncil(profile)) return false;
    return Boolean(ROLES[profile])
      && (api.hasPermission(profile, "settings") || api.hasPermission(profile, "institutionalContent"));
  }

  function role(profile) {
    return canOpenModule(profile) ? ROLES[profile] : null;
  }

  /* ---------- Armazenamento ---------- */

  function nowIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function event(action, profile, version, note) {
    const entry = { at: nowIso(), action, profile: profileLabel(profile) || profile, version };
    if (note) entry.note = note;
    return entry;
  }

  function seedState() {
    const at = "2026-11-06T08:00:00";
    const sections = {};
    SECTIONS.forEach((s) => {
      sections[s.id] = {
        versions: [{
          number: 1, status: STATUS.PUBLISHED, data: { ...s.seed },
          author: "referencia", contributors: [],
          createdAt: at, updatedAt: at, publishedAt: at
        }],
        history: [{ at, action: "Versão de referência registrada a partir do conteúdo estático atual do site.", profile: "Referência do protótipo", version: 1 }]
      };
    });
    return {
      schema: 1,
      parameters: { data: { ...PARAM_SEED }, updatedAt: at, history: [{ at, action: "Parâmetros iniciais registrados a partir do conteúdo público atual.", profile: "Referência do protótipo" }] },
      sections
    };
  }

  // Seed somente na ausência da chave; nunca acrescenta registros a uma base existente.
  function load() {
    let parsed = null;
    try {
      parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      parsed = null;
    }
    if (parsed && typeof parsed === "object" && parsed.sections && parsed.parameters) {
      SECTIONS.forEach((s) => {
        if (!parsed.sections[s.id]) parsed.sections[s.id] = seedState().sections[s.id];
      });
      return parsed;
    }
    const fresh = seedState();
    save(fresh);
    return fresh;
  }

  function save(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Persistência apenas demonstrativa.
    }
  }

  /* ---------- Regras do fluxo editorial (puras sobre o estado) ---------- */

  function sectionState(state, sectionId) {
    return state.sections[sectionId];
  }

  function published(sec) {
    return sec.versions.find((v) => v.status === STATUS.PUBLISHED) || null;
  }

  function working(sec) {
    return sec.versions.find((v) => WORKING.includes(v.status)) || null;
  }

  const snapshot = (data) => JSON.stringify(data);

  function fail(message) {
    return { ok: false, error: message };
  }

  function allowedActions(state, sectionId, profile) {
    const r = role(profile);
    const sec = sectionState(state, sectionId);
    if (!r || !sec) return [];
    const w = working(sec);
    const actions = [];
    if (r.edit && !w) actions.push("create");
    if (w && r.edit && EDITABLE.includes(w.status)) actions.push("edit", "submit");
    if (w && r.review && w.status === STATUS.REVIEW) {
      actions.push("return");
      if (!w.contributors.includes(profile)) actions.push("approve");
    }
    if (w && r.publish && w.status === STATUS.APPROVED) actions.push("publish");
    return actions;
  }

  function validate(section, data) {
    const missing = section.fields.filter((f) => f.required && !String(data[f.name] || "").trim()).map((f) => f.label);
    if (missing.length) return `Preencha: ${missing.join(", ")}.`;
    const email = section.fields.find((f) => f.type === "email");
    if (email && data[email.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[email.name])) return "Informe um e-mail válido.";
    if (section.id === "board" || section.id === "gallery") {
      const field = section.id === "board" ? "members" : "items";
      const parts = section.id === "board" ? 2 : 3;
      const bad = String(data[field] || "").split("\n").filter((l) => l.trim()).some((l) => l.split("|").map((p) => p.trim()).filter(Boolean).length < parts);
      if (bad) return section.id === "board" ? "Cada membro deve seguir o formato Cargo | Nome." : "Cada item deve seguir o formato Título | Legenda | Referência da imagem.";
    }
    return "";
  }

  function apply(state, sectionId, action, profile, payload = {}) {
    const section = SECTIONS.find((s) => s.id === sectionId);
    const sec = section && sectionState(state, sectionId);
    if (!sec) return fail("Seção inexistente.");
    if (!allowedActions(state, sectionId, profile).includes(action)) {
      const w = working(sec);
      if (action === "approve" && w && w.contributors.includes(profile)) {
        return fail("O autor ou editor de uma versão não pode aprová-la.");
      }
      return fail("Ação não permitida para este perfil na situação atual.");
    }
    const w = working(sec);
    const note = String(payload.note || "").trim();

    if (action === "create") {
      const base = published(sec);
      const number = Math.max(...sec.versions.map((v) => v.number)) + 1;
      const version = {
        number, status: STATUS.DRAFT,
        data: { ...(base ? base.data : section.seed) },
        author: profile, contributors: [profile],
        createdAt: nowIso(), updatedAt: nowIso(), basedOn: base ? base.number : null
      };
      sec.versions.push(version);
      sec.history.push(event("Nova versão criada como Rascunho.", profile, number, base ? `Baseada na versão publicada ${base.number}.` : ""));
      return { ok: true, version };
    }

    if (action === "edit") {
      const data = {};
      section.fields.forEach((f) => { data[f.name] = String(payload.data?.[f.name] ?? "").trim(); });
      const error = validate(section, data);
      if (error) return fail(error);
      const wasChanges = w.status === STATUS.CHANGES;
      w.data = data;
      w.updatedAt = nowIso();
      if (!w.contributors.includes(profile)) w.contributors.push(profile);
      if (wasChanges) w.status = STATUS.EDITING;
      sec.history.push(event(wasChanges ? "Nova edição após ajustes solicitados." : "Conteúdo editado.", profile, w.number));
      return { ok: true, version: w };
    }

    if (action === "submit") {
      const error = validate(section, w.data);
      if (error) return fail(error);
      w.status = STATUS.REVIEW;
      w.reviewSnapshot = snapshot(w.data);
      w.submittedAt = nowIso();
      sec.history.push(event("Encaminhado para revisão.", profile, w.number, note));
      return { ok: true, version: w };
    }

    if (action === "return") {
      if (!note) return fail("Informe a observação dos ajustes solicitados.");
      w.status = STATUS.CHANGES;
      w.reviewSnapshot = null;
      sec.history.push(event("Devolvido para ajustes.", profile, w.number, note));
      return { ok: true, version: w };
    }

    if (action === "approve") {
      if (w.reviewSnapshot !== snapshot(w.data)) return fail("A versão foi alterada após o envio para revisão e não pode ser aprovada.");
      w.status = STATUS.APPROVED;
      w.approvedBy = profile;
      w.approvedAt = nowIso();
      w.approvedSnapshot = w.reviewSnapshot;
      sec.history.push(event("Versão aprovada.", profile, w.number, note));
      return { ok: true, version: w };
    }

    if (action === "publish") {
      if (w.approvedSnapshot !== snapshot(w.data)) return fail("Somente a versão aprovada, sem alterações, pode ser publicada.");
      const previous = published(sec);
      if (previous) {
        previous.status = STATUS.SUPERSEDED;
        previous.supersededAt = nowIso();
      }
      w.status = STATUS.PUBLISHED;
      w.publishedAt = nowIso();
      w.publishedBy = profile;
      sec.history.push(event("Versão publicada no fluxo administrativo.", profile, w.number,
        previous ? `Versão ${previous.number} preservada como Substituída.` : ""));
      return { ok: true, version: w };
    }

    return fail("Ação desconhecida.");
  }

  function updateParameters(state, profile, data) {
    const r = role(profile);
    if (!r || !r.params || !perfis().hasPermission(profile, "settings")) return fail("Somente o perfil com permissão de Configurações altera os parâmetros.");
    const next = {};
    PARAM_FIELDS.forEach((f) => { next[f.name] = String(data?.[f.name] ?? "").trim(); });
    if (!next.acronym) return fail("Preencha: Sigla.");
    const changed = PARAM_FIELDS.filter((f) => next[f.name] !== state.parameters.data[f.name]).map((f) => f.label);
    if (!changed.length) return fail("Nenhuma alteração para salvar.");
    state.parameters.data = next;
    state.parameters.updatedAt = nowIso();
    state.parameters.history.push(event("Parâmetros atualizados.", profile, undefined, `Campos: ${changed.join(", ")}.`));
    return { ok: true };
  }

  /* ---------- Interface ---------- */

  const ui = { tab: "home", panel: "content", message: null, preview: false };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function slug(text) {
    return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  function formatDateTime(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ""));
    return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : "—";
  }

  function statusBadge(status) {
    return `<span class="admin-docs__status admin-docs__status--${slug(status)}">${escapeHtml(status)}</span>`;
  }

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
        <h1 id="admin-content-title">Configurações</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button button--primary" href="admin-painel.html">Voltar ao painel</a>
      </div>`;
  }

  const lines = (text) => String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const orPending = (value) => (String(value || "").trim() ? escapeHtml(value) : "<em>Dado oficial a confirmar</em>");

  function previewMarkup(section, data) {
    if (section.id === "home") {
      return `<h3>${escapeHtml(data.heroTitle)}</h3><p><strong>${escapeHtml(data.heroSubtitle)}</strong></p><p>${escapeHtml(data.heroText)}</p>
        <p><span class="admin-cfg__fake-button">${escapeHtml(data.ctaLabel)}</span></p><p>${escapeHtml(data.aboutText)}</p>
        <ul>${lines(data.highlights).map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`;
    }
    if (section.id === "institutional") {
      return `<h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.summary)}</p>${data.mission ? `<h4>Missão</h4><p>${escapeHtml(data.mission)}</p>` : ""}`;
    }
    if (section.id === "board") {
      return `<p>${escapeHtml(data.intro)}</p><p><strong>Mandato oficial:</strong> ${orPending(data.mandate)}</p>
        <ul class="admin-cfg__cards">${lines(data.members).map((l) => { const [cargo, nome] = l.split("|").map((p) => p.trim()); return `<li><strong>${escapeHtml(cargo)}</strong><span>${escapeHtml(nome)}</span></li>`; }).join("")}</ul>`;
    }
    if (section.id === "gallery") {
      return `<ul class="admin-cfg__cards">${lines(data.items).map((l) => { const [t, leg, img] = l.split("|").map((p) => p.trim()); return `<li><strong>${escapeHtml(t)}</strong><span>${escapeHtml(leg)}</span><small>Imagem: ${escapeHtml(img)}</small></li>`; }).join("")}</ul>`;
    }
    return `<dl class="admin-cfg__dl">
      <dt>Endereço</dt><dd>${orPending(data.address)}</dd>
      <dt>Telefone</dt><dd>${orPending(data.phone)}</dd>
      <dt>E-mail</dt><dd>${orPending(data.email)}</dd>
      <dt>Atendimento</dt><dd>${orPending(data.hours)}</dd>
      <dt>Redes sociais</dt><dd>${lines(data.social).length ? lines(data.social).map(escapeHtml).join("<br>") : "<em>Dado oficial a confirmar</em>"}</dd>
    </dl>`;
  }

  function fieldMarkup(field, value, disabled) {
    const id = `cfg-${field.name}`;
    const common = `id="${id}" name="${field.name}"${field.required ? " required aria-required=\"true\"" : ""}${disabled ? " disabled" : ""}`;
    const input = field.type === "textarea" || field.type === "list"
      ? `<textarea ${common} rows="${field.type === "list" ? 6 : 4}">${escapeHtml(value)}</textarea>`
      : `<input type="${field.type === "email" ? "email" : "text"}" ${common} value="${escapeHtml(value)}">`;
    return `<div class="admin-docs__field"><label for="${id}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>${input}</div>`;
  }

  function historyMarkup(history) {
    return `<ol class="admin-docs__history">${[...history].reverse().map((h) => `
      <li><strong>${escapeHtml(h.action)}</strong>
      <span>${formatDateTime(h.at)} — ${escapeHtml(h.profile)}${h.version ? ` — versão ${h.version}` : ""}</span>
      ${h.note ? `<em>${escapeHtml(h.note)}</em>` : ""}</li>`).join("")}</ol>`;
  }

  function messageMarkup() {
    if (!ui.message) return "";
    const m = ui.message;
    return `<p class="admin-cfg__message admin-cfg__message--${m.ok ? "ok" : "error"}" role="${m.ok ? "status" : "alert"}" tabindex="-1" data-cfg-message>${escapeHtml(m.text)}</p>`;
  }

  function contentPanel(state, profile) {
    const section = SECTIONS.find((s) => s.id === ui.tab);
    const sec = sectionState(state, section.id);
    const pub = published(sec);
    const w = working(sec);
    const actions = allowedActions(state, section.id, profile);
    const canEdit = actions.includes("edit");
    const shown = w || pub;
    const selfBlocked = w && w.status === STATUS.REVIEW && role(profile).review && w.contributors.includes(profile);

    const tabs = SECTIONS.map((s) => `
      <button type="button" role="tab" class="admin-docs__tab" id="cfg-tab-${s.id}" aria-controls="cfg-panel"
        aria-selected="${s.id === ui.tab}" tabindex="${s.id === ui.tab ? 0 : -1}" data-cfg-tab="${s.id}">${escapeHtml(s.label)}</button>`).join("");

    const btn = (action, label, kind = "secondary") => actions.includes(action)
      ? `<button type="button" class="button button--${kind}" data-cfg-action="${action}">${label}</button>` : "";

    return `
      <div class="admin-docs__tabs" role="tablist" aria-label="Seções do conteúdo institucional">${tabs}</div>
      <section class="admin-docs__panel admin-cfg__panel" id="cfg-panel" role="tabpanel" aria-labelledby="cfg-tab-${section.id}">
        <div class="admin-cfg__status">
          <div><span>Versão publicada</span><strong>${pub ? `v${pub.number} ${statusBadge(pub.status)}` : "Nenhuma"}</strong></div>
          <div><span>Versão em trabalho</span><strong>${w ? `v${w.number} ${statusBadge(w.status)}` : "Nenhuma"}</strong></div>
          <div><span>Referência pública atual</span><strong>${escapeHtml(section.source)}</strong></div>
        </div>
        ${pub ? `<p class="admin-docs__form-note">${PUBLIC_NOTICE}</p>` : ""}
        ${selfBlocked ? '<p class="admin-docs__form-note" role="note">Esta versão foi criada ou editada por este perfil: a aprovação deve ser feita por outro responsável.</p>' : ""}
        ${messageMarkup()}

        <form class="admin-cfg__form" data-cfg-form novalidate>
          <fieldset ${canEdit ? "" : "disabled"}>
            <legend>${canEdit ? `Editando versão ${w.number}` : `Conteúdo da versão ${shown.number} (somente leitura)`}</legend>
            <div class="admin-docs__form-grid admin-cfg__grid">
              ${section.fields.map((f) => fieldMarkup(f, shown.data[f.name], !canEdit)).join("")}
            </div>
          </fieldset>
          ${actions.includes("return") || actions.includes("approve") || actions.includes("submit") || actions.includes("publish") ? `
            <div class="admin-docs__field admin-cfg__note">
              <label for="cfg-note">Observação ${actions.includes("return") ? "(obrigatória para devolver)" : "(opcional)"}</label>
              <textarea id="cfg-note" rows="2" data-cfg-note></textarea>
            </div>` : ""}
          <div class="admin-docs__drawer-actions admin-cfg__actions">
            ${btn("create", "Criar nova versão", "primary")}
            ${canEdit ? '<button type="submit" class="button button--secondary">Salvar edição</button>' : ""}
            ${btn("submit", "Encaminhar para revisão", "primary")}
            ${btn("return", "Devolver para ajustes")}
            ${btn("approve", "Aprovar versão", "primary")}
            ${btn("publish", "Publicar", "primary")}
            <button type="button" class="button button--secondary" data-cfg-preview aria-expanded="${ui.preview}" aria-controls="cfg-preview">${ui.preview ? "Ocultar pré-visualização" : "Pré-visualizar"}</button>
          </div>
        </form>

        <div id="cfg-preview" class="admin-cfg__preview" ${ui.preview ? "" : "hidden"}>
          <p class="admin-docs__notice">${PREVIEW_NOTICE}</p>
          <div class="admin-cfg__preview-body">${previewMarkup(section, shown.data)}</div>
        </div>

        <details class="admin-cfg__history">
          <summary>Histórico da seção ${escapeHtml(section.label)} (${sec.history.length})</summary>
          ${historyMarkup(sec.history)}
        </details>
      </section>`;
  }

  function paramsPanel(state, profile) {
    const editable = Boolean(role(profile).params && perfis().hasPermission(profile, "settings"));
    return `
      <section class="admin-docs__panel admin-cfg__panel" aria-labelledby="cfg-params-title">
        <h2 id="cfg-params-title" class="admin-cfg__title">Parâmetros administrativos básicos</h2>
        <p class="admin-cfg__intro">Identificação institucional já exibida no site. Telefone, e-mail, endereço, horário e redes sociais são mantidos na aba <strong>Contatos</strong> do conteúdo institucional. Não há configurações técnicas de servidor, banco, e-mail ou segurança neste protótipo.</p>
        ${messageMarkup()}
        <form data-cfg-params novalidate>
          <fieldset ${editable ? "" : "disabled"}>
            <legend>${editable ? "Editar parâmetros" : "Somente leitura — alteração restrita ao Administrador Geral"}</legend>
            <div class="admin-docs__form-grid admin-cfg__grid">
              ${PARAM_FIELDS.map((f) => fieldMarkup({ ...f, name: f.name }, state.parameters.data[f.name], !editable)).join("")}
            </div>
          </fieldset>
          ${editable ? '<div class="admin-cfg__actions"><button type="submit" class="button button--primary">Salvar parâmetros</button></div>' : ""}
        </form>
        <details class="admin-cfg__history">
          <summary>Histórico dos parâmetros (${state.parameters.history.length})</summary>
          ${historyMarkup(state.parameters.history)}
        </details>
      </section>`;
  }

  function renderModule() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;
    markNavigation();

    if (!perfis()) {
      renderDenied(container, "Matriz de perfis indisponível.");
      return;
    }
    const profile = currentProfile();
    if (!canOpenModule(profile)) {
      renderDenied(container, `O perfil ${profileLabel(profile)} não possui acesso às Configurações nem ao conteúdo institucional.`);
      return;
    }

    const state = load();
    const r = role(profile);

    container.innerHTML = `
      <p class="admin-docs__notice">Conteúdo demonstrativo mantido apenas neste navegador. Nenhuma página pública é alterada por este módulo.</p>
      <header class="admin-docs__header">
        <div>
          <span class="admin-docs__eyebrow">ADMINISTRAÇÃO</span>
          <h1 id="admin-content-title">CONFIGURAÇÕES</h1>
          <p>Parâmetros institucionais básicos e administração futura dos conteúdos públicos, com revisão, aprovação e publicação versionadas.</p>
        </div>
        <div class="admin-docs__header-actions">
          <span class="admin-docs__profile">${escapeHtml(profileLabel(profile))}</span>
        </div>
      </header>
      <div class="admin-docs__role"><strong>Papel editorial</strong><span>${escapeHtml(r.label)}</span></div>
      <div class="admin-cfg__switch" role="group" aria-label="Área de configuração">
        <button type="button" class="button button--${ui.panel === "content" ? "primary" : "secondary"}" aria-pressed="${ui.panel === "content"}" data-cfg-panel="content">Conteúdo institucional</button>
        <button type="button" class="button button--${ui.panel === "params" ? "primary" : "secondary"}" aria-pressed="${ui.panel === "params"}" data-cfg-panel="params">Parâmetros administrativos</button>
      </div>
      ${ui.panel === "params" ? paramsPanel(state, profile) : contentPanel(state, profile)}`;

    if (ui.message) container.querySelector("[data-cfg-message]")?.focus();
  }

  function formData(form) {
    const data = {};
    form.querySelectorAll("input[name], textarea[name]").forEach((el) => { data[el.name] = el.value; });
    return data;
  }

  function run(mutator, okText) {
    const state = load();
    const result = mutator(state);
    if (result.ok) save(state);
    ui.message = { ok: result.ok, text: result.ok ? okText : result.error };
    renderModule();
    ui.message = null;
  }

  const ACTION_TEXT = {
    create: "Nova versão criada como Rascunho. A versão publicada foi preservada.",
    submit: "Versão encaminhada para revisão.",
    return: "Versão devolvida para ajustes.",
    approve: "Versão aprovada. Aguardando publicação.",
    publish: PUBLIC_NOTICE
  };

  function bindEvents() {
    const container = document.querySelector("[data-admin-content]");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-cfg-tab]");
      if (tab) {
        ui.tab = tab.dataset.cfgTab;
        ui.preview = false;
        renderModule();
        container.querySelector(`[data-cfg-tab="${ui.tab}"]`)?.focus();
        return;
      }
      const panel = e.target.closest("[data-cfg-panel]");
      if (panel) {
        ui.panel = panel.dataset.cfgPanel;
        renderModule();
        container.querySelector(`[data-cfg-panel="${ui.panel}"]`)?.focus();
        return;
      }
      if (e.target.closest("[data-cfg-preview]")) {
        ui.preview = !ui.preview;
        renderModule();
        container.querySelector("[data-cfg-preview]")?.focus();
        return;
      }
      const action = e.target.closest("[data-cfg-action]");
      if (action) {
        const name = action.dataset.cfgAction;
        const note = container.querySelector("[data-cfg-note]")?.value || "";
        run((state) => apply(state, ui.tab, name, currentProfile(), { note }), ACTION_TEXT[name]);
      }
    });

    container.addEventListener("keydown", (e) => {
      const tab = e.target.closest("[data-cfg-tab]");
      if (!tab || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
      const ids = SECTIONS.map((s) => s.id);
      const next = ids[(ids.indexOf(tab.dataset.cfgTab) + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
      ui.tab = next;
      ui.preview = false;
      renderModule();
      container.querySelector(`[data-cfg-tab="${next}"]`)?.focus();
    });

    container.addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.target.matches("[data-cfg-form]")) {
        const data = formData(e.target);
        run((state) => apply(state, ui.tab, "edit", currentProfile(), { data }), "Edição salva na versão em trabalho.");
      } else if (e.target.matches("[data-cfg-params]")) {
        const data = formData(e.target);
        run((state) => updateParameters(state, currentProfile(), data), "Parâmetros salvos.");
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.matches("[data-admin-profile-select]")) window.setTimeout(renderModule, 0);
    });

    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) renderModule();
    });
  }

  // API para validação automatizada das regras (sem DOM).
  window.SindGestaoConteudoInstitucional = Object.freeze({
    STORAGE_KEY, STATUS, SECTION_IDS: SECTIONS.map((s) => s.id),
    canOpenModule, allowedActions, apply, updateParameters, load, save,
    published, working
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
