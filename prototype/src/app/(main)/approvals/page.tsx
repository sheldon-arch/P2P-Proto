"use client";

import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import type { Column } from "@/components/patterns/DataTable";

type Req = Record<string, unknown>;
// Approval queue: requisitions in flight (INITIATION) needing approval.
const columns: Column<Req>[] = [
  { key: "identifier", header: "Requisition", mono: true, render: (r) => String(r.identifier ?? r.id) },
  { key: "category", header: "Category" },
  { key: "priority", header: "Priority" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "totalAmountInBase", header: "Value (USD)", mono: true, className: "text-right",
    render: (r) => (r.totalAmountInBase ? `$${Number(r.totalAmountInBase).toLocaleString()}` : "—") },
];

export default function ApprovalsPage() {
  return (
    <ListPage<Req>
      title="Approval Queue"
      description="Requisitions awaiting your decision (segregation-of-duties enforced)"
      entity="tickets"
      columns={columns}
      params={{ stage: "INITIATION" }}
      detailBase="/requisitions"
      getRowId={(r) => String(r.id ?? r.identifier)}
      emptyMessage="Nothing awaiting approval."
    />
  );
}
