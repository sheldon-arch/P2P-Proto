"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Item = Record<string, unknown>;
const columns: Column<Item>[] = [
  { key: "code", header: "Code", mono: true },
  { key: "description", header: "Item" },
  { key: "type", header: "Type" },
  { key: "segment", header: "Segment" },
  { key: "stockUom", header: "UoM" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
];

export default function ItemsPage() {
  return (
    <ListPage<Item>
      title="Items"
      description="Item master: raw materials, packaging, MRO, and services"
      entity="items"
      columns={columns}
      detailBase="/items"
      getRowId={(r) => String(r.id)}
      emptyMessage="No items in the master."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" data-testid="link-permit-expiry"><Link href="/items/permit-expiry">Permit expiry</Link></Button>
          <Button asChild variant="outline" data-testid="link-artwork"><Link href="/items/artwork">Artwork / NPD</Link></Button>
          <Button asChild data-testid="new-item"><Link href="/items/new"><Plus className="mr-1 h-4 w-4" /> Onboard Item</Link></Button>
        </div>
      }
    />
  );
}
