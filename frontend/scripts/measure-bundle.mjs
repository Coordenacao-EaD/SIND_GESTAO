import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const distDirectory = resolve("dist");
const outputPath = resolve(process.argv[2] ?? "test-results/performance/bundle.json");
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function sum(files, key) {
  return files.reduce((total, file) => total + file[key], 0);
}

const files = walk(distDirectory).map((path) => {
  const contents = readFileSync(path);
  const extension = extname(path).toLowerCase();
  return {
    path: relative(distDirectory, path).replaceAll("\\", "/"),
    extension: extension || "(none)",
    bytes: contents.length,
    gzipBytes: gzipSync(contents, { level: 9 }).length,
    brotliBytes: brotliCompressSync(contents, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}).sort((left, right) => right.bytes - left.bytes);

const select = (predicate) => files.filter(predicate);
const summarize = (selected) => ({
  files: selected.length,
  bytes: sum(selected, "bytes"),
  gzipBytes: sum(selected, "gzipBytes"),
  brotliBytes: sum(selected, "brotliBytes"),
});

const report = {
  generatedAt: new Date().toISOString(),
  command: `npm run measure:bundle -- ${relative(resolve("."), outputPath).replaceAll("\\", "/")}`,
  totals: summarize(files),
  categories: {
    images: summarize(select((file) => imageExtensions.has(file.extension))),
    javascript: summarize(select((file) => file.extension === ".js")),
    css: summarize(select((file) => file.extension === ".css")),
    fonts: summarize(select((file) => /^\.woff2?$|^\.ttf$|^\.otf$|^\.eot$/.test(file.extension))),
    other: summarize(select((file) => !imageExtensions.has(file.extension)
      && file.extension !== ".js" && file.extension !== ".css"
      && !/^\.woff2?$|^\.ttf$|^\.otf$|^\.eot$/.test(file.extension))),
  },
  largestFiles: files.slice(0, 10),
  files,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report.totals)}\n${outputPath}\n`);
