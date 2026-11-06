// T34 — Enquetes e Votações: base única compartilhada entre Área Administrativa
// (admin-votacoes.js) e participação do usuário (filiado-votacoes.html).
// localStorage["sindGestao.votingDemo"], exposta em window.SindGestaoVotacoes.
// Protótipo demonstrativo: não há criptografia, servidor nem sistema eleitoral.
// Eleições sindicais formais não fazem parte deste módulo.
(() => {
  "use strict";

  const CHAVE = "sindGestao.votingDemo";
  const CHAVE_LEGADA = "sindGestao.votacaoDemo.VOT-2026-DEMO-01"; // sessionStorage da versão anterior

  const TIPOS = ["Enquete", "Votação"];
  const PUBLICOS = ["Filiados", "Servidores cadastrados"];
  const MODALIDADES = ["Identificada", "Sigilosa"];
  const STATUS_ADM = { RASCUNHO: "Rascunho", LIBERADA: "Liberada" };
  const SITUACAO = { RASCUNHO: "Rascunho", AGENDADA: "Agendada", ABERTA: "Aberta", ENCERRADA: "Encerrada" };

  // Participantes demonstrativos por público (identificadores fictícios).
  const PARTICIPANTES = Object.freeze({
    filiado: { id: "FIL-DEMO-0001", nome: "Filiado Demonstrativo", publico: "Filiados" },
    servidorCadastrado: { id: "SRV-DEMO-0001", nome: "Servidor cadastrado demonstrativo", publico: "Servidores cadastrados" }
  });

  /* ---------- Utilidades ---------- */

  function agora() {
    return new Date();
  }

  function isoLocal(d = agora()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function parseData(valor) {
    const d = new Date(String(valor || ""));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
  }

  /* ---------- Seeds (criados somente se a chave não existir) ---------- */

  function votosSeed(distribuicao, identificada, prefixo) {
    const votes = [];
    const participacoes = [];
    let n = 0;
    distribuicao.forEach(([opcaoId, qtd]) => {
      for (let i = 0; i < qtd; i += 1) {
        n += 1;
        const participanteId = `${prefixo}-${String(n).padStart(4, "0")}`;
        participacoes.push({ participanteId, at: "2026-10-2" + (n % 8) + "T10:00:00" });
        votes.push(identificada ? { opcaoId, participanteId } : { opcaoId });
      }
    });
    return { votes, participacoes };
  }

  function seeds() {
    const encerrada = votosSeed([["hibrido", 13], ["online", 7], ["presencial", 4]], true, "FIL-DEMO-SEED");

    return [
      {
        id: "VOT-2026-DEMO-00",
        tipo: "Enquete",
        titulo: "Formato preferencial para reuniões",
        descricao: "Consulta demonstrativa sobre o formato das reuniões ordinárias.",
        pergunta: "Qual formato você prefere para as reuniões ordinárias?",
        opcoes: [
          { id: "hibrido", texto: "Formato híbrido" },
          { id: "online", texto: "On-line" },
          { id: "presencial", texto: "Presencial" }
        ],
        publico: "Filiados",
        modalidade: "Identificada",
        inicioAt: "2026-10-20T08:00:00",
        fimAt: "2026-10-30T18:00:00",
        statusAdministrativo: STATUS_ADM.LIBERADA,
        resultadoVisivelAoPublicoParticipante: true,
        createdBy: "Presidência",
        createdAt: "2026-10-15T09:00:00",
        releasedBy: "Presidência",
        releasedAt: "2026-10-16T10:00:00",
        closedAt: "2026-10-30T18:00:00",
        votes: encerrada.votes,
        participacoes: encerrada.participacoes,
        history: [
          { at: "2026-10-15T09:00:00", profile: "Presidência", action: "Consulta criada como Rascunho." },
          { at: "2026-10-16T10:00:00", profile: "Presidência", action: "Consulta liberada." },
          { at: "2026-10-30T18:00:00", profile: "Sistema", action: "Consulta encerrada pelo término do período." }
        ]
      },
      {
        id: "VOT-2026-DEMO-01",
        tipo: "Enquete",
        titulo: "Preferência de canal para comunicações gerais",
        descricao: "Consulta demonstrativa sobre o canal preferido para comunicações gerais.",
        pergunta: "Qual canal você prefere para receber comunicações gerais?",
        opcoes: [
          { id: "portal", texto: "Portal / Área do Filiado", detalhe: "Consultar as informações diretamente no sistema." },
          { id: "email", texto: "E-mail", detalhe: "Receber os principais comunicados por e-mail." },
          { id: "whatsapp", texto: "WhatsApp institucional", detalhe: "Receber avisos gerais pelo canal institucional." },
          { id: "presencial", texto: "Atendimento presencial", detalhe: "Priorizar a comunicação nos atendimentos presenciais." }
        ],
        publico: "Filiados",
        modalidade: "Sigilosa",
        inicioAt: "2026-11-05T08:00:00",
        fimAt: "2026-11-12T18:00:00",
        statusAdministrativo: STATUS_ADM.LIBERADA,
        resultadoVisivelAoPublicoParticipante: true,
        createdBy: "Presidência",
        createdAt: "2026-11-01T09:00:00",
        releasedBy: "Presidência",
        releasedAt: "2026-11-03T10:00:00",
        closedAt: null,
        votes: [{ opcaoId: "email" }, { opcaoId: "portal" }, { opcaoId: "whatsapp" }],
        participacoes: [
          { participanteId: "FIL-DEMO-SEED-0101", at: "2026-11-05T09:12:00" },
          { participanteId: "FIL-DEMO-SEED-0102", at: "2026-11-05T11:40:00" },
          { participanteId: "FIL-DEMO-SEED-0103", at: "2026-11-05T15:05:00" }
        ],
        history: [
          { at: "2026-11-01T09:00:00", profile: "Presidência", action: "Consulta criada como Rascunho." },
          { at: "2026-11-03T10:00:00", profile: "Presidência", action: "Consulta liberada." }
        ]
      },
      {
        id: "VOT-2026-DEMO-02",
        tipo: "Votação",
        titulo: "Data do encontro regional de filiados",
        descricao: "Votação simples demonstrativa para definir a data do encontro regional.",
        pergunta: "Qual data você prefere para o encontro regional de filiados?",
        opcoes: [
          { id: "sabado-05", texto: "Sábado, 05/12/2026" },
          { id: "sabado-12", texto: "Sábado, 12/12/2026" }
        ],
        publico: "Filiados",
        modalidade: "Identificada",
        inicioAt: "2026-11-20T08:00:00",
        fimAt: "2026-11-27T18:00:00",
        statusAdministrativo: STATUS_ADM.LIBERADA,
        resultadoVisivelAoPublicoParticipante: false,
        createdBy: "Presidência",
        createdAt: "2026-11-04T14:00:00",
        releasedBy: "Presidência",
        releasedAt: "2026-11-05T09:30:00",
        closedAt: null,
        votes: [],
        participacoes: [],
        history: [
          { at: "2026-11-04T14:00:00", profile: "Presidência", action: "Consulta criada como Rascunho." },
          { at: "2026-11-05T09:30:00", profile: "Presidência", action: "Consulta liberada." }
        ]
      },
      {
        id: "VOT-2026-DEMO-03",
        tipo: "Enquete",
        titulo: "Temas para o próximo ciclo de formação",
        descricao: "Enquete demonstrativa destinada aos servidores cadastrados no portal.",
        pergunta: "Qual tema você considera prioritário para o próximo ciclo de formação?",
        opcoes: [
          { id: "carreira", texto: "Plano de carreira" },
          { id: "saude", texto: "Saúde do servidor" },
          { id: "previdencia", texto: "Previdência" }
        ],
        publico: "Servidores cadastrados",
        modalidade: "Sigilosa",
        inicioAt: "2026-12-01T08:00:00",
        fimAt: "2026-12-10T18:00:00",
        statusAdministrativo: STATUS_ADM.RASCUNHO,
        resultadoVisivelAoPublicoParticipante: true,
        createdBy: "Presidência",
        createdAt: "2026-11-05T16:00:00",
        releasedBy: null,
        releasedAt: null,
        closedAt: null,
        votes: [],
        participacoes: [],
        history: [
          { at: "2026-11-05T16:00:00", profile: "Presidência", action: "Consulta criada como Rascunho." }
        ]
      }
    ];
  }

  /* ---------- Persistência ---------- */

  function gravar(lista) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch {
      return false;
    }
  }

  // Situação temporal derivada do período; "Liberada" é apenas a autorização administrativa.
  function situacao(consulta, referencia = agora()) {
    if (!consulta || consulta.statusAdministrativo !== STATUS_ADM.LIBERADA) return SITUACAO.RASCUNHO;
    const inicio = parseData(consulta.inicioAt);
    const fim = parseData(consulta.fimAt);
    if (!inicio || !fim) return SITUACAO.RASCUNHO;
    if (referencia < inicio) return SITUACAO.AGENDADA;
    if (referencia < fim) return SITUACAO.ABERTA;
    return SITUACAO.ENCERRADA;
  }

  // Registra uma única vez o encerramento temporal no histórico.
  function registrarEncerramentos(lista) {
    let alterou = false;
    lista.forEach((consulta) => {
      if (situacao(consulta) === SITUACAO.ENCERRADA && !consulta.closedAt) {
        consulta.closedAt = consulta.fimAt;
        consulta.history = Array.isArray(consulta.history) ? consulta.history : [];
        consulta.history.push({ at: consulta.fimAt, profile: "Sistema", action: "Consulta encerrada pelo término do período." });
        alterou = true;
      }
    });
    return alterou;
  }

  function normalizar(consulta) {
    return {
      ...consulta,
      opcoes: Array.isArray(consulta.opcoes) ? consulta.opcoes : [],
      votes: Array.isArray(consulta.votes) ? consulta.votes : [],
      participacoes: Array.isArray(consulta.participacoes) ? consulta.participacoes : [],
      history: Array.isArray(consulta.history) ? consulta.history : []
    };
  }

  function lerTodas() {
    let lista = null;
    try {
      const bruto = window.localStorage.getItem(CHAVE);
      if (bruto !== null) {
        const parsed = JSON.parse(bruto);
        if (Array.isArray(parsed)) lista = parsed;
      }
    } catch {
      lista = null;
    }

    if (!lista) {
      lista = seeds();
      gravar(lista);
    }

    lista = lista.filter((c) => c && typeof c.id === "string").map(normalizar);
    if (registrarEncerramentos(lista)) gravar(lista);
    return lista;
  }

  function salvarTodas(lista) {
    return gravar(lista);
  }

  function proximoId(lista) {
    const ano = agora().getFullYear();
    const numeros = lista
      .map((c) => new RegExp(`^VOT-${ano}-(\\d{4})$`).exec(c.id))
      .filter(Boolean)
      .map((m) => Number(m[1]));
    const n = (numeros.length ? Math.max(...numeros) : 0) + 1;
    return `VOT-${ano}-${String(n).padStart(4, "0")}`;
  }

  /* ---------- Regras de participação ---------- */

  function jaParticipou(consulta, participanteId) {
    return consulta.participacoes.some((p) => p.participanteId === participanteId);
  }

  // Visibilidade para o participante: somente Liberadas e destinadas ao seu público.
  function visivelPara(consulta, participante) {
    return Boolean(participante
      && consulta.statusAdministrativo === STATUS_ADM.LIBERADA
      && consulta.publico === participante.publico);
  }

  function resultadoVisivelParticipante(consulta) {
    return situacao(consulta) === SITUACAO.ENCERRADA && consulta.resultadoVisivelAoPublicoParticipante === true;
  }

  function apurar(consulta) {
    const total = consulta.votes.length;
    return {
      total,
      participacoes: consulta.participacoes.length,
      linhas: consulta.opcoes.map((opcao) => {
        const qtd = consulta.votes.filter((v) => v.opcaoId === opcao.id).length;
        return { id: opcao.id, texto: opcao.texto, votos: qtd, percentual: total ? Math.round((qtd / total) * 100) : 0 };
      })
    };
  }

  /*
   * Registro do voto com revalidação completa no momento da execução.
   * Sigilosa: o voto não guarda identificador nem horário e é inserido em posição aleatória;
   * o controle de voto único fica em "participacoes", que não guarda a opção.
   */
  function registrarVoto(consultaId, tipoParticipante, opcaoId) {
    const participante = PARTICIPANTES[tipoParticipante];
    if (!participante) return { ok: false, erro: "Perfil sem permissão para participar." };

    const lista = lerTodas();
    const consulta = lista.find((c) => c.id === consultaId);
    if (!consulta) return { ok: false, erro: "Consulta não encontrada." };
    if (consulta.statusAdministrativo !== STATUS_ADM.LIBERADA) return { ok: false, erro: "Consulta não liberada." };
    if (consulta.publico !== participante.publico) return { ok: false, erro: "Esta consulta é destinada a outro público." };

    const sit = situacao(consulta);
    if (sit === SITUACAO.AGENDADA) return { ok: false, erro: "A consulta ainda não foi aberta." };
    if (sit !== SITUACAO.ABERTA) return { ok: false, erro: "A consulta está encerrada." };
    if (jaParticipou(consulta, participante.id)) return { ok: false, erro: "Participação já registrada nesta consulta." };
    if (!consulta.opcoes.some((o) => o.id === opcaoId)) return { ok: false, erro: "Opção inválida." };

    const at = isoLocal();
    consulta.participacoes.push({ participanteId: participante.id, at });

    if (consulta.modalidade === "Identificada") {
      consulta.votes.push({ opcaoId, participanteId: participante.id, at });
    } else {
      const posicao = Math.floor(Math.random() * (consulta.votes.length + 1));
      consulta.votes.splice(posicao, 0, { opcaoId });
    }

    // Histórico sem associação entre pessoa e opção.
    consulta.history.push({ at, profile: "Participante", action: "Participação registrada." });

    return salvarTodas(lista) ? { ok: true } : { ok: false, erro: "Não foi possível gravar a participação neste navegador." };
  }

  window.SindGestaoVotacoes = Object.freeze({
    CHAVE,
    TIPOS,
    PUBLICOS,
    MODALIDADES,
    STATUS_ADM,
    SITUACAO,
    PARTICIPANTES,
    lerTodas,
    salvarTodas,
    proximoId,
    situacao,
    jaParticipou,
    visivelPara,
    resultadoVisivelParticipante,
    apurar,
    registrarVoto,
    isoLocal,
    parseData,
    clonar
  });

  /* ---------- Renderização na Área do Filiado ---------- */

  const raiz = document.querySelector("[data-votacoes-root]");
  if (!raiz) return;

  // Esta página é da Área do Filiado: o participante é sempre o perfil Filiado.
  const TIPO_PARTICIPANTE = "filiado";

  try { window.sessionStorage.removeItem(CHAVE_LEGADA); } catch { /* sem efeito */ }

  function esc(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  function dataHora(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ""));
    if (!m) return "—";
    return `${m[3]}/${m[2]}/${m[1]} · ${m[4]}h${m[5] === "00" ? "" : m[5]}`;
  }

  function data(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${m[3]}/${m[2]}/${m[1]}` : "—";
  }

  const TITULOS_SECAO = {
    Aberta: "Consulta disponível",
    Agendada: "Consulta agendada",
    Encerrada: "Consulta anterior"
  };

  function resultadoMarkup(consulta) {
    if (!resultadoVisivelParticipante(consulta)) {
      return '<p class="votacao-resultado-aviso">Resultado não disponibilizado aos participantes.</p>';
    }
    const r = apurar(consulta);
    return `
      <p class="votacao-resultado-aviso">Nesta consulta demonstrativa, a divulgação do resultado foi autorizada após o encerramento.</p>
      <div class="votacao-resultados">
        ${r.linhas.map((l) => `
          <div class="votacao-resultado">
            <div><strong>${esc(l.texto)}</strong><span>${l.percentual}%</span></div>
            <progress max="100" value="${l.percentual}">${l.percentual}%</progress>
          </div>`).join("")}
      </div>
      <p class="votacao-amostra">Total de participações: ${r.participacoes}. Percentuais inteiramente fictícios, utilizados apenas para representar o comportamento da interface.</p>
    `;
  }

  function corpoMarkup(consulta, sit, participou) {
    const pergunta = `
      <div class="votacao-pergunta">
        <p class="votacao-pergunta__label">Pergunta</p>
        <h4>${esc(consulta.pergunta)}</h4>
      </div>`;

    if (sit === SITUACAO.ENCERRADA) {
      return `${participou ? '<p class="votacao-resultado-aviso">Sua participação foi registrada nesta consulta.</p>' : ""}${resultadoMarkup(consulta)}`;
    }

    if (sit === SITUACAO.AGENDADA) {
      return `${pergunta}
        <ul class="votacao-lista-opcoes">${consulta.opcoes.map((o) => `<li>${esc(o.texto)}</li>`).join("")}</ul>
        <p class="votacao-resultado-aviso">A votação ficará disponível a partir de ${esc(dataHora(consulta.inicioAt))}.</p>`;
    }

    const confirmacao = `
      <div class="votacao-confirmacao" role="status">
        <span class="votacao-confirmacao__icone" aria-hidden="true">✓</span>
        <div>
          <strong>Participação registrada nesta demonstração</strong>
          <p>${consulta.modalidade === "Sigilosa"
            ? "Por se tratar de voto sigiloso, a opção selecionada não é exibida. Não é possível votar novamente."
            : "Voto identificado registrado neste navegador. Não é possível votar novamente."}</p>
        </div>
      </div>`;

    if (participou) return `${pergunta}${confirmacao}`;

    return `${pergunta}
      <form data-votacao-form="${esc(consulta.id)}" novalidate>
        <fieldset class="votacao-opcoes">
          <legend class="sr-only">Selecione uma opção</legend>
          ${consulta.opcoes.map((o) => `
            <label class="votacao-opcao">
              <input type="radio" name="voto" value="${esc(o.id)}">
              <span><strong>${esc(o.texto)}</strong>${o.detalhe ? `<small>${esc(o.detalhe)}</small>` : ""}</span>
            </label>`).join("")}
        </fieldset>
        <p class="votacao-erro" data-votacao-erro role="alert" hidden></p>
        <div class="votacao-acoes">
          <button type="submit" class="button button--primary">CONFIRMAR VOTO</button>
          <p>${consulta.modalidade === "Sigilosa"
            ? "Por se tratar de voto sigiloso, a opção selecionada não será exibida depois da confirmação."
            : "Voto identificado: a participação ficará associada ao seu cadastro."}</p>
        </div>
      </form>`;
  }

  function cartaoMarkup(consulta) {
    const sit = situacao(consulta);
    const participou = jaParticipou(consulta, PARTICIPANTES[TIPO_PARTICIPANTE].id);
    const tipoMeta = sit === SITUACAO.ENCERRADA
      ? `<span>Encerrada em</span><strong>${esc(data(consulta.fimAt))}</strong>`
      : `<span>Modalidade</span><strong>${consulta.modalidade === "Sigilosa" ? "Voto sigiloso" : "Voto identificado"}</strong>`;

    return `
      <section class="votacao-section" aria-labelledby="titulo-${esc(consulta.id)}">
        <div class="prestacao-section__header">
          <div>
            <span class="votacao-status votacao-status--${sit.toLowerCase()}">${sit.toUpperCase()}</span>
            <h2 id="titulo-${esc(consulta.id)}">${TITULOS_SECAO[sit]}</h2>
          </div>
          <span class="votacao-protocolo">${esc(consulta.id)}</span>
        </div>
        <article class="votacao-card${sit === SITUACAO.ABERTA ? " votacao-card--ativa" : ""}">
          <div class="votacao-card__cabecalho">
            <div>
              <span class="filiado-badge">${esc(consulta.tipo.toUpperCase())} DEMONSTRATIVA</span>
              <h3>${esc(consulta.titulo)}</h3>
            </div>
            <div class="votacao-card__tipo">${tipoMeta}</div>
          </div>
          ${consulta.descricao ? `<p>${esc(consulta.descricao)}</p>` : ""}
          <div class="votacao-metadados">
            <div><span>Público</span><strong>${esc(consulta.publico)}</strong></div>
            <div><span>Início</span><strong>${esc(dataHora(consulta.inicioAt))}</strong></div>
            <div><span>Encerramento</span><strong>${esc(dataHora(consulta.fimAt))}</strong></div>
          </div>
          ${corpoMarkup(consulta, sit, participou)}
        </article>
      </section>`;
  }

  const ORDEM = { Aberta: 0, Agendada: 1, Encerrada: 2 };

  function render() {
    const participante = PARTICIPANTES[TIPO_PARTICIPANTE];
    const consultas = lerTodas()
      .filter((c) => visivelPara(c, participante))
      .sort((a, b) => (ORDEM[situacao(a)] - ORDEM[situacao(b)]) || String(b.inicioAt).localeCompare(String(a.inicioAt)));

    raiz.innerHTML = consultas.length
      ? consultas.map(cartaoMarkup).join("")
      : '<section class="votacao-section"><p class="votacao-resultado-aviso">Nenhuma consulta liberada para o seu perfil no momento.</p></section>';
  }

  raiz.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-votacao-form]");
    if (!form) return;
    event.preventDefault();

    const erro = form.querySelector("[data-votacao-erro]");
    const escolhida = form.querySelector('input[name="voto"]:checked');
    if (!escolhida) {
      erro.textContent = "Selecione uma opção antes de confirmar o voto.";
      erro.hidden = false;
      return;
    }

    // registrarVoto relê o storage e revalida liberação, público, período e voto anterior.
    const resultado = registrarVoto(form.dataset.votacaoForm, TIPO_PARTICIPANTE, escolhida.value);
    if (!resultado.ok) {
      render();
      const novoErro = raiz.querySelector(`[data-votacao-form="${CSS.escape(form.dataset.votacaoForm)}"] [data-votacao-erro]`);
      if (novoErro) {
        novoErro.textContent = resultado.erro;
        novoErro.hidden = false;
      } else {
        window.alert(resultado.erro);
      }
      return;
    }
    render();
  });

  raiz.addEventListener("change", (event) => {
    const erro = event.target.closest("form")?.querySelector("[data-votacao-erro]");
    if (erro) erro.hidden = true;
  });

  window.addEventListener("storage", (event) => {
    if (event.key === CHAVE) render();
  });

  render();
})();
