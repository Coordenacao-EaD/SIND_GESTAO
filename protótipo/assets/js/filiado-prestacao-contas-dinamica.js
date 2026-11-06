// T32 — Integra à Área do Filiado as prestações de contas validadas e publicadas pela Presidência.
// Carregado ANTES de area-filiado.js (padrão das integrações anteriores).
// Somente registros com status "Publicada" são exibidos. Rascunho, Aguardando validação,
// Arquivada, documentos internos do T31 e conteúdo de Conselhos nunca aparecem aqui.
(() => {
  "use strict";

  const STORAGE_KEY = "sindGestao.financeDemo";
  const PUBLISHED = "Publicada";

  // Somente demonstrativos já existentes no protótipo podem gerar link.
  const SAFE_FILES = [
    "../assets/docs/financeiro/demonstrativo-financeiro-2026.html",
    "../assets/docs/financeiro/comprovante-demonstrativo.html",
    "../assets/docs/financeiro/relatorio-sintetico-2025.html"
  ];

  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function cents(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }

  function money(value) {
    return BRL.format(cents(value) / 100);
  }

  function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return match ? `${match[3]}/${match[2]}/${match[1]}` : "—";
  }

  function sortKey(record) {
    const c = String(record.competence || "");
    let m = /^(\d{2})\/(\d{4})$/.exec(c);
    if (m) return Number(m[2]) * 100 + Number(m[1]);
    m = /^([1-4])º tri\/(\d{4})$/.exec(c);
    if (m) return Number(m[2]) * 100 + Number(m[1]) * 3;
    return Number(record.year || 0) * 100 + 12;
  }

  function loadPublished() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((r) => r && typeof r === "object" && r.status === PUBLISHED
          && /^PC-\d{4}-\d{4}$/.test(String(r.id)) && r.validatedBy)
        .sort((a, b) => sortKey(b) - sortKey(a));
    } catch {
      return [];
    }
  }

  function safeFiles(record) {
    return [record.statement, ...(Array.isArray(record.attachments) ? record.attachments : [])]
      .filter((f) => f && SAFE_FILES.includes(f.href));
  }

  function fileLabel(file) {
    return /\.pdf$/i.test(file.name) ? "PDF" : "DOC";
  }

  function render(published, year) {
    const ofYear = published.filter((r) => String(r.year) === String(year));
    const current = ofYear[0] || null;

    const status = document.querySelector("[data-pc-status]");
    const resumo = document.querySelector("[data-pc-resumo]");
    const docs = document.querySelector("[data-pc-documentos]");
    const history = document.querySelector("[data-pc-historico]");

    if (status) {
      status.innerHTML = current ? `
        <div>
          <span class="prestacao-status__icone" aria-hidden="true">✓</span>
          <div>
            <span class="filiado-badge">${escapeHtml(current.competence)} · ${escapeHtml(current.type)}</span>
            <h2 id="status-prestacao">${escapeHtml(current.title)}</h2>
            <p>${escapeHtml(current.summary || "")}</p>
          </div>
        </div>
        <div class="prestacao-validacao">
          <span>Elaborada pela ${escapeHtml(current.createdBy || "Tesouraria")}</span>
          <strong>Validada pela ${escapeHtml(current.validatedBy)}</strong>
          <small>Publicada em ${formatDate(current.publishedAt)} · ${escapeHtml(current.id)}</small>
        </div>
      ` : `
        <div>
          <span class="prestacao-status__icone" aria-hidden="true">i</span>
          <div>
            <span class="filiado-badge">EXERCÍCIO ${escapeHtml(year || "—")}</span>
            <h2 id="status-prestacao">Nenhuma prestação disponibilizada</h2>
            <p>Ainda não há prestação de contas validada pela Presidência e publicada para este exercício.</p>
          </div>
        </div>
      `;
    }

    if (resumo) {
      if (current) {
        const balance = (cents(current.revenue) - cents(current.expense)) / 100;
        resumo.innerHTML = `
          <article class="filiado-card prestacao-card-financeiro">
            <span class="prestacao-card-label">Receitas</span>
            <strong class="filiado-value">${money(current.revenue)}</strong>
            <p>Total de receitas da competência ${escapeHtml(current.competence)}.</p>
          </article>
          <article class="filiado-card prestacao-card-financeiro">
            <span class="prestacao-card-label">Despesas</span>
            <strong class="filiado-value">${money(current.expense)}</strong>
            <p>Total de despesas da competência ${escapeHtml(current.competence)}.</p>
          </article>
          <article class="filiado-card prestacao-card-financeiro">
            <span class="prestacao-card-label">Saldo do período</span>
            <strong class="filiado-value">${money(balance)}</strong>
            <p>Diferença entre receitas e despesas do período.</p>
          </article>
          <article class="filiado-card prestacao-card-financeiro">
            <span class="prestacao-card-label">Competência</span>
            <strong class="filiado-value">${escapeHtml(current.competence)}</strong>
            <p>Prestação ${escapeHtml(String(current.type || "").toLowerCase())} validada e publicada.</p>
          </article>
        `;
      } else {
        resumo.innerHTML = '<p class="prestacao-observacao">Nenhum valor disponível para o exercício selecionado.</p>';
      }
    }

    if (docs) {
      const files = current ? safeFiles(current) : [];
      docs.innerHTML = files.length
        ? files.map((file, index) => `
          <article class="prestacao-documento">
            <div class="prestacao-documento__icone" aria-hidden="true">${fileLabel(file)}</div>
            <div class="prestacao-documento__texto">
              <strong>${index === 0 && file === current.statement ? "Demonstrativo financeiro" : "Documento complementar"} — ${escapeHtml(current.competence)}</strong>
              <p>${escapeHtml(file.name)}</p>
            </div>
            <div class="prestacao-documento__acoes">
              <a href="${escapeHtml(file.href)}" target="_blank" rel="noopener noreferrer">Visualizar</a>
              <a href="${escapeHtml(file.href)}" download>Baixar</a>
            </div>
          </article>`).join("")
        : '<p class="prestacao-observacao">Nenhum demonstrativo disponibilizado para esta prestação.</p>';
    }

    if (history) {
      history.querySelectorAll(".prestacao-exercicio, [data-pc-historico-vazio]").forEach((node) => node.remove());
      const previous = published.filter((r) => r !== current);
      if (!previous.length) {
        history.insertAdjacentHTML("beforeend",
          '<p class="prestacao-observacao" data-pc-historico-vazio>Nenhuma outra prestação publicada.</p>');
      } else {
        history.insertAdjacentHTML("beforeend", previous.map((r) => {
          const balance = (cents(r.revenue) - cents(r.expense)) / 100;
          const file = safeFiles(r)[0];
          return `
            <details class="prestacao-exercicio">
              <summary>
                <span>${escapeHtml(r.title)}</span>
                <span class="prestacao-status-tag">Disponibilizada</span>
              </summary>
              <div class="prestacao-exercicio__content">
                <p>Competência ${escapeHtml(r.competence)} · Receitas ${money(r.revenue)} · Despesas ${money(r.expense)} · Saldo ${money(balance)}</p>
                ${file ? `<a href="${escapeHtml(file.href)}" target="_blank" rel="noopener noreferrer">Visualizar demonstrativo</a>` : ""}
              </div>
            </details>`;
        }).join(""));
      }
    }
  }

  function init() {
    if (!document.querySelector("[data-pc-status]")) return;

    const published = loadPublished();
    const select = document.querySelector("[data-pc-exercicio]");
    const years = [...new Set(published.map((r) => String(r.year)).filter(Boolean))].sort().reverse();
    const defaultYear = years[0] || String(new Date().getFullYear());

    if (select) {
      const options = years.length ? years : [defaultYear];
      select.innerHTML = options.map((y) => `<option value="${escapeHtml(y)}"${y === defaultYear ? " selected" : ""}>${escapeHtml(y)}</option>`).join("");
      select.addEventListener("change", () => render(published, select.value));
    }

    render(published, defaultYear);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
