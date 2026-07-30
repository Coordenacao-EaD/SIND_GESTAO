const documentosTransparencia = [
  {
    id: 1,
    titulo: "Prestação de Contas — 1º semestre de 2026",
    categoria: "Prestação de Contas",
    categoriaSlug: "prestacao-contas",
    icone: "bi-clipboard-data",
    descricao: "Relatório consolidado das informações financeiras e administrativas do período.",
    ano: "2026",
    periodo: "1-semestre",
    periodoLabel: "Janeiro a junho de 2026",
    publicacao: "20/07/2026",
    atualizacao: "20/07/2026",
    situacao: "publicado",
    responsavel: "Secretaria Financeira",
    arquivo: "../assets/documents/transparencia/prestacao-contas-1-semestre-2026.pdf"
  },
  {
    id: 2,
    titulo: "Demonstrativo de Receitas e Despesas",
    categoria: "Receitas e Despesas",
    categoriaSlug: "receitas-despesas",
    icone: "bi-cash-coin",
    descricao: "Resumo demonstrativo das receitas recebidas e das despesas realizadas.",
    ano: "2026",
    periodo: "1-semestre",
    periodoLabel: "1º semestre de 2026",
    publicacao: "18/07/2026",
    atualizacao: "18/07/2026",
    situacao: "publicado",
    responsavel: "Secretaria Financeira",
    arquivo: "../assets/documents/transparencia/receitas-despesas-2026.pdf"
  },
  {
    id: 3,
    titulo: "Relatório Financeiro Detalhado",
    categoria: "Relatórios Financeiros",
    categoriaSlug: "relatorios-financeiros",
    icone: "bi-graph-up-arrow",
    descricao: "Documento detalhado com informações sobre a execução financeira do período.",
    ano: "2026",
    periodo: "1-semestre",
    periodoLabel: "Janeiro a junho de 2026",
    publicacao: "17/07/2026",
    atualizacao: "17/07/2026",
    situacao: "atualizado",
    responsavel: "Secretaria Financeira",
    arquivo: "../assets/documents/transparencia/relatorio-financeiro-detalhado-2026.pdf"
  },
  {
    id: 4,
    titulo: "Balanço Patrimonial",
    categoria: "Balanço Patrimonial",
    categoriaSlug: "balanco-patrimonial",
    icone: "bi-bar-chart-line",
    descricao: "Demonstrativo da situação patrimonial da entidade no período informado.",
    ano: "2026",
    periodo: "anual",
    periodoLabel: "Exercício de 2026",
    publicacao: "15/07/2026",
    atualizacao: "15/07/2026",
    situacao: "vigente",
    responsavel: "Secretaria Financeira",
    arquivo: "../assets/documents/transparencia/balanco-patrimonial-2026.pdf"
  },
  {
    id: 5,
    titulo: "Parecer de Fiscalização",
    categoria: "Pareceres",
    categoriaSlug: "pareceres",
    icone: "bi-patch-check",
    descricao: "Parecer demonstrativo emitido pelo órgão interno responsável pela fiscalização.",
    ano: "2026",
    periodo: "1-semestre",
    periodoLabel: "1º semestre de 2026",
    publicacao: "12/07/2026",
    atualizacao: "12/07/2026",
    situacao: "publicado",
    responsavel: "Conselho Fiscal",
    arquivo: "../assets/documents/transparencia/parecer-fiscalizacao-2026.pdf"
  },
  {
    id: 6,
    titulo: "Documentos Comprobatórios",
    categoria: "Documentos Comprobatórios",
    categoriaSlug: "documentos-comprobatorios",
    icone: "bi-folder2-open",
    descricao: "Conjunto de documentos públicos que acompanham e comprovam as informações apresentadas.",
    ano: "2026",
    periodo: "1-semestre",
    periodoLabel: "1º semestre de 2026",
    publicacao: "10/07/2026",
    atualizacao: "10/07/2026",
    situacao: "vigente",
    responsavel: "Secretaria Financeira",
    arquivo: "../assets/documents/transparencia/documentos-comprobatorios-2026.pdf"
  }
];

const documentosComprobatorios = [
  { nome: "Nota Fiscal — Serviços de Manutenção", tipo: "PDF", data: "05/07/2026", tamanho: "280 KB", arquivo: "" },
  { nome: "Relatório Anexo — Execução de Convênios", tipo: "PDF", data: "06/07/2026", tamanho: "410 KB", arquivo: "" },
  { nome: "Parecer Complementar do Conselho Fiscal", tipo: "PDF", data: "08/07/2026", tamanho: "195 KB", arquivo: "" },
  { nome: "Declaração de Regularidade Institucional", tipo: "PDF", data: "09/07/2026", tamanho: "120 KB", arquivo: "" },
  { nome: "Documento de Apoio — Memória de Cálculo", tipo: "PDF", data: "10/07/2026", tamanho: "340 KB", arquivo: "" }
];

const transparencyStatusLabels = { publicado: "Publicado", atualizado: "Atualizado", vigente: "Vigente", historico: "Histórico" };
const transparencyStatusClasses = { publicado: "document-status--current", atualizado: "document-status--updated", vigente: "document-status--current", historico: "document-status--historical" };

function normalizeTransparencyText(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function parseTransparencyDate(value = "") {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function transparencyFileActionHtml(arquivo, kind) {
  if (arquivo) {
    const isDownload = kind === "download";
    return `<a class="transparency-button transparency-button--${kind}" href="${arquivo}" target="_blank" rel="noopener"${isDownload ? " download" : ""}><i class="bi ${isDownload ? "bi-download" : "bi-eye"}" aria-hidden="true"></i>${isDownload ? "Download" : "Consultar"}</a>`;
  }
  return `<button class="transparency-button transparency-button--${kind}" type="button" data-transparency-missing-file><i class="bi ${kind === "download" ? "bi-download" : "bi-eye"}" aria-hidden="true"></i>${kind === "download" ? "Download" : "Consultar"}</button>`;
}

function createTransparencyCard(item) {
  const article = document.createElement("article");
  article.className = "transparency-card";
  article.innerHTML = `
    <div class="transparency-card__top">
      <span class="transparency-card__icon" aria-hidden="true"><i class="bi ${item.icone}"></i></span>
      <span class="document-status ${transparencyStatusClasses[item.situacao]}">${transparencyStatusLabels[item.situacao]}</span>
    </div>
    <div class="transparency-card__body">
      <span class="transparency-card__category">${item.categoria}</span>
      <h3>${item.titulo}</h3>
      <p>${item.descricao}</p>
      <dl class="transparency-card__meta">
        <div><dt>Período</dt><dd>${item.periodoLabel}</dd></div>
        <div><dt>Atualização</dt><dd>${item.atualizacao}</dd></div>
      </dl>
      <span class="transparency-card__public"><i class="bi bi-unlock" aria-hidden="true"></i>Documento público</span>
    </div>
    <div class="transparency-card__actions">
      <button class="transparency-button transparency-button--view" type="button" data-transparency-consult="${item.id}"><i class="bi bi-search" aria-hidden="true"></i>Consultar</button>
      ${transparencyFileActionHtml(item.arquivo, "download")}
    </div>
  `;
  return article;
}

function createSupportingItem(file) {
  const li = document.createElement("li");
  li.className = "transparency-supporting-item";
  li.innerHTML = `
    <div class="transparency-supporting-item__icon" aria-hidden="true"><i class="bi bi-file-earmark-pdf"></i></div>
    <div class="transparency-supporting-item__info">
      <strong>${file.nome}</strong>
      <span>${file.tipo} • ${file.data} • ${file.tamanho}</span>
    </div>
    <div class="transparency-supporting-item__actions">
      ${transparencyFileActionHtml(file.arquivo, "view")}
      ${transparencyFileActionHtml(file.arquivo, "download")}
    </div>
  `;
  return li;
}

function initializeTransparencyListing() {
  const grid = document.querySelector("[data-transparency-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-transparency-search]");
  const yearSelect = document.querySelector("[data-transparency-year]");
  const periodSelect = document.querySelector("[data-transparency-period]");
  const categorySelect = document.querySelector("[data-transparency-category]");
  const countEl = document.querySelector("[data-transparency-count]");
  const summaryText = document.querySelector("[data-transparency-summary-text]");
  const empty = document.querySelector("[data-transparency-empty]");
  const summaryPeriod = document.querySelector("[data-transparency-summary-period]");
  const summaryCount = document.querySelector("[data-transparency-summary-count]");
  const summaryUpdate = document.querySelector("[data-transparency-summary-update]");
  const summaryStatus = document.querySelector("[data-transparency-summary-status]");

  const defaults = { year: yearSelect.value, period: periodSelect.value, category: categorySelect.value };
  let filtered = documentosTransparencia;

  function getSearchableText(item) {
    return [item.titulo, item.descricao, item.categoria, item.ano, item.periodoLabel].join(" ");
  }

  function render() {
    grid.replaceChildren(...filtered.map(createTransparencyCard));
    grid.hidden = filtered.length === 0;
    empty.hidden = filtered.length !== 0;

    const yearLabel = yearSelect.options[yearSelect.selectedIndex].textContent;
    const periodLabel = periodSelect.options[periodSelect.selectedIndex].textContent;
    const count = filtered.length;
    countEl.textContent = String(count);
    summaryText.textContent = `${count} documento${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"} para ${yearSelect.value === "todos" ? "todos os anos" : yearLabel}`;

    summaryPeriod.textContent = `${yearSelect.value === "todos" ? "Todos os anos" : yearLabel} — ${periodLabel}`;
    summaryCount.textContent = `${count} documento${count === 1 ? "" : "s"} publicado${count === 1 ? "" : "s"}`;
    if (count) {
      const lastUpdate = filtered.reduce((latest, item) => {
        const date = parseTransparencyDate(item.atualizacao);
        return date > latest ? date : latest;
      }, parseTransparencyDate(filtered[0].atualizacao));
      const dd = String(lastUpdate.getDate()).padStart(2, "0");
      const mm = String(lastUpdate.getMonth() + 1).padStart(2, "0");
      summaryUpdate.textContent = `Última atualização em ${dd}/${mm}/${lastUpdate.getFullYear()}`;
      summaryStatus.textContent = "Situação: informações disponíveis";
    } else {
      summaryUpdate.textContent = "Última atualização: —";
      summaryStatus.textContent = "Situação: nenhuma informação disponível para o período";
    }
  }

  function applyFilters() {
    const term = normalizeTransparencyText(search.value);
    filtered = documentosTransparencia.filter((item) => {
      const searchable = normalizeTransparencyText(getSearchableText(item));
      return (!term || searchable.includes(term))
        && (yearSelect.value === "todos" || item.ano === yearSelect.value)
        && (periodSelect.value === "todos" || item.periodo === periodSelect.value || item.periodo === "anual")
        && (categorySelect.value === "todas" || item.categoriaSlug === categorySelect.value);
    });
    render();
  }

  function clearFilters() {
    search.value = "";
    yearSelect.value = defaults.year;
    periodSelect.value = defaults.period;
    categorySelect.value = defaults.category;
    applyFilters();
    search.focus();
  }

  search.addEventListener("input", applyFilters);
  [yearSelect, periodSelect, categorySelect].forEach((field) => field.addEventListener("change", applyFilters));
  document.querySelectorAll("[data-transparency-clear]").forEach((button) => button.addEventListener("click", clearFilters));
  document.querySelector("[data-transparency-filters]")?.addEventListener("submit", (event) => event.preventDefault());

  applyFilters();
}

function initializeTransparencyModal() {
  const modal = document.querySelector("[data-transparency-modal]");
  const grid = document.querySelector("[data-transparency-grid]");
  if (!modal || !grid) return;

  const modalIcon = modal.querySelector("[data-transparency-modal-icon]");
  const modalCategory = modal.querySelector("[data-transparency-modal-category]");
  const modalTitle = modal.querySelector("[data-transparency-modal-title]");
  const modalPeriod = modal.querySelector("[data-transparency-modal-period]");
  const modalDescription = modal.querySelector("[data-transparency-modal-description]");
  const modalStatus = modal.querySelector("[data-transparency-modal-status]");
  const modalPublish = modal.querySelector("[data-transparency-modal-publish]");
  const modalUpdate = modal.querySelector("[data-transparency-modal-update]");
  const modalResponsible = modal.querySelector("[data-transparency-modal-responsible]");
  const modalFileName = modal.querySelector("[data-transparency-modal-filename]");
  const modalFileActions = modal.querySelector("[data-transparency-modal-file-actions]");
  const modalSupporting = modal.querySelector("[data-transparency-modal-supporting]");
  const modalSupportingList = modal.querySelector("[data-transparency-supporting-list]");

  let lastTrigger = null;

  function openModal(item, trigger) {
    lastTrigger = trigger;
    modalIcon.className = `bi ${item.icone}`;
    modalCategory.textContent = item.categoria;
    modalTitle.textContent = item.titulo;
    modalPeriod.textContent = item.periodoLabel;
    modalDescription.textContent = item.descricao;
    modalStatus.textContent = transparencyStatusLabels[item.situacao];
    modalStatus.className = `document-status ${transparencyStatusClasses[item.situacao]}`;
    modalPublish.textContent = item.publicacao;
    modalUpdate.textContent = item.atualizacao;
    modalResponsible.textContent = item.responsavel;
    modalFileName.textContent = item.arquivo ? item.arquivo.split("/").pop() : "Arquivo ainda não disponível";
    modalFileActions.innerHTML = `${transparencyFileActionHtml(item.arquivo, "view")}${transparencyFileActionHtml(item.arquivo, "download")}`;

    const isSupportingDocument = item.categoriaSlug === "documentos-comprobatorios";
    modalSupporting.hidden = !isSupportingDocument;
    if (isSupportingDocument) {
      modalSupportingList.replaceChildren(...documentosComprobatorios.map(createSupportingItem));
    }

    document.body.classList.add("modal-open");
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    modal.querySelector("[data-transparency-modal-close]")?.focus();
  }

  function closeModal() {
    if (!modal.hasAttribute("open")) return;
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
      document.body.classList.remove("modal-open");
      lastTrigger?.focus();
    }
  }

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-transparency-consult]");
    if (!trigger) return;
    const item = documentosTransparencia.find((doc) => doc.id === Number(trigger.dataset.transparencyConsult));
    if (item) openModal(item, trigger);
  });

  modal.querySelectorAll("[data-transparency-modal-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    lastTrigger?.focus();
  });
}

function initializeTransparencyMissingFileNotices() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-transparency-missing-file]");
    if (!trigger) return;
    if (typeof showToast === "function") {
      showToast("Documento demonstrativo. O arquivo definitivo ainda não foi inserido.");
    }
  });
}

initializeTransparencyListing();
initializeTransparencyModal();
initializeTransparencyMissingFileNotices();
