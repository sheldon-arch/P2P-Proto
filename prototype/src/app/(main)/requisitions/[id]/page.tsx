"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { ApprovalPanel } from "@/components/patterns/ApprovalPanel";
import { RequisitionLines } from "@/components/patterns/RequisitionLines";
import { BudgetBanner } from "@/components/patterns/BudgetBanner";

export default function RequisitionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="tickets"
      id={id}
      backTo="/requisitions"
      title={(r) => String(r.identifier ?? r.id)}
      statusKey="status"
      fields={[
        { key: "stage", label: "Stage", render: (r) => <StatusBadge status={r.stage as string} /> },
        { key: "category", label: "Category" },
        { key: "directOrIndirect", label: "Direct/Indirect" },
        { key: "purchaseType", label: "Purchase Type" },
        { key: "priority", label: "Priority" },
        { key: "currency", label: "Currency" },
        { key: "totalAmountInBase", label: "Value (USD)", mono: true,
          render: (r) => (r.totalAmountInBase ? `$${Number(r.totalAmountInBase).toLocaleString()}` : "—") },
        { key: "requesterId", label: "Requester", mono: true },
        { key: "supplierId", label: "Supplier", mono: true },
      ]}
    >
      {(row) => (
        <>
          <BudgetBanner ticket={row} />
          <RequisitionLines ticketId={String(row.id ?? row.identifier)} />
          <ApprovalPanel recordId={String(row.id ?? row.identifier)} requesterId={row.requesterId as string} />
        </>
      )}
    </DetailPage>
  );
}
