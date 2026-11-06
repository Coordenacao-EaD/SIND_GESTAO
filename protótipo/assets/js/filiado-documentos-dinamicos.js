// T31 — Insere na Área do Filiado as atas e documentos publicados no módulo administrativo.
// Deve ser carregado ANTES de area-filiado.js, que captura os [data-record] na inicialização.
(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.documentsDemo";

  // Somente estes escopos podem chegar ao filiado. Financeiro, Diretoria e Conselhos nunca aparecem.
  const SCOPE_BADGES = {
    "Público": "Público",
    "Filiados": "Restrito a Filiados"
  };

  // Categorias confidenciais bloqueadas mesmo que o escopo esteja incoerente.
  const BLOCKED_CATEGORIES = ["Documento financeiro", "Conselho de Ética", "Conselho Fiscal"];

  // Conversão para o vocabulário de categorias já usado pelos filtros desta página.
  const CATEGORY_MAP = {
    "Ata": "Atas",
    "Pauta": "Assembleias",
    "Comunicado interno": "Comunicados internos",
    "Relatório": "Relatórios"
  };

  // Somente os PDFs demonstrativos existentes podem gerar link.
  const SAFE_FILES = [
    "../assets/docs/ata-assembleia-demonstrativa.pdf",
    "../assets/docs/pauta-assembleia-geral-demonstrativa.pdf"
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalize(text) {
    return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function loadRecords() {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function isPublishable(record) {
    return record && typeof record === "object"
      && record.status === "Publicado"
      && Object.prototype.hasOwnProperty.call(SCOPE_BADGES, record.scope)
      && !BLOCKED_CATEGORIES.includes(record.category)
      && (record.kind === "atas" || record.kind === "documentos")
      && /^\d{4}-\d{2}-\d{2}$/.test(String(record.date || ""))
      && record.title;
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function fileMarkup(record) {
    const file = record.file;
    if (file && SAFE_FILES.includes(file.href)) {
      const href = escapeHtml(file.href);
      const name = escapeHtml(file.name);
      const title = escapeHtml(record.title);
      return `
        <div class="filiado-arquivo"><p class="filiado-arquivo__status">Arquivo disponível</p><div class="filiado-arquivo__acoes">
          <a class="filiado-arquivo__acao" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Visualizar ${title} em nova aba">Visualizar</a>
          <a class="filiado-arquivo__acao filiado-arquivo__acao--secundaria" href="${href}" download="${name}" aria-label="Baixar arquivo de ${title}">Baixar PDF</a>
        </div></div>`;
    }
    if (file && file.name) {
      return `<div class="filiado-arquivo filiado-arquivo--indisponivel"><p class="filiado-arquivo__status">Arquivo demonstrativo registrado (${escapeHtml(file.name)}). O download estará disponível na versão definitiva.</p></div>`;
    }
    return '<div class="filiado-arquivo filiado-arquivo--indisponivel"><p class="filiado-arquivo__status">Arquivo ainda não disponibilizado nesta demonstração.</p></div>';
  }

  function cardMarkup(record) {
    const category = CATEGORY_MAP[record.category] || "Documentos sindicais";
    const year = /^\d{4}$/.test(String(record.year)) ? String(record.year) : record.date.slice(0, 4);
    const safeId = String(record.id).replace(/[^\w-]/g, "").toLowerCase();
    const text = record.kind === "atas" ? (record.summary || "") : (record.description || "");
    const origin = record.kind === "atas" && record.assembly && record.assembly.title
      ? `<p><small>Origem: ${escapeHtml(record.assembly.title)}</small></p>` : "";

    return `
      <article id="documento-${escapeHtml(safeId)}" class="filiado-card" data-record data-dynamic-document
        data-categoria="${escapeHtml(category)}" data-ano="${escapeHtml(year)}" data-situacao="Vigente">
        <div class="filiado-meta"><span class="filiado-badge">${escapeHtml(SCOPE_BADGES[record.scope])}</span><span>${escapeHtml(category)} · ${escapeHtml(year)} · Vigente</span></div>
        <h2>${escapeHtml(record.title)}</h2>
        <p>${escapeHtml(text)} <time datetime="${escapeHtml(record.date)}">(${formatDate(record.date)})</time></p>
        ${origin}
        ${fileMarkup(record)}
      </article>
    `;
  }

  function ensureYearOptions(years) {
    const select = document.querySelector('[data-filter="ano"]');
    if (!select) return;
    const existing = new Set([...select.options].map((option) => option.value || option.textContent));
    years.filter((year) => !existing.has(year)).forEach((year) => {
      const option = document.createElement("option");
      option.textContent = year;
      select.appendChild(option);
    });
  }

  function render() {
    const list = document.querySelector(".filiado-list");
    if (!list) return;

    // Evita duplicação com os cards estáticos e entre registros dinâmicos.
    const knownTitles = new Set(
      [...list.querySelectorAll("[data-record] h2")].map((heading) => normalize(heading.textContent))
    );
    const knownIds = new Set();

    const visible = loadRecords()
      .filter(isPublishable)
      .filter((record) => {
        const title = normalize(record.title);
        if (knownIds.has(record.id) || knownTitles.has(title)) return false;
        knownIds.add(record.id);
        knownTitles.add(title);
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    ensureYearOptions(visible.map((r) => (/^\d{4}$/.test(String(r.year)) ? String(r.year) : r.date.slice(0, 4))));
    list.insertAdjacentHTML("afterbegin", visible.map(cardMarkup).join(""));
  }

  // Executa sincronamente (script defer, antes de area-filiado.js), com o DOM já analisado.
  render();
})();
