#!/usr/bin/env node
/**
 * tour-lint: static checks on the guided tour script.
 *  - no AI/ML/"intelligence" wording in narration (honesty guardrail)
 *  - every step's persona is a valid role id (or "supplier")
 *  - every step's anchor is referenced by a data-tour-id somewhere in src/app
 *    or src/components (so it resolves at runtime; runtime also center-falls-back)
 *  - every step has a route, title, and body
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCRIPT = join(ROOT, "src/lib/tour/script.ts");

const VALID_ROLES = new Set([
  "requester", "approver", "buyer", "finance_maker", "finance_checker", "management",
  "supplier", "receiving", "quality", "engineering", "budget_owner", "tax_compliance",
  "administrator", "inventory_manager",
]);
const BANNED = [/\bAI\b/, /\bML\b/, /machine learning/i, /artificial intelligence/i, /\bintelligence\b/i, /\bsmart\b/i, /predict/i];

const src = readFileSync(SCRIPT, "utf8");

// crude but effective: pull each step object's fields via regex
const stepBlocks = src.split(/\{\s*\n?\s*id:/).slice(1);
const problems = [];

// gather all data-tour-id values across src
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?)$/.test(e)) out.push(p);
  }
  return out;
}
const anchorDefs = new Set();
for (const f of [...walk(join(ROOT, "src/app")), ...walk(join(ROOT, "src/components"))]) {
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(/data-tour-id="([^"]+)"/g)) anchorDefs.add(m[1]);
  // tourId="x" prop form
  for (const m of txt.matchAll(/tourId="([^"]+)"/g)) anchorDefs.add(m[1]);
}

for (const block of stepBlocks) {
  const id = (block.match(/^\s*"([^"]+)"/) ?? [])[1] ?? "?";
  const persona = (block.match(/persona:\s*"([^"]+)"/) ?? [])[1];
  const anchor = (block.match(/anchor:\s*"([^"]+)"/) ?? [])[1];
  const route = (block.match(/route:\s*"([^"]+)"/) ?? [])[1];
  const title = (block.match(/title:\s*"([^"]+)"/) ?? [])[1];
  const body = (block.match(/body:\s*"([^"]+)"/) ?? [])[1];

  if (persona && !VALID_ROLES.has(persona)) problems.push(`step ${id}: invalid persona "${persona}"`);
  if (!route) problems.push(`step ${id}: missing route`);
  if (!title) problems.push(`step ${id}: missing title`);
  if (!body) problems.push(`step ${id}: missing body`);
  if (anchor && !anchorDefs.has(anchor)) problems.push(`step ${id}: anchor "${anchor}" has no data-tour-id in src (would center-fallback)`);
  for (const re of BANNED) {
    if (re.test(title ?? "") || re.test(body ?? "")) problems.push(`step ${id}: banned wording /${re.source}/ in narration`);
  }
}

if (problems.length > 0) {
  console.error(`[tour-lint] FAILED: ${problems.length} issue(s):`);
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log(`[tour-lint] OK — ${stepBlocks.length} steps, all anchors resolve, no banned wording, personas valid`);
