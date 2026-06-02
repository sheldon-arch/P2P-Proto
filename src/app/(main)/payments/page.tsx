"use client";

import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import type { Column } from "@/components/patterns/DataTable";

type Installment = Record<string, unknown>;
const columns: Column<Installment>[] = [
  { key: "id", header: "Installment", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "description", header: "Description" },
  { key: "date", header: "Due", mono: true },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "amount", header: "Amount", mono: true, className: "text-right",
    render: (r) => (r.amount ? `$${Number(r.amount).toLocaleString()}` : "—") },
];

export default function PaymentsPage() {
  return (
    <ListPage<Installment>
      title="Payments"
      description="Payment schedules and installments (maker/checker)"
      entity="installments"
      columns={columns}
      detailBase="/payments"
      getRowId={(r) => String(r.id)}
      emptyMessage="No payments scheduled."
    />
  );
}
