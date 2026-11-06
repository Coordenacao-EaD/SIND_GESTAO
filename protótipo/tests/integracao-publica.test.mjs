// Integração pública final: versão Publicada, Notícias/Comunicados, votação do Servidor
// cadastrado e tolerância a storage ausente/corrompido. Execução: node --test tests/
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const js = (name) => readFile(new URL(`../assets/js/${name}`, import.meta.url), "utf8");

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    dump: () => Object.fromEntries(data)
  };
}

// Elemento mínimo: suficiente para os hooks de texto [data-conteudo].
function fakeElement(attrs = {}, text = "") {
  return { dataset: { ...attrs }, textContent: text, hidden: false, innerHTML: "", addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], prepend() {}, setAttribute() {} };
}

function fakeDocument({ conteudo = [], root = null } = {}) {
  return {
    readyState: "complete",
    body: { classList: { contains: () => false, add() {}, remove() {} } },
    addEventListener() {},
    querySelector: (sel) => (sel === "[data-servidor-votacoes-root]" ? root : null),
    querySelectorAll: (sel) => (sel === "[data-conteudo]" ? conteudo : [])
  };
}

function context({ local = memoryStorage(), session = memoryStorage(), document = fakeDocument(), profile = "presidencia" } = {}) {
  const window = {
    localStorage: local,
    sessionStorage: session,
    addEventListener() {},
    SindGestaoAdminPerfis: {
      current: () => profile,
      label: (p) => p,
      isCouncil: () => false,
      hasPermission: () => true
    }
  };
  const ctx = vm.createContext({ window, document, localStorage: local, sessionStorage: session, console, CSS: { escape: (s) => s } });
  window.window = window;
  return ctx;
}

async function run(ctx, ...files) {
  for (const f of files) vm.runInContext(await js(f), ctx, { filename: f });
  return ctx;
}

/* ---------- 27. Versão Publicada ---------- */

test("conteúdo institucional: só a versão Publicada chega à área pública (A → B)", async () => {
  const local = memoryStorage();
  const admin = await run(context({ local }), "admin-configuracoes.js");
  const C = admin.window.SindGestaoConteudoInstitucional;

  const pubTitle = () => {
    const el = fakeElement({ conteudo: "home.heroTitle" }, "Juntos somos mais fortes.");
    const ctx = context({ local, document: fakeDocument({ conteudo: [el] }) });
    vm.runInContext(publicSrc, ctx);
    return { api: ctx.window.SindGestaoConteudoPublico, text: el.textContent };
  };
  const publicSrc = await js("conteudo-publico-dinamico.js");

  let state = C.load(); // versão A (seed) Publicada
  assert.equal(pubTitle().text, "Juntos somos mais fortes.");

  const step = (action, profile, payload) => {
    const r = C.apply(state, "home", action, profile, payload);
    assert.ok(r.ok, `${action}: ${r.error}`);
    C.save(state);
  };

  step("create", "secretaria");
  const data = { ...C.published(state.sections.home).data, heroTitle: "Versão B da chamada" };
  step("edit", "secretaria", { data });
  assert.equal(pubTitle().text, "Juntos somos mais fortes.", "Rascunho não aparece");
  step("submit", "secretaria");
  assert.equal(pubTitle().text, "Juntos somos mais fortes.", "Em revisão não aparece");
  step("approve", "presidencia");
  assert.equal(pubTitle().text, "Juntos somos mais fortes.", "Aprovado não aparece");
  step("publish", "presidencia");
  const after = pubTitle();
  assert.equal(after.text, "Versão B da chamada", "Publicado aparece");

  const versions = JSON.parse(local.getItem(C.STORAGE_KEY)).sections.home.versions;
  assert.equal(versions.find((v) => v.number === 1).status, "Substituído");
  assert.equal(versions.find((v) => v.number === 2).status, "Publicado");

  // Leitura pública não grava nada.
  const before = local.getItem(C.STORAGE_KEY);
  pubTitle();
  assert.equal(local.getItem(C.STORAGE_KEY), before);
});

/* ---------- 26. Storage ausente/corrompido ---------- */

test("storage ausente, corrompido ou sem campos mantém o estático", async () => {
  const src = await js("conteudo-publico-dinamico.js");
  const cases = [
    memoryStorage(),
    memoryStorage({ "sindGestao.institutionalContentDemo": "{json inválido" }),
    memoryStorage({ "sindGestao.institutionalContentDemo": JSON.stringify({ sections: {} }) }),
    memoryStorage({ "sindGestao.institutionalContentDemo": JSON.stringify({ sections: { home: { versions: [{ number: 1, data: { heroTitle: "Sem status" } }] } } }) }),
    memoryStorage({ "sindGestao.institutionalContentDemo": JSON.stringify({ sections: { home: { versions: [{ number: 1, status: "Publicado" }] } } }) }),
    memoryStorage({ "sindGestao.institutionalContentDemo": JSON.stringify({ sections: { home: { versions: [{ number: 2, status: "Aprovado", data: { heroTitle: "Aprovada" } }] } } }) })
  ];
  const throwing = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  for (const local of [...cases, throwing]) {
    const el = fakeElement({ conteudo: "home.heroTitle" }, "Estático");
    const ctx = context({ local, session: throwing, document: fakeDocument({ conteudo: [el] }) });
    vm.runInContext(src, ctx);
    assert.equal(el.textContent, "Estático");
    assert.equal(ctx.window.SindGestaoConteudoPublico.publishedSection("home") === null || ctx.window.SindGestaoConteudoPublico.publishedField("home", "heroTitle") === null, true);
    assert.deepEqual([...ctx.window.SindGestaoConteudoPublico.publishedCommunications("Notícia")], []);
  }
});

test("contatos: vazio e 'a confirmar' nunca viram dado público", async () => {
  const src = await js("conteudo-publico-dinamico.js");
  const local = memoryStorage({
    "sindGestao.institutionalContentDemo": JSON.stringify({ sections: { contacts: { versions: [{ number: 1, status: "Publicado", data: { address: "", phone: "Dado oficial a confirmar", email: "  ", hours: "Seg. a sex., 8h às 17h" } }] } } })
  });
  const ctx = context({ local });
  vm.runInContext(src, ctx);
  const P = ctx.window.SindGestaoConteudoPublico;
  assert.equal(P.publishedField("contacts", "address"), null);
  assert.equal(P.publishedField("contacts", "phone"), null);
  assert.equal(P.publishedField("contacts", "email"), null);
  assert.equal(P.publishedField("contacts", "hours"), "Seg. a sex., 8h às 17h");
  assert.equal(P.safeLocalImage("https://exemplo.com/x.png"), null);
  assert.equal(P.safeLocalImage("assets/images/../../x.png"), null);
  assert.equal(P.safeLocalImage("assets/images/noticias/assembleia.png"), "assets/images/noticias/assembleia.png");
});

test("galeria: seed publicado não altera o acervo; item novo entra uma vez; imagem inválida usa reserva", async () => {
  const load = async (items) => {
    const local = memoryStorage(items === null ? {} : {
      "sindGestao.institutionalContentDemo": JSON.stringify({ sections: { gallery: { versions: [
        { number: 1, status: "Substituído", data: { items: "Antigo | x | assets/images/banner.jpg" } },
        { number: 2, status: "Publicado", publishedAt: "2026-11-06T10:00:00", data: { items } }
      ] } } })
    });
    const ctx = await run(context({ local }), "conteudo-publico-dinamico.js", "galeria.js");
    return JSON.parse(vm.runInContext("JSON.stringify(galeriaRegistros)", ctx));
  };
  const estatico = await load(null);
  const seed = "Assembleia Geral dos Servidores | Votação das propostas pelo plenário. | assets/images/noticias/assembleia.png\nReunião da Diretoria | Análise dos documentos da pauta. | assets/images/noticias/negociacao.png\nEncontro com Filiados | Escuta e diálogo com os filiados. | assets/images/contato/atendimento.jpg";
  assert.deepEqual(await load(seed), estatico);

  const novo = await load(`${seed}\nNovo Evento | Legenda nova | https://externo.com/x.png\nNovo Evento | Repetido | assets/images/inexistente.png`);
  assert.equal(novo.length, estatico.length + 1);
  const item = novo.find((r) => r.titulo === "Novo Evento");
  assert.equal(item.fotos[0].imagem, "reserva");
  assert.equal(item.dataISO, "2026-11-06");
  assert.ok(!novo.some((r) => r.titulo === "Antigo"), "Substituído não aparece");
});

/* ---------- 28/29. Notícias e Comunicados ---------- */

const record = (over) => ({ type: "Notícia", title: "Notícia A", category: "Institucional", audience: "Público geral", summary: "Resumo", body: "Corpo", author: "Secretaria", status: "Publicado", publishedDateISO: "2026-11-05", publishedDateLabel: "5 de novembro de 2026", ...over });

async function newsWith(records) {
  const session = memoryStorage({ "sindGestao.communicationWorkflowDemo": JSON.stringify(records) });
  const ctx = await run(context({ session }), "conteudo-publico-dinamico.js", "noticias.js");
  return vm.runInContext("noticias.map((n) => ({ id: n.id, titulo: n.titulo, adm: Boolean(n.administrativo) }))", ctx);
}

test("notícias: Publicada aparece, Rascunho não; publicar B não duplica", async () => {
  const staticCount = (await newsWith([])).length;
  const A = record({ id: "CNT-1", publicId: 9101, title: "Notícia A" });
  const B = record({ id: "CNT-2", publicId: 9102, title: "Notícia B", status: "Rascunho" });

  let list = await newsWith([A, B]);
  assert.ok(list.some((n) => n.id === 9101));
  assert.ok(!list.some((n) => n.id === 9102));
  assert.equal(list.length, staticCount + 1);

  for (const status of ["Em revisão", "Aprovado"]) {
    list = await newsWith([A, { ...B, status }]);
    assert.ok(!list.some((n) => n.id === 9102), status);
  }

  list = await newsWith([A, { ...B, status: "Publicado", publishedDateISO: "2026-11-06" }, { ...A }]);
  assert.equal(list.filter((n) => n.id === 9101).length, 1, "sem duplicar");
  assert.equal(list[0].id, 9102, "mais recente primeiro");
  assert.equal(list.length, staticCount + 2);

  // Público restrito não vai para a área pública.
  list = await newsWith([record({ publicId: 9103, title: "Somente filiados", audience: "Filiados" })]);
  assert.ok(!list.some((n) => n.id === 9103));

  // Notícia administrativa com o mesmo título de uma estática substitui a estática.
  const first = (await newsWith([]))[0];
  list = await newsWith([record({ publicId: 9104, title: first.titulo })]);
  assert.equal(list.filter((n) => n.titulo === first.titulo).length, 1);
  assert.equal(list.find((n) => n.titulo === first.titulo).adm, true);
});

test("comunicados: somente Publicado de Público geral, sem duplicar, lista pública recalculada", async () => {
  const records = [
    record({ type: "Comunicado", publicId: 9201, title: "Comunicado publicado" }),
    record({ type: "Comunicado", publicId: 9202, title: "Comunicado em revisão", status: "Em revisão" }),
    record({ type: "Comunicado", publicId: 9203, title: "Comunicado aprovado", status: "Aprovado" }),
    record({ type: "Comunicado", publicId: 9204, title: "Comunicado filiados", audience: "Filiados" }),
    record({ type: "Comunicado", publicId: 9201, title: "Comunicado publicado" })
  ];
  const session = memoryStorage({ "sindGestao.communicationWorkflowDemo": JSON.stringify(records) });
  const ctx = await run(context({ session }), "conteudo-publico-dinamico.js", "comunicados.js");
  const ids = JSON.parse(vm.runInContext("JSON.stringify(publicComunicados.map((c) => c.id))", ctx));
  assert.deepEqual(ids.filter((id) => id > 9000), [9201]);
  const item = vm.runInContext("publicComunicados.find((c) => c.id === 9201)", ctx);
  assert.equal(item.fimVigencia, "", "sem data final inventada");
  assert.equal(item.inicioVigencia, "05/11/2026");
  assert.equal(session.getItem("sindGestao.communicationWorkflowDemo"), JSON.stringify(records), "não grava");
});

/* ---------- 30. Votação do Servidor cadastrado ---------- */

function iso(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3600e3);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function consulta(id, over) {
  return { id, tipo: "Enquete", titulo: id, pergunta: "?", opcoes: [{ id: "a", texto: "A" }, { id: "b", texto: "B" }], publico: "Servidores cadastrados", modalidade: "Sigilosa", inicioAt: iso(-2), fimAt: iso(48), statusAdministrativo: "Liberada", resultadoVisivelAoPublicoParticipante: true, votes: [], participacoes: [], history: [], ...over };
}

async function votingCtx(local, accessType) {
  if (accessType) local.setItem("sindGestao.demoAccessType", accessType);
  const root = fakeElement();
  const ctx = await run(context({ local, document: fakeDocument({ root }) }), "filiado-votacoes-dinamicas.js", "servidor-votacoes.js");
  return { V: ctx.window.SindGestaoVotacoes, root };
}

test("servidor cadastrado: visibilidade, situação, voto único e resultado", async () => {
  const local = memoryStorage({
    "sindGestao.votingDemo": JSON.stringify([
      consulta("SRV-ABERTA"),
      consulta("SRV-IDENT", { modalidade: "Identificada" }),
      consulta("SRV-RASCUNHO", { statusAdministrativo: "Rascunho" }),
      consulta("SRV-AGENDADA", { inicioAt: iso(24), fimAt: iso(72) }),
      consulta("SRV-ENCERRADA-OCULTA", { inicioAt: iso(-72), fimAt: iso(-24), resultadoVisivelAoPublicoParticipante: false }),
      consulta("SRV-ENCERRADA-VISIVEL", { inicioAt: iso(-72), fimAt: iso(-24) }),
      consulta("FIL-ABERTA", { publico: "Filiados" })
    ])
  });
  const { V, root } = await votingCtx(local, "servidorCadastrado");
  const servidor = V.PARTICIPANTES.servidorCadastrado;
  assert.equal(servidor.id, "SRV-DEMO-0001");

  const visiveis = V.lerTodas().filter((c) => V.visivelPara(c, servidor)).map((c) => c.id);
  assert.ok(!visiveis.includes("FIL-ABERTA"), "1/2: não vê Filiados");
  assert.ok(!visiveis.includes("SRV-RASCUNHO"), "não vê Rascunho");
  assert.ok(root.innerHTML.includes("SRV-ABERTA") && !root.innerHTML.includes("FIL-ABERTA") && !root.innerHTML.includes("SRV-RASCUNHO"));

  assert.equal(V.registrarVoto("SRV-RASCUNHO", "servidorCadastrado", "a").ok, false, "3: Rascunho");
  assert.equal(V.registrarVoto("SRV-AGENDADA", "servidorCadastrado", "a").ok, false, "4: Agendada");
  assert.equal(V.registrarVoto("FIL-ABERTA", "servidorCadastrado", "a").ok, false, "público Filiados");
  assert.equal(V.registrarVoto("SRV-ABERTA", "servidorCadastrado", "a").ok, true, "5: Aberta");
  assert.equal(V.registrarVoto("SRV-ABERTA", "servidorCadastrado", "b").ok, false, "6: segundo voto");

  // 7: "F5" — novo contexto lendo o mesmo storage.
  const reload = await votingCtx(local);
  assert.equal(reload.V.registrarVoto("SRV-ABERTA", "servidorCadastrado", "b").ok, false);
  const salvo = reload.V.lerTodas().find((c) => c.id === "SRV-ABERTA");
  assert.equal(salvo.participacoes.filter((p) => p.participanteId === "SRV-DEMO-0001").length, 1);
  assert.ok(salvo.votes.every((v) => !v.participanteId), "sigiloso sem identificador");
  assert.ok(reload.root.innerHTML.includes("Participação registrada"));

  assert.equal(reload.V.registrarVoto("SRV-IDENT", "servidorCadastrado", "a").ok, true);
  assert.equal(reload.V.registrarVoto("SRV-ENCERRADA-VISIVEL", "servidorCadastrado", "a").ok, false, "8: Encerrada");

  const lista = reload.V.lerTodas();
  assert.equal(reload.V.resultadoVisivelParticipante(lista.find((c) => c.id === "SRV-ENCERRADA-OCULTA")), false, "9: regra de divulgação");
  assert.equal(reload.V.resultadoVisivelParticipante(lista.find((c) => c.id === "SRV-ENCERRADA-VISIVEL")), true);
  assert.equal(reload.V.resultadoVisivelParticipante(lista.find((c) => c.id === "SRV-ABERTA")), false, "Aberta não mostra resultado");
});

test("visitante, filiado e administrativo não usam a página do servidor", async () => {
  for (const access of [null, "filiado", "administrativo", "valor-invalido"]) {
    const local = memoryStorage({ "sindGestao.votingDemo": JSON.stringify([consulta("SRV-ABERTA")]) });
    const { root } = await votingCtx(local, access);
    assert.ok(root.innerHTML.includes("Acesso restrito"), String(access));
    assert.ok(!root.innerHTML.includes("SRV-ABERTA"), String(access));
    assert.ok(!root.innerHTML.includes("<form"), String(access));
  }
});

/* ---------- 31/32. Bases restritas ---------- */

test("integração pública não lê denúncias nem finanças", async () => {
  for (const file of ["conteudo-publico-dinamico.js", "servidor-votacoes.js", "noticias.js", "comunicados.js", "galeria.js", "main.js"]) {
    const src = (await js(file)).replace(/\/\/.*$/gm, "");
    assert.ok(!src.includes("manifestationsDemo"), file);
    assert.ok(!src.includes("financeDemo"), file);
  }
});
