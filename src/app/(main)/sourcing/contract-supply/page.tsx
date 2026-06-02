"use client";

/**
 * e09 — Contract / constant supply. A pre-priced constant-supply arrangement
 * runs with NO requisition, NO RFQ, and NO PO: the supplier delivers against the
 * contract and submits an invoice in PO format; a "delivered" flag skips inbound
 * tracking. Demonstrates the invoice-driven path for framework/constant supply.
 */
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { StatusBadge } from "@/components/patterns/StatusBadge";

type Row = Record<string, unknown>;
const ROWS: Row[] = [
  { id: "CS-001", item: "Corrugated shipping cases", supplier: "PackRight Cartons Co", price: "$0.62 / case", delivered: "Delivered", invoice: "INV-CS-221" },
  { id: "CS-002", item: "Stretch wrap film", supplier: "ClearMold HDPE Industries", price: "$1.85 / roll", delivered: "Delivered", invoice: "INV-CS-222" },
  { id: "CS-003", item: "Pallet labels", supplier: "Harvest Labels", price: "$0.04 / label", delivered: "Pending", invoice: "—" },
];
const columns: Column<Row>[] = [
  { key: "id", header: "Contract", mono: true },
  { key: "item", header: "Item" },
  { key: "supplier", header: "Supplier" },
  { key: "price", header: "Pre-agreed price", mono: true },
  { key: "delivered", header: "Delivery", render: (r) => <StatusBadge status={r.delivered === "Delivered" ? "delivered" : "upcoming"} /> },
  { key: "invoice", header: "Invoice (PO format)", mono: true },
];

export default function ContractSupply() {
  return (
    <div>
      <PageHeader title="Contract / Constant Supply" description="Pre-priced supply with no requisition/RFQ/PO (e09)" />
      <RuleBanner tone="info" title="Invoice-driven, no requisition/RFQ/PO" testId="contract-supply-rule">
        Constant-supply items are pre-priced under a framework. The supplier delivers against the
        contract and invoices in PO format; the &quot;delivered&quot; flag skips inbound tracking. No
        requisition, RFQ, or PO is raised per delivery.
      </RuleBanner>
      <div className="mt-4">
        <DataTable<Row> columns={columns} rows={ROWS} getRowId={(r) => String(r.id)} />
      </div>
    </div>
  );
}
