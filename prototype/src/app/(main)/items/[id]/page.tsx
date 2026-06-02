"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { ActionPanel } from "@/components/patterns/ActionPanel";

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="items"
      id={id}
      backTo="/items"
      title={(r) => String(r.description ?? r.id)}
      statusKey="status"
      fields={[
        { key: "code", label: "Code", mono: true },
        { key: "type", label: "Type" },
        { key: "segment", label: "Segment" },
        { key: "subSegment", label: "Sub-segment" },
        { key: "department", label: "Department" },
        { key: "stockUom", label: "Stock UoM" },
        { key: "purchaseUom", label: "Purchase UoM" },
        { key: "standardSupplierId", label: "Standard Supplier", mono: true },
      ]}
    >
      {(row) => <ActionPanel entity="items" id={String(row.id)} extraPayload={{ reason: "Manual action (demo)" }} />}
    </DetailPage>
  );
}
