// Galeria pública: registros visuais demonstrativos organizados por evento.
const galeriaCategorias = {
  assembleias: "Assembleias",
  reunioes: "Reuniões",
  mobilizacoes: "Mobilizações",
  formacao: "Formação",
  eventos: "Eventos Institucionais"
};

// Imagens já existentes no protótipo, reutilizadas como material ilustrativo.
const galeriaImagens = {
  assembleia: { src: "../assets/images/noticias/assembleia.png", width: 1619, height: 971 },
  direitos: { src: "../assets/images/noticias/direitos.png", width: 1619, height: 971 },
  negociacao: { src: "../assets/images/noticias/negociacao.png", width: 1619, height: 971 },
  acordo: { src: "../assets/images/sede-sindicato.jpg", width: 2560, height: 1440 },
  uniao: { src: "../assets/images/banner.jpg", width: 1672, height: 941 },
  servidores: { src: "../assets/images/filiacao/uniao-servidores.jpg", width: 1600, height: 1000 },
  dialogo: { src: "../assets/images/contato/atendimento.jpg", width: 1600, height: 1000 }
};

const galeriaImagemReserva = "../assets/images/sede-sindicato.jpg";

const galeriaRegistros = [
  {
    id: "assembleia-geral-2026",
    titulo: "Assembleia Geral dos Servidores",
    categoria: "assembleias",
    dataISO: "2026-08-24",
    local: "Auditório da sede",
    descricao: "Servidores reunidos em Assembleia Geral Ordinária para deliberar sobre a pauta institucional e aprovar os encaminhamentos da categoria.",
    fotos: [
      { imagem: "assembleia", alt: "Plenário lotado com servidores de mãos levantadas durante votação em auditório", legenda: "Votação das propostas pelo plenário." },
      { imagem: "direitos", alt: "Integrantes da mesa reunidos em torno de uma mesa com documentos", legenda: "Sistematização dos encaminhamentos aprovados." }
    ]
  },
  {
    id: "reuniao-diretoria-2026",
    titulo: "Reunião da Diretoria",
    categoria: "reunioes",
    dataISO: "2026-06-10",
    local: "Sala de reuniões da sede",
    descricao: "Reunião ordinária da Diretoria Executiva para acompanhar o planejamento da gestão e as demandas apresentadas pelos filiados.",
    fotos: [
      { imagem: "negociacao", alt: "Quatro integrantes da Diretoria analisam documentos sobre a mesa de reunião", legenda: "Análise dos documentos da pauta." },
      { imagem: "direitos", alt: "Seis pessoas em diálogo ao redor de uma mesa de reunião com documentos e copos de água", legenda: "Debate sobre as demandas dos filiados." }
    ]
  },
  {
    id: "encontro-filiados-2026",
    titulo: "Encontro com Filiados",
    categoria: "eventos",
    dataISO: "2026-04-18",
    local: "Sede do Sindicato",
    descricao: "Encontro aberto para apresentar as ações da gestão, ouvir os filiados e fortalecer os canais de diálogo com a categoria.",
    fotos: [
      { imagem: "dialogo", alt: "Ilustração de duas pessoas conversando, com um balão de diálogo acima delas", legenda: "Escuta e diálogo com os filiados." },
      { imagem: "servidores", alt: "Ilustração de três pessoas lado a lado com um símbolo de confirmação", legenda: "Apresentação das ações da gestão." },
      { imagem: "uniao", alt: "Mãos de várias pessoas sobrepostas em sinal de união", legenda: "Encerramento do encontro." }
    ]
  },
  {
    id: "mobilizacao-servidores-2025",
    titulo: "Mobilização em Defesa dos Servidores",
    categoria: "mobilizacoes",
    dataISO: "2025-10-22",
    local: "Unidades regionais",
    descricao: "Ato de mobilização em defesa da valorização dos servidores e do serviço público, com participação de filiados de diferentes unidades.",
    fotos: [
      { imagem: "uniao", alt: "Mãos de várias pessoas sobrepostas em sinal de união e mobilização", legenda: "Ato simbólico de união da categoria." },
      { imagem: "assembleia", alt: "Servidores reunidos em auditório com as mãos levantadas", legenda: "Plenária de mobilização." }
    ]
  },
  {
    id: "formacao-sindical-2025",
    titulo: "Formação Sindical",
    categoria: "formacao",
    dataISO: "2025-08-12",
    local: "Sala de formação",
    descricao: "Atividade formativa sobre direitos, organização sindical e participação coletiva, voltada a filiados e representantes de base.",
    fotos: [
      { imagem: "direitos", alt: "Participantes em roda de conversa ao redor de uma mesa com materiais de estudo", legenda: "Roda de conversa sobre direitos e organização sindical." },
      { imagem: "negociacao", alt: "Quatro participantes analisam textos durante atividade em grupo", legenda: "Atividade em grupo com estudo de documentos." }
    ]
  },
  {
    id: "reuniao-ampliada-2024",
    titulo: "Reunião Ampliada da Categoria",
    categoria: "reunioes",
    dataISO: "2024-05-14",
    local: "Auditório da sede",
    descricao: "Reunião com representantes de diferentes unidades para consolidar a pauta de reivindicações apresentada à assembleia.",
    fotos: [
      { imagem: "servidores", alt: "Ilustração de três pessoas lado a lado com um símbolo de confirmação", legenda: "Consolidação das propostas da categoria." },
      { imagem: "assembleia", alt: "Auditório com servidores de mãos levantadas durante deliberação", legenda: "Deliberação dos representantes presentes." }
    ]
  },
  {
    id: "termo-cooperacao-2024",
    titulo: "Assinatura de Termo de Cooperação",
    categoria: "eventos",
    dataISO: "2024-11-05",
    local: "Sede do Sindicato",
    descricao: "Formalização de termo de cooperação institucional voltado à ampliação das ações de orientação e atendimento aos servidores.",
    fotos: [
      { imagem: "acordo", alt: "Aperto de mãos sobre a mesa de reunião, com participantes aplaudindo ao fundo", legenda: "Formalização do termo de cooperação." },
      { imagem: "negociacao", alt: "Representantes analisam o texto do termo antes da assinatura", legenda: "Leitura final do documento." }
    ]
  }
];

function formatarDataGaleria(dataISO) {
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function textoQuantidadeFotos(total) {
  return total === 1 ? "1 foto" : `${total} fotos`;
}

function aplicarImagemGaleria(elemento, chave) {
  const imagem = galeriaImagens[chave];
  elemento.src = imagem.src;
  elemento.width = imagem.width;
  elemento.height = imagem.height;
}

function tratarFalhaImagemGaleria(elemento) {
  elemento.addEventListener("error", () => {
    if (!elemento.src.endsWith(galeriaImagemReserva.replace("..", ""))) elemento.src = galeriaImagemReserva;
  });
}

function criarCardGaleria(registro) {
  const article = document.createElement("article");
  article.className = "gallery-card";
  article.dataset.galleryCard = registro.id;

  const media = document.createElement("div");
  media.className = "gallery-card__media";
  media.dataset.galleryOpen = registro.id;

  const capa = document.createElement("img");
  capa.alt = "";
  capa.loading = "lazy";
  capa.decoding = "async";
  tratarFalhaImagemGaleria(capa);
  aplicarImagemGaleria(capa, registro.fotos[0].imagem);

  const quantidade = document.createElement("span");
  quantidade.className = "gallery-card__count";
  quantidade.innerHTML = `<i class="bi bi-images" aria-hidden="true"></i>${textoQuantidadeFotos(registro.fotos.length)}`;

  const zoom = document.createElement("span");
  zoom.className = "gallery-card__zoom";
  zoom.setAttribute("aria-hidden", "true");
  zoom.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';

  media.append(capa, quantidade, zoom);

  const body = document.createElement("div");
  body.className = "gallery-card__body";
  body.innerHTML = `
    <span class="news-category">${galeriaCategorias[registro.categoria]}</span>
    <h3>${registro.titulo}</h3>
    <div class="gallery-card__meta">
      <time datetime="${registro.dataISO}"><i class="bi bi-calendar3" aria-hidden="true"></i>${formatarDataGaleria(registro.dataISO)}</time>
      <span><i class="bi bi-geo-alt" aria-hidden="true"></i>${registro.local}</span>
    </div>
    <p>${registro.descricao}</p>
    <button class="news-read-link gallery-card__action" type="button" data-gallery-open="${registro.id}" aria-label="Ver fotos de ${registro.titulo}">Ver fotos <i class="bi bi-arrow-right" aria-hidden="true"></i></button>
  `;

  article.append(media, body);
  return article;
}

function initializeGallery() {
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid) return;

  const categorySelect = document.querySelector("[data-gallery-category]");
  const yearSelect = document.querySelector("[data-gallery-year]");
  const count = document.querySelector("[data-gallery-count]");
  const empty = document.querySelector("[data-gallery-empty]");
  const modal = document.querySelector("[data-gallery-modal]");
  const modalImage = modal.querySelector("[data-gallery-modal-image]");
  const modalCounter = modal.querySelector("[data-gallery-modal-counter]");
  const modalCaption = modal.querySelector("[data-gallery-modal-caption]");
  const modalCategory = modal.querySelector("[data-gallery-modal-category]");
  const modalTitle = modal.querySelector("[data-gallery-modal-title]");
  const modalDescription = modal.querySelector("[data-gallery-modal-description]");
  const modalDate = modal.querySelector("[data-gallery-modal-date]");
  const modalLocation = modal.querySelector("[data-gallery-modal-location]");
  const modalTotal = modal.querySelector("[data-gallery-modal-total]");
  const closeButton = modal.querySelector("[data-gallery-close]");
  const previousButton = modal.querySelector("[data-gallery-prev]");
  const nextButton = modal.querySelector("[data-gallery-next]");

  let registroAtual = null;
  let fotoAtual = 0;
  let ultimoGatilho = null;

  tratarFalhaImagemGaleria(modalImage);

  function aplicarFiltros() {
    const categoria = categorySelect.value;
    const ano = yearSelect.value;
    const filtrados = galeriaRegistros.filter((registro) => (
      (categoria === "todas" || registro.categoria === categoria)
      && (ano === "todos" || registro.dataISO.startsWith(ano))
    ));

    grid.replaceChildren(...filtrados.map(criarCardGaleria));
    grid.hidden = filtrados.length === 0;
    empty.hidden = filtrados.length !== 0;
    count.textContent = String(filtrados.length);
  }

  function limparFiltros() {
    categorySelect.value = "todas";
    yearSelect.value = "todos";
    aplicarFiltros();
    categorySelect.focus();
  }

  function mostrarFoto(indice) {
    const total = registroAtual.fotos.length;
    fotoAtual = (indice + total) % total;
    const foto = registroAtual.fotos[fotoAtual];
    aplicarImagemGaleria(modalImage, foto.imagem);
    modalImage.alt = foto.alt;
    modalCounter.textContent = `Foto ${fotoAtual + 1} de ${total}`;
    modalCaption.textContent = foto.legenda;
  }

  function abrirRegistro(id, gatilho) {
    registroAtual = galeriaRegistros.find((registro) => registro.id === id);
    if (!registroAtual) return;

    ultimoGatilho = gatilho;
    modalCategory.textContent = galeriaCategorias[registroAtual.categoria];
    modalTitle.textContent = registroAtual.titulo;
    modalDescription.textContent = registroAtual.descricao;
    modalDate.textContent = formatarDataGaleria(registroAtual.dataISO);
    modalDate.dateTime = registroAtual.dataISO;
    modalLocation.textContent = registroAtual.local;
    modalTotal.textContent = textoQuantidadeFotos(registroAtual.fotos.length);

    const possuiVariasFotos = registroAtual.fotos.length > 1;
    previousButton.hidden = !possuiVariasFotos;
    nextButton.hidden = !possuiVariasFotos;
    mostrarFoto(0);

    document.body.classList.add("modal-open");
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    closeButton.focus();
  }

  function aoFecharRegistro() {
    document.body.classList.remove("modal-open");
    ultimoGatilho?.focus();
  }

  function fecharRegistro() {
    if (!modal.hasAttribute("open")) return;
    if (typeof modal.close === "function") {
      modal.close();
    } else {
      modal.removeAttribute("open");
      aoFecharRegistro();
    }
  }

  grid.addEventListener("click", (event) => {
    const gatilho = event.target.closest("[data-gallery-open]");
    if (!gatilho) return;
    const card = gatilho.closest("[data-gallery-card]");
    const botaoDoCard = card?.querySelector(".gallery-card__action") || gatilho;
    abrirRegistro(gatilho.dataset.galleryOpen, botaoDoCard);
  });

  categorySelect.addEventListener("change", aplicarFiltros);
  yearSelect.addEventListener("change", aplicarFiltros);
  document.querySelectorAll("[data-gallery-clear]").forEach((button) => {
    button.addEventListener("click", limparFiltros);
  });
  document.querySelector("[data-gallery-filters]")?.addEventListener("submit", (event) => event.preventDefault());

  closeButton.addEventListener("click", fecharRegistro);
  previousButton.addEventListener("click", () => mostrarFoto(fotoAtual - 1));
  nextButton.addEventListener("click", () => mostrarFoto(fotoAtual + 1));

  modal.addEventListener("close", aoFecharRegistro);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) fecharRegistro();
  });
  modal.addEventListener("keydown", (event) => {
    if (!registroAtual || registroAtual.fotos.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      mostrarFoto(fotoAtual - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      mostrarFoto(fotoAtual + 1);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharRegistro();
  });

  aplicarFiltros();
}

initializeGallery();
