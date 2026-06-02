#!/usr/bin/env node
/**
 * Render every .bpmn in ../diagrams to an SVG under src/lib/bpmn/derived/svg/
 * using bpmn-to-image (bundled puppeteer/chrome). These are read-only visual
 * references for human verification; they are not shipped in the app bundle.
 */
import { convertAll } from "bpmn-to-image";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIAGRAMS_DIR = resolve(__dirname, "../../diagrams");
const OUT_DIR = resolve(__dirname, "../src/lib/bpmn/derived/svg");

mkdirSync(OUT_DIR, { recursive: true });

const all = readdirSync(DIAGRAMS_DIR).filter((f) => f.endsWith(".bpmn")).sort();

// bpmn-js needs a BPMNDiagram (diagram-interchange layout) to render; files that
// carry only the semantic model (no bpmndi) are skipped for the SVG (their graph
// + coverage are still complete via the extraction pipeline). This keeps the
// render resilient instead of crashing the whole batch.
const renderable = [];
const skipped = [];
for (const f of all) {
  const xml = readFileSync(join(DIAGRAMS_DIR, f), "utf8");
  if (/BPMNDiagram/.test(xml)) renderable.push(f);
  else skipped.push(f);
}

const conversions = renderable.map((f) => ({
  input: join(DIAGRAMS_DIR, f),
  outputs: [join(OUT_DIR, f.replace(/\.bpmn$/, ".svg"))],
}));

console.log(`[bpmn-render] rendering ${conversions.length} diagrams to ${OUT_DIR}`);
if (skipped.length) console.log(`[bpmn-render] skipped (no layout/bpmndi, semantic-only): ${skipped.join(", ")}`);
await convertAll(conversions);
console.log(`[bpmn-render] done`);
