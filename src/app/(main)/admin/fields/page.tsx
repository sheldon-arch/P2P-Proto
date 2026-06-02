"use client";

/**
 * Admin: Dynamic field configuration (diagram 01 — Fields). Shows how fields are
 * configured per (stage x scope x purchaseType x category): which are mandatory,
 * which are auto, and conditional show/hide (e.g. HS code on import lines). This
 * is what makes the requisition/PO forms adapt to context.
 */
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";

type FieldCfg = Record<string, unknown>;
const FIELDS: FieldCfg[] = [
  { field: "hsCode", scope: "Line", condition: "purchaseType = Import", mandatory: "No", auto: "No" },
  { field: "incoterm", scope: "Header", condition: "purchaseType = Import", mandatory: "Yes", auto: "No" },
  { field: "identifier", scope: "Header", condition: "always", mandatory: "n/a", auto: "Yes (immutable)" },
  { field: "needDate", scope: "Line", condition: "always", mandatory: "Yes", auto: "No" },
  { field: "scopeOfWork", scope: "Header", condition: "poType = service/maintenance", mandatory: "Yes", auto: "No" },
  { field: "tolerance", scope: "Line", condition: "category = Items (materials)", mandatory: "No", auto: "No" },
];
const columns: Column<FieldCfg>[] = [
  { key: "field", header: "Field", mono: true },
  { key: "scope", header: "Scope" },
  { key: "condition", header: "Shown when" },
  { key: "mandatory", header: "Mandatory" },
  { key: "auto", header: "Auto" },
];

export default function AdminFields() {
  return (
    <div>
      <PageHeader title="Field Configuration" description="Per-stage, per-scope, per-purchase-type dynamic fields" />
      <RuleBanner tone="info" title="Forms adapt to context" testId="fields-info">
        Field visibility, mandatory status, and auto-population are configured per stage, scope,
        purchase type, and category. For example, an import line shows the HS code and the header
        requires an Incoterm; a service PO shows scope-of-work instead of quantity tolerance.
      </RuleBanner>
      <div className="mt-4">
        <DataTable<FieldCfg> columns={columns} rows={FIELDS} getRowId={(r) => String(r.field)} />
      </div>
    </div>
  );
}
