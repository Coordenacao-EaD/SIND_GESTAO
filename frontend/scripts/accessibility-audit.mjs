import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4180";
const outputDirectory = resolve(process.argv[3] ?? "test-results/accessibility/initial");
const enforce = process.argv.includes("--enforce");
const debugUrl = process.env.CHROME_DEBUG_URL ?? "http://127.0.0.1:9333";
const axeSource = readFileSync(resolve("node_modules/axe-core/axe.min.js"), "utf8");

const scenarios = [
  { id: "home-1440x900", path: "/", width: 1440, height: 900, state: "default" },
  { id: "home-1024x768", path: "/", width: 1024, height: 768, state: "default" },
  { id: "home-768x1024", path: "/", width: 768, height: 1024, state: "default" },
  { id: "home-390x844", path: "/", width: 390, height: 844, state: "default" },
  { id: "home-360x800", path: "/", width: 360, height: 800, state: "default" },
  { id: "mobile-menu-open", path: "/", width: 390, height: 844, state: "mobile-menu" },
  { id: "institutional-dropdown-open", path: "/", width: 1440, height: 900, state: "dropdown" },
  { id: "membership-route", path: "/filie-se", width: 1440, height: 900, state: "default" },
  { id: "member-area-route", path: "/area-do-filiado", width: 1440, height: 900, state: "default" },
  { id: "not-found-route", path: "/rota-inexistente-a11y", width: 1440, height: 900, state: "default" },
  { id: "hero-image-normal", path: "/", width: 1440, height: 900, state: "hero-normal" },
  { id: "hero-image-fallback", path: "/", width: 1440, height: 900, state: "hero-fallback" },
];

mkdirSync(outputDirectory, { recursive: true });
mkdirSync(resolve(outputDirectory, "screenshots"), { recursive: true });

const targets = await (await fetch(`${debugUrl}/json`)).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("Nenhuma página do Chrome headless foi encontrada.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolvePromise, rejectPromise) => {
  socket.onopen = resolvePromise;
  socket.onerror = rejectPromise;
});

let commandId = 0;
const pendingCommands = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pendingCommands.has(message.id)) return;
  const { resolve: resolveCommand, reject } = pendingCommands.get(message.id);
  pendingCommands.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolveCommand(message.result);
};

function command(method, params = {}) {
  return new Promise((resolveCommand, reject) => {
    const id = ++commandId;
    pendingCommands.set(id, { resolve: resolveCommand, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

const wait = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? "Falha ao avaliar expressão no Chrome.");
  }
  return response.result.value;
}

async function prepareScenario(scenario) {
  await command("Emulation.setDeviceMetricsOverride", {
    width: scenario.width,
    height: scenario.height,
    deviceScaleFactor: 1,
    mobile: scenario.width <= 768,
  });
  await command("Page.navigate", { url: `${baseUrl}${scenario.path}` });
  await wait(900);

  if (scenario.state === "mobile-menu") {
    await evaluate(`document.querySelector('[aria-controls="mobile-menu"]').click()`);
    await wait(150);
  }
  if (scenario.state === "dropdown") {
    await evaluate(
      `[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Institucional")).click()`,
    );
    await wait(150);
  }
  if (scenario.state === "hero-fallback") {
    await evaluate(
      `document.querySelector("main section img").dispatchEvent(new Event("error", { bubbles: true }))`,
    );
    await wait(150);
  }
}

async function collectState(scenario) {
  return evaluate(`(() => {
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    const main = document.querySelector("main");
    const heroImage = document.querySelector("main section img");
    const heroFallback = document.querySelector("main section [role='img']");
    const mobileTrigger = document.querySelector('[aria-controls="mobile-menu"]');
    const mobileDialog = document.getElementById("mobile-menu");
    const dropdownTrigger = [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Institucional"));
    return {
      scenario: ${JSON.stringify(scenario.id)},
      url: location.href,
      title: document.title,
      mainCount: document.querySelectorAll("main").length,
      h1Count: document.querySelectorAll("h1").length,
      nestedMain: Boolean(main?.querySelector("main")),
      duplicateIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      skipTargetExists: Boolean(document.querySelector('.skip-link[href="#conteudo"]') && document.getElementById("conteudo")),
      mobileExpanded: mobileTrigger?.getAttribute("aria-expanded") ?? null,
      mobileDialogModal: mobileDialog?.getAttribute("aria-modal") ?? null,
      mobileDialogName: mobileDialog?.getAttribute("aria-labelledby") ?? mobileDialog?.getAttribute("aria-label") ?? null,
      backgroundInert: mobileTrigger?.getAttribute("aria-expanded") === "true"
        ? [...document.querySelector(".site-shell").children]
            .filter((element) => element.tagName !== "HEADER")
            .every((element) => element.inert)
        : null,
      dropdownExpanded: dropdownTrigger?.getAttribute("aria-expanded") ?? null,
      heroImagePresent: Boolean(heroImage),
      heroImageAlt: heroImage?.getAttribute("alt") ?? null,
      heroFallbackPresent: Boolean(heroFallback),
      heroFallbackName: heroFallback?.getAttribute("aria-label") ?? null,
      colorTokens: Object.fromEntries([
        "color-gold", "color-gold-dark", "color-gold-deep", "color-gold-soft",
        "color-text", "color-white", "color-footer"
      ].map((token) => [token, getComputedStyle(document.documentElement).getPropertyValue("--" + token).trim()])),
    };
  })()`);
}

async function runAxe(tags) {
  return evaluate(`(async () => {
    ${axeSource}
    return axe.run(document, {
      runOnly: { type: "tag", values: ${JSON.stringify(tags)} },
      resultTypes: ["violations", "passes", "incomplete", "inapplicable"]
    });
  })()`);
}

async function dispatchKey(key, code, virtualKeyCode, modifiers = 0) {
  const params = {
    key,
    code,
    windowsVirtualKeyCode: virtualKeyCode,
    nativeVirtualKeyCode: virtualKeyCode,
    modifiers,
  };
  await command("Input.dispatchKeyEvent", { type: "keyDown", ...params });
  await command("Input.dispatchKeyEvent", { type: "keyUp", ...params });
  await wait(80);
}

async function verifyInteraction(scenario) {
  if (scenario.state === "mobile-menu") {
    await evaluate(`document.querySelectorAll("#mobile-menu a")[document.querySelectorAll("#mobile-menu a").length - 1].focus()`);
    await dispatchKey("Tab", "Tab", 9);
    const forwardWrap = await evaluate(`({
      insideDialog: Boolean(document.activeElement.closest("#mobile-menu")),
      activeName: document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim()
    })`);
    await dispatchKey("Escape", "Escape", 27);
    const close = await evaluate(`(() => {
      const trigger = document.querySelector('[aria-controls="mobile-menu"]');
      return {
        expanded: trigger.getAttribute("aria-expanded"),
        focusRestored: document.activeElement === trigger
      };
    })()`);
    return { forwardWrap, close };
  }

  if (scenario.state === "dropdown") {
    await evaluate(`document.querySelector("#institutional-menu a").focus()`);
    await dispatchKey("Escape", "Escape", 27);
    const close = await evaluate(`(() => {
      const trigger = [...document.querySelectorAll("button")]
        .find((button) => button.textContent.includes("Institucional"));
      return {
        expanded: trigger.getAttribute("aria-expanded"),
        focusRestored: document.activeElement === trigger
      };
    })()`);
    return { close };
  }

  return null;
}

function countByImpact(violations) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0, unknown: 0 };
  for (const violation of violations) counts[violation.impact ?? "unknown"] += 1;
  return counts;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function relativeLuminance(hexColor) {
  const normalizedColor = hexColor.length === 4
    ? `#${[...hexColor.slice(1)].map((channel) => channel.repeat(2)).join("")}`
    : hexColor;
  const channels = normalizedColor.match(/[a-f\d]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

await command("Page.enable");
await command("Runtime.enable");

const results = [];
for (const scenario of scenarios) {
  await prepareScenario(scenario);
  const state = await collectState(scenario);
  const wcag = await runAxe(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
  const bestPractice = await runAxe(["best-practice"]);
  const screenshot = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  writeFileSync(
    resolve(outputDirectory, "screenshots", `${scenario.id}.png`),
    Buffer.from(screenshot.data, "base64"),
  );
  const interaction = await verifyInteraction(scenario);

  const result = {
    scenario,
    state,
    axeVersion: wcag.testEngine.version,
    wcag,
    bestPractice,
    interaction,
    counts: {
      wcag: countByImpact(wcag.violations),
      bestPractice: countByImpact(bestPractice.violations),
      incomplete: wcag.incomplete.length + bestPractice.incomplete.length,
      passes: wcag.passes.length + bestPractice.passes.length,
      inapplicable: wcag.inapplicable.length + bestPractice.inapplicable.length,
    },
  };
  results.push(result);
  writeFileSync(resolve(outputDirectory, `${scenario.id}.json`), JSON.stringify(result, null, 2));
  process.stdout.write(
    `${scenario.id}: WCAG=${wcag.violations.length}, best-practice=${bestPractice.violations.length}, incomplete=${result.counts.incomplete}\n`,
  );
}

const uniqueViolations = new Map();
for (const result of results) {
  for (const profile of ["wcag", "bestPractice"]) {
    for (const violation of result[profile].violations) {
      const key = `${profile}:${violation.id}`;
      if (!uniqueViolations.has(key)) {
        uniqueViolations.set(key, {
          profile,
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          scenarios: [],
          affectedElements: 0,
        });
      }
      const item = uniqueViolations.get(key);
      item.scenarios.push(result.scenario.id);
      item.affectedElements += violation.nodes.length;
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  tool: `axe-core ${results[0]?.axeVersion ?? "unknown"}`,
  browser: "Google Chrome headless via Chrome DevTools Protocol",
  baseUrl,
  tags: {
    wcag: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    bestPractice: ["best-practice"],
  },
  disabledRules: [],
  scenarios: results.map((result) => ({
    id: result.scenario.id,
    path: result.scenario.path,
    viewport: `${result.scenario.width}x${result.scenario.height}`,
    state: result.state,
    counts: result.counts,
  })),
  uniqueViolations: [...uniqueViolations.values()],
};
writeFileSync(resolve(outputDirectory, "summary.json"), JSON.stringify(summary, null, 2));

const tokens = results[0].state.colorTokens;
const contrastPairs = [
  ["escuro sobre dourado claro", tokens["color-text"], tokens["color-gold"]],
  ["escuro sobre dourado escuro (hover/foco)", tokens["color-text"], tokens["color-gold-dark"]],
  ["dourado profundo sobre branco", tokens["color-gold-deep"], tokens["color-white"]],
  ["dourado profundo sobre dourado suave", tokens["color-gold-deep"], tokens["color-gold-soft"]],
  ["branco sobre rodapé escuro", tokens["color-white"], tokens["color-footer"]],
].map(([name, foreground, background]) => ({
  name,
  foreground,
  background,
  ratio: Number(contrastRatio(foreground, background).toFixed(2)),
  wcagAaNormalText: contrastRatio(foreground, background) >= 4.5,
}));
writeFileSync(resolve(outputDirectory, "contrast-analysis.json"), JSON.stringify({
  method: "WCAG relative luminance calculated from CSS custom properties read from the rendered DOM",
  pairs: contrastPairs,
  axeIncomplete: results.flatMap((result) =>
    result.wcag.incomplete
      .filter((item) => item.id === "color-contrast")
      .map((item) => ({ scenario: result.scenario.id, rule: item.id, nodes: item.nodes.length })),
  ),
  incompleteJustification: "axe-core cannot resolve final colors through CSS gradients and image overlays; screenshots and the previously validated visual measurements remain evidence for those nodes.",
}, null, 2));

const rows = summary.scenarios.map(({ id, viewport, counts }) => {
  const total = Object.values(counts.wcag).reduce((sum, value) => sum + value, 0)
    + Object.values(counts.bestPractice).reduce((sum, value) => sum + value, 0);
  return `<tr><td>${escapeHtml(id)}</td><td>${escapeHtml(viewport)}</td><td>${counts.wcag.critical + counts.bestPractice.critical}</td><td>${counts.wcag.serious + counts.bestPractice.serious}</td><td>${counts.wcag.moderate + counts.bestPractice.moderate}</td><td>${counts.wcag.minor + counts.bestPractice.minor}</td><td>${counts.incomplete}</td><td>${total === 0 ? "Aprovado" : "Requer análise"}</td></tr>`;
}).join("\n");
const violationRows = summary.uniqueViolations.map((violation) =>
  `<tr><td>${escapeHtml(violation.profile)}</td><td>${escapeHtml(violation.id)}</td><td>${escapeHtml(violation.impact)}</td><td>${escapeHtml(violation.scenarios.join(", "))}</td><td>${violation.affectedElements}</td><td><a href="${escapeHtml(violation.helpUrl)}">${escapeHtml(violation.help)}</a></td></tr>`,
).join("\n");
writeFileSync(resolve(outputDirectory, "report.html"), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Auditoria automatizada F1</title>
<style>body{font:16px/1.5 system-ui;margin:2rem;color:#1d1d1d}table{border-collapse:collapse;width:100%;margin-block:1rem 2rem}th,td{border:1px solid #aaa;padding:.5rem;text-align:left}th{background:#eee}code{background:#eee;padding:.1rem .3rem}</style></head>
<body><h1>Auditoria automatizada de acessibilidade — F1</h1>
<p>Ferramenta: <strong>${escapeHtml(summary.tool)}</strong>. Perfis executados separadamente: <code>WCAG 2.1 AA</code> e <code>best-practice</code>. Nenhuma regra desabilitada.</p>
<h2>Cenários</h2><table><thead><tr><th>Cenário</th><th>Viewport</th><th>Critical</th><th>Serious</th><th>Moderate</th><th>Minor</th><th>Incomplete</th><th>Resultado</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Violações consolidadas</h2><table><thead><tr><th>Perfil</th><th>Regra</th><th>Impacto</th><th>Cenários</th><th>Elementos</th><th>Ajuda</th></tr></thead><tbody>${violationRows || "<tr><td colspan='6'>Nenhuma violação.</td></tr>"}</tbody></table>
</body></html>`);

writeFileSync(resolve(outputDirectory, "audit.log"), [
  `generatedAt=${summary.generatedAt}`,
  `tool=${summary.tool}`,
  `browser=${summary.browser}`,
  `baseUrl=${baseUrl}`,
  `wcagTags=${summary.tags.wcag.join(",")}`,
  `bestPracticeTags=${summary.tags.bestPractice.join(",")}`,
  "disabledRules=none",
  ...summary.scenarios.map(({ id, counts }) =>
    `${id}|wcag=${JSON.stringify(counts.wcag)}|bestPractice=${JSON.stringify(counts.bestPractice)}|incomplete=${counts.incomplete}|passes=${counts.passes}|inapplicable=${counts.inapplicable}`,
  ),
].join("\n"));

const markdownRows = summary.scenarios.map(({ id, counts }) => {
  const critical = counts.wcag.critical + counts.bestPractice.critical;
  const serious = counts.wcag.serious + counts.bestPractice.serious;
  const moderate = counts.wcag.moderate + counts.bestPractice.moderate;
  const minor = counts.wcag.minor + counts.bestPractice.minor;
  return `| ${id} | ${critical} | ${serious} | ${moderate} | ${minor} | ${counts.incomplete} | ${critical + serious + moderate + minor === 0 ? "Aprovado" : "Requer análise"} |`;
}).join("\n");
writeFileSync(resolve(outputDirectory, "summary.md"), `# Auditoria automatizada de acessibilidade — F1

- Ferramenta: ${summary.tool}
- Navegador: ${summary.browser}
- Tags WCAG: ${summary.tags.wcag.join(", ")}
- Best practice executado separadamente
- Regras desabilitadas: nenhuma

| Cenário | Critical | Serious | Moderate | Minor | Incomplete | Resultado |
|---|---:|---:|---:|---:|---:|---|
${markdownRows}

Os itens incomplete são preservados no JSON bruto e detalhados em \`contrast-analysis.json\`.
`);

socket.close();

if (enforce) {
  const blockingViolations = results.flatMap((result) => [
    ...result.wcag.violations,
    ...result.bestPractice.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"),
  ]);
  if (blockingViolations.length > 0) process.exitCode = 1;
}
