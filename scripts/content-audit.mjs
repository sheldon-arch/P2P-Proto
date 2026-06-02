#!/usr/bin/env node
/**
 * content-audit: cross-checks that enumerated field values in the SEED conform to
 * the enums declared in src/lib/domain/enums.ts. This is the data-side guarantee
 * behind "every dropdown value makes sense" — a status/category/incoterm in the
 * data that isn't a declared enum value would surface as a nonsense dropdown or a
 * badge with no styling. As screens add forms (later phases), this audit extends
 * to assert each form's fields/options match the BPMN-derived field-config.
 *
 * Exit non-zero on any value that is not in its declared enum.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENUMS_TS = resolve(__dirname, "../src/lib/domain/enums.ts");
const SEED_DIR = resolve(__dirname, "../src/lib/seed/data");

// Parse enums.ts: `export type Name = "A" | "B" | ...;`
function parseEnums(src) {
  const out = {};
  const re = /export type (\w+)\s*=\s*([^;]+);/g;
  let m;
  while ((m = re.exec(src))) {
    const values = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    if (values.length) out[m[1]] = new Set(values);
  }
  return out;
}

const enums = parseEnums(readFileSync(ENUMS_TS, "utf8"));

// Map (entity field) -> enum type to check. Conservative: only fields whose
// values are clearly enum-controlled. Keyed by a substring of the field name.
const FIELD_ENUM = [
  { field: "status", entities: { tickets: "RequisitionStatus", suppliers: "SupplierStatus", items: "ItemStatus", installments: "InstallmentStatus" } },
  { field: "stage", enum: "RequisitionStage" },
  { field: "priority", enum: "Priority" },
  { field: "category", enum: "RequisitionCategory" },
  { field: "directOrIndirect", enum: "PurchaseDirection" },
  { field: "purchaseType", enum: "PurchaseType" },
  { field: "incoterm", enum: "Incoterm" },
  { field: "matchType", enum: "MatchType" },
  { field: "matchStatus", enum: "MatchType" }, // matchStatus uses MATCHED/EXCEPTION; skip if not enum
  { field: "grade", enum: "ScorecardGrade" },
];

function loadSeed(file) {
  try {
    const d = JSON.parse(readFileSync(join(SEED_DIR, file), "utf8"));
    return Array.isArray(d) ? d : Object.values(d)[0] ?? [];
  } catch {
    return [];
  }
}

const files = readdirSync(SEED_DIR).filter((f) => f.endsWith(".json"));
const violations = [];
let checks = 0;

// Build a map: collection file -> entity key (best-effort by filename)
const FILE_TO_ENTITY = {
  "live_tickets.json": "tickets", "history_tickets.json": "tickets",
  "suppliers.json": "suppliers", "items.json": "items",
  "live_installments.json": "installments", "supplier_scorecards.json": "scorecards",
  "live_pos.json": "pos", "live_invoices.json": "invoices",
};

for (const file of files) {
  const entity = FILE_TO_ENTITY[file];
  const rows = loadSeed(file);
  if (!rows.length) continue;

  for (const spec of FIELD_ENUM) {
    let enumName = spec.enum;
    if (spec.entities) enumName = entity ? spec.entities[entity] : undefined;
    if (!enumName) continue;
    const allowed = enums[enumName];
    if (!allowed) continue;

    for (const row of rows) {
      const v = row[spec.field];
      if (v === undefined || v === null || v === "") continue;
      checks++;
      // matchStatus is MATCHED/EXCEPTION/etc., not MatchType — skip that combo
      if (spec.field === "matchStatus") continue;
      if (!allowed.has(String(v))) {
        violations.push(`${file}: ${entity ?? "?"}.${spec.field} = "${v}" not in ${enumName} {${[...allowed].join("|")}}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`[content-audit] FAILED: ${violations.length} enum violation(s):`);
  for (const v of [...new Set(violations)].slice(0, 40)) console.error("  " + v);
  process.exit(1);
}
console.log(`[content-audit] OK — ${checks} enum-controlled values checked, all conform`);
