// T30 — Insere na Área do Filiado as assembleias/reuniões do módulo administrativo.
// Deve ser carregado ANTES de area-filiado.js, que captura os [data-record] na inicialização.
(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.assembliesDemo";

  // Somente estas situações são visíveis ao filiado (Rascunho, Aguardando autorização e Cancelada nunca aparecem).
  // Os rótulos seguem o vocabulário já usado pelos filtros desta página.
  const VISIBLE_STATUS = {
    Agendada: "Próxima",
    Encerrada: "Encerrada"
  };

  const MODALITIES = ["Presencial", "Online", "Híbrida"];

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

  function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatTime(value) {
    const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
    if (!match) return "";
    return match[2] === "00" ? `${match[1]}h` : `${match[1]}h${match[2]}`;
  }

  function isSafeInternalRef(value) {
    return /^[\w\-./#?=&]+$/.test(value) && !value.includes("..") && !value.startsWith("//");
  }

  function isSafeLink(value) {
    return /^https:\/\/[^\s<>"']+$/i.test(value);
  }

  function accessMarkup(record) {
    const parts = [];
    if (record.location) parts.push(escapeHtml(record.location));

    if (record.accessLink && isSafeLink(record.accessLink)) {
      parts.push(record.status === "Agendada"
        ? `<a class="filiado-link" href="${escapeHtml(record.accessLink)}" target="_blank" rel="noopener noreferrer">Acessar link da reunião (demonstrativo)</a>`
        : "Acesso online encerrado.");
    }

    return parts.length ? parts.join(" · ") : "Informação de acesso ainda não disponibilizada.";
  }

  function cardMarkup(record) {
    const situation = VISIBLE_STATUS[record.status];
    const safeId = String(record.id).replace(/[^\w-]/g, "");
    const time = formatTime(record.time);
    const documentMarkup = record.document && isSafeInternalRef(record.document)
      ? `<a class="filiado-link" href="${escapeHtml(record.document)}">Consultar documento relacionado →</a>`
      : "<p>Nenhum documento relacionado nesta demonstração.</p>";

    return `
      <article id="assembleia-${escapeHtml(safeId.toLowerCase())}" class="filiado-card" data-record data-dynamic-assembly
        data-situacao="${escapeHtml(situation)}" data-modalidade="${escapeHtml(record.modality)}">
        <div class="filiado-meta"><span class="filiado-badge">${escapeHtml(situation)}</span><span>${escapeHtml(record.modality)}</span><span>${escapeHtml(record.type)}</span></div>
        <h2>${escapeHtml(record.title)}</h2>
        <p><time datetime="${escapeHtml(record.date)}">${formatDate(record.date)}</time>${time ? ` · ${escapeHtml(time)} (horário de Cuiabá)` : ""}</p>
        <details>
          <summary>Ver detalhes: ${escapeHtml(record.title)}</summary>
          <p><strong>Local / acesso:</strong> ${accessMarkup(record)}</p>
          <p><strong>Pauta:</strong> ${escapeHtml(record.agenda || "—")}</p>
          ${documentMarkup}
        </details>
      </article>
    `;
  }

  function render() {
    const list = document.querySelector(".filiado-list");
    if (!list) return;

    // Evita duplicação: ignora registros cujo título já existe nos cards estáticos ou já inseridos.
    const knownTitles = new Set(
      [...list.querySelectorAll("[data-record] h2")].map((heading) => normalize(heading.textContent))
    );
    const knownIds = new Set();

    const visible = loadRecords()
      .filter((record) =>
        record && typeof record === "object"
        && Object.prototype.hasOwnProperty.call(VISIBLE_STATUS, record.status)
        && record.audience === "Filiados"
        && MODALITIES.includes(record.modality)
        && isValidDate(record.date)
        && record.title)
      .filter((record) => {
        const title = normalize(record.title);
        if (knownIds.has(record.id) || knownTitles.has(title)) return false;
        knownIds.add(record.id);
        knownTitles.add(title);
        return true;
      });

    const scheduled = visible.filter((r) => r.status === "Agendada").sort((a, b) => a.date.localeCompare(b.date));
    const closed = visible.filter((r) => r.status === "Encerrada").sort((a, b) => b.date.localeCompare(a.date));

    // Próximas no início da lista; encerradas ao final, junto ao histórico.
    list.insertAdjacentHTML("afterbegin", scheduled.map(cardMarkup).join(""));
    list.insertAdjacentHTML("beforeend", closed.map(cardMarkup).join(""));
  }

  // Executa sincronamente (script defer, antes de area-filiado.js), com o DOM já analisado.
  render();
})();
