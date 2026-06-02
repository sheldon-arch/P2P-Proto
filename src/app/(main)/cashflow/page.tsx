"use client";

import Link from "next/link";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Installment = Record<string, unknown>;
// Cashflow view: the same installments, framed as outflows by due date.
const columns: Column<Installment>[] = [
  { key: "date", header: "Due Date", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "description", header: "Description" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "amount", header: "Outflow", mono: true, className: "text-right",
    render: (r) => (r.amount ? `$${Number(r.amount).toLocaleString()}` : "—") },
];

export default function CashflowPage() {
  return (
    <ListPage<Installment>
      title="Cash Flow"
      description="Upcoming payment outflows and cash-float purchases"
      entity="installments"
      columns={columns}
      getRowId={(r) => String(r.id)}
      emptyMessage="No upcoming outflows."
      actions={
        <Button asChild variant="outline" data-testid="link-cash-float">
          <Link href="/cashflow/float">Cash float</Link>
        </Button>
      }
    />
  );
}
