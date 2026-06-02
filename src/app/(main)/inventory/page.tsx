"use client";

import { ListPage } from "@/components/patterns/ListPage";
import type { Column } from "@/components/patterns/DataTable";

type Inv = Record<string, unknown>;
const columns: Column<Inv>[] = [
  { key: "itemId", header: "Item", mono: true },
  { key: "warehouseCode", header: "Warehouse", mono: true },
  { key: "stockOnHand", header: "On Hand", mono: true, className: "text-right" },
  { key: "allocated", header: "Allocated", mono: true, className: "text-right" },
  { key: "available", header: "Available", mono: true, className: "text-right" },
  { key: "lastMovementAt", header: "Last Movement", mono: true },
];

export default function InventoryPage() {
  return (
    <ListPage<Inv>
      title="Inventory Reorder Worklist"
      description="Stock on hand by item and warehouse; reorder-point replenishment"
      entity="inventory"
      columns={columns}
      getRowId={(r) => String(r.id ?? `${r.itemId}@${r.warehouseCode}`)}
      emptyMessage="No inventory records."
    />
  );
}
