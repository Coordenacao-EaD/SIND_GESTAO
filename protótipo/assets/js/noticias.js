const noticias = [
  {
    id: 1,
    titulo: "Sindicato e governo retomam mesa de negociação",
    categoria: "Negociação",
    categoriaSlug: "negociacao",
    resumo: "Representantes da categoria voltaram a discutir reivindicações e propostas relacionadas à valorização dos servidores.",
    autor: "Assessoria de Comunicação",
    data: "20 de maio de 2024",
    dataISO: "2024-05-20",
    ano: "2024",
    imagem: "../assets/images/noticias/negociacao.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 2,
    titulo: "Nova prestação de contas já está disponível para consulta",
    categoria: "Transparência",
    categoriaSlug: "transparencia",
    resumo: "Relatório financeiro do período pode ser consultado na área pública de transparência.",
    autor: "Secretaria Financeira",
    data: "18 de maio de 2024",
    dataISO: "2024-05-18",
    ano: "2024",
    imagem: "../assets/images/placeholders/noticia-direitos.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 3,
    titulo: "Campanha salarial inicia nova etapa de mobilização",
    categoria: "Direitos",
    categoriaSlug: "direitos",
    resumo: "Assembleias e reuniões regionais integram as próximas ações da campanha.",
    autor: "Diretoria Executiva",
    data: "15 de maio de 2024",
    dataISO: "2024-05-15",
    ano: "2024",
    imagem: "../assets/images/noticias/direitos.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 4,
    titulo: "Assembleia aprova pauta de reivindicações",
    categoria: "Assembleias",
    categoriaSlug: "assembleias",
    resumo: "Filiados aprovaram os principais pontos que serão apresentados nas negociações.",
    autor: "Assessoria de Comunicação",
    data: "12 de maio de 2024",
    dataISO: "2024-05-12",
    ano: "2024",
    imagem: "../assets/images/noticias/assembleia.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 5,
    titulo: "Confira os novos horários de atendimento",
    categoria: "Atendimento",
    categoriaSlug: "atendimento",
    resumo: "A sede sindical terá novos horários de atendimento presencial e remoto.",
    autor: "Secretaria-Geral",
    data: "10 de maio de 2024",
    dataISO: "2024-05-10",
    ano: "2024",
    imagem: "../assets/images/placeholders/noticia-negociacao.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 6,
    titulo: "Atualização cadastral dos filiados começa nesta semana",
    categoria: "Informes",
    categoriaSlug: "informes",
    resumo: "A atualização permitirá melhorar os canais de comunicação com a categoria.",
    autor: "Secretaria-Geral",
    data: "8 de maio de 2024",
    dataISO: "2024-05-08",
    ano: "2024",
    imagem: "../assets/images/placeholders/noticia-assembleia.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 7,
    titulo: "Sindicato realiza assembleia geral com ampla participação",
    categoria: "Assembleias",
    categoriaSlug: "assembleias",
    resumo: "Filiados participaram da discussão de pautas institucionais, direitos da categoria e próximos encaminhamentos.",
    autor: "Assessoria de Comunicação",
    data: "20 de maio de 2024",
    dataISO: "2024-05-20",
    ano: "2024",
    imagem: "../assets/images/noticias/assembleia.png",
    leitura: "Leitura de 4 minutos",
    destaque: true
  },
  {
    id: 8,
    titulo: "Orientação jurídica esclarece mudanças em benefícios",
    categoria: "Direitos",
    categoriaSlug: "direitos",
    resumo: "Equipe jurídica apresenta orientações gerais sobre procedimentos e direitos dos servidores.",
    autor: "Assessoria Jurídica",
    data: "22 de agosto de 2025",
    dataISO: "2025-08-22",
    ano: "2025",
    imagem: "../assets/images/placeholders/noticia-direitos.jpg",
    leitura: "Leitura de 4 minutos"
  },
  {
    id: 9,
    titulo: "Campanha de valorização chega às unidades regionais",
    categoria: "Campanhas",
    categoriaSlug: "campanhas",
    resumo: "Ações de diálogo e mobilização serão realizadas em diferentes unidades do serviço público.",
    autor: "Diretoria Executiva",
    data: "14 de março de 2025",
    dataISO: "2025-03-14",
    ano: "2025",
    imagem: "../assets/images/noticias/direitos.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 10,
    titulo: "Portal amplia acesso aos documentos de transparência",
    categoria: "Transparência",
    categoriaSlug: "transparencia",
    resumo: "Nova organização facilita a consulta de relatórios e documentos institucionais públicos.",
    autor: "Secretaria Financeira",
    data: "10 de fevereiro de 2026",
    dataISO: "2026-02-10",
    ano: "2026",
    imagem: "../assets/images/placeholders/noticia-negociacao.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 11,
    titulo: "Atendimento itinerante inicia calendário de 2026",
    categoria: "Atendimento",
    categoriaSlug: "atendimento",
    resumo: "Servidores poderão buscar orientações institucionais em pontos de atendimento programados.",
    autor: "Secretaria-Geral",
    data: "28 de janeiro de 2026",
    dataISO: "2026-01-28",
    ano: "2026",
    imagem: "../assets/images/placeholders/noticia-assembleia.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 12,
    titulo: "Reunião regional debate condições de trabalho",
    categoria: "Negociação",
    categoriaSlug: "negociacao",
    resumo: "Representantes locais apresentaram demandas e propostas para o próximo ciclo de diálogo.",
    autor: "Assessoria de Comunicação",
    data: "18 de janeiro de 2026",
    dataISO: "2026-01-18",
    ano: "2026",
    imagem: "../assets/images/noticias/negociacao.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 13,
    titulo: "Informe orienta servidores sobre calendário institucional",
    categoria: "Informes",
    categoriaSlug: "informes",
    resumo: "Datas de reuniões, atendimentos e atividades coletivas estão reunidas no novo calendário.",
    autor: "Secretaria-Geral",
    data: "12 de novembro de 2025",
    dataISO: "2025-11-12",
    ano: "2025",
    imagem: "../assets/images/placeholders/noticia-assembleia.jpg",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 14,
    titulo: "Assembleia regional reúne servidores de diferentes unidades",
    categoria: "Assembleias",
    categoriaSlug: "assembleias",
    resumo: "O encontro ampliou a participação e consolidou propostas apresentadas pela categoria.",
    autor: "Assessoria de Comunicação",
    data: "7 de setembro de 2025",
    dataISO: "2025-09-07",
    ano: "2025",
    imagem: "../assets/images/noticias/assembleia.png",
    leitura: "Leitura de 3 minutos"
  },
  {
    id: 15,
    titulo: "Campanha institucional reforça importância da participação",
    categoria: "Campanhas",
    categoriaSlug: "campanhas",
    resumo: "A iniciativa apresenta os canais disponíveis para diálogo e participação dos filiados.",
    autor: "Diretoria Executiva",
    data: "4 de dezembro de 2024",
    dataISO: "2024-12-04",
    ano: "2024",
    imagem: "../assets/images/noticias/direitos.png",
    leitura: "Leitura de 2 minutos"
  },
  {
    id: 16,
    titulo: "Relatório anual reúne principais ações do sindicato",
    categoria: "Transparência",
    categoriaSlug: "transparencia",
    resumo: "Documento apresenta um panorama demonstrativo das atividades e iniciativas realizadas.",
    autor: "Secretaria Financeira",
    data: "20 de dezembro de 2024",
    dataISO: "2024-12-20",
    ano: "2024",
    imagem: "../assets/images/placeholders/noticia-direitos.jpg",
    leitura: "Leitura de 4 minutos"
  }
];

const newsImageFallback = "../assets/images/placeholders/noticia-assembleia.jpg";

function normalizeNewsText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function createNewsImage(image, alt, className = "") {
  const element = document.createElement("img");
  element.src = image;
  element.alt = alt;
  element.loading = "lazy";
  element.className = className;
  element.addEventListener("error", () => {
    if (!element.src.endsWith(newsImageFallback)) element.src = newsImageFallback;
  }, { once: true });
  return element;
}

function createNewsCard(noticia, related = false) {
  const article = document.createElement("article");
  article.className = related ? "news-public-card news-public-card--related" : "news-public-card";

  const imageLink = document.createElement("a");
  imageLink.className = "news-public-card__image";
  imageLink.href = `noticia.html?id=${noticia.id}`;
  imageLink.append(createNewsImage(noticia.imagem, `Imagem de capa: ${noticia.titulo}`));

  const content = document.createElement("div");
  content.className = "news-public-card__content";
  content.innerHTML = `
    <span class="news-category">${noticia.categoria}</span>
    <h3><a href="noticia.html?id=${noticia.id}">${noticia.titulo}</a></h3>
    <p>${noticia.resumo}</p>
    <div class="news-byline">
      <span><i class="bi bi-person" aria-hidden="true"></i>${noticia.autor}</span>
      <time datetime="${noticia.dataISO}"><i class="bi bi-calendar3" aria-hidden="true"></i>${noticia.data}</time>
    </div>
    <a class="news-read-link" href="noticia.html?id=${noticia.id}">Ler mais <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
  `;
  article.append(imageLink, content);
  return article;
}

function initializeNewsListing() {
  const grid = document.querySelector("[data-news-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-news-search]");
  const category = document.querySelector("[data-news-category]");
  const year = document.querySelector("[data-news-year]");
  const count = document.querySelector("[data-news-count]");
  const empty = document.querySelector("[data-news-empty]");
  const pagination = document.querySelector("[data-news-pagination]");
  const featuredContainer = document.querySelector("[data-news-featured]");
  const listStart = document.querySelector("[data-news-list-start]");
  const clearButtons = document.querySelectorAll("[data-news-clear]");
  const pageSize = 3;
  let currentPage = 1;
  let filteredNews = [];

  const featured = noticias.find((item) => item.destaque);
  const regularNews = noticias.filter((item) => !item.destaque);

  if (featured && featuredContainer) {
    const image = createNewsImage(featured.imagem, `Imagem de capa: ${featured.titulo}`);
    featuredContainer.querySelector("[data-featured-image]").append(image);
    featuredContainer.querySelector("[data-featured-category]").textContent = featured.categoria;
    featuredContainer.querySelector("[data-featured-title]").textContent = featured.titulo;
    featuredContainer.querySelector("[data-featured-summary]").textContent = featured.resumo;
    featuredContainer.querySelector("[data-featured-author]").textContent = featured.autor;
    featuredContainer.querySelector("[data-featured-date]").textContent = featured.data;
    featuredContainer.querySelector("[data-featured-date]").dateTime = featured.dataISO;
    featuredContainer.querySelector("[data-featured-link]").href = `noticia.html?id=${featured.id}`;
  }

  function renderPagination(totalPages) {
    pagination.replaceChildren();
    if (totalPages <= 1) {
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;

    const addButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.page = String(page);
      button.className = options.className || "";
      button.disabled = options.disabled;
      button.setAttribute("aria-label", options.ariaLabel || `Página ${page}`);
      if (page === currentPage && !options.navigation) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        currentPage = page;
        renderNews();
        listStart?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pagination.append(button);
    };

    addButton("Anterior", Math.max(1, currentPage - 1), {
      className: "news-pagination__navigation",
      disabled: currentPage === 1,
      ariaLabel: "Página anterior",
      navigation: true
    });
    for (let page = 1; page <= totalPages; page += 1) addButton(String(page), page);
    addButton("Seguinte", Math.min(totalPages, currentPage + 1), {
      className: "news-pagination__navigation",
      disabled: currentPage === totalPages,
      ariaLabel: "Próxima página",
      navigation: true
    });
  }

  function renderNews() {
    const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredNews.slice(start, start + pageSize);
    grid.replaceChildren(...pageItems.map((item) => createNewsCard(item)));
    count.textContent = String(filteredNews.length);
    empty.hidden = filteredNews.length !== 0;
    grid.hidden = filteredNews.length === 0;
    renderPagination(filteredNews.length ? totalPages : 0);
  }

  function applyNewsFilters() {
    const term = normalizeNewsText(search.value);
    const selectedCategory = category.value;
    const selectedYear = year.value;
    filteredNews = regularNews.filter((item) => {
      const searchable = normalizeNewsText(`${item.titulo} ${item.resumo} ${item.categoria} ${item.autor}`);
      return (!term || searchable.includes(term))
        && (selectedCategory === "todas" || item.categoriaSlug === selectedCategory)
        && (selectedYear === "todos" || item.ano === selectedYear);
    });
    currentPage = 1;
    featuredContainer.hidden = Boolean(term || selectedCategory !== "todas" || selectedYear !== "todos");
    renderNews();
  }

  function clearNewsFilters() {
    search.value = "";
    category.value = "todas";
    year.value = "todos";
    applyNewsFilters();
    search.focus();
  }

  search.addEventListener("input", applyNewsFilters);
  category.addEventListener("change", applyNewsFilters);
  year.addEventListener("change", applyNewsFilters);
  clearButtons.forEach((button) => button.addEventListener("click", clearNewsFilters));
  document.querySelector("[data-news-filters]")?.addEventListener("submit", (event) => event.preventDefault());
  applyNewsFilters();
}

function createDefaultArticleContent(noticia) {
  return [
    {
      tipo: "paragrafo",
      texto: `O sindicato acompanha de forma permanente os temas relacionados a ${noticia.categoria.toLowerCase()} e mantém a categoria informada sobre cada novo encaminhamento.`
    },
    {
      tipo: "titulo",
      texto: "Principais pontos discutidos"
    },
    {
      tipo: "lista",
      itens: [
        "valorização salarial e profissional;",
        "condições adequadas de trabalho;",
        "revisão de benefícios;",
        "calendário de reuniões;",
        "acompanhamento das propostas."
      ]
    },
    {
      tipo: "citacao",
      texto: "O diálogo institucional deve resultar em medidas concretas para a valorização dos servidores."
    },
    {
      tipo: "titulo",
      texto: "Próximos encaminhamentos"
    },
    {
      tipo: "paragrafo",
      texto: "Uma nova reunião deverá ocorrer após a análise das propostas apresentadas pelas partes. Os filiados serão informados pelos canais oficiais."
    },
    {
      tipo: "informacao",
      texto: "Este conteúdo é demonstrativo e será futuramente administrado pelo módulo de Notícias e Comunicados."
    }
  ];
}

function renderArticleContent(container, items) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    let element;
    if (item.tipo === "titulo") {
      element = document.createElement("h2");
      element.textContent = item.texto;
    } else if (item.tipo === "citacao") {
      element = document.createElement("blockquote");
      element.textContent = item.texto;
    } else if (item.tipo === "lista") {
      element = document.createElement("ul");
      item.itens.forEach((text) => {
        const listItem = document.createElement("li");
        listItem.textContent = text;
        element.append(listItem);
      });
    } else if (item.tipo === "informacao") {
      element = document.createElement("aside");
      element.className = "news-article__information";
      element.innerHTML = `<i class="bi bi-info-circle" aria-hidden="true"></i><p>${item.texto}</p>`;
    } else {
      element = document.createElement("p");
      element.textContent = item.texto;
    }
    fragment.append(element);
  });
  container.replaceChildren(fragment);
}

function initializeNewsDetail() {
  const article = document.querySelector("[data-news-article]");
  if (!article) return;

  const params = new URLSearchParams(window.location.search);
  const newsId = Number(params.get("id"));
  const noticia = noticias.find((item) => item.id === newsId);
  const notFound = document.querySelector("[data-news-not-found]");

  if (!noticia) {
    article.hidden = true;
    notFound.hidden = false;
    document.title = "Notícia não encontrada | Sinprotec";
    return;
  }

  notFound.hidden = true;
  article.hidden = false;
  document.title = `${noticia.titulo} | Sinprotec`;
  document.querySelector("[data-detail-breadcrumb-title]").textContent = noticia.titulo;
  document.querySelector("[data-detail-category]").textContent = noticia.categoria;
  document.querySelector("[data-detail-title]").textContent = noticia.titulo;
  document.querySelector("[data-detail-summary]").textContent = noticia.resumo;
  document.querySelector("[data-detail-author]").textContent = noticia.autor;
  const dateElement = document.querySelector("[data-detail-date]");
  dateElement.textContent = noticia.data;
  dateElement.dateTime = noticia.dataISO;
  document.querySelector("[data-detail-reading]").textContent = noticia.leitura;

  const cover = createNewsImage(noticia.imagem, `Imagem de capa: ${noticia.titulo}`);
  cover.loading = "eager";
  document.querySelector("[data-detail-cover]").append(cover);
  document.querySelector("[data-detail-caption]").textContent = `Imagem institucional — ${noticia.categoria}`;

  const opening = {
    tipo: "paragrafo",
    texto: noticia.id === 1
      ? "O sindicato e representantes do governo retomaram as reuniões da mesa de negociação para tratar das principais demandas apresentadas pela categoria."
      : noticia.resumo
  };
  renderArticleContent(document.querySelector("[data-detail-content]"), [opening, ...createDefaultArticleContent(noticia)]);

  document.querySelector("[data-author-name]").textContent = noticia.autor;
  const related = noticias
    .filter((item) => item.id !== noticia.id)
    .sort((a, b) => Number(b.categoriaSlug === noticia.categoriaSlug) - Number(a.categoriaSlug === noticia.categoriaSlug))
    .slice(0, 3);
  document.querySelector("[data-related-grid]").replaceChildren(...related.map((item) => createNewsCard(item, true)));

  const feedback = document.querySelector("[data-news-feedback]");
  function showFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = false;
    window.clearTimeout(showFeedback.timer);
    showFeedback.timer = window.setTimeout(() => {
      feedback.hidden = true;
    }, 3000);
  }

  document.querySelector("[data-copy-link]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showFeedback("Link copiado para a área de transferência.");
    } catch {
      const input = document.createElement("textarea");
      input.value = window.location.href;
      input.setAttribute("readonly", "");
      input.className = "news-copy-helper";
      document.body.append(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showFeedback("Link copiado para a área de transferência.");
    }
  });

  document.querySelectorAll("[data-share-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      showFeedback(`${button.dataset.shareDemo}: compartilhamento demonstrativo.`);
    });
  });
}

initializeNewsListing();
initializeNewsDetail();
