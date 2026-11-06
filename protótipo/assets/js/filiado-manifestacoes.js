// Denúncias e Manifestações — protótipo demonstrativo para validação institucional.
// Base única compartilhada entre Área do Filiado e Conselhos:
// localStorage["sindGestao.manifestationsDemo"], acessada pela API
// window.SindGestaoManifestacoes (mesmo padrão de T33/T34).
// A API NÃO expõe leitura da base inteira: o Conselho é sempre derivado do perfil
// autenticado (sindGestao.adminDemoProfile) e relido a cada chamada.
(() => {
  "use strict";

  const CHAVE = "sindGestao.manifestationsDemo";
  const CHAVE_LEGADA = "sindGestao.manifestacaoDemo"; // sessionStorage da versão anterior
  const PROFILE_KEY = "sindGestao.adminDemoProfile";
  const ROLE_KEY = "sindGestao.councilDemoRole"; // autorização demonstrativa interna

  const STATUS = Object.freeze({
    RECEIVED: "Recebida",
    ANALYSIS: "Em análise",
    ANSWERED: "Respondida",
    FINALIZED: "Finalizada",
    ARCHIVED: "Arquivada"
  });
  const FLUXO = Object.freeze(Object.values(STATUS));

  const CONSELHOS = Object.freeze({ etica: "Conselho de Ética", fiscal: "Conselho Fiscal" });
  const PERFIL_CONSELHO = Object.freeze({ conselhoEtica: "etica", conselhoFiscal: "fiscal" });
  const PAPEIS = Object.freeze({ presidencia: "Presidência do Conselho", membro: "Membro do Conselho" });
  const TIPOS = Object.freeze(["Denúncia", "Manifestação"]);
  const IDENTIDADES = Object.freeze({ identificada: "Identificada", protegida: "Identidade protegida" });

  // Transições únicas permitidas (somente Presidência do Conselho).
  const TRANSICOES = Object.freeze({
    iniciar: { de: STATUS.RECEIVED, para: STATUS.ANALYSIS, acao: "Análise iniciada." },
    responder: { de: STATUS.ANALYSIS, para: STATUS.ANSWERED, acao: "Resposta formal registrada." },
    finalizar: { de: STATUS.ANSWERED, para: STATUS.FINALIZED, acao: "Manifestação finalizada." },
    arquivar: { de: STATUS.FINALIZED, para: STATUS.ARCHIVED, acao: "Manifestação arquivada." }
  });

  const AVISO_CONSELHO = "Aviso demonstrativo registrado para os membros do Conselho destinatário.";

  // Manifestante demonstrativo da Área do Filiado (usado SOMENTE na modalidade Identificada).
  const MANIFESTANTE_DEMO = Object.freeze({ id: "FIL-DEMO-0001", nome: "Filiado Demonstrativo" });

  function evento(at, action, extra = {}) {
    return { at, action, status: null, papel: "Sistema", note: "", visivelManifestante: true, ...extra };
  }

  function eventosRecebimento(at) {
    return [
      evento(at, "Manifestação recebida.", { status: STATUS.RECEIVED }),
      evento(at, AVISO_CONSELHO, { visivelManifestante: false })
    ];
  }

  // Seeds de identidade protegida não possuem nenhum identificador pessoal.
  const SEEDS = [
    {
      protocolo: "MAN-2026-0001", chave: "ETK7Q2MA", tipo: "Denúncia", conselho: "etica",
      identidade: "identificada", manifestanteId: "FIL-DEMO-0001", manifestanteNome: "Filiado Demonstrativo",
      assunto: "Conduta em reunião de núcleo regional",
      descricao: "Relato fictício sobre conduta inadequada durante reunião de núcleo regional, registrado apenas para demonstração do fluxo.",
      status: STATUS.RECEIVED, createdAt: "2026-11-03T09:15:00", updatedAt: "2026-11-03T09:15:00",
      history: eventosRecebimento("2026-11-03T09:15:00")
    },
    {
      protocolo: "MAN-2026-0002", chave: "PR9HX4ND", tipo: "Manifestação", conselho: "etica",
      identidade: "protegida",
      assunto: "Uso indevido de canal institucional",
      descricao: "Manifestação fictícia sobre uso de canal institucional para finalidade alheia ao Sindicato.",
      status: STATUS.ANALYSIS, createdAt: "2026-10-28T14:40:00", updatedAt: "2026-10-30T10:05:00",
      history: [
        ...eventosRecebimento("2026-10-28T14:40:00"),
        evento("2026-10-30T10:00:00", "Análise iniciada.", { status: STATUS.ANALYSIS, papel: PAPEIS.presidencia }),
        evento("2026-10-30T10:05:00", "Andamento interno registrado.", {
          papel: PAPEIS.presidencia, note: "Solicitada consulta ao regimento interno.", visivelManifestante: false
        })
      ]
    },
    {
      protocolo: "MAN-2026-0003", chave: "FS3MW8RT", tipo: "Manifestação", conselho: "fiscal",
      identidade: "identificada", manifestanteId: "FIL-DEMO-0002", manifestanteNome: "Filiado Demonstrativo B",
      assunto: "Esclarecimento sobre despesas de evento",
      descricao: "Pedido fictício de esclarecimento sobre despesas registradas em evento regional.",
      status: STATUS.ANSWERED, createdAt: "2026-10-20T08:30:00", updatedAt: "2026-10-27T16:20:00",
      respondedAt: "2026-10-27T16:20:00",
      respostaFormal: "O Conselho Fiscal verificou os lançamentos demonstrativos e os documentos comprobatórios. As despesas constam da prestação de contas do período.",
      history: [
        ...eventosRecebimento("2026-10-20T08:30:00"),
        evento("2026-10-22T09:00:00", "Análise iniciada.", { status: STATUS.ANALYSIS, papel: PAPEIS.presidencia }),
        evento("2026-10-27T16:20:00", "Resposta formal registrada.", { status: STATUS.ANSWERED, papel: PAPEIS.presidencia })
      ]
    },
    {
      protocolo: "MAN-2026-0004", chave: "FZ6LB2QE", tipo: "Denúncia", conselho: "fiscal",
      identidade: "protegida",
      assunto: "Divergência em relatório de contas",
      descricao: "Denúncia fictícia sobre divergência entre valores de relatório demonstrativo de contas.",
      status: STATUS.FINALIZED, createdAt: "2026-10-05T11:00:00", updatedAt: "2026-10-19T15:00:00",
      respondedAt: "2026-10-16T14:10:00", finalizedAt: "2026-10-19T15:00:00",
      respostaFormal: "A divergência apontada foi conferida e corrigida no relatório demonstrativo. O registro foi encaminhado à finalização.",
      history: [
        ...eventosRecebimento("2026-10-05T11:00:00"),
        evento("2026-10-07T09:30:00", "Análise iniciada.", { status: STATUS.ANALYSIS, papel: PAPEIS.presidencia }),
        evento("2026-10-16T14:10:00", "Resposta formal registrada.", { status: STATUS.ANSWERED, papel: PAPEIS.presidencia }),
        evento("2026-10-19T15:00:00", "Manifestação finalizada.", { status: STATUS.FINALIZED, papel: PAPEIS.presidencia })
      ]
    }
  ];

  /* ---------- Utilidades ---------- */

  function nowIso() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function gerarChave() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let chave = "";
    for (let i = 0; i < 8; i += 1) chave += chars[Math.floor(Math.random() * chars.length)];
    return chave;
  }

  const clonar = (valor) => JSON.parse(JSON.stringify(valor));

  /* ---------- Normalização (lista branca de campos) ---------- */

  function normalizarEvento(e, conselho) {
    if (!e || typeof e !== "object" || !e.at || !e.action) return null;
    return {
      at: String(e.at),
      action: String(e.action),
      status: FLUXO.includes(e.status) ? e.status : null,
      conselho: CONSELHOS[conselho],
      papel: String(e.papel || "Sistema"),
      note: String(e.note || ""),
      visivelManifestante: e.visivelManifestante === true
    };
  }

  // Somente campos conhecidos são persistidos. Na identidade protegida, qualquer
  // identificador pessoal (nome, CPF, e-mail, matrícula, memberId...) é descartado.
  function normalizar(item) {
    if (!item || typeof item !== "object") return null;
    const protocolo = String(item.protocolo || "").trim().toUpperCase();
    if (!/^MAN-\d{4}-\d{4}$/.test(protocolo)) return null;
    const conselho = Object.prototype.hasOwnProperty.call(CONSELHOS, item.conselho) ? item.conselho : null;
    if (!conselho) return null;
    const identidade = item.identidade === "protegida" ? "protegida" : "identificada";

    const registro = {
      protocolo,
      chave: String(item.chave || "").trim().toUpperCase(),
      tipo: TIPOS.includes(item.tipo) ? item.tipo : "Manifestação",
      conselho,
      identidade,
      assunto: String(item.assunto || ""),
      descricao: String(item.descricao || ""),
      status: FLUXO.includes(item.status) ? item.status : STATUS.RECEIVED,
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || item.createdAt || null,
      respondedAt: item.respondedAt || null,
      finalizedAt: item.finalizedAt || null,
      archivedAt: item.archivedAt || null,
      respostaFormal: String(item.respostaFormal || ""),
      history: (Array.isArray(item.history) ? item.history : [])
        .map((e) => normalizarEvento(e, conselho))
        .filter(Boolean)
    };

    if (identidade === "identificada") {
      registro.manifestanteId = String(item.manifestanteId || "");
      registro.manifestanteNome = String(item.manifestanteNome || "");
    }
    return registro;
  }

  /* ---------- Armazenamento ---------- */

  function salvarBase(registros) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(registros));
      return true;
    } catch (error) {
      return false; // Sem armazenamento, o estado vale apenas para a página aberta.
    }
  }

  // Versão anterior: um único registro mínimo em sessionStorage, sem conteúdo nem
  // dados pessoais. Migra uma vez, sem duplicar protocolo, e remove a chave antiga.
  function migrarLegado(registros, protocolos) {
    let migrou = false;
    try {
      const antigo = JSON.parse(window.sessionStorage.getItem(CHAVE_LEGADA) || "null");
      if (antigo && typeof antigo === "object") {
        const at = nowIso();
        const status = antigo.status === STATUS.ANALYSIS ? STATUS.ANALYSIS : STATUS.RECEIVED;
        const history = eventosRecebimento(at);
        if (status === STATUS.ANALYSIS) history.push(evento(at, "Análise iniciada.", { status, papel: "Sistema" }));
        const registro = normalizar({
          protocolo: antigo.protocolo,
          chave: antigo.chave,
          conselho: antigo.conselho,
          identidade: antigo.identidade,
          tipo: "Manifestação",
          assunto: "Registro demonstrativo anterior",
          descricao: "Registro criado em versão anterior do protótipo; o conteúdo não era armazenado.",
          status, createdAt: at, updatedAt: at, history
        });
        if (registro && !protocolos.has(registro.protocolo)) {
          protocolos.add(registro.protocolo);
          registros.push(registro);
          migrou = true;
        }
      }
      window.sessionStorage.removeItem(CHAVE_LEGADA);
    } catch (error) {
      // Migração apenas demonstrativa.
    }
    return migrou;
  }

  // Sempre relida do storage. Semeia uma única vez: após F5 os seeds não são duplicados.
  function lerBase() {
    let salvas = null;
    try {
      salvas = JSON.parse(window.localStorage.getItem(CHAVE) || "null");
    } catch (error) {
      salvas = null;
    }

    const protocolos = new Set();
    const registros = [];
    (Array.isArray(salvas) ? salvas : SEEDS).forEach((item) => {
      const registro = normalizar(item);
      if (registro && !protocolos.has(registro.protocolo)) {
        protocolos.add(registro.protocolo);
        registros.push(registro);
      }
    });

    const migrou = migrarLegado(registros, protocolos);
    registros.sort((a, b) => a.protocolo.localeCompare(b.protocolo));
    if (!Array.isArray(salvas) || migrou || salvas.length !== registros.length) salvarBase(registros);
    return registros;
  }

  function proximoProtocolo(registros) {
    const ano = new Date().getFullYear();
    const prefixo = `MAN-${ano}-`;
    const maior = registros
      .filter((r) => r.protocolo.startsWith(prefixo))
      .reduce((max, r) => Math.max(max, Number(r.protocolo.slice(-4)) || 0), 0);
    return `${prefixo}${String(maior + 1).padStart(4, "0")}`;
  }

  /* ---------- Contexto do Conselho (sempre relido) ---------- */

  function conselhoAtivo() {
    try {
      const perfil = window.localStorage.getItem(PROFILE_KEY);
      return Object.prototype.hasOwnProperty.call(PERFIL_CONSELHO, perfil) ? PERFIL_CONSELHO[perfil] : null;
    } catch (error) {
      return null;
    }
  }

  // Menor privilégio por padrão: sem escolha registrada, o papel é Membro do Conselho.
  function papelAtivo() {
    const conselho = conselhoAtivo();
    if (!conselho) return null;
    try {
      const papeis = JSON.parse(window.localStorage.getItem(ROLE_KEY) || "{}");
      return papeis && papeis[conselho] === "presidencia" ? "presidencia" : "membro";
    } catch (error) {
      return "membro";
    }
  }

  function definirPapel(papel) {
    const conselho = conselhoAtivo();
    if (!conselho || !Object.prototype.hasOwnProperty.call(PAPEIS, papel)) return false;
    try {
      const atual = JSON.parse(window.localStorage.getItem(ROLE_KEY) || "{}") || {};
      atual[conselho] = papel;
      window.localStorage.setItem(ROLE_KEY, JSON.stringify(atual));
      return true;
    } catch (error) {
      return false;
    }
  }

  /* ---------- API do Conselho ---------- */

  // O filtro por Conselho ocorre no próprio carregamento: registros do outro
  // Conselho nunca saem desta função. Perfis não-Conselho recebem lista vazia.
  function lerDoConselhoAtivo() {
    const conselho = conselhoAtivo();
    if (!conselho) return [];
    return clonar(lerBase().filter((r) => r.conselho === conselho));
  }

  function acoesPermitidas(registro) {
    const conselho = conselhoAtivo();
    if (!conselho || !registro || registro.conselho !== conselho) return [];
    const acoes = ["view"];
    if (papelAtivo() !== "presidencia") return acoes;
    Object.entries(TRANSICOES).forEach(([acao, t]) => {
      if (registro.status === t.de) acoes.push(acao);
    });
    if (registro.status !== STATUS.ARCHIVED) acoes.push("andamento");
    return acoes;
  }

  // Revalidação completa a cada ação: perfil, Conselho, papel interno, registro
  // persistido, pertencimento ao Conselho, situação e transição.
  function executarAcao(protocolo, acao, dados = {}) {
    const conselho = conselhoAtivo();
    if (!conselho) return { ok: false, erro: "Perfil sem acesso às manifestações dos Conselhos." };
    const papel = papelAtivo();
    if (papel !== "presidencia") return { ok: false, erro: "Somente a Presidência do Conselho pode executar esta ação." };

    const base = lerBase();
    const registro = base.find((r) => r.protocolo === String(protocolo || "").trim().toUpperCase());
    if (!registro || registro.conselho !== conselho) {
      return { ok: false, erro: "Manifestação não encontrada no escopo deste Conselho." };
    }

    const at = nowIso();
    const comum = { papel: PAPEIS.presidencia, conselho: CONSELHOS[conselho] };

    if (acao === "andamento") {
      const nota = String(dados.nota || "").trim();
      if (registro.status === STATUS.ARCHIVED) return { ok: false, erro: "Manifestações arquivadas não recebem andamento." };
      if (!nota) return { ok: false, erro: "Informe a observação do andamento." };
      registro.history.push(evento(at, "Andamento interno registrado.", { ...comum, note: nota, visivelManifestante: false }));
    } else if (Object.prototype.hasOwnProperty.call(TRANSICOES, acao)) {
      const t = TRANSICOES[acao];
      if (registro.status !== t.de) {
        return { ok: false, erro: `Transição inválida: a manifestação está ${registro.status}.` };
      }
      if (acao === "responder") {
        const texto = String(dados.resposta || "").trim();
        if (!texto) return { ok: false, erro: "Informe a resposta formal." };
        registro.respostaFormal = texto;
        registro.respondedAt = at;
      }
      if (acao === "finalizar") registro.finalizedAt = at;
      if (acao === "arquivar") registro.archivedAt = at;
      registro.status = t.para;
      registro.history.push(evento(at, t.acao, { ...comum, status: t.para }));
    } else {
      return { ok: false, erro: "Ação desconhecida." };
    }

    registro.updatedAt = at;
    salvarBase(base);
    return { ok: true, registro: clonar(registro) };
  }

  /* ---------- API do manifestante ---------- */

  function registrar(dados = {}) {
    if (!Object.prototype.hasOwnProperty.call(CONSELHOS, dados.conselho)) return null;
    const identidade = dados.identidade === "protegida" ? "protegida" : "identificada";
    const assunto = String(dados.assunto || "").trim();
    const descricao = String(dados.descricao || "").trim();
    if (!assunto || !descricao) return null;

    const base = lerBase();
    const at = nowIso();
    const bruto = {
      protocolo: proximoProtocolo(base),
      chave: gerarChave(),
      tipo: TIPOS.includes(dados.tipo) ? dados.tipo : "Manifestação",
      conselho: dados.conselho,
      identidade,
      assunto,
      descricao,
      status: STATUS.RECEIVED,
      createdAt: at,
      updatedAt: at,
      history: eventosRecebimento(at)
    };
    // Identidade protegida: nenhum dado pessoal é associado ao registro.
    if (identidade === "identificada") {
      bruto.manifestanteId = MANIFESTANTE_DEMO.id;
      bruto.manifestanteNome = MANIFESTANTE_DEMO.nome;
    }

    const registro = normalizar(bruto);
    base.push(registro);
    salvarBase(base);
    return { protocolo: registro.protocolo, chave: registro.chave };
  }

  // Consulta somente por protocolo + chave. Retorna apenas dados públicos:
  // sem notas internas, papéis responsáveis ou eventos internos.
  function consultar(protocolo, chave) {
    const p = String(protocolo || "").trim().toUpperCase();
    const c = String(chave || "").trim().toUpperCase();
    if (!p || !c) return null;
    const registro = lerBase().find((r) => r.protocolo === p);
    if (!registro || !registro.chave || registro.chave !== c) return null;
    return {
      protocolo: registro.protocolo,
      conselho: CONSELHOS[registro.conselho],
      identidade: IDENTIDADES[registro.identidade],
      status: registro.status,
      respostaFormal: registro.respostaFormal,
      respondedAt: registro.respondedAt,
      eventos: registro.history
        .filter((e) => e.visivelManifestante)
        .map((e) => ({ at: e.at, action: e.action, status: e.status }))
    };
  }

  window.SindGestaoManifestacoes = Object.freeze({
    CHAVE, STATUS, FLUXO, CONSELHOS, PAPEIS, TIPOS, IDENTIDADES, AVISO_CONSELHO,
    registrar, consultar,
    conselhoAtivo, papelAtivo, definirPapel, lerDoConselhoAtivo, acoesPermitidas, executarAcao
  });

  /* ==================== Interface da Área do Filiado ==================== */

  const formRegistro = document.getElementById("form-manifestacao");
  const formConsulta = document.getElementById("form-acompanhamento");
  if (!formRegistro && !formConsulta) return; // Página administrativa: apenas a API.

  const overlay = document.getElementById("manifestacao-overlay");
  const drawerRegistro = document.getElementById("manifestacao-drawer");
  const drawerConsulta = document.getElementById("acompanhamento-drawer");
  const abrirRegistro = document.getElementById("abrir-manifestacao");
  const abrirConsulta = document.getElementById("abrir-acompanhamento");
  const fecharRegistro = document.getElementById("fechar-manifestacao");
  const cancelarRegistro = document.getElementById("cancelar-manifestacao");
  const fecharConsulta = document.getElementById("fechar-acompanhamento");
  const confirmacao = document.getElementById("manifestacao-confirmacao");
  const protocoloEl = document.getElementById("manifestacao-protocolo");
  const chaveEl = document.getElementById("manifestacao-chave");
  const acompanharDepois = document.getElementById("acompanhar-apos-registro");
  const resultado = document.getElementById("resultado-acompanhamento");
  const naoLocalizada = document.getElementById("manifestacao-nao-localizada");

  let ultimoFoco = null;
  let ultimoRegistro = null; // somente em memória da página

  function formatar(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso || ""));
    if (!m) return "—";
    return `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}:${m[5]}` : ""}`;
  }

  function abrir(drawer, trigger) {
    ultimoFoco = trigger || document.activeElement;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
    drawer.querySelector("button, input, select, textarea")?.focus();
  }

  function fechar(drawer) {
    drawer.hidden = true;
    if (drawerRegistro.hidden && drawerConsulta.hidden) {
      overlay.hidden = true;
      document.body.style.overflow = "";
      ultimoFoco?.focus();
    }
  }

  abrirRegistro?.addEventListener("click", () => {
    formRegistro.hidden = false;
    confirmacao.hidden = true;
    formRegistro.reset();
    abrir(drawerRegistro, abrirRegistro);
  });

  abrirConsulta?.addEventListener("click", () => {
    resultado.hidden = true;
    naoLocalizada.hidden = true;
    abrir(drawerConsulta, abrirConsulta);
  });

  fecharRegistro?.addEventListener("click", () => fechar(drawerRegistro));
  cancelarRegistro?.addEventListener("click", () => fechar(drawerRegistro));
  fecharConsulta?.addEventListener("click", () => fechar(drawerConsulta));

  overlay?.addEventListener("click", () => {
    if (!drawerRegistro.hidden) fechar(drawerRegistro);
    if (!drawerConsulta.hidden) fechar(drawerConsulta);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !drawerRegistro || !drawerConsulta) return;
    if (!drawerRegistro.hidden) fechar(drawerRegistro);
    if (!drawerConsulta.hidden) fechar(drawerConsulta);
  });

  formRegistro?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!formRegistro.reportValidity()) return;

    // O anexo NÃO é lido, enviado nem armazenado no protótipo.
    const criado = registrar({
      conselho: document.getElementById("manifestacao-conselho").value,
      identidade: formRegistro.querySelector('input[name="identidade"]:checked')?.value,
      assunto: document.getElementById("manifestacao-assunto").value,
      descricao: document.getElementById("manifestacao-descricao").value
    });
    if (!criado) return;

    ultimoRegistro = criado;
    protocoloEl.textContent = criado.protocolo;
    chaveEl.textContent = criado.chave;

    formRegistro.reset();
    formRegistro.hidden = true;
    confirmacao.hidden = false;
  });

  acompanharDepois?.addEventListener("click", () => {
    fechar(drawerRegistro);
    document.getElementById("consulta-protocolo").value = ultimoRegistro?.protocolo || "";
    document.getElementById("consulta-chave").value = ultimoRegistro?.chave || "";
    abrir(drawerConsulta, acompanharDepois);
  });

  function renderTimeline(status) {
    const alvo = document.getElementById("resultado-timeline");
    if (!alvo) return;
    const atual = FLUXO.indexOf(status);
    alvo.innerHTML = "";
    FLUXO.forEach((etapa, i) => {
      const item = document.createElement("div");
      item.className = "manifestacao-timeline__item";
      if (i < atual || (i === atual && status === STATUS.ARCHIVED)) item.classList.add("manifestacao-timeline__item--concluido");
      else if (i === atual) item.classList.add("manifestacao-timeline__item--atual");
      const marca = document.createElement("span");
      marca.textContent = i < atual || (i === atual && status === STATUS.ARCHIVED) ? "✓" : String(i + 1);
      const texto = document.createElement("div");
      const titulo = document.createElement("strong");
      titulo.textContent = etapa;
      texto.append(titulo);
      if (i === atual) {
        const sub = document.createElement("small");
        sub.textContent = "Situação atual.";
        texto.append(sub);
      }
      item.append(marca, texto);
      alvo.append(item);
    });
  }

  function renderEventos(eventos) {
    const lista = document.getElementById("resultado-eventos-lista");
    if (!lista) return;
    lista.innerHTML = "";
    eventos.slice().reverse().forEach((e) => {
      const li = document.createElement("li");
      const quando = document.createElement("time");
      quando.dateTime = e.at;
      quando.textContent = formatar(e.at);
      li.append(quando, ` — ${e.action}`);
      lista.append(li);
    });
  }

  formConsulta?.addEventListener("submit", (event) => {
    event.preventDefault();
    resultado.hidden = true;
    naoLocalizada.hidden = true;

    // Relê a base compartilhada a cada consulta (reflete ações do Conselho).
    const dados = consultar(
      document.getElementById("consulta-protocolo").value,
      document.getElementById("consulta-chave").value
    );
    if (!dados) {
      naoLocalizada.hidden = false;
      return;
    }

    const encerrada = dados.status === STATUS.FINALIZED || dados.status === STATUS.ARCHIVED;
    const badge = document.getElementById("resultado-status-badge");
    if (badge) {
      badge.textContent = dados.status.toUpperCase();
      badge.className = `votacao-status votacao-status--${encerrada ? "encerrada" : "aberta"}`;
    }
    document.getElementById("resultado-protocolo").textContent = dados.protocolo;
    document.getElementById("resultado-conselho").textContent = dados.conselho;
    document.getElementById("resultado-identidade").textContent = dados.identidade;
    const situacao = document.getElementById("resultado-status");
    if (situacao) situacao.textContent = dados.status;

    renderTimeline(dados.status);
    renderEventos(dados.eventos);

    const resposta = document.getElementById("resultado-resposta");
    if (resposta) {
      resposta.hidden = !dados.respostaFormal;
      document.getElementById("resultado-resposta-texto").textContent = dados.respostaFormal;
      document.getElementById("resultado-resposta-data").textContent =
        dados.respondedAt ? `Registrada em ${formatar(dados.respondedAt)}.` : "";
    }

    resultado.hidden = false;
  });
})();
