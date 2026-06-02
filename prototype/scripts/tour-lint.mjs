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
// The overlay anchors by data-tour-id, falling back to data-testid; accept both.
const anchorDefs = new Set();
// Some anchors are generated from a template literal: ActionPanel renders
// `action-${a}` (data-tour-id) for each action in its ACTIONS map. The static
// scan below can't see those literals, so derive the keys from ActionPanel's
// ACTIONS object and register `action-<key>` for each — resolving anchors like
// "action-issue" exactly as they resolve at runtime, with no duplicated list.
{
  const ap = readFileSync(join(ROOT, "src/components/patterns/ActionPanel.tsx"), "utf8");
  const block = ap.match(/const ACTIONS[^{]*\{([\s\S]*?)\n\};/);
  if (block) {
    for (const m of block[1].matchAll(/^\s*(\w+):\s*\{/gm)) anchorDefs.add(`action-${m[1]}`);
  }
}
for (const f of [...walk(join(ROOT, "src/app")), ...walk(join(ROOT, "src/components"))]) {
  const txt = readFileSync(f, "utf8");
  for (const m of txt.matchAll(/data-tour-id="([^"]+)"/g)) anchorDefs.add(m[1]);
  for (const m of txt.matchAll(/tourId="([^"]+)"/g)) anchorDefs.add(m[1]);
  for (const m of txt.matchAll(/data-testid="([^"]+)"/g)) anchorDefs.add(m[1]);
  // testId="x" prop form (RuleBanner etc.)
  for (const m of txt.matchAll(/testId="([^"]+)"/g)) anchorDefs.add(m[1]);
}

for (const block of stepBlocks) {
  const id = (block.match(/^\s*"([^"]+)"/) ?? [])[1] ?? "?";
  const persona = (block.match(/persona:\s*"([^"]+)"/) ?? [])[1];
  const anchor = (block.match(/anchor:\s*"([^"]+)"/) ?? [])[1];
  const route = (block.match(/route:\s*"([^"]+)"/) ?? [])[1];
  const title = (block.match(/title:\s*"([^"]+)"/) ?? [])[1];
  const body = (block.match(/body:\s*"([^"]+)"/) ?? [])[1];
  const mode = (block.match(/mode:\s*"([^"]+)"/) ?? [])[1];
  const advanceWhen = (block.match(/advanceWhen:\s*"([^"]+)"/) ?? [])[1];

  if (persona && !VALID_ROLES.has(persona)) problems.push(`step ${id}: invalid persona "${persona}"`);
  if (!route) problems.push(`step ${id}: missing route`);
  if (!title) problems.push(`step ${id}: missing title`);
  if (!body) problems.push(`step ${id}: missing body`);
  if (anchor && !anchorDefs.has(anchor)) problems.push(`step ${id}: anchor "${anchor}" has no data-tour-id/testid in src (would center-fallback)`);
  if (mode === "tryit" && !advanceWhen) problems.push(`step ${id}: tryit step must declare advanceWhen`);
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
