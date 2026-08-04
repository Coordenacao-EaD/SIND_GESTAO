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
const dataEndpointRequests = [];
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
    if (entry.level === "error") consoleErrors.push(entry.text);
    if (entry.level === "warning") consoleWarnings.push(entry.text);
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
  assert.deepEqual(resourceFailures, []);
  assert.deepEqual(dataEndpointRequests, []);
  recordCheck("Console, erros de página, recursos e chamadas a endpoint de dados ausentes");
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
