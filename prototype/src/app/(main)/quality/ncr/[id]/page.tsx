"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { ActionPanel } from "@/components/patterns/ActionPanel";
import { RuleBanner } from "@/components/patterns/RuleBanner";

export default function NcrDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="ncrs"
      id={id}
      backTo="/quality"
      title={(r) => `NCR ${r.id}`}
      statusKey="status"
      fields={[
        { key: "supplierId", label: "Supplier", mono: true },
        { key: "itemId", label: "Item", mono: true },
        { key: "deliveryNoteNumber", label: "Delivery Note", mono: true },
        { key: "percentNonConformance", label: "% Non-conformance", mono: true,
          render: (r) => (r.percentNonConformance != null ? `${r.percentNonConformance}%` : "—") },
        { key: "disposition", label: "Disposition" },
        { key: "raisedBy", label: "Raised By", mono: true },
        { key: "description", label: "Description" },
      ]}
    >
      {(row) => (
        <>
          <RuleBanner tone="warning" title="Quality non-conformance loop" testId="ncr-loop" tourId="ncr.actions">
            Disposition the non-conformance, raise a CAPA if systemic, then close the CAPA once
            effectiveness is verified. Closing a CAPA feeds the supplier re-evaluation and can
            move the supplier toward SUSPENDED.
          </RuleBanner>
          <ActionPanel entity="ncrs" id={String(row.id)} extraPayload={{ disposition: "return" }} />
        </>
      )}
    </DetailPage>
  );
}
