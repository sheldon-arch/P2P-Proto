"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";

export default function DeliveryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="grns"
      id={id}
      backTo="/deliveries"
      title={(r) => `GRN ${r.id}`}
      statusKey="status"
      fields={[
        { key: "poId", label: "Purchase Order", mono: true },
        { key: "ticketId", label: "Requisition", mono: true },
        { key: "grnDate", label: "GRN Date", mono: true },
        { key: "receivedQty", label: "Received Qty", mono: true },
        { key: "note", label: "Note" },
      ]}
    />
  );
}
