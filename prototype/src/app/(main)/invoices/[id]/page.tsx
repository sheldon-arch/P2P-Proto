"use client";

import { use } from "react";
import { DetailPage } from "@/components/patterns/DetailPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { InvoiceMatch } from "@/components/patterns/InvoiceMatch";
import { useFieldVisibility } from "@/lib/rbac/useFieldVisibility";

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hidden } = useFieldVisibility();
  // Commercial-field wall (A17): hide the invoice amount for roles denied
  // commercial visibility (Quality), client-side on top of the server strip.
  const fields = [
    { key: "supplierId", label: "Supplier", mono: true },
    { key: "invoiceDate", label: "Invoice Date", mono: true },
    { key: "matchType", label: "Match Type" },
    { key: "exceptionType", label: "Exception", render: (r: Record<string, unknown>) => (r.exceptionType ? <StatusBadge status="EXCEPTION" /> : "—") },
    { key: "routedTo", label: "Routed To" },
    ...(!hidden("Invoice", "amount")
      ? [{
          key: "amount", label: "Amount", mono: true,
          render: (r: Record<string, unknown>) =>
            r.amount ? `${r.currency ?? ""} ${Number(r.amount).toLocaleString()}` : "—",
        }]
      : []),
  ];
  return (
    <DetailPage
      entity="invoices"
      id={id}
      backTo="/invoices"
      title={(r) => `Invoice ${r.invoiceNumber ?? r.id}`}
      statusKey="matchStatus"
      fields={fields}
    >
      {(row) => <InvoiceMatch invoice={row} />}
    </DetailPage>
  );
}
