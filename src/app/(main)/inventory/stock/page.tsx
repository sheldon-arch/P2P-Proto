"use client";

/** All stock balances by item and warehouse (the full ledger view). */
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

export default function StockPage() {
  return (
    <ListPage<Inv>
      title="Stock Balances"
      description="Stock on hand, allocated, and available by item and warehouse"
      entity="inventory"
      columns={columns}
      getRowId={(r) => String(r.id ?? `${r.itemId}@${r.warehouseCode}`)}
      emptyMessage="No inventory records."
    />
  );
}
