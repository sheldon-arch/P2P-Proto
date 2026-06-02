"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Req = Record<string, unknown>;
const columns: Column<Req>[] = [
  { key: "identifier", header: "Requisition", mono: true, render: (r) => String(r.identifier ?? r.id) },
  { key: "category", header: "Category" },
  { key: "purchaseType", header: "Type" },
  { key: "priority", header: "Priority" },
  { key: "stage", header: "Stage", render: (r) => <StatusBadge status={r.stage as string} /> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "totalAmountInBase", header: "Value (USD)", mono: true, className: "text-right",
    render: (r) => (r.totalAmountInBase ? `$${Number(r.totalAmountInBase).toLocaleString()}` : "—") },
];

export default function RequisitionsPage() {
  return (
    <ListPage<Req>
      title="Requisitions"
      description="Purchase requisitions across their lifecycle"
      entity="tickets"
      columns={columns}
      detailBase="/requisitions"
      getRowId={(r) => String(r.id ?? r.identifier)}
      emptyMessage="No requisitions yet."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" data-testid="link-auto-create"><Link href="/requisitions/auto-create">Auto-create item</Link></Button>
          <Button asChild data-testid="new-requisition"><Link href="/requisitions/new"><Plus className="mr-1 h-4 w-4" /> New Requisition</Link></Button>
        </div>
      }
    />
  );
}
