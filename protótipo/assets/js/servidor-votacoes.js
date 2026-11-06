// Enquetes e Votações — Participação de Servidores Cadastrados (página pública restrita à
// sessão demonstrativa "Servidor cadastrado"). Não é uma área própria: o Servidor continua
// direcionado à Home após o login e acessa esta página pelo atalho da Home.
//
// Regras e persistência vêm exclusivamente da API do T34 (window.SindGestaoVotacoes, em
// filiado-votacoes-dinamicas.js), sobre localStorage["sindGestao.votingDemo"]:
// visibilidade (Liberada + público "Servidores cadastrados"), situação temporal,
// voto único revalidado no registro e divulgação de resultado.
(() => {
  "use strict";

  const ACCESS_KEY = "sindGestao.demoAccessType";
  const TIPO_PARTICIPANTE = "servidorCadastrado";

  const raiz = document.querySelector("[data-servidor-votacoes-root]");
  if (!raiz) return;

  function api() {
    return window.SindGestaoVotacoes || null;
  }

  // Relida a cada renderização: sair em outra aba bloqueia imediatamente a participação.
  function sessaoServidor() {
    try {
      return window.localStorage.getItem(ACCESS_KEY) === TIPO_PARTICIPANTE;
    } catch {
      return false;
    }
  }

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

  function restritoMarkup() {
    return `
      <section class="servidor-votacoes__restrito" role="status">
        <h2>Acesso restrito</h2>
        <p>Esta página é destinada à participação de Servidores Cadastrados. Entre com o perfil
          demonstrativo “Servidor cadastrado” para consultar e participar das enquetes e votações disponíveis.</p>
        <a class="button button--primary" href="../index.html">Voltar para a Página Inicial</a>
      </section>`;
  }

  const TITULOS = { Aberta: "Consulta disponível", Agendada: "Consulta agendada", Encerrada: "Consulta encerrada" };
  const ORDEM = { Aberta: 0, Agendada: 1, Encerrada: 2 };

  function resultadoMarkup(V, consulta) {
    if (!V.resultadoVisivelParticipante(consulta)) {
      return '<p class="votacao-resultado-aviso">Resultado não disponibilizado aos participantes.</p>';
    }
    const r = V.apurar(consulta);
    return `
      <p class="votacao-resultado-aviso">A divulgação do resultado desta consulta demonstrativa foi autorizada após o encerramento.</p>
      <div class="votacao-resultados">
        ${r.linhas.map((l) => `
          <div class="votacao-resultado">
            <div><strong>${esc(l.texto)}</strong><span>${l.percentual}%</span></div>
            <progress max="100" value="${l.percentual}">${l.percentual}%</progress>
          </div>`).join("")}
      </div>
      <p class="votacao-amostra">Total de participações: ${r.participacoes}. Valores fictícios, apenas demonstrativos.</p>`;
  }

  function corpoMarkup(V, consulta, sit, participou) {
    const pergunta = `
      <div class="votacao-pergunta">
        <p class="votacao-pergunta__label">Pergunta</p>
        <h4>${esc(consulta.pergunta)}</h4>
      </div>`;

    if (sit === V.SITUACAO.ENCERRADA) {
      return `${participou ? '<p class="votacao-resultado-aviso">Sua participação foi registrada nesta consulta.</p>' : ""}${resultadoMarkup(V, consulta)}`;
    }

    if (sit === V.SITUACAO.AGENDADA) {
      return `${pergunta}
        <ul class="votacao-lista-opcoes">${consulta.opcoes.map((o) => `<li>${esc(o.texto)}</li>`).join("")}</ul>
        <p class="votacao-resultado-aviso">A participação ficará disponível a partir de ${esc(dataHora(consulta.inicioAt))}.</p>`;
    }

    if (participou) {
      return `${pergunta}
        <div class="votacao-confirmacao" role="status">
          <span class="votacao-confirmacao__icone" aria-hidden="true">✓</span>
          <div>
            <strong>Participação registrada nesta demonstração</strong>
            <p>${consulta.modalidade === "Sigilosa"
              ? "Por se tratar de voto sigiloso, a opção selecionada não é exibida. Não é possível votar novamente."
              : "Voto identificado registrado neste navegador. Não é possível votar novamente."}</p>
          </div>
        </div>`;
    }

    return `${pergunta}
      <form data-servidor-votacao-form="${esc(consulta.id)}" novalidate>
        <fieldset class="votacao-opcoes">
          <legend class="sr-only">Selecione uma opção para: ${esc(consulta.pergunta)}</legend>
          ${consulta.opcoes.map((o) => `
            <label class="votacao-opcao">
              <input type="radio" name="voto" value="${esc(o.id)}">
              <span><strong>${esc(o.texto)}</strong>${o.detalhe ? `<small>${esc(o.detalhe)}</small>` : ""}</span>
            </label>`).join("")}
        </fieldset>
        <p class="votacao-erro" data-votacao-erro role="alert" hidden></p>
        <div class="votacao-acoes">
          <button type="submit" class="button button--primary">Confirmar voto</button>
          <p>${consulta.modalidade === "Sigilosa"
            ? "Voto sigiloso: a opção selecionada não será exibida depois da confirmação."
            : "Voto identificado: a participação ficará associada ao seu cadastro de servidor."}</p>
        </div>
      </form>`;
  }

  function cartaoMarkup(V, consulta) {
    const sit = V.situacao(consulta);
    const participou = V.jaParticipou(consulta, V.PARTICIPANTES[TIPO_PARTICIPANTE].id);
    return `
      <section class="votacao-section" aria-labelledby="titulo-${esc(consulta.id)}">
        <div class="prestacao-section__header">
          <div>
            <span class="votacao-status votacao-status--${sit.toLowerCase()}">${esc(sit.toUpperCase())}</span>
            <h2 id="titulo-${esc(consulta.id)}">${TITULOS[sit] || "Consulta"}</h2>
          </div>
          <span class="votacao-protocolo">${esc(consulta.id)}</span>
        </div>
        <article class="votacao-card${sit === V.SITUACAO.ABERTA ? " votacao-card--ativa" : ""}">
          <div class="votacao-card__cabecalho">
            <div>
              <span class="filiado-badge">${esc(String(consulta.tipo || "").toUpperCase())} DEMONSTRATIVA</span>
              <h3>${esc(consulta.titulo)}</h3>
            </div>
            <div class="votacao-card__tipo"><span>Modalidade</span><strong>${consulta.modalidade === "Sigilosa" ? "Voto sigiloso" : "Voto identificado"}</strong></div>
          </div>
          ${consulta.descricao ? `<p>${esc(consulta.descricao)}</p>` : ""}
          <div class="votacao-metadados">
            <div><span>Público</span><strong>${esc(consulta.publico)}</strong></div>
            <div><span>Início</span><strong>${esc(dataHora(consulta.inicioAt))}</strong></div>
            <div><span>Encerramento</span><strong>${esc(dataHora(consulta.fimAt))}</strong></div>
          </div>
          ${corpoMarkup(V, consulta, sit, participou)}
        </article>
      </section>`;
  }

  function render() {
    const V = api();
    if (!sessaoServidor() || !V) {
      raiz.innerHTML = restritoMarkup();
      return;
    }
    const participante = V.PARTICIPANTES[TIPO_PARTICIPANTE];
    // visivelPara: somente Liberadas e destinadas a "Servidores cadastrados" (Rascunhos e Filiados ficam fora).
    const consultas = V.lerTodas()
      .filter((c) => V.visivelPara(c, participante))
      .sort((a, b) => (ORDEM[V.situacao(a)] - ORDEM[V.situacao(b)]) || String(b.inicioAt).localeCompare(String(a.inicioAt)));

    raiz.innerHTML = `
      <section class="votacao-explicacao" aria-label="Como funciona">
        <div>
          <strong>Como funciona</strong>
          <p>Cada consulta possui período e regra de votação próprios. A participação é única por consulta
            e o resultado é apresentado somente quando sua divulgação estiver autorizada.</p>
        </div>
        <div class="votacao-regra"><span>Público</span><strong>Servidores cadastrados</strong></div>
      </section>
      ${consultas.length
        ? consultas.map((c) => cartaoMarkup(V, c)).join("")
        : '<section class="votacao-section"><p class="votacao-resultado-aviso">Nenhuma consulta disponível para Servidores Cadastrados no momento.</p></section>'}`;
  }

  raiz.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-servidor-votacao-form]");
    if (!form) return;
    event.preventDefault();
    const V = api();
    const id = form.dataset.servidorVotacaoForm;

    if (!sessaoServidor() || !V) {
      render();
      return;
    }

    const erro = form.querySelector("[data-votacao-erro]");
    const escolhida = form.querySelector('input[name="voto"]:checked');
    if (!escolhida) {
      erro.textContent = "Selecione uma opção antes de confirmar o voto.";
      erro.hidden = false;
      return;
    }

    // registrarVoto relê o storage e revalida liberação, público, período e voto anterior.
    const resultado = V.registrarVoto(id, TIPO_PARTICIPANTE, escolhida.value);
    render();
    if (!resultado.ok) {
      const novoErro = raiz.querySelector(`[data-servidor-votacao-form="${CSS.escape(id)}"] [data-votacao-erro]`);
      if (novoErro) {
        novoErro.textContent = resultado.erro;
        novoErro.hidden = false;
      } else {
        const aviso = document.createElement("p");
        aviso.className = "votacao-erro";
        aviso.setAttribute("role", "alert");
        aviso.textContent = resultado.erro;
        raiz.prepend(aviso);
      }
    }
  });

  raiz.addEventListener("change", (event) => {
    const erro = event.target.closest("form")?.querySelector("[data-votacao-erro]");
    if (erro) erro.hidden = true;
  });

  window.addEventListener("storage", (event) => {
    if (event.key === ACCESS_KEY || event.key === api()?.CHAVE) render();
  });

  render();
})();
