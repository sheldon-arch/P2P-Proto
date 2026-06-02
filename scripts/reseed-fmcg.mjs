#!/usr/bin/env node
/**
 * FMCG reseed: copy the rich seed from the reference prototype into this project,
 * relabeling pharma vocabulary to FMCG (packaged foods & snacks, "Harvest Foods")
 * while preserving ALL structure, ids, and figures (so KPI/landed-cost assertions
 * still hold). seed-lint then verifies no pharma vocabulary leaked.
 *
 * This is a DATA transform only — the term map changes labels, never numbers.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, "../../p2p-prototype/src/lib/seed");
const OUT = resolve(__dirname, "../src/lib/seed/data");

mkdirSync(OUT, { recursive: true });

// Ordered term map (longer/more specific phrases first to avoid partial hits).
// Each entry replaces case-insensitively but preserves a Title-Case look.
const TERM_MAP = [
  // --- full phrases FIRST (before any sub-token rule like USP->FCC changes them) ---
  ["API must comply with USP, BP, EP, or IP monograph as applicable", "Ingredient must comply with FCC or relevant food-grade standard as applicable"],
  ["USP-BP-EP-IP", "FCC-FOODGRADE"],
  ["Pharmacopoeial Compliance", "Food-Grade Compliance"],
  ["Pharmacopoeial", "Food-Grade"],
  ["Active Pharmaceutical Ingredient", "Food Ingredient"],
  ["active pharmaceutical ingredient", "food ingredient"],
  ["Pharma Solvent", "Food-Grade Solvent"],
  ["pharma solvent", "food-grade solvent"],
  ["Active Pharma Ltd", "Food Ingredients Ltd"],
  ["Active Pharma", "Food Ingredients"],
  ["Fine Chemicals", "Food Ingredients"],
  ["fine chemicals", "food ingredients"],
  ["Excipients", "Additives"],
  ["excipients", "additives"],
  ["Excipient", "Food Additive"],
  ["excipient", "food additive"],
  ["meridianhealth.com", "harvestfoods.com"],
  ["Meridian Consumer Health", "Harvest Foods"],
  ["Meridian Consumer", "Harvest Foods"],
  ["Meridian", "Harvest"],
  ["meridian", "harvest"],
  ["MSDS", "Spec Sheet"],
  // structural codes: API sub-segment (Active Pharmaceutical Ingredient) -> FIN (Food INgredient)
  ["RM/API", "RM/FIN"],
  ["RM-API", "RM-FIN"],
  ["/API", "/FIN"],
  ["-API", "-FIN"],
  // narrative / classification free-text uses of "API"
  ["regulated API", "regulated food ingredient"],
  ["API lot", "ingredient lot"],
  ['"classDesc": "API"', '"classDesc": "Food Ingredient"'],
  // earlier 'pharma'->'food' produced "Foodcopoeial"; normalize the cert wording
  ["Foodcopoeial Compliance", "Food-Grade Compliance"],
  ["Foodcopoeial", "Food-Grade"],
  ["pharma-grade", "food-grade"],
  ["Pharma-Grade", "Food-Grade"],
  ["pharmaceutical", "food-grade"],
  ["Pharmaceutical", "Food-Grade"],
  ["pharma", "food"],
  ["Pharma", "Food"],
  // USP (US Pharmacopeia) -> FCC (Food Chemicals Codex), the food-industry analog.
  // WORD-BOUNDARY ONLY — "USP" must not match inside "sUSPended", etc.
  [/\bUSP\b/g, "FCC"],
  // discovery keyword arrays use lowercase "api" / "bulk drug"
  ["\"api\"", "\"food ingredient\""],
  ["bulk drug", "bulk ingredient"],
  // keep GMP (applies to food), keep ISO; map tablet -> snack bar
  ["tablets", "snack bars"],
  ["tablet", "snack bar"],
  ["capsules", "portion packs"],
  ["capsule", "portion pack"],
  [/\bOTC\b/g, "retail"],
];

// Data normalizations applied AFTER relabeling: align enum-controlled values to
// the declared enum casing (BPMN: purchaseType {Local|Import}). The source seed
// stored these uppercase; the enum/contract is Title case.
const NORMALIZE = [
  [/"purchaseType":\s*"LOCAL"/g, '"purchaseType": "Local"'],
  [/"purchaseType":\s*"IMPORT"/g, '"purchaseType": "Import"'],
];

// Per-file data fixes (applied to specific seed files only). Links the hero
// DRAFT POs to budgets so the PO-issue budget hard-commit is demonstrable:
// the ingredient PO ($696k) -> a small budget (forces an override), the carton
// PO ($17.9k) -> a budget with room (clean commit).
const FILE_FIXES = {
  "live_pos.json": [
    [/("id":\s*"PO-HERO",)/, '$1 "budgetId": "BUD-0012",'],
    [/("id":\s*"PO-HERO-CTN",)/, '$1 "budgetId": "BUD-0001",'],
  ],
};

function relabel(text) {
  let out = text;
  for (const [from, to] of TERM_MAP) {
    if (from instanceof RegExp) {
      out = out.replace(from, to);
    } else {
      out = out.split(from).join(to);
    }
  }
  for (const [from, to] of NORMALIZE) {
    out = out.replace(from, to);
  }
  return out;
}

const files = readdirSync(SRC).filter((f) => f.endsWith(".json"));
let changed = 0;
for (const f of files) {
  const raw = readFileSync(join(SRC, f), "utf8");
  let next = relabel(raw);
  for (const [from, to] of FILE_FIXES[f] ?? []) {
    next = next.replace(from, to);
  }
  if (next !== raw) changed++;
  // validate it is still valid JSON
  JSON.parse(next);
  writeFileSync(join(OUT, f), next);
}

// also copy the seed index manifest if present (non-json handled separately)
console.log(`[reseed-fmcg] ${files.length} seed files copied to ${OUT} (${changed} relabeled)`);
console.log(`[reseed-fmcg] company: Harvest Foods (packaged foods & snacks)`);
