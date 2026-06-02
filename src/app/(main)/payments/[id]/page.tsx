"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { PaymentActions } from "@/components/patterns/PaymentActions";

export default function PaymentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="installments"
      id={id}
      backTo="/payments"
      title={(r) => `Installment ${r.id}`}
      statusKey="status"
      fields={[
        { key: "supplierId", label: "Supplier", mono: true },
        { key: "description", label: "Description" },
        { key: "date", label: "Due Date", mono: true },
        { key: "amount", label: "Amount", mono: true,
          render: (r) => (r.amount ? `$${Number(r.amount).toLocaleString()}` : "—") },
        { key: "approvedAmount", label: "Approved", mono: true,
          render: (r) => (r.approvedAmount != null ? `$${Number(r.approvedAmount).toLocaleString()}` : "—") },
      ]}
    >
      {(row) => <PaymentActions installment={row} />}
    </DetailPage>
  );
}
