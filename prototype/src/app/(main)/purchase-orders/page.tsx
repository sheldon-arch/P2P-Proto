"use client";

import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import type { Column } from "@/components/patterns/DataTable";

type PO = Record<string, unknown>;
const columns: Column<PO>[] = [
  { key: "id", header: "PO", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "poDate", header: "Date", mono: true },
  { key: "incoterm", header: "Incoterm" },
  { key: "poType", header: "Type", render: (r) => (r.poType === "freight-forwarder" ? "Freight forwarder" : "Supplier") },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "value", header: "Value", mono: true, className: "text-right",
    render: (r) => (r.value ? `${r.currency ?? ""} ${Number(r.value).toLocaleString()}` : "—") },
];

export default function PurchaseOrdersPage() {
  return (
    <ListPage<PO>
      title="Purchase Orders"
      description="Issued and acknowledged purchase orders"
      entity="purchaseOrders"
      columns={columns}
      detailBase="/purchase-orders"
      getRowId={(r) => String(r.id)}
      emptyMessage="No purchase orders."
    />
  );
}
