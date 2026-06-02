"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { CompareMatrix } from "@/components/patterns/CompareMatrix";

export default function RfqDetail({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  return (
    <DetailPage
      entity="rfqs"
      id={reference}
      backTo="/sourcing"
      title={(r) => `RFQ ${r.reference ?? r.id}`}
      statusKey="status"
      fields={[
        { key: "ticketId", label: "Requisition", mono: true },
        { key: "sentDate", label: "Sent", mono: true },
        { key: "deadline", label: "Deadline", mono: true },
        { key: "invitedSupplierIds", label: "Suppliers Invited",
          render: (r) => String((r.invitedSupplierIds as unknown[] | undefined)?.length ?? 0) },
      ]}
    >
      {(row) => <CompareMatrix rfqId={String(row.id ?? row.reference)} />}
    </DetailPage>
  );
}
