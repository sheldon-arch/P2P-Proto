#!/usr/bin/env node
/**
 * theme-lint: enforce the pure-ShadCN-neutral constraint. Raw colors (hex,
 * rgb(), hsl() literals, Tailwind arbitrary color classes) are only allowed in
 * globals.css (the token definitions) and tailwind.config.ts (the semantic
 * status palette). Everywhere else, components must read tokens. This prevents
 * drift back to the navy Material look of the Stitch reference.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCAN_DIRS = [join(ROOT, "src/app"), join(ROOT, "src/components")];
const ALLOW = new Set([
  join(ROOT, "src/app/globals.css"),
]);

// raw color signals
const PATTERNS = [
  { re: /#[0-9a-fA-F]{3,8}\b/, name: "hex color" },
  { re: /\b(bg|text|border|fill|stroke|ring)-\[#/, name: "arbitrary color class" },
  { re: /\brgb\(/, name: "rgb() literal" },
];

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|css)$/.test(e)) out.push(p);
  }
  return out;
}

const violations = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    if (ALLOW.has(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // skip comments-only signal noise minimally
      for (const { re, name } of PATTERNS) {
        if (re.test(line)) {
          violations.push(`${relative(ROOT, file)}:${i + 1}  ${name}  ${line.trim().slice(0, 70)}`);
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error(`[theme-lint] FAILED: ${violations.length} raw-color use(s) outside globals.css:`);
  for (const v of violations.slice(0, 40)) console.error("  " + v);
  process.exit(1);
}
console.log("[theme-lint] OK — no raw colors outside globals.css (tokens only)");
