"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { PoActions } from "@/components/patterns/PoActions";

export default function PoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="purchaseOrders"
      id={id}
      backTo="/purchase-orders"
      title={(r) => `PO ${r.id}`}
      statusKey="status"
      fields={[
        { key: "supplierId", label: "Supplier", mono: true },
        { key: "poDate", label: "PO Date", mono: true },
        { key: "incoterm", label: "Incoterm" },
        { key: "currency", label: "Currency" },
        { key: "contractQty", label: "Contract Qty", mono: true },
        { key: "value", label: "Value", mono: true,
          render: (r) => (r.value ? `${r.currency ?? ""} ${Number(r.value).toLocaleString()}` : "—") },
      ]}
    >
      {(row) => <PoActions po={row} />}
    </DetailPage>
  );
}
