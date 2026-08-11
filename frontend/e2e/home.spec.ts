import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const previewPort = 4182;
const debugPort = 9334;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const debugUrl = `http://127.0.0.1:${debugPort}`;
const projectDirectory = resolve(".");
const evidenceDirectory = resolve("test-results/e2e");
const screenshotDirectory = resolve(evidenceDirectory, "screenshots");
const chromePath = process.env.CHROME_PATH
  ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeProfile = mkdtempSync(join(tmpdir(), "sindgestao-home-e2e-"));

mkdirSync(screenshotDirectory, { recursive: true });

const previewOutput = [];
const previewErrors = [];
const browserOutput = [];
const browserDiagnostics = [];
const pageErrors = [];
const consoleErrors = [];
const consoleWarnings = [];
const resourceFailures = [];
const unsavedGuardNotices = [];
const dataEndpointRequests = [];

// Chrome reports this when the F2.2B unsaved-changes guard registers `beforeunload` and the automated
// navigation happens without a user gesture. It is the guard working, not a defect, so it is collected
// separately and asserted on purpose while every other console entry stays blocking.
function isUnsavedGuardNotice(text) {
  return text.includes("beforeunload") && text.includes("never had a user gesture");
}
const resourceRequests = new Map();
const checks = [];
const startedAt = Date.now();

const previewProcess = spawn(
  process.execPath,
  [
    resolve("node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(previewPort),
    "--strictPort",
  ],
  {
    cwd: projectDirectory,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
previewProcess.stdout.on("data", (chunk) => previewOutput.push(chunk.toString()));
previewProcess.stderr.on("data", (chunk) => previewErrors.push(chunk.toString()));

const chromeProcess = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-sync",
    "--disable-extensions",
    "--disable-features=PushMessaging,MediaRouter,OptimizationHints",
    "--metrics-recording-only",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeProfile}`,
    "about:blank",
  ],
  {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
chromeProcess.stdout.on("data", (chunk) => browserOutput.push(chunk.toString()));
chromeProcess.stderr.on("data", (chunk) => browserDiagnostics.push(chunk.toString()));

let socket;
let commandId = 0;
const pendingCommands = new Map();

const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function waitForUrl(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The local process is still starting.
    }
    await wait(100);
  }
  throw new Error(`Tempo esgotado aguardando ${url}`);
}

function recordCheck(name, details = {}) {
  checks.push({ name, passed: true, ...details });
}

function command(method, params = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const id = ++commandId;
    pendingCommands.set(id, { resolve: resolveCommand, reject: rejectCommand });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? "Falha ao avaliar o DOM.");
  }
  return response.result.value;
}

/** Aguarda uma condição no DOM: as rotas administrativas usam lazy loading e chegam em dois passos. */
async function waitForCondition(expression, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Condição não satisfeita no tempo esperado: ${expression}`);
}

async function navigate(path, width, height) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 768,
  });
  await command("Page.navigate", { url: `${baseUrl}${path}` });
  await wait(700);
  assert.equal(await evaluate("document.readyState"), "complete");
}

async function pressKey(key, code, virtualKeyCode) {
  const params = {
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
  };
  await command("Input.dispatchKeyEvent", { type: "keyDown", ...params });
  await command("Input.dispatchKeyEvent", { type: "keyUp", ...params });
  await wait(100);
}

async function captureScreenshot(name) {
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(join(screenshotDirectory, `${name}.png`), Buffer.from(screenshot.data, "base64"));
}

function handleProtocolEvent(message) {
  if (message.method === "Network.requestWillBeSent") {
    resourceRequests.set(message.params.requestId, message.params.request.url);
    if (message.params.type === "Fetch" || message.params.type === "XHR") {
      dataEndpointRequests.push({
        url: message.params.request.url,
        type: message.params.type,
        method: message.params.request.method,
      });
    }
  }
  if (message.method === "Runtime.exceptionThrown") {
    pageErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Runtime.consoleAPICalled") {
    const text = message.params.args
      .map((argument) => argument.value ?? argument.description ?? "")
      .join(" ");
    if (message.params.type === "error") consoleErrors.push(text);
    if (message.params.type === "warning") consoleWarnings.push(text);
  }
  if (message.method === "Log.entryAdded") {
    const entry = message.params.entry;
    if (isUnsavedGuardNotice(entry.text)) unsavedGuardNotices.push(entry.text);
    else if (entry.level === "error") consoleErrors.push(entry.text);
    else if (entry.level === "warning") consoleWarnings.push(entry.text);
  }
  if (message.method === "Network.loadingFailed" && !message.params.canceled) {
    resourceFailures.push({
      url: resourceRequests.get(message.params.requestId) ?? "URL indisponível",
      errorText: message.params.errorText,
      type: message.params.type,
    });
  }
  if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
    resourceFailures.push({
      url: message.params.response.url,
      status: message.params.response.status,
      type: message.params.type,
    });
  }
}

let failure;
try {
  const homeResponse = await waitForUrl(baseUrl);
  assert.equal(homeResponse.status, 200);
  await waitForUrl(`${debugUrl}/json/version`);
  const targets = await (await fetch(`${debugUrl}/json`)).json();
  const page = targets.find((target) => target.type === "page");
  assert.ok(page, "Chrome não expôs uma página via CDP.");

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolvePromise, rejectPromise) => {
    socket.onopen = resolvePromise;
    socket.onerror = rejectPromise;
  });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pendingCommands.has(message.id)) {
      const pending = pendingCommands.get(message.id);
      pendingCommands.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }
    handleProtocolEvent(message);
  };

  await Promise.all([
    command("Page.enable"),
    command("Runtime.enable"),
    command("Log.enable"),
    command("Network.enable"),
  ]);

  await navigate("/", 1440, 900);
  const home = await evaluate(`(() => ({
    pathname: location.pathname,
    mainCount: document.querySelectorAll("main").length,
    h1Count: document.querySelectorAll("h1").length,
    h1: document.querySelector("h1")?.textContent.trim(),
    hasVisibleContent: document.querySelector("main")?.textContent.trim().length > 0,
    heroImageVisible: (() => {
      const image = document.querySelector("main section img");
      const bounds = image?.getBoundingClientRect();
      return Boolean(image?.complete && image.naturalWidth > 0 && bounds?.width > 0 && bounds?.height > 0);
    })(),
    hasQuickLinks: Boolean(document.querySelector('nav[aria-label="Acesso rápido aos serviços"]')),
    essentialSections: [
      "Sobre o Sindicato",
      "Últimas Notícias",
      "Comunicados Recentes",
      "Transparência que gera confiança",
      "Documentos Importantes"
    ].every((label) => [...document.querySelectorAll("h2")]
      .some((heading) => heading.textContent.trim() === label)),
    headerLinks: document.querySelectorAll('header nav[aria-label="Menu principal"] a').length,
    footerCount: document.querySelectorAll("footer").length,
    footerInstitution: document.querySelector("footer strong")?.textContent.trim(),
    footerNavigations: document.querySelectorAll("footer nav").length,
    footerHasContact: [...document.querySelectorAll("footer h2")]
      .some((heading) => heading.textContent.trim() === "Contato"),
    footerPhone: document.querySelector('footer a[href^="tel:"]')?.textContent.trim(),
    footerHasPrivacy: [...document.querySelectorAll("footer a")]
      .some((link) => link.textContent.trim() === "Política de Privacidade"),
    footerHasTerms: [...document.querySelectorAll("footer a")]
      .some((link) => link.textContent.trim() === "Termos de Uso"),
    unsafeFooterLinks: [...document.querySelectorAll("footer a")]
      .filter((link) => !link.getAttribute("href")
        || link.getAttribute("href").startsWith("http://")).length,
    externalFooterLinks: document.querySelectorAll('footer a[href^="https://"]').length,
    unprotectedExternalFooterLinks: [...document.querySelectorAll('footer a[href^="https://"]')]
      .filter((link) => link.getAttribute("target") !== "_blank"
        || !link.getAttribute("rel")?.split(/\\s+/).includes("noopener")
        || !link.getAttribute("rel")?.split(/\\s+/).includes("noreferrer")).length
  }))()`);
  assert.deepEqual(home, {
    pathname: "/",
    mainCount: 1,
    h1Count: 1,
    h1: "Juntos somos mais fortes.",
    hasVisibleContent: true,
    heroImageVisible: true,
    hasQuickLinks: true,
    essentialSections: true,
    headerLinks: 10,
    footerCount: 1,
    footerInstitution: "SINDGESTÃO",
    footerNavigations: 3,
    footerHasContact: true,
    footerPhone: "(11) 1234-5678",
    footerHasPrivacy: true,
    footerHasTerms: true,
    unsafeFooterLinks: 0,
    externalFooterLinks: 6,
    unprotectedExternalFooterLinks: 0,
  });
  recordCheck("CA-HOM-001: Home pública HTTP 200 com Hero, blocos, contato e rodapé mockados", {
    httpStatus: homeResponse.status,
  });
  await captureScreenshot("home-desktop");

  await evaluate(`[...document.querySelectorAll("main a")].find((link) => link.textContent.trim() === "Filie-se").click()`);
  await wait(250);
  assert.equal(await evaluate("location.pathname"), "/filie-se");
  assert.equal(await evaluate("document.querySelector('h1').textContent.trim()"), "Filie-se");
  recordCheck("Navegação para /filie-se");

  await evaluate(`[...document.querySelectorAll("main a")].find((link) => link.textContent.includes("Voltar à Página Inicial")).click()`);
  await wait(250);
  assert.equal(await evaluate("location.pathname"), "/");
  recordCheck("Retorno à Home");

  await evaluate(`document.querySelector('header a[aria-label="Área do Filiado"]').click()`);
  await wait(250);
  assert.equal(await evaluate("location.pathname"), "/area-do-filiado");
  assert.equal(await evaluate("document.querySelector('h1').textContent.trim()"), "Área do Filiado");
  recordCheck("Navegação para /area-do-filiado");

  await navigate("/rota-inexistente-e2e", 1440, 900);
  assert.equal(await evaluate("document.querySelector('h1').textContent.trim()"), "Página não encontrada");
  assert.equal(await evaluate("document.querySelectorAll('main').length"), 1);
  recordCheck("Rota inexistente apresenta 404 amigável");
  await captureScreenshot("not-found");

  const adminResponse = await waitForUrl(`${baseUrl}/admin/home`);
  assert.equal(adminResponse.status, 200);
  await navigate("/admin/home", 1440, 1000);
  const admin = await evaluate(`(() => ({
    pathname: location.pathname,
    mainCount: document.querySelectorAll("main").length,
    h1Count: document.querySelectorAll("h1").length,
    h1: document.querySelector("h1")?.textContent.trim(),
    hasAdminNavigation: Boolean(document.querySelector('nav[aria-label="Navegação administrativa"]')),
    hasPublicNavigation: Boolean(document.querySelector('nav[aria-label="Menu principal"]')),
    demoNotice: document.querySelector('[role="note"]')?.textContent.includes("Nenhuma alteração é persistida"),
    titleInput: document.querySelector('input[maxlength="90"]')?.value,
    saveInitiallyDisabled: [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Salvar rascunho"))?.disabled
  }))()`);
  assert.deepEqual(admin, {
    pathname: "/admin/home",
    mainCount: 1,
    h1Count: 1,
    h1: "Página Inicial",
    hasAdminNavigation: true,
    hasPublicNavigation: false,
    demoNotice: true,
    titleInput: "Juntos somos mais fortes.",
    saveInitiallyDisabled: true,
  });
  recordCheck("F2.2A: /admin/home responde diretamente no preview e isola o layout público", {
    httpStatus: adminResponse.status,
  });
  await captureScreenshot("admin-home-desktop");

  await evaluate(`(() => {
    const input = document.querySelector('input[maxlength="90"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "Servidor em primeiro lugar");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('section[aria-labelledby=\"banner-preview-title\"] h3').textContent"), "Servidor em primeiro lugar");
  assert.equal(await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).disabled`), false);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"status\"]')?.textContent.includes('somente na memória')"), true);
  recordCheck("F2.2A: edição atualiza a prévia e salva rascunho somente em memória");

  await navigate("/admin/home?scenario=conflict", 1440, 900);
  assert.equal(await evaluate("document.querySelector('[role=\"alert\"]')?.textContent.includes('409')"), true);
  await navigate("/admin/home?scenario=validation", 390, 844);
  assert.equal(await evaluate("document.querySelector('[role=\"alert\"]')?.textContent.includes('422')"), true);
  assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  assert.equal(await evaluate("document.querySelector('[aria-controls=\"admin-navigation\"]') !== null"), true);
  recordCheck("F2.2A: estados 409/422 e layout administrativo mobile responsivo");
  await captureScreenshot("admin-home-mobile-validation");

  const contactsResponse = await waitForUrl(`${baseUrl}/admin/home/contacts`);
  const socialResponse = await waitForUrl(`${baseUrl}/admin/home/social`);
  assert.equal(contactsResponse.status, 200);
  assert.equal(socialResponse.status, 200);
  recordCheck("F2.2B: rotas diretas de contatos e redes sociais respondem no preview", {
    contactsStatus: contactsResponse.status,
    socialStatus: socialResponse.status,
  });
  await navigate("/admin/home", 1440, 1000);
  await evaluate(`[...document.querySelectorAll("a")].find((link) => link.textContent.includes("Editar contatos")).click()`);
  await wait(150);
  assert.equal(await evaluate("location.pathname"), "/admin/home/contacts");
  await navigate("/admin/home", 1440, 1000);
  await evaluate(`[...document.querySelectorAll("a")].find((link) => link.textContent.includes("Editar redes sociais")).click()`);
  await wait(150);
  assert.equal(await evaluate("location.pathname"), "/admin/home/social");
  recordCheck("F2.2B: cards do painel abrem os dois novos editores");

  await navigate("/admin/home/contacts", 1440, 1000);
  assert.equal(await evaluate("document.querySelector('h1').textContent.trim()"), "Contatos públicos");
  await evaluate(`(() => {
    const input = document.querySelector('input[type="email"]');
    const postalCode = document.querySelector('input[data-error-field="postalCode"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "atendimento@sindgestao.org.br");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setter.call(postalCode, "78123456");
    postalCode.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  assert.equal(await evaluate("document.querySelector('section[aria-labelledby=\"contacts-preview-title\"] a[href^=\"mailto:\"]')?.getAttribute('href')"), "mailto:atendimento@sindgestao.org.br");
  assert.equal(await evaluate("document.querySelector('section[aria-labelledby=\"contacts-preview-title\"]')?.textContent.includes('CEP 78123-456')"), true);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"status\"]')?.textContent.includes('somente na memória')"), true);
  recordCheck("F2.2B: contatos atualizam a prévia e salvam a configuração somente em memória");
  await evaluate(`(() => {
    const input = document.querySelector('input[data-error-field="municipality"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "Cuiabá Centro");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Enviar para revisão")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('input[type=\"email\"]')?.disabled"), true);
  assert.equal(await evaluate("document.body.textContent.includes('Configuração completa enviada')"), true);
  recordCheck("F2.2B: contatos são enviados como unidade e a edição fica bloqueada");
  await captureScreenshot("admin-contacts-desktop");

  await navigate("/admin/home/contacts?scenario=validation", 390, 844);
  await evaluate(`(() => {
    const input = document.querySelector('input[data-error-field="municipality"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "Cuiabá Centro");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"alert\"]')?.textContent.includes('422')"), true);
  assert.equal(await evaluate("document.querySelector('input[data-error-field=\"municipality\"]')?.value"), "Cuiabá Centro");
  assert.equal(
    await evaluate(`[...document.querySelectorAll('[role="status"]')].some((status) => status.textContent.includes("Ação simulada concluída"))`),
    false,
  );
  assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  recordCheck("F2.2B: contatos preservam o rascunho no 422 e permanecem responsivos");

  await navigate("/admin/home/social", 1440, 1000);
  assert.equal(await evaluate("document.querySelector('h1').textContent.trim()"), "Redes sociais");
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Adicionar rede social")).click()`);
  await wait(100);
  assert.equal(await evaluate("document.querySelectorAll('select[data-error-field$=\".platform\"]').length"), 4);
  await evaluate(`(() => {
    const select = document.querySelectorAll('select[data-error-field$=".platform"]')[3];
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(select, "Facebook");
    select.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"alert\"]')?.textContent.includes('422')"), true);
  await evaluate(`(() => {
    const select = document.querySelectorAll('select[data-error-field$=".platform"]')[3];
    const url = document.querySelectorAll('input[data-error-field$=".url"]')[3];
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, "LinkedIn");
    select.dispatchEvent(new Event("change", { bubbles: true }));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(url, "https://linkedin.com/company/sindgestao");
    url.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.getAttribute("aria-label") === "Mover LinkedIn para cima").click()`);
  await wait(100);
  await evaluate(`document.querySelector('[role="switch"][aria-label="Inativar Facebook"]').click()`);
  await wait(100);
  assert.equal(await evaluate("document.querySelector('section[aria-labelledby=\"social-preview-title\"] a[aria-label=\"Facebook (abre em nova aba)\"]') === null"), true);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"status\"]')?.textContent.includes('somente na memória')"), true);
  recordCheck("F2.2B: redes adicionam, rejeitam duplicidade, corrigem, reordenam, atualizam a prévia e salvam em memória");
  await captureScreenshot("admin-social-desktop");

  await navigate("/admin/home/social?scenario=conflict", 390, 844);
  await evaluate(`document.querySelector('[role="switch"][aria-label="Inativar Facebook"]').click()`);
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Salvar rascunho")).click()`);
  await wait(150);
  assert.equal(await evaluate("document.querySelector('[role=\"alert\"]')?.textContent.includes('409')"), true);
  assert.equal(await evaluate("document.querySelector('[role=\"switch\"][aria-label=\"Ativar Facebook\"]') !== null"), true);
  assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  recordCheck("F2.2B: conflito de redes preserva a configuração e o layout mobile");
  await captureScreenshot("admin-social-mobile-conflict");

  // ---------------------------------------------------------------- F2.2C: fila e decisões de revisão
  const reviewQueueReady = `document.querySelector("h1")?.textContent.trim() === "Revisões da Página Inicial"`;
  const reviewDetailReady = `document.querySelector("h1")?.textContent.trim() === "Detalhe da revisão"`;
  const reviewsResponse = await waitForUrl(`${baseUrl}/admin/home/reviews`);
  const reviewDetailResponse = await waitForUrl(`${baseUrl}/admin/home/reviews/review-banner-1`);
  assert.equal(reviewsResponse.status, 200);
  assert.equal(reviewDetailResponse.status, 200);
  recordCheck("F2.2C: rotas diretas da fila e do detalhe respondem no preview", {
    queueStatus: reviewsResponse.status,
    detailStatus: reviewDetailResponse.status,
  });

  await navigate("/admin/home", 1440, 1000);
  await evaluate(`[...document.querySelectorAll('nav[aria-label="Navegação administrativa"] a')].find((link) => link.textContent.includes("Revisões")).click()`);
  await wait(250);
  assert.equal(await evaluate("location.pathname"), "/admin/home/reviews");
  await waitForCondition(`document.querySelector("h1")?.textContent.trim() === "Revisões da Página Inicial"`);
  assert.equal(await evaluate("document.body.textContent.includes('Revisão completa')"), false);
  recordCheck("F2.2C: Revisões deixou de ser 'Em breve' e abre pelo menu administrativo");

  const queueItemCount = `document.querySelectorAll("li a[href^='/admin/home/reviews/']").length`;
  assert.equal(await evaluate(queueItemCount), 3);
  const queueTypes = await evaluate(`(() => {
    const text = document.body.textContent;
    return { banner: text.includes("Banner"), contacts: text.includes("Contatos"), social: text.includes("Redes sociais") };
  })()`);
  assert.deepEqual(queueTypes, { banner: true, contacts: true, social: true });
  await captureScreenshot("admin-reviews-queue-desktop");

  await evaluate(`(() => {
    const select = document.getElementById("filter-type");
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, "banner");
    select.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await wait(150);
  assert.equal(await evaluate(queueItemCount), 1);
  recordCheck("F2.2C: fila lista os três tipos e filtra por tipo de conteúdo");

  await evaluate(`document.querySelector("li a[href='/admin/home/reviews/review-banner-1']").click()`);
  await wait(250);
  assert.equal(await evaluate("location.pathname"), "/admin/home/reviews/review-banner-1");
  await waitForCondition(`document.querySelector("h1")?.textContent.trim() === "Detalhe da revisão"`);
  const comparison = await evaluate(`(() => {
    const headers = [...document.querySelectorAll("th")].map((cell) => cell.textContent.trim());
    return {
      hasPublicColumn: headers.includes("Versão pública"),
      hasSubmittedColumn: headers.includes("Conteúdo submetido"),
      showsPublicTitle: document.body.textContent.includes("Juntos somos mais fortes."),
      showsSubmittedTitle: document.body.textContent.includes("Servidor valorizado, cidade mais forte."),
      statesNoPublication: document.body.textContent.includes("nunca publica o conteúdo")
    };
  })()`);
  assert.deepEqual(comparison, {
    hasPublicColumn: true,
    hasSubmittedColumn: true,
    showsPublicTitle: true,
    showsSubmittedTitle: true,
    statesNoPublication: true,
  });
  recordCheck("F2.2C: detalhe apresenta a comparação entre versão pública e conteúdo submetido");
  await captureScreenshot("admin-review-detail-desktop");

  const approveButton = `[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Aprovar")`;
  await navigate("/admin/home/reviews/review-banner-1?scenario=author", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  const asAuthor = await evaluate(`({
    approveDisabled: ${approveButton}.disabled,
    reason: document.body.textContent.includes("Você é o autor deste conteúdo."),
    segregation: document.body.textContent.includes("A segregação de funções impede esta decisão.")
  })`);
  assert.deepEqual(asAuthor, { approveDisabled: true, reason: true, segregation: true });
  recordCheck("F2.2C: autoaprovação bloqueada para o autor mesmo com a capability");

  await navigate("/admin/home/reviews/review-banner-1?scenario=submitter", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  assert.equal(await evaluate(`${approveButton}.disabled`), true);
  assert.equal(await evaluate(`document.body.textContent.includes("Você enviou este conteúdo para revisão.")`), true);
  recordCheck("F2.2C: responsável pelo envio não pode decidir a própria submissão");

  await navigate("/admin/home/reviews/review-banner-1", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  assert.equal(await evaluate(`${approveButton}.disabled`), false);
  await evaluate(`${approveButton}.click()`);
  await wait(200);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"]')?.getAttribute("aria-modal")`), "true");
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.includes("Aprovar revisão")).click()`);
  await waitForCondition(`document.body.textContent.includes("Conteúdo aprovado. A publicação exige uma ação separada.")`);
  await waitForCondition(`document.querySelector('[role="dialog"]') === null`);
  const afterApproval = await evaluate(`({
    dialogClosed: document.querySelector('[role="dialog"]') === null,
    approved: document.body.textContent.includes("Aprovada"),
    message: document.body.textContent.includes("Conteúdo aprovado. A publicação exige uma ação separada."),
    approveDisabled: ${approveButton}.disabled
  })`);
  assert.deepEqual(afterApproval, { dialogClosed: true, approved: true, message: true, approveDisabled: true });
  recordCheck("F2.2C: aprovação simulada registra a decisão, não publica e bloqueia nova decisão");

  await navigate("/admin/home/reviews/review-contacts-1", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  const requestChangesButton = `[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Solicitar ajustes")`;
  await evaluate(`${requestChangesButton}.click()`);
  await wait(200);
  const dialogConfirm = `[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Solicitar ajustes")`;
  await evaluate(`${dialogConfirm}.click()`);
  await wait(150);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"] textarea').getAttribute("aria-invalid")`), "true");
  assert.equal(await evaluate(`document.body.textContent.includes("O conteúdo voltou para rascunho")`), false);
  await evaluate(`(() => {
    const textarea = document.querySelector('[role="dialog"] textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(textarea, "curto");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`${dialogConfirm}.click()`);
  await wait(150);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"] textarea').getAttribute("aria-invalid")`), "true");
  await evaluate(`(() => {
    const textarea = document.querySelector('[role="dialog"] textarea');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(textarea, "Informe o horário de atendimento antes de reenviar para revisão.");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await wait(100);
  await evaluate(`${dialogConfirm}.click()`);
  await waitForCondition(`document.body.textContent.includes("O conteúdo voltou para rascunho")`);
  await waitForCondition(`document.querySelector('[role="dialog"]') === null`);
  const afterChanges = await evaluate(`({
    dialogClosed: document.querySelector('[role="dialog"]') === null,
    message: document.body.textContent.includes("O conteúdo voltou para rascunho"),
    decision: document.body.textContent.includes("Ajustes solicitados"),
    draft: document.body.textContent.includes("Rascunho")
  })`);
  assert.deepEqual(afterChanges, { dialogClosed: true, message: true, decision: true, draft: true });
  recordCheck("F2.2C: solicitação de ajustes valida a justificativa e devolve o conteúdo para rascunho");

  await navigate("/admin/home/reviews/review-banner-1?scenario=hash_mismatch", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  const withHashMismatch = await evaluate(`({
    approveDisabled: ${approveButton}.disabled,
    reason: document.body.textContent.includes("hash submetido não confere com o atual")
  })`);
  assert.deepEqual(withHashMismatch, { approveDisabled: true, reason: true });
  recordCheck("F2.2C: hash divergente bloqueia a decisão e explica o motivo");

  await navigate("/admin/home/reviews/review-banner-1?scenario=concurrent", 1440, 1000);
  await waitForCondition(reviewDetailReady);
  await evaluate(`${approveButton}.click()`);
  await wait(200);
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.includes("Aprovar revisão")).click()`);
  await wait(250);
  const afterConflict = await evaluate(`({
    conflict: document.querySelector('[role="alert"]')?.textContent.includes("409") ?? false,
    noFalseSuccess: !document.body.textContent.includes("Conteúdo aprovado. A publicação exige uma ação separada."),
    stillPending: document.body.textContent.includes("Pendente"),
    canReload: [...document.querySelectorAll("button")].some((button) => button.textContent.includes("Recarregar dados"))
  })`);
  assert.deepEqual(afterConflict, { conflict: true, noFalseSuccess: true, stillPending: true, canReload: true });
  recordCheck("F2.2C: decisão concorrente devolve 409 sem simular sucesso e permite recarregar");

  await navigate("/admin/home/reviews", 390, 844);
  await waitForCondition(reviewQueueReady);
  assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  await captureScreenshot("admin-reviews-queue-mobile");
  await navigate("/admin/home/reviews/review-social-1", 390, 844);
  await waitForCondition(reviewDetailReady);
  assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  recordCheck("F2.2C: fila e detalhe permanecem sem rolagem horizontal em 390x844");

  const publishButton = (label) => `[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === ${JSON.stringify(label)})`;
  await navigate("/admin/home/publication", 1440, 900);
  await waitForCondition(`document.querySelector("h1")?.textContent.includes("Publicação simulada")`);
  assert.equal(await evaluate(`document.querySelector('a[href="/admin/home/history"]') !== null`), true);
  assert.equal(await evaluate(`document.querySelector('a[href="/admin/home/publication"]') !== null`), true);
  assert.equal(await evaluate(`[...document.querySelectorAll("button")].some((button) => button.textContent.toLowerCase().includes("publicar tudo"))`), false);
  recordCheck("F2.2D: rotas reais de publicação e histórico estão disponíveis sem ação publicar tudo");

  await evaluate(`${publishButton("Publicar banner")}.click()`);
  await waitForCondition(`document.querySelector('[role="dialog"]') !== null`);
  const bannerSummary = await evaluate(`({
    title: document.querySelector('[role="dialog"] h2').textContent.trim(),
    version: document.querySelector('[role="dialog"]').textContent.includes("v2"),
    simulated: document.querySelector('[role="dialog"]').textContent.includes("não altera a Home pública real")
  })`);
  assert.deepEqual(bannerSummary, { title: "Publicar banner", version: true, simulated: true });
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Publicar banner").click()`);
  await waitForCondition(`document.body.textContent.includes("Banner publicado no mock")`);
  assert.equal(await evaluate(`document.body.textContent.includes("Publicado no mock")`), true);
  recordCheck("F2.2D: banner aprovado é publicado separadamente com resumo e metadata mockada");
  await captureScreenshot("admin-publication-banner-success");

  await navigate("/admin/home/publication", 1440, 900);
  await waitForCondition(`${publishButton("Publicar contatos")} !== undefined`);
  await evaluate(`${publishButton("Publicar contatos")}.click()`);
  await waitForCondition(`document.querySelector('[role="dialog"]') !== null`);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes("E-mail")`), true);
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Publicar contatos").click()`);
  await waitForCondition(`document.body.textContent.includes("Contatos publicado no mock")`);
  recordCheck("F2.2D: contatos são publicados separadamente e exibem comparação completa");

  await navigate("/admin/home/publication", 1440, 900);
  await waitForCondition(`${publishButton("Publicar redes sociais")} !== undefined`);
  await evaluate(`${publishButton("Publicar redes sociais")}.click()`);
  await waitForCondition(`document.querySelector('[role="dialog"]') !== null`);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes("Instagram")`), true);
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Publicar configuração de redes sociais").click()`);
  await waitForCondition(`document.body.textContent.includes("Redes sociais publicado no mock")`);
  assert.equal(await evaluate(`[...document.querySelectorAll("button")].some((button) => /Publicar (Facebook|Instagram|YouTube|LinkedIn|X)/.test(button.textContent))`), false);
  recordCheck("F2.2D: redes sociais são publicadas como configuração indivisível, nunca por link");

  await navigate("/admin/home/history", 1440, 900);
  await waitForCondition(`document.querySelector("h1")?.textContent.includes("Histórico de versões")`);
  assert.equal(await evaluate(`document.querySelectorAll("ol li").length >= 4`), true);
  await evaluate(`(() => { const select = [...document.querySelectorAll("select")].find((item) => item.closest("label")?.textContent.includes("Tipo")); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, "footer_contacts"); select.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  await waitForCondition(`document.body.textContent.includes("1 de 4 versões exibidas")`);
  recordCheck("F2.2D: histórico somente leitura lista versões e filtra por tipo");
  await captureScreenshot("admin-history-desktop");

  await navigate("/admin/home/history/history-banner-v0", 1440, 900);
  await waitForCondition(`document.querySelector("h1")?.textContent.includes("Versão editorial v0")`);
  assert.equal(await evaluate(`document.querySelector("input, textarea") === null`), true);
  await evaluate(`${publishButton("Restaurar como novo rascunho")}.click()`);
  await waitForCondition(`document.querySelector('[role="dialog"]') !== null`);
  assert.equal(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes("versão pública atual não será alterada")`), true);
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Restaurar como novo rascunho").click()`);
  await waitForCondition(`document.body.textContent.includes("Novo rascunho criado")`);
  assert.equal(await evaluate(`document.body.textContent.includes("aprovação histórica não foi reutilizada")`), true);
  recordCheck("F2.2D: detalhe é imutável e restore cria novo draft sem reutilizar aprovação");

  await evaluate(`[...document.querySelectorAll("a")].find((link) => link.textContent.includes("Abrir novo rascunho")).click()`);
  await waitForCondition(`location.search.includes("scenario=restored") && document.body.textContent.includes("Rascunho")`);
  recordCheck("F2.2D: pós-restore abre o editor correto exibindo um rascunho");

  await navigate("/admin/home/publication?scenario=publication_conflict", 1440, 900);
  await waitForCondition(`${publishButton("Publicar banner")} !== undefined`);
  await evaluate(`${publishButton("Publicar banner")}.click()`);
  await waitForCondition(`document.querySelector('[role="dialog"]') !== null`);
  await evaluate(`[...document.querySelectorAll('[role="dialog"] button')].find((button) => button.textContent.trim() === "Publicar banner").click()`);
  await waitForCondition(`document.querySelector('[role="alert"]')?.textContent.includes("409")`);
  assert.equal(await evaluate(`document.body.textContent.includes("Banner publicado no mock")`), false);
  assert.equal(await evaluate(`[...document.querySelectorAll("button")].some((button) => button.textContent.includes("Recarregar dados"))`), true);
  recordCheck("F2.2D: conflito 409 preserva a versão pública, não simula sucesso e oferece recarga");

  for (const path of ["/admin/home/publication", "/admin/home/history", "/admin/home/history/history-banner-v0"]) {
    await navigate(path, 390, 844);
    await waitForCondition(`document.querySelector("h1") !== null`);
    assert.equal(await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), false);
  }
  recordCheck("F2.2D: publicação, histórico e detalhe não têm overflow em 390x844");

  await navigate("/", 1440, 900);
  const publicHomeAfterDecisions = await evaluate(`(() => ({
    h1: document.querySelector("h1")?.textContent.trim(),
    hasAdminLink: [...document.querySelectorAll("a")].some((link) => (link.getAttribute("href") ?? "").startsWith("/admin")),
    footerPhone: document.querySelector('footer a[href^="tel:"]')?.textContent.trim()
  }))()`);
  assert.deepEqual(publicHomeAfterDecisions, {
    h1: "Juntos somos mais fortes.",
    hasAdminLink: false,
    footerPhone: "(11) 1234-5678",
  });
  recordCheck("F2.2C: nenhuma decisão alterou a Home pública e o menu público não expõe rotas administrativas");

  await navigate("/admin/home/social", 390, 844);
  const adminMenuTrigger = `document.querySelector('[aria-controls="admin-navigation"]')`;
  const adminMenuClosed = await evaluate(`(() => {
    const trigger = ${adminMenuTrigger};
    const bounds = trigger.getBoundingClientRect();
    return {
      name: trigger.getAttribute("aria-label"),
      expanded: trigger.getAttribute("aria-expanded"),
      visible: bounds.width > 0 && bounds.height > 0 && getComputedStyle(trigger).visibility !== "hidden",
      navigationHidden: getComputedStyle(document.getElementById("admin-navigation").closest("aside")).visibility,
    };
  })()`);
  assert.deepEqual(adminMenuClosed, {
    name: "Abrir menu administrativo",
    expanded: "false",
    visible: true,
    navigationHidden: "hidden",
  });
  await evaluate(`${adminMenuTrigger}.click()`);
  await wait(150);
  const adminMenuOpen = await evaluate(`(() => {
    const trigger = ${adminMenuTrigger};
    return {
      name: trigger.getAttribute("aria-label"),
      expanded: trigger.getAttribute("aria-expanded"),
      navigationVisible: getComputedStyle(document.getElementById("admin-navigation").closest("aside")).visibility,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  })()`);
  assert.deepEqual(adminMenuOpen, {
    name: "Fechar menu administrativo",
    expanded: "true",
    navigationVisible: "visible",
    overflow: false,
  });
  await captureScreenshot("admin-social-mobile-menu-open");
  await pressKey("Escape", "Escape", 27);
  assert.equal(await evaluate(`${adminMenuTrigger}.getAttribute("aria-expanded")`), "false");
  assert.equal(await evaluate(`document.activeElement === ${adminMenuTrigger}`), true);
  recordCheck("F2.2B: menu administrativo mobile abre, rotula, fecha por Escape e restaura o foco em 390x844");

  await navigate("/admin/home/social", 1440, 1000);
  assert.equal(
    await evaluate(`(() => {
      const trigger = ${adminMenuTrigger};
      const bounds = trigger.getBoundingClientRect();
      return bounds.width === 0 && bounds.height === 0
        && getComputedStyle(trigger.closest("header")).display === "none";
    })()`),
    true,
  );
  recordCheck("F2.2B: o gatilho do menu administrativo permanece oculto no layout desktop");

  await navigate("/", 390, 844);
  assert.equal(
    await evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"),
    false,
  );
  const menuTrigger = `document.querySelector('[aria-controls="mobile-menu"]')`;
  await evaluate(`${menuTrigger}.click()`);
  await wait(150);
  assert.equal(await evaluate(`${menuTrigger}.getAttribute("aria-expanded")`), "true");
  assert.equal(await evaluate("document.activeElement.closest('#mobile-menu') !== null"), true);
  recordCheck("Menu mobile abre e recebe foco");
  await captureScreenshot("home-mobile-menu-open");

  await pressKey("Escape", "Escape", 27);
  assert.equal(await evaluate(`${menuTrigger}.getAttribute("aria-expanded")`), "false");
  assert.equal(await evaluate(`document.activeElement === ${menuTrigger}`), true);
  recordCheck("Menu mobile fecha por Escape e restaura foco");

  assert.deepEqual(pageErrors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(consoleWarnings, []);
  assert.ok(unsavedGuardNotices.length > 0, "A guarda de alterações não salvas não foi exercida.");
  assert.deepEqual(resourceFailures, []);
  assert.deepEqual(dataEndpointRequests, []);
  recordCheck("Console, erros de página, recursos e chamadas a endpoint de dados ausentes", {
    unsavedGuardNotices: unsavedGuardNotices.length,
  });
} catch (error) {
  failure = error;
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  previewProcess.kill();
  chromeProcess.kill();
  await wait(250);
  rmSync(chromeProfile, { recursive: true, force: true });

  const report = {
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    browser: "Google Chrome headless via Chrome DevTools Protocol",
    baseUrl,
    checks,
    pageErrors,
    consoleErrors,
    consoleWarnings,
    resourceFailures,
    unsavedGuardNotices,
    dataEndpointRequests,
    previewOutput,
    previewErrors,
    browserOutput,
    browserDiagnostics,
    passed: !failure,
    failure: failure instanceof Error ? failure.stack : failure ? String(failure) : null,
  };
  writeFileSync(resolve(evidenceDirectory, "report.json"), JSON.stringify(report, null, 2));
}

if (failure) throw failure;
process.stdout.write(`E2E Home aprovado: ${checks.length} verificações em ${Date.now() - startedAt}ms\n`);
