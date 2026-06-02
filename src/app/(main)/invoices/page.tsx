"use client";

import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import type { Column } from "@/components/patterns/DataTable";

type Invoice = Record<string, unknown>;
const columns: Column<Invoice>[] = [
  { key: "invoiceNumber", header: "Invoice", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "invoiceDate", header: "Date", mono: true },
  { key: "matchType", header: "Match" },
  { key: "matchStatus", header: "Match Status", render: (r) => <StatusBadge status={r.matchStatus as string} /> },
  { key: "exceptionType", header: "Exception", render: (r) => (r.exceptionType ? <StatusBadge status="EXCEPTION" /> : "—") },
  { key: "amount", header: "Amount", mono: true, className: "text-right",
    render: (r) => (r.amount ? `${r.currency ?? ""} ${Number(r.amount).toLocaleString()}` : "—") },
];

export default function InvoicesPage() {
  return (
    <ListPage<Invoice>
      title="Invoices"
      description="Supplier invoices and two-/three-way match status"
      entity="invoices"
      columns={columns}
      detailBase="/invoices"
      getRowId={(r) => String(r.id)}
      emptyMessage="No invoices captured."
    />
  );
}
