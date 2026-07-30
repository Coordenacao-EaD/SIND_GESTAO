const comunicados = [
  {
    id: 1,
    titulo: "Expediente em dias de feriados",
    categoria: "Expediente",
    categoriaSlug: "expediente",
    resumo: "Informamos os horários de funcionamento da sede sindical durante os próximos feriados.",
    data: "20 de maio de 2024",
    dataISO: "2024-05-20",
    ano: "2024",
    publicoAlvo: "Público geral",
    publicoSlug: "publico-geral",
    situacao: "vigente",
    inicioVigencia: "20/05/2024",
    fimVigencia: "31/05/2024",
    autor: "Secretaria-Geral",
    anexos: [{ nome: "Comunicado de expediente — feriados", arquivo: "../assets/documents/comunicados/expediente-feriados.pdf", tipo: "PDF", tamanho: "850 KB" }]
  },
  {
    id: 2,
    titulo: "Convocação para assembleia extraordinária",
    categoria: "Assembleias",
    categoriaSlug: "assembleias",
    resumo: "Todos os filiados estão convocados para participar da assembleia extraordinária.",
    data: "17 de maio de 2024",
    dataISO: "2024-05-17",
    ano: "2024",
    publicoAlvo: "Filiados",
    publicoSlug: "filiados",
    situacao: "urgente",
    inicioVigencia: "17/05/2024",
    fimVigencia: "24/05/2024",
    autor: "Diretoria Executiva",
    anexos: [{ nome: "Convocação da assembleia extraordinária", arquivo: "../assets/documents/comunicados/assembleia-extraordinaria.pdf", tipo: "PDF", tamanho: "720 KB" }]
  },
  {
    id: 3,
    titulo: "Atualização cadastral de empresas conveniadas",
    categoria: "Benefícios",
    categoriaSlug: "beneficios",
    resumo: "Solicitamos a atualização das informações das empresas parceiras e conveniadas.",
    data: "15 de maio de 2024",
    dataISO: "2024-05-15",
    ano: "2024",
    publicoAlvo: "Categorias específicas",
    publicoSlug: "categorias-especificas",
    situacao: "vigente",
    inicioVigencia: "15/05/2024",
    fimVigencia: "15/06/2024",
    autor: "Secretaria de Benefícios",
    anexos: []
  },
  {
    id: 4,
    titulo: "Alteração temporária no atendimento presencial",
    categoria: "Atendimento",
    categoriaSlug: "atendimento",
    resumo: "A sede funcionará em horário especial durante o período informado.",
    data: "13 de maio de 2024",
    dataISO: "2024-05-13",
    ano: "2024",
    publicoAlvo: "Público geral",
    publicoSlug: "publico-geral",
    situacao: "encerrado",
    inicioVigencia: "13/05/2024",
    fimVigencia: "17/05/2024",
    autor: "Secretaria-Geral",
    anexos: []
  },
  {
    id: 5,
    titulo: "Novos convênios disponíveis aos filiados",
    categoria: "Benefícios",
    categoriaSlug: "beneficios",
    resumo: "Confira os novos benefícios e descontos disponibilizados aos filiados.",
    data: "10 de maio de 2024",
    dataISO: "2024-05-10",
    ano: "2024",
    publicoAlvo: "Filiados",
    publicoSlug: "filiados",
    situacao: "vigente",
    inicioVigencia: "10/05/2024",
    fimVigencia: "31/12/2024",
    autor: "Secretaria de Benefícios",
    anexos: []
  },
  {
    id: 6,
    titulo: "Atualização obrigatória de dados cadastrais",
    categoria: "Informes",
    categoriaSlug: "informes",
    resumo: "Os filiados deverão revisar seus dados para manter os canais de comunicação atualizados.",
    data: "8 de maio de 2024",
    dataISO: "2024-05-08",
    ano: "2024",
    publicoAlvo: "Filiados",
    publicoSlug: "filiados",
    situacao: "vigente",
    inicioVigencia: "08/05/2024",
    fimVigencia: "08/06/2024",
    autor: "Secretaria-Geral",
    anexos: [{ nome: "Orientações para atualização cadastral", arquivo: "../assets/documents/comunicados/atualizacao-cadastral.pdf", tipo: "PDF", tamanho: "640 KB" }]
  },
  {
    id: 7,
    titulo: "Novo canal de atendimento aos aposentados",
    categoria: "Atendimento",
    categoriaSlug: "atendimento",
    resumo: "Canal especializado passa a atender dúvidas e solicitações dos servidores aposentados.",
    data: "12 de fevereiro de 2025",
    dataISO: "2025-02-12",
    ano: "2025",
    publicoAlvo: "Aposentados",
    publicoSlug: "aposentados",
    situacao: "vigente",
    inicioVigencia: "12/02/2025",
    fimVigencia: "31/12/2025",
    autor: "Secretaria-Geral",
    anexos: []
  },
  {
    id: 8,
    titulo: "Reunião ampliada da Diretoria",
    categoria: "Informes",
    categoriaSlug: "informes",
    resumo: "Integrantes da Diretoria estão convocados para reunião de planejamento institucional.",
    data: "5 de março de 2025",
    dataISO: "2025-03-05",
    ano: "2025",
    publicoAlvo: "Diretoria",
    publicoSlug: "diretoria",
    situacao: "encerrado",
    inicioVigencia: "05/03/2025",
    fimVigencia: "12/03/2025",
    autor: "Presidência",
    anexos: []
  },
  {
    id: 9,
    titulo: "Orientações para adesão a novos benefícios",
    categoria: "Benefícios",
    categoriaSlug: "beneficios",
    resumo: "Servidores podem consultar os critérios demonstrativos de adesão aos novos convênios.",
    data: "22 de agosto de 2025",
    dataISO: "2025-08-22",
    ano: "2025",
    publicoAlvo: "Servidores",
    publicoSlug: "servidores",
    situacao: "vigente",
    inicioVigencia: "22/08/2025",
    fimVigencia: "31/12/2025",
    autor: "Secretaria de Benefícios",
    anexos: []
  },
  {
    id: 10,
    titulo: "Convocação urgente para mobilização regional",
    categoria: "Urgente",
    categoriaSlug: "urgente",
    resumo: "Servidores estão convocados para atividade regional de mobilização e diálogo.",
    data: "16 de janeiro de 2026",
    dataISO: "2026-01-16",
    ano: "2026",
    publicoAlvo: "Servidores",
    publicoSlug: "servidores",
    situacao: "urgente",
    inicioVigencia: "16/01/2026",
    fimVigencia: "23/01/2026",
    autor: "Diretoria Executiva",
    anexos: []
  },
  {
    id: 11,
    titulo: "Calendário de atendimento para o primeiro semestre",
    categoria: "Expediente",
    categoriaSlug: "expediente",
    resumo: "Confira os dias e horários previstos para atendimento presencial e remoto.",
    data: "10 de janeiro de 2026",
    dataISO: "2026-01-10",
    ano: "2026",
    publicoAlvo: "Público geral",
    publicoSlug: "publico-geral",
    situacao: "vigente",
    inicioVigencia: "10/01/2026",
    fimVigencia: "30/06/2026",
    autor: "Secretaria-Geral",
    anexos: []
  },
  {
    id: 12,
    titulo: "Prazo para atualização de filiação",
    categoria: "Filiação",
    categoriaSlug: "filiacao",
    resumo: "Filiados devem conferir seus dados e a situação de vínculo até a data indicada.",
    data: "8 de janeiro de 2026",
    dataISO: "2026-01-08",
    ano: "2026",
    publicoAlvo: "Filiados",
    publicoSlug: "filiados",
    situacao: "vigente",
    inicioVigencia: "08/01/2026",
    fimVigencia: "28/02/2026",
    autor: "Secretaria-Geral",
    anexos: []
  }
];

const communicationStatusLabels = { vigente: "Vigente", encerrado: "Encerrado", urgente: "Urgente" };

function normalizeCommunicationText(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function getCommunicationSearchText(item) {
  const detailText = item.id === 1
    ? "Informamos que, em razão dos próximos feriados, a sede sindical funcionará em horários diferenciados."
    : item.resumo;
  return `${item.titulo} ${item.resumo} ${item.categoria} ${item.publicoAlvo} ${detailText}
    Nos dias indicados, os atendimentos presenciais poderão ser reduzidos.
    Os canais digitais permanecerão disponíveis para orientações e solicitações.
    Horários de atendimento segunda-feira atendimento normal terça-feira atendimento até as 14h
    quarta-feira sede fechada quinta-feira retorno às atividades normais.
    Em caso de urgência, utilize os canais institucionais de contato.`;
}

function createCommunicationCard(item, compact = false) {
  const article = document.createElement("article");
  article.className = compact ? "communication-card communication-card--compact" : "communication-card";
  article.innerHTML = `
    <div class="communication-card__icon" aria-hidden="true"><i class="bi bi-megaphone-fill"></i></div>
    <div class="communication-card__content">
      <div class="communication-card__badges">
        <span class="communication-category">${item.categoria}</span>
        <span class="communication-status communication-status--${item.situacao}">${communicationStatusLabels[item.situacao]}</span>
      </div>
      <h3><a href="comunicado.html?id=${item.id}">${item.titulo}</a></h3>
      <p>${item.resumo}</p>
      <div class="communication-meta">
        <time datetime="${item.dataISO}"><i class="bi bi-calendar3" aria-hidden="true"></i>${item.data}</time>
        <span><i class="bi bi-people" aria-hidden="true"></i><strong>Público-alvo:</strong> ${item.publicoAlvo}</span>
        ${item.anexos.length ? `<span><i class="bi bi-paperclip" aria-hidden="true"></i>${item.anexos.length} documento anexo</span>` : ""}
      </div>
    </div>
    <a class="communication-read" href="comunicado.html?id=${item.id}">Ler comunicado <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
  `;
  return article;
}

function initializeCommunicationsListing() {
  const list = document.querySelector("[data-communication-list]");
  if (!list) return;
  const search = document.querySelector("[data-communication-search]");
  const category = document.querySelector("[data-communication-category]");
  const audience = document.querySelector("[data-communication-audience]");
  const year = document.querySelector("[data-communication-year]");
  const status = document.querySelector("[data-communication-status]");
  const count = document.querySelector("[data-communication-count]");
  const empty = document.querySelector("[data-communication-empty]");
  const pagination = document.querySelector("[data-communication-pagination]");
  const listStart = document.querySelector("[data-communication-list-start]");
  const pageSize = 4;
  let currentPage = 1;
  let filtered = comunicados;

  function renderPagination(totalPages) {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const addButton = (label, page, navigation = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.className = navigation ? "communication-pagination__navigation" : "";
      button.disabled = navigation && ((label === "Anterior" && currentPage === 1) || (label === "Seguinte" && currentPage === totalPages));
      button.setAttribute("aria-label", navigation ? label : `Página ${page}`);
      if (!navigation && page === currentPage) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        currentPage = page;
        render();
        listStart?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagination.append(button);
    };
    addButton("Anterior", Math.max(1, currentPage - 1), true);
    for (let page = 1; page <= totalPages; page += 1) addButton(String(page), page);
    addButton("Seguinte", Math.min(totalPages, currentPage + 1), true);
  }

  function render() {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    list.replaceChildren(...filtered.slice(start, start + pageSize).map((item) => createCommunicationCard(item)));
    count.textContent = String(filtered.length);
    list.hidden = filtered.length === 0;
    empty.hidden = filtered.length !== 0;
    renderPagination(filtered.length ? totalPages : 0);
  }

  function applyFilters() {
    const term = normalizeCommunicationText(search.value);
    filtered = comunicados.filter((item) => {
      const searchable = normalizeCommunicationText(getCommunicationSearchText(item));
      return (!term || searchable.includes(term))
        && (category.value === "todas" || item.categoriaSlug === category.value)
        && (audience.value === "todos" || item.publicoSlug === audience.value)
        && (year.value === "todos" || item.ano === year.value)
        && (status.value === "todos" || item.situacao === status.value);
    });
    currentPage = 1;
    render();
  }

  function clearFilters() {
    search.value = "";
    category.value = "todas";
    audience.value = "todos";
    year.value = "todos";
    status.value = "todos";
    applyFilters();
    search.focus();
  }

  search.addEventListener("input", applyFilters);
  [category, audience, year, status].forEach((field) => field.addEventListener("change", applyFilters));
  document.querySelectorAll("[data-communication-clear]").forEach((button) => button.addEventListener("click", clearFilters));
  document.querySelector("[data-communication-filters]")?.addEventListener("submit", (event) => event.preventDefault());
  applyFilters();
}

function renderCommunicationContent(container, item) {
  const paragraphOne = document.createElement("p");
  paragraphOne.textContent = item.id === 1
    ? "Informamos que, em razão dos próximos feriados, a sede sindical funcionará em horários diferenciados."
    : item.resumo;
  const paragraphTwo = document.createElement("p");
  paragraphTwo.textContent = "Nos dias indicados, os atendimentos presenciais poderão ser reduzidos. Os canais digitais permanecerão disponíveis para orientações e solicitações.";
  const heading = document.createElement("h2");
  heading.textContent = "Horários de atendimento";
  const list = document.createElement("ul");
  ["segunda-feira: atendimento normal;", "terça-feira: atendimento até as 14h;", "quarta-feira: sede fechada;", "quinta-feira: retorno às atividades normais."].forEach((text) => {
    const listItem = document.createElement("li");
    listItem.textContent = text;
    list.append(listItem);
  });
  const highlight = document.createElement("aside");
  highlight.className = "communication-highlight";
  highlight.innerHTML = '<i class="bi bi-info-circle" aria-hidden="true"></i><p>Em caso de urgência, utilize os canais institucionais de contato.</p>';
  container.replaceChildren(paragraphOne, paragraphTwo, heading, list, highlight);
}

function initializeCommunicationDetail() {
  const article = document.querySelector("[data-communication-detail]");
  if (!article) return;
  const item = comunicados.find((communication) => communication.id === Number(new URLSearchParams(window.location.search).get("id")));
  const notFound = document.querySelector("[data-communication-not-found]");
  if (!item) {
    article.hidden = true;
    notFound.hidden = false;
    document.title = "Comunicado não encontrado | Sinprotec";
    return;
  }

  article.hidden = false;
  notFound.hidden = true;
  document.title = `${item.titulo} | Sinprotec`;
  document.querySelector("[data-communication-breadcrumb]").textContent = item.titulo;
  document.querySelector("[data-communication-detail-category]").textContent = item.categoria;
  const statusBadge = document.querySelector("[data-communication-detail-status]");
  statusBadge.textContent = communicationStatusLabels[item.situacao];
  statusBadge.classList.add(`communication-status--${item.situacao}`);
  document.querySelector("[data-communication-title]").textContent = item.titulo;
  document.querySelector("[data-communication-summary]").textContent = item.resumo;
  const date = document.querySelector("[data-communication-date]");
  date.textContent = item.data;
  date.dateTime = item.dataISO;
  document.querySelector("[data-communication-audience-detail]").textContent = item.publicoAlvo;
  document.querySelector("[data-communication-validity]").textContent = `De ${item.inicioVigencia} a ${item.fimVigencia}`;
  document.querySelector("[data-communication-author]").textContent = item.autor;
  renderCommunicationContent(document.querySelector("[data-communication-content]"), item);

  const attachments = document.querySelector("[data-communication-attachments]");
  const attachmentEmpty = document.querySelector("[data-communication-attachments-empty]");
  attachments.replaceChildren(...item.anexos.map((attachment) => {
    const card = document.createElement("article");
    card.className = "communication-attachment";
    card.innerHTML = `
      <div class="communication-attachment__icon"><i class="bi bi-file-earmark-pdf-fill" aria-hidden="true"></i></div>
      <div><h3>${attachment.nome}</h3><p>${attachment.tipo} • ${attachment.tamanho}</p></div>
      <div class="communication-attachment__actions">
        <button type="button" data-attachment-action="Visualizar"><i class="bi bi-eye" aria-hidden="true"></i>Visualizar</button>
        <button type="button" data-attachment-action="Download"><i class="bi bi-download" aria-hidden="true"></i>Download</button>
      </div>`;
    return card;
  }));
  attachmentEmpty.hidden = item.anexos.length !== 0;
  attachments.hidden = item.anexos.length === 0;

  const related = comunicados
    .filter((communication) => communication.id !== item.id)
    .sort((a, b) => Number(b.categoriaSlug === item.categoriaSlug || b.publicoSlug === item.publicoSlug) - Number(a.categoriaSlug === item.categoriaSlug || a.publicoSlug === item.publicoSlug))
    .slice(0, 3);
  document.querySelector("[data-communication-related]").replaceChildren(...related.map((communication) => createCommunicationCard(communication, true)));

  const feedback = document.querySelector("[data-communication-feedback]");
  function showFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = false;
    window.clearTimeout(showFeedback.timer);
    showFeedback.timer = window.setTimeout(() => { feedback.hidden = true; }, 3000);
  }

  document.querySelectorAll("[data-attachment-action]").forEach((button) => {
    button.addEventListener("click", () => showFeedback("Arquivo demonstrativo ainda não inserido."));
  });
  document.querySelector("[data-communication-copy]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const input = document.createElement("textarea");
      input.value = window.location.href;
      input.className = "news-copy-helper";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showFeedback("Link copiado para a área de transferência.");
  });
  document.querySelector("[data-communication-print]")?.addEventListener("click", () => window.print());
}

initializeCommunicationsListing();
initializeCommunicationDetail();
