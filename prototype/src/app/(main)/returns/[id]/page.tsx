"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { ActionPanel } from "@/components/patterns/ActionPanel";

export default function ReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="returns"
      id={id}
      backTo="/returns"
      title={(r) => `RMA ${r.rmaNumber ?? r.id}`}
      statusKey="closureStatus"
      fields={[
        { key: "sourceOrderId", label: "Source Order", mono: true },
        { key: "supplierId", label: "Supplier", mono: true },
        { key: "reason", label: "Reason" },
        { key: "productCondition", label: "Condition" },
        { key: "authorizationStatus", label: "Authorization", render: (r) => <StatusBadge status={r.authorizationStatus as string} /> },
        { key: "linkedNcrId", label: "Linked NCR", mono: true },
      ]}
    >
      {(row) => <ActionPanel entity="returns" id={String(row.id ?? row.rmaNumber)} extraPayload={{ rmaNumber: row.rmaNumber, reason: row.reason }} />}
    </DetailPage>
  );
}
