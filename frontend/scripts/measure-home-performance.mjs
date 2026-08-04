import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const outputPath = resolve(process.argv[2] ?? "test-results/performance/performance.json");
const screenshotDirectory = resolve(dirname(outputPath), `${outputPath.split(/[\\/]/).at(-1).replace(/\.json$/, "")}-screenshots`);
const previewPort = 4182;
const debugPort = 9334;
const baseUrl = `http://127.0.0.1:${previewPort}`;
const debugUrl = `http://127.0.0.1:${debugPort}`;
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const temporaryRoot = resolve(tmpdir());
const chromeProfile = mkdtempSync(join(temporaryRoot, "sindgestao-performance-"));
const viewports = [
  { id: "desktop-1440x900", width: 1440, height: 900 },
  { id: "desktop-1024x768", width: 1024, height: 768 },
  { id: "tablet-768x1024", width: 768, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
  { id: "mobile-360x800", width: 360, height: 800 },
];

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(screenshotDirectory, { recursive: true });

const preview = spawn(process.execPath, [
  resolve("node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1",
  "--port", String(previewPort), "--strictPort",
], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
const browser = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--disable-background-networking",
  "--disable-component-update", "--disable-default-apps", "--no-first-run",
  "--no-default-browser-check", "--disable-sync", "--disable-extensions",
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${chromeProfile}`, "about:blank",
], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
const previewOutput = [];
const previewErrors = [];
const browserErrors = [];
preview.stdout.on("data", (chunk) => previewOutput.push(chunk.toString()));
preview.stderr.on("data", (chunk) => previewErrors.push(chunk.toString()));
browser.stderr.on("data", (chunk) => browserErrors.push(chunk.toString()));

const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
async function waitForUrl(url) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (preview.exitCode !== null) {
      throw new Error(`Vite preview encerrou com ${preview.exitCode}: ${previewErrors.join("")}`);
    }
    if (browser.exitCode !== null) {
      throw new Error(`Chrome encerrou com ${browser.exitCode}: ${browserErrors.join("")}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // Process is still starting.
    }
    await wait(100);
  }
  throw new Error(`Tempo esgotado aguardando ${url}. Vite: ${previewOutput.join("")} ${previewErrors.join("")}`);
}

let socket;
let commandId = 0;
const pending = new Map();
const responses = new Map();
const failures = [];
const consoleErrors = [];
const consoleWarnings = [];

function command(method, params = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const id = ++commandId;
    pending.set(id, { resolveCommand, rejectCommand });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

function currentResources() {
  return [...responses.values()].map((response) => ({
    url: response.url,
    status: response.status,
    mimeType: response.mimeType,
    encodedBytes: response.encodedBytes ?? 0,
    type: response.type,
  })).sort((left, right) => right.encodedBytes - left.encodedBytes);
}

let failure;
try {
  await waitForUrl(baseUrl);
  await waitForUrl(`${debugUrl}/json/version`);
  const targets = await (await fetch(`${debugUrl}/json`)).json();
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Chrome não expôs uma página via CDP.");

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolvePromise, rejectPromise) => {
    socket.onopen = resolvePromise;
    socket.onerror = rejectPromise;
  });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.rejectCommand(new Error(message.error.message));
      else item.resolveCommand(message.result);
      return;
    }
    if (message.method === "Network.responseReceived") {
      const { requestId, response, type } = message.params;
      responses.set(requestId, {
        url: response.url, status: response.status, mimeType: response.mimeType, type,
      });
    }
    if (message.method === "Network.loadingFinished" && responses.has(message.params.requestId)) {
      responses.get(message.params.requestId).encodedBytes = message.params.encodedDataLength;
    }
    if (message.method === "Network.loadingFailed" && !message.params.canceled) failures.push(message.params);
    if (message.method === "Runtime.consoleAPICalled") {
      const value = message.params.args.map((argument) => argument.value ?? argument.description ?? "").join(" ");
      if (message.params.type === "error") consoleErrors.push(value);
      if (message.params.type === "warning") consoleWarnings.push(value);
    }
  };

  await Promise.all([
    command("Page.enable"), command("Runtime.enable"), command("Network.enable"),
    command("Network.setCacheDisabled", { cacheDisabled: true }),
  ]);
  await command("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__sindPerformance = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        window.__sindPerformance.lcp = entries.at(-1)?.startTime ?? window.__sindPerformance.lcp;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__sindPerformance.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });`,
  });

  const results = [];
  for (const viewport of viewports) {
    responses.clear();
    failures.length = 0;
    await command("Emulation.setDeviceMetricsOverride", {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1,
      mobile: viewport.width <= 768,
    });
    await command("Page.navigate", { url: `${baseUrl}/?performance=${viewport.id}-${Date.now()}` });
    await wait(2600);
    const initial = await evaluate(`(() => ({
      readyState: document.readyState,
      lcpMs: Number((window.__sindPerformance?.lcp ?? 0).toFixed(2)),
      cls: Number((window.__sindPerformance?.cls ?? 0).toFixed(5)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      images: [...document.images].map((image) => ({
        alt: image.alt, src: image.getAttribute("src"), currentSrc: image.currentSrc,
        srcset: image.getAttribute("srcset"), sizes: image.getAttribute("sizes"),
        loading: image.loading, fetchPriority: image.fetchPriority,
        naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
        displayedWidth: Number(image.getBoundingClientRect().width.toFixed(2)),
        displayedHeight: Number(image.getBoundingClientRect().height.toFixed(2)),
        complete: image.complete
      })),
      resources: performance.getEntriesByType("resource").map((entry) => ({
        name: entry.name, initiatorType: entry.initiatorType,
        transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize
      }))
    }))()`);
    const initialNetwork = currentResources();

    await evaluate(`(async () => {
      const step = Math.max(innerHeight * 0.75, 300);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y); await new Promise((resolvePromise) => setTimeout(resolvePromise, 120));
      }
      scrollTo(0, 0); await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    })()`);
    const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    writeFileSync(resolve(screenshotDirectory, `${viewport.id}.png`), Buffer.from(screenshot.data, "base64"));
    results.push({
      viewport,
      ...initial,
      initialNetwork,
      completeNetwork: currentResources(),
      failures: [...failures],
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    method: "Chrome headless/CDP with PerformanceObserver; local production build; cache disabled",
    lighthouse: "not installed; no score invented",
    baseUrl,
    previewOutput,
    previewErrors,
    browserErrors,
    results,
    consoleErrors,
    consoleWarnings,
  };
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(results.map(({ viewport, lcpMs, cls, horizontalOverflow }) => ({ viewport: viewport.id, lcpMs, cls, horizontalOverflow })))}\n`);
} catch (error) {
  failure = error;
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  preview.kill();
  browser.kill();
  await wait(250);
  const resolvedProfile = resolve(chromeProfile);
  if (!resolvedProfile.startsWith(`${temporaryRoot}\\`) && resolvedProfile !== temporaryRoot) {
    failure ??= new Error("Perfil temporário fora da raiz temporária; remoção cancelada.");
  } else {
    rmSync(resolvedProfile, { recursive: true, force: true });
  }
}

if (failure) throw failure;
