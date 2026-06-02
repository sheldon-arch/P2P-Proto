"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Ret = Record<string, unknown>;
const columns: Column<Ret>[] = [
  { key: "rmaNumber", header: "RMA", mono: true },
  { key: "sourceOrderId", header: "Source Order", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "reason", header: "Reason" },
  { key: "authorizationStatus", header: "Authorization", render: (r) => <StatusBadge status={r.authorizationStatus as string} /> },
  { key: "closureStatus", header: "Closure", render: (r) => <StatusBadge status={r.closureStatus as string} /> },
];

export default function ReturnsPage() {
  return (
    <ListPage<Ret>
      title="Returns & RMA"
      description="Return authorizations, disposition, and credit/debit notes"
      entity="returns"
      columns={columns}
      detailBase="/returns"
      getRowId={(r) => String(r.id ?? r.rmaNumber)}
      emptyMessage="No returns in progress."
      actions={
        <Button asChild data-testid="new-return">
          <Link href="/returns/new"><Plus className="mr-1 h-4 w-4" /> Initiate Return</Link>
        </Button>
      }
    />
  );
}
