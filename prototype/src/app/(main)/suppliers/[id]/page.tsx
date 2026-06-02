"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { GradeBadge } from "@/components/patterns/StatusBadge";
import { ActionPanel } from "@/components/patterns/ActionPanel";
import { SupplierScorecard } from "@/components/patterns/SupplierScorecard";

export default function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="suppliers"
      id={id}
      backTo="/suppliers"
      title={(r) => String(r.name ?? r.id)}
      statusKey="status"
      fields={[
        { key: "code", label: "Code", mono: true },
        { key: "classification", label: "Classification" },
        { key: "purchaseType", label: "Purchase Type" },
        { key: "currency", label: "Currency" },
        { key: "supplierGroup", label: "Group" },
        { key: "paymentTerms", label: "Payment Terms" },
        { key: "grade", label: "Scorecard Grade", render: (r) => <GradeBadge grade={r.grade as string} /> },
        { key: "avlScopeOfApproval", label: "AVL Scope" },
      ]}
    >
      {(row) => (
        <>
          <SupplierScorecard supplierId={String(row.id)} />
          <ActionPanel entity="suppliers" id={String(row.id)} extraPayload={{ reason: "Manual action (demo)" }} />
        </>
      )}
    </DetailPage>
  );
}
