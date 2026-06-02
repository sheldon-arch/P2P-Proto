#!/usr/bin/env node
/**
 * Coverage ledger — makes "does the UI cover every BPMN flow end-to-end" a
 * measurable number. For every BPMN userTask, the coverage map declares how it
 * is implemented:
 *   screen:<route>   a screen/control the user reaches
 *   action:<name>    an engine action exposed on a detail page (ActionPanel etc.)
 *   inline:<where>   an inline behavior/banner on a parent screen
 *   system           automated (no UI needed) — engine/service backed
 *   n/a              event/gateway-only, not a user action
 *
 * A userTask with no map entry is an UNCOVERED GAP. The report prints coverage %
 * and lists gaps. With --strict, exits non-zero if any in-scope userTask is
 * uncovered (used as the Phase 7 gate). serviceTasks are reported separately as
 * system-backed (informational).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG = resolve(__dirname, "../src/lib/bpmn/derived/catalog.json");
const MAP = resolve(__dirname, "../src/lib/bpmn/coverage-map.json");

const strict = process.argv.includes("--strict");
const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, "utf8")) : {};

const userTasks = catalog.nodes.filter((n) => n.type === "userTask");
const serviceTasks = catalog.nodes.filter((n) => n.type === "serviceTask");

function keyOf(n) {
  return `${n.diagram}#${n.id}`;
}

const covered = [];
const gaps = [];
for (const n of userTasks) {
  const entry = map[keyOf(n)];
  if (entry) covered.push({ ...n, impl: entry });
  else gaps.push(n);
}

const pct = userTasks.length ? Math.round((covered.length / userTasks.length) * 100) : 100;

// breakdown by implementation kind
const byKind = {};
for (const c of covered) {
  const kind = String(c.impl).split(":")[0];
  byKind[kind] = (byKind[kind] ?? 0) + 1;
}

console.log("[coverage-ledger] ----------------------------------------");
console.log(`  userTasks:        ${userTasks.length}`);
console.log(`  covered:          ${covered.length} (${pct}%)`);
console.log(`  by kind:          ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(", ") || "—"}`);
console.log(`  serviceTasks:     ${serviceTasks.length} (system/automated — engine-backed)`);
console.log("[coverage-ledger] ----------------------------------------");

if (gaps.length > 0) {
  console.log(`  ${gaps.length} UNCOVERED userTask(s):`);
  const byD = {};
  for (const g of gaps) (byD[g.diagram] = byD[g.diagram] || []).push(g);
  for (const [d, ns] of Object.entries(byD)) {
    console.log(`    ${d}:`);
    for (const n of ns) console.log(`      ${n.id} — ${(n.name || "").slice(0, 56)}`);
  }
}

if (strict && gaps.length > 0) {
  console.error(`[coverage-ledger] STRICT FAIL — ${gaps.length} userTasks uncovered`);
  process.exit(1);
}
console.log(`[coverage-ledger] ${gaps.length === 0 ? "OK — every userTask is covered" : `${pct}% covered (${gaps.length} remaining)`}`);
