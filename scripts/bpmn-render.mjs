#!/usr/bin/env node
/**
 * Render every .bpmn in ../diagrams to an SVG under src/lib/bpmn/derived/svg/
 * using bpmn-to-image (bundled puppeteer/chrome). These are read-only visual
 * references for human verification; they are not shipped in the app bundle.
 */
import { convertAll } from "bpmn-to-image";
import { readdirSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIAGRAMS_DIR = resolve(__dirname, "../../diagrams");
const OUT_DIR = resolve(__dirname, "../src/lib/bpmn/derived/svg");

mkdirSync(OUT_DIR, { recursive: true });

const files = readdirSync(DIAGRAMS_DIR).filter((f) => f.endsWith(".bpmn")).sort();

const conversions = files.map((f) => ({
  input: join(DIAGRAMS_DIR, f),
  outputs: [join(OUT_DIR, f.replace(/\.bpmn$/, ".svg"))],
}));

console.log(`[bpmn-render] rendering ${conversions.length} diagrams to ${OUT_DIR}`);
await convertAll(conversions);
console.log(`[bpmn-render] done`);
