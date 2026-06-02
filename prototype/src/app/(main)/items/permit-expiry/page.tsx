"use client";

/**
 * e11 — Permit & document expiry tracking. Regulated items carry permits /
 * certificates with expiry dates and remaining quantities. The system alerts
 * ~1 week before expiry (or when quantity runs low), and a PO for that item is
 * blocked until a valid permit is attached.
 */
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { StatusBadge } from "@/components/patterns/StatusBadge";

type Row = Record<string, unknown>;
const ROWS: Row[] = [
  { id: "PMT-101", item: "Natural color additive E160c", permit: "Import permit", expiry: "2026-06-05", remaining: "200 kg", state: "expiring" },
  { id: "PMT-102", item: "Preservative blend", permit: "Food-safety cert", expiry: "2026-09-30", remaining: "1,500 kg", state: "valid" },
  { id: "PMT-103", item: "Flavor concentrate (import)", permit: "Ministry permit", expiry: "2026-06-02", remaining: "0 kg", state: "expired" },
];
const columns: Column<Row>[] = [
  { key: "id", header: "Permit", mono: true },
  { key: "item", header: "Item" },
  { key: "permit", header: "Document" },
  { key: "expiry", header: "Expiry", mono: true },
  { key: "remaining", header: "Qty remaining", mono: true, className: "text-right" },
  { key: "state", header: "Status", render: (r) => <StatusBadge status={r.state === "valid" ? "ONBOARDED" : r.state === "expired" ? "SUSPENDED" : "ON_HOLD"} /> },
];

export default function PermitExpiry() {
  return (
    <div>
      <PageHeader title="Permit & Document Expiry" description="Expiry and quantity tracking for regulated items (e11)" />
      <RuleBanner tone="warning" title="Expiry alerts: PO blocked without a valid permit" testId="permit-expiry-rule">
        Permits and certificates are tracked by expiry date and remaining quantity. An alert fires
        about a week before expiry (or when quantity runs low). A purchase order for the item is
        blocked until a valid permit is attached.
      </RuleBanner>
      <div className="mt-4">
        <DataTable<Row> columns={columns} rows={ROWS} getRowId={(r) => String(r.id)} />
      </div>
    </div>
  );
}
