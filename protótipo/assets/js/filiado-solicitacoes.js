// Módulo demonstrativo: não envia dados, não guarda anexos e não representa autorização real.
// T33: base única compartilhada com a Área Administrativa (admin-solicitacoes.js) em
// localStorage["sindGestao.requestsDemo"]. A API de armazenamento é exposta em
// window.SindGestaoSolicitacoes para que o administrativo use exatamente a mesma fonte.
(() => {
  const CHAVE = 'sindGestao.requestsDemo';
  const CHAVE_LEGADA = 'sindGestao.demoSolicitacoes'; // sessionStorage da versão anterior
  const CHAVE_MIGRACAO = 'sindGestao.requestsDemo.migracaoSessao';
  const ANO = 2026;
  const AREAS = ['Secretaria', 'Diretoria', 'Tesouraria'];
  const STATUS_VALIDOS = ['Recebida', 'Em análise', 'Respondida', 'Finalizada'];
  const SOLICITANTE = 'Filiado Demonstrativo';
  const SOLICITANTE_ID = 'FIL-DEMO-0001';
  const STATUS_MODIFICADOR = {
    Recebida: 'recebida',
    'Em análise': 'analise',
    Respondida: 'respondida',
    Finalizada: 'finalizada',
  };
  const ACOES_PUBLICAS = {
    Recebida: 'Solicitação recebida.',
    'Em análise': 'Análise iniciada.',
    Respondida: 'Resposta registrada.',
    Finalizada: 'Solicitação finalizada.',
  };

  // Registros demonstrativos originais (categoria, assunto, descrição, data, status e histórico
  // preservados), enriquecidos apenas com os campos necessários ao administrativo.
  const demonstrativas = [
    {
      protocolo: 'SOL-2026-0004',
      categoria: 'Documentos',
      assunto: 'Solicitação de documento',
      descricao: 'Pedido demonstrativo de documento institucional.',
      data: '2026-09-08',
      status: 'Recebida',
      areaResponsavel: 'Secretaria',
      historico: [['Recebida', '2026-09-08']],
    },
    {
      protocolo: 'SOL-2026-0003',
      categoria: 'Benefícios',
      assunto: 'Dúvida sobre benefício',
      descricao: 'Dúvida demonstrativa encaminhada ao atendimento do Sindicato.',
      data: '2026-09-01',
      status: 'Em análise',
      areaResponsavel: 'Diretoria',
      historico: [['Recebida', '2026-09-01'], ['Em análise', '2026-09-03']],
      internos: [{
        at: '2026-09-03T10:00:00',
        profile: 'Secretaria',
        action: 'Encaminhada de Secretaria para Diretoria.',
        note: 'Benefício depende de deliberação da Diretoria.',
        from: 'Secretaria',
        to: 'Diretoria',
        visibleToMember: false,
      }],
    },
    {
      protocolo: 'SOL-2026-0002',
      categoria: 'Cadastro',
      assunto: 'Atualização cadastral',
      descricao: 'Pedido demonstrativo de atualização de informações cadastrais.',
      data: '2026-08-20',
      status: 'Respondida',
      areaResponsavel: 'Secretaria',
      resposta: 'Seu pedido de atualização cadastral foi analisado. As informações demonstrativas foram conferidas e o cadastro será atualizado pela Secretaria.',
      respondedAt: '2026-08-28T09:00:00',
      respondedBy: 'Secretaria',
      historico: [['Recebida', '2026-08-20'], ['Em análise', '2026-08-24'], ['Respondida', '2026-08-28']],
    },
    {
      protocolo: 'SOL-2026-0001',
      categoria: 'Documentos',
      assunto: 'Solicitação de declaração',
      descricao: 'Pedido demonstrativo de emissão de declaração.',
      data: '2026-08-05',
      status: 'Finalizada',
      areaResponsavel: 'Secretaria',
      resposta: 'A declaração demonstrativa foi emitida e está disponível para retirada na Secretaria do Sindicato.',
      respondedAt: '2026-08-12T09:00:00',
      respondedBy: 'Secretaria',
      finalizedAt: '2026-08-14T09:00:00',
      finalizedBy: 'Secretaria',
      historico: [['Recebida', '2026-08-05'], ['Em análise', '2026-08-07'], ['Respondida', '2026-08-12'], ['Finalizada', '2026-08-14']],
    },
  ];

  const texto = (valor) => (typeof valor === 'string' ? valor : '');

  // Converte o histórico legado ([status, data]) e garante a estrutura completa do registro.
  function normalizarRegistro(item) {
    if (!item || typeof item !== 'object' || !/^SOL-\d{4}-\d{4}$/.test(texto(item.protocolo))) return null;
    if (!['categoria', 'assunto', 'descricao', 'data'].every((campo) => typeof item[campo] === 'string')) return null;
    const status = STATUS_VALIDOS.includes(item.status) ? item.status : 'Recebida';
    const area = AREAS.includes(item.areaResponsavel) ? item.areaResponsavel : 'Secretaria';
    let history = Array.isArray(item.history) ? item.history.filter((e) => e && typeof e === 'object') : null;
    if (!history) {
      const legado = Array.isArray(item.historico) && item.historico.length ? item.historico : [[status, item.data]];
      history = legado.map(([etapa, data]) => ({
        at: `${data}T09:00:00`,
        profile: etapa === 'Recebida' ? SOLICITANTE : area,
        action: ACOES_PUBLICAS[etapa] || etapa,
        note: '',
        status: etapa,
        visibleToMember: true,
      }));
      history.push(...(item.internos || []));
      history.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    }
    const createdAt = texto(item.createdAt) || `${item.data}T09:00:00`;
    return {
      protocolo: item.protocolo,
      categoria: item.categoria,
      assunto: item.assunto,
      descricao: item.descricao,
      data: item.data,
      status,
      solicitante: texto(item.solicitante) || SOLICITANTE,
      solicitanteId: texto(item.solicitanteId) || SOLICITANTE_ID,
      areaResponsavel: area,
      responsavelAtual: texto(item.responsavelAtual) || area,
      resposta: texto(item.resposta),
      respondedBy: texto(item.respondedBy),
      finalizedBy: texto(item.finalizedBy),
      createdAt,
      updatedAt: texto(item.updatedAt) || texto(history[history.length - 1]?.at) || createdAt,
      respondedAt: texto(item.respondedAt),
      finalizedAt: texto(item.finalizedAt),
      history,
    };
  }

  function normalizarLista(lista) {
    const vistos = new Set();
    return lista.map(normalizarRegistro).filter((registro) => {
      if (!registro || vistos.has(registro.protocolo)) return false;
      vistos.add(registro.protocolo);
      return true;
    });
  }

  function salvarTodas(registros) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(registros));
      return true;
    } catch (error) {
      return false; // Sem armazenamento, o estado vale apenas para a página aberta.
    }
  }

  // Migração demonstrativa executada uma única vez: solicitações antigas da sessão entram
  // na base compartilhada, sem duplicar protocolos já existentes.
  function migrarSessao(registros) {
    try {
      if (window.localStorage.getItem(CHAVE_MIGRACAO)) return false;
      let migrou = false;
      const antigas = JSON.parse(window.sessionStorage.getItem(CHAVE_LEGADA) || 'null');
      if (Array.isArray(antigas)) {
        const protocolos = new Set(registros.map((item) => item.protocolo));
        antigas.forEach((item) => {
          const registro = normalizarRegistro(item);
          if (registro && !protocolos.has(registro.protocolo)) {
            protocolos.add(registro.protocolo);
            registros.push(registro);
            migrou = true;
          }
        });
      }
      window.sessionStorage.removeItem(CHAVE_LEGADA);
      window.localStorage.setItem(CHAVE_MIGRACAO, new Date().toISOString());
      return migrou;
    } catch (error) {
      return false; // Migração apenas demonstrativa.
    }
  }

  // Sempre relida do storage. Semeia uma única vez: após F5 os seeds não são duplicados.
  function lerTodas() {
    let salvas = null;
    try {
      salvas = JSON.parse(window.localStorage.getItem(CHAVE) || 'null');
    } catch (error) {
      salvas = null;
    }
    const registros = normalizarLista(Array.isArray(salvas) ? salvas : demonstrativas);
    const migrou = migrarSessao(registros);
    registros.sort((a, b) => b.protocolo.localeCompare(a.protocolo));
    if (!Array.isArray(salvas) || migrou || salvas.length !== registros.length) salvarTodas(registros);
    return registros;
  }

  window.SindGestaoSolicitacoes = Object.freeze({
    CHAVE, AREAS, STATUS: STATUS_VALIDOS, lerTodas, salvarTodas,
  });

  // Somente as solicitações do filiado demonstrativo.
  const lerCriadas = () => lerTodas().filter((item) => item.solicitanteId === SOLICITANTE_ID);

  const pluralizar = (total, singular, plural) => `${total} ${total === 1 ? singular : plural}`;

  function juntar(partes) {
    if (partes.length < 2) return partes.join('');
    return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
  }

  // Painel: o resumo acompanha a base compartilhada.
  function atualizarResumo() {
    const valor = document.querySelector('[data-solicitacoes-resumo-valor]');
    const resumo = document.querySelector('[data-solicitacoes-resumo-texto]');
    if (!valor || !resumo) return;
    const registros = lerCriadas();
    const contar = (status) => registros.filter((item) => item.status === status).length;
    const recebidas = contar('Recebida');
    const emAnalise = contar('Em análise');
    const respondidas = contar('Respondida');
    const partes = [];
    if (recebidas) partes.push(pluralizar(recebidas, 'recebida', 'recebidas'));
    if (emAnalise) partes.push(`${emAnalise} em análise`);
    if (respondidas) partes.push(pluralizar(respondidas, 'respondida', 'respondidas'));
    valor.textContent = pluralizar(recebidas + emAnalise + respondidas, 'solicitação', 'solicitações');
    resumo.textContent = partes.length ? `${juntar(partes)}.` : 'Nenhuma solicitação em andamento.';
  }

  atualizarResumo();

  const lista = document.querySelector('[data-solicitacoes-lista]');
  if (!lista) return;

  const vazio = document.querySelector('[data-solicitacoes-vazio]');
  const contagem = document.querySelector('[data-solicitacoes-contagem]');
  const botoesFiltro = [...document.querySelectorAll('[data-filtro]')];
  const gavetaNova = document.querySelector('[data-solicitacao-gaveta-nova]');
  const gavetaDetalhe = document.querySelector('[data-solicitacao-gaveta-detalhe]');
  const detalhe = document.querySelector('[data-solicitacao-detalhe]');
  const form = document.querySelector('[data-solicitacao-form]');
  const confirmacao = document.querySelector('[data-solicitacao-confirmacao]');
  const botaoNova = document.querySelector('[data-solicitacao-nova]');

  let filtroAtual = '';

  const todas = () => lerCriadas();
  const formatarData = (iso) => iso.split('-').reverse().join('/');

  function criar(tag, classe, conteudo) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (conteudo !== undefined) elemento.textContent = conteudo;
    return elemento;
  }

  function criarData(iso) {
    const elemento = criar('time', '', formatarData(iso));
    elemento.dateTime = iso;
    return elemento;
  }

  function criarStatus(status) {
    const modificador = STATUS_MODIFICADOR[status] || 'recebida';
    return criar('span', `filiado-badge solicitacao-status solicitacao-status--${modificador}`, status);
  }

  function criarItem(registro) {
    const item = criar('article', 'filiado-card solicitacao-item');
    const meta = criar('div', 'filiado-meta');
    meta.append(criar('strong', 'solicitacao-protocolo', registro.protocolo), criarData(registro.data), criarStatus(registro.status));

    const botao = criar('button', 'button button--secondary', 'Ver detalhes');
    botao.type = 'button';
    botao.setAttribute('aria-haspopup', 'dialog');
    botao.setAttribute('aria-label', `Ver detalhes da solicitação ${registro.protocolo}`);
    // Relê o registro no clique para refletir ações administrativas recentes.
    botao.addEventListener('click', () => {
      const atual = todas().find((entrada) => entrada.protocolo === registro.protocolo) || registro;
      abrirDetalhe(atual, botao);
    });

    item.append(meta, criar('h2', '', registro.assunto), criar('p', '', `Categoria: ${registro.categoria}`), botao);
    return item;
  }

  function renderizarLista() {
    const visiveis = todas().filter((item) => !filtroAtual || item.status === filtroAtual);
    lista.replaceChildren(...visiveis.map(criarItem));
    vazio.hidden = visiveis.length !== 0;
    contagem.textContent = `${pluralizar(visiveis.length, 'registro demonstrativo', 'registros demonstrativos')}`;
  }

  function selecionarFiltro(filtro) {
    filtroAtual = filtro;
    botoesFiltro.forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtro)));
    renderizarLista();
  }

  botoesFiltro.forEach((botao) => {
    botao.addEventListener('click', () => selecionarFiltro(botao.dataset.filtro));
  });

  // Comportamento comum às gavetas: foco inicial, X, ESC, overlay e retorno de foco.
  function configurarGaveta(gaveta) {
    let inicioNoOverlay = false;
    gaveta.addEventListener('mousedown', (event) => { inicioNoOverlay = event.target === gaveta; });
    gaveta.addEventListener('click', (event) => {
      if (event.target === gaveta && inicioNoOverlay) gaveta.close();
    });
    gaveta.addEventListener('click', (event) => {
      if (event.target.closest('[data-solicitacao-fechar]')) gaveta.close();
    });
    gaveta.addEventListener('close', () => {
      document.body.classList.remove('filiation-drawer-open');
      gaveta.dispatchEvent(new CustomEvent('solicitacao:fechada'));
      gaveta.origem?.focus();
    });
  }

  function abrirGaveta(gaveta, origem, alvoFoco) {
    gaveta.origem = origem;
    document.body.classList.add('filiation-drawer-open');
    gaveta.showModal();
    gaveta.querySelector('.filiation-drawer__body').scrollTop = 0;
    alvoFoco.focus();
  }

  configurarGaveta(gavetaNova);
  configurarGaveta(gavetaDetalhe);

  function abrirDetalhe(registro, origem) {
    const dados = criar('dl', 'filiado-data solicitacao-dados');
    [
      ['Protocolo', registro.protocolo],
      ['Categoria', registro.categoria],
      ['Data', criarData(registro.data)],
      ['Status', criarStatus(registro.status)],
    ].forEach(([rotulo, valor]) => {
      const campo = criar('div');
      const definicao = criar('dd');
      definicao.append(valor);
      campo.append(criar('dt', '', rotulo), definicao);
      dados.append(campo);
    });

    const assunto = criar('section', 'solicitacao-secao');
    assunto.append(criar('h3', '', 'Assunto'), criar('p', '', registro.assunto));

    const descricao = criar('section', 'solicitacao-secao');
    descricao.append(criar('h3', '', 'Descrição'), criar('p', 'solicitacao-descricao', registro.descricao));

    // Somente mudanças públicas de situação: anotações internas e roteamento não chegam ao filiado.
    const publicos = registro.history.filter((entrada) => entrada.visibleToMember !== false && entrada.status);
    const historico = publicos.length ? publicos : [{ status: registro.status, at: registro.data }];
    const linha = criar('ol', 'solicitacao-timeline');
    historico.forEach((entrada, indice) => {
      const atual = indice === historico.length - 1;
      const item = criar('li', `solicitacao-timeline__item${atual ? ' solicitacao-timeline__item--atual' : ''}`);
      if (atual) item.setAttribute('aria-current', 'step');
      item.append(criar('strong', '', entrada.status), criarData(String(entrada.at).slice(0, 10)));
      if (atual) item.append(criar('span', 'solicitacao-timeline__atual', 'Status atual'));
      linha.append(item);
    });
    const andamento = criar('section', 'solicitacao-secao');
    andamento.append(criar('h3', '', 'Histórico do andamento'), linha);

    const blocos = [dados, assunto, descricao, andamento];
    // A resposta vem do próprio registro (registrada pelo administrativo).
    if ((registro.status === 'Respondida' || registro.status === 'Finalizada') && registro.resposta) {
      const resposta = criar('section', 'solicitacao-secao solicitacao-resposta');
      resposta.append(criar('h3', '', 'Resposta do Sindicato'), criar('p', '', registro.resposta));
      blocos.push(resposta);
    }
    detalhe.replaceChildren(...blocos);
    abrirGaveta(gavetaDetalhe, origem, gavetaDetalhe.querySelector('h2'));
  }

  const campos = ['categoria', 'assunto', 'descricao'].map((nome) => form.elements[nome]);

  function marcarCampo(campo, invalido) {
    const erro = document.getElementById(`${campo.id}-erro`);
    erro.hidden = !invalido;
    if (invalido) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
  }

  campos.forEach((campo) => {
    const revalidar = () => {
      if (campo.getAttribute('aria-invalid') === 'true') marcarCampo(campo, !campo.value.trim());
    };
    campo.addEventListener('input', revalidar);
    campo.addEventListener('change', revalidar);
  });

  const pad = (n) => String(n).padStart(2, '0');

  function dataDeHoje() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
  }

  function instanteAtual() {
    const agora = new Date();
    return `${dataDeHoje()}T${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`;
  }

  function restaurarFormulario() {
    form.reset(); // Descarta também a referência ao anexo escolhido.
    campos.forEach((campo) => marcarCampo(campo, false));
    form.hidden = false;
    confirmacao.hidden = true;
  }

  gavetaNova.addEventListener('solicitacao:fechada', restaurarFormulario);

  botaoNova.addEventListener('click', () => {
    abrirGaveta(gavetaNova, botaoNova, gavetaNova.querySelector('h2'));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalidos = campos.filter((campo) => {
      const invalido = !campo.value.trim();
      marcarCampo(campo, invalido);
      return invalido;
    });
    if (invalidos.length) {
      invalidos[0].focus();
      return;
    }

    // Relê a base inteira para gerar o protocolo sem colidir com registros já existentes.
    const base = lerTodas();
    const maior = Math.max(0, ...base.map((item) => Number(item.protocolo.split('-').pop()) || 0));
    const instante = instanteAtual();
    const registro = normalizarRegistro({
      protocolo: `SOL-${ANO}-${String(maior + 1).padStart(4, '0')}`,
      categoria: form.elements.categoria.value,
      assunto: form.elements.assunto.value.trim(),
      descricao: form.elements.descricao.value.trim(),
      data: dataDeHoje(),
      status: 'Recebida',
      solicitante: SOLICITANTE,
      solicitanteId: SOLICITANTE_ID,
      areaResponsavel: 'Secretaria',
      responsavelAtual: 'Secretaria',
      createdAt: instante,
      updatedAt: instante,
      history: [{
        at: instante, profile: SOLICITANTE, action: ACOES_PUBLICAS.Recebida, note: '', status: 'Recebida', visibleToMember: true,
      }],
    });
    salvarTodas([registro, ...base]);
    selecionarFiltro(''); // "Recebida" só aparece em Todas; garante que o novo registro fique visível.

    form.hidden = true;
    confirmacao.hidden = false;
    confirmacao.querySelector('[data-solicitacao-protocolo]').textContent = registro.protocolo;
    confirmacao.querySelector('[data-solicitacao-confirmacao-titulo]').focus();
  });

  // Ações administrativas feitas em outra aba aparecem sem recarregar a página.
  window.addEventListener('storage', (event) => {
    if (event.key === CHAVE) {
      renderizarLista();
      atualizarResumo();
    }
  });
  window.addEventListener('focus', renderizarLista);

  renderizarLista();
})();
