"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { InvoiceMatch } from "@/components/patterns/InvoiceMatch";

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DetailPage
      entity="invoices"
      id={id}
      backTo="/invoices"
      title={(r) => `Invoice ${r.invoiceNumber ?? r.id}`}
      statusKey="matchStatus"
      fields={[
        { key: "supplierId", label: "Supplier", mono: true },
        { key: "invoiceDate", label: "Invoice Date", mono: true },
        { key: "matchType", label: "Match Type" },
        { key: "exceptionType", label: "Exception", render: (r) => (r.exceptionType ? <StatusBadge status="EXCEPTION" /> : "—") },
        { key: "routedTo", label: "Routed To" },
        { key: "amount", label: "Amount", mono: true,
          render: (r) => (r.amount ? `${r.currency ?? ""} ${Number(r.amount).toLocaleString()}` : "—") },
      ]}
    >
      {(row) => <InvoiceMatch invoice={row} />}
    </DetailPage>
  );
}
