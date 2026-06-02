#!/usr/bin/env node
/**
 * seed-lint: fail the build if pharma vocabulary leaked into the FMCG seed.
 * The reskin must be label-only; this guards against regressions when the seed
 * is regenerated. Part of the per-phase verification gate.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(__dirname, "../src/lib/seed/data");

// whole-word-ish banned terms (case-insensitive). GMP/ISO/FCC are allowed.
const BANNED = [
  /pharmaceutical/i,
  /\bpharma\b/i,
  /excipient/i,
  /\bMSDS\b/i,
  /\bUSP\b/i,
  /meridian/i,
  /\bAPI\b/, // "Active Pharmaceutical Ingredient" abbreviation (case-sensitive to avoid 'api' substrings)
];

const files = readdirSync(SEED_DIR).filter((f) => f.endsWith(".json"));
const violations = [];

for (const f of files) {
  const lines = readFileSync(join(SEED_DIR, f), "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const re of BANNED) {
      if (re.test(line)) {
        violations.push(`${f}:${i + 1}  /${re.source}/  ${line.trim().slice(0, 80)}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`[seed-lint] FAILED: ${violations.length} pharma-vocabulary leak(s):`);
  for (const v of violations.slice(0, 40)) console.error("  " + v);
  process.exit(1);
}

console.log(`[seed-lint] OK — ${files.length} seed files, no pharma vocabulary`);
