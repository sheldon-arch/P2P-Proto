"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { PoActions } from "@/components/patterns/PoActions";
import { useFieldVisibility } from "@/lib/rbac/useFieldVisibility";

export default function PoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hidden } = useFieldVisibility();
  // Commercial-field wall (A17): hide PO value for roles denied commercial
  // visibility (Quality), client-side defense-in-depth on top of the server strip.
  const fields = [
    { key: "supplierId", label: "Supplier", mono: true },
    { key: "poDate", label: "PO Date", mono: true },
    { key: "incoterm", label: "Incoterm" },
    { key: "currency", label: "Currency" },
    { key: "poType", label: "PO Type", render: (r: Record<string, unknown>) => (r.poType === "freight-forwarder" ? "Freight forwarder" : "Supplier") },
    ...(true ? [{ key: "linkedPoId", label: "Linked PO", mono: true, render: (r: Record<string, unknown>) => (r.linkedPoId ? String(r.linkedPoId) : "—") }] : []),
    { key: "contractQty", label: "Contract Qty", mono: true },
    ...(!hidden("PurchaseOrder", "value")
      ? [{
          key: "value", label: "Value", mono: true,
          render: (r: Record<string, unknown>) =>
            r.value ? `${r.currency ?? ""} ${Number(r.value).toLocaleString()}` : "—",
        }]
      : []),
  ];
  return (
    <DetailPage
      entity="purchaseOrders"
      id={id}
      backTo="/purchase-orders"
      title={(r) => `PO ${r.id}`}
      statusKey="status"
      fields={fields}
    >
      {(row) => <PoActions po={row} />}
    </DetailPage>
  );
}
