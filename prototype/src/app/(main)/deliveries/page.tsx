"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Grn = Record<string, unknown>;
const columns: Column<Grn>[] = [
  { key: "id", header: "GRN", mono: true },
  { key: "poId", header: "PO", mono: true },
  { key: "grnDate", header: "Date", mono: true },
  { key: "receivedQty", header: "Received Qty", mono: true, className: "text-right" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
];

export default function DeliveriesPage() {
  return (
    <ListPage<Grn>
      title="Deliveries & Goods Receipt"
      description="Inbound deliveries, partial blocks, and goods receipt notes"
      entity="grns"
      columns={columns}
      detailBase="/deliveries"
      getRowId={(r) => String(r.id)}
      emptyMessage="No deliveries recorded."
      actions={
        <Button asChild variant="outline" data-testid="link-tracking">
          <Link href="/deliveries/tracking"><Truck className="mr-1 h-4 w-4" /> Inbound tracking</Link>
        </Button>
      }
    />
  );
}
