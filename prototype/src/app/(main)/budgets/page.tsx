"use client";

import { ListPage } from "@/components/patterns/ListPage";
import type { Column } from "@/components/patterns/DataTable";

type Budget = Record<string, unknown>;
const money = (v: unknown) => (v != null ? `$${Number(v).toLocaleString()}` : "—");

const columns: Column<Budget>[] = [
  { key: "projectId", header: "Cost Center / Project", mono: true },
  { key: "period", header: "Period" },
  { key: "amount", header: "Budget", mono: true, className: "text-right", render: (r) => money(r.amount) },
  { key: "committedAmount", header: "Committed", mono: true, className: "text-right", render: (r) => money(r.committedAmount) },
  { key: "actualAmount", header: "Actual", mono: true, className: "text-right", render: (r) => money(r.actualAmount) },
  { key: "availableAmount", header: "Available", mono: true, className: "text-right", render: (r) => money(r.availableAmount) },
];

export default function BudgetsPage() {
  return (
    <ListPage<Budget>
      title="Budgets"
      description="Commitment-vs-actual by cost center and period"
      entity="budgets"
      columns={columns}
      getRowId={(r) => String(r.id)}
      emptyMessage="No budgets configured."
    />
  );
}
