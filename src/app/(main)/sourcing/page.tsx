"use client";

import Link from "next/link";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Rfq = Record<string, unknown>;
const columns: Column<Rfq>[] = [
  { key: "reference", header: "RFQ", mono: true },
  { key: "ticketId", header: "Requisition", mono: true },
  { key: "sentDate", header: "Sent", mono: true },
  { key: "deadline", header: "Deadline", mono: true },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "invitedSupplierIds", header: "Suppliers",
    render: (r) => String((r.invitedSupplierIds as unknown[] | undefined)?.length ?? 0) },
];

export default function SourcingPage() {
  return (
    <ListPage<Rfq>
      title="Sourcing"
      description="Requests for quotation and landed-cost comparison"
      entity="rfqs"
      columns={columns}
      detailBase="/sourcing/rfq"
      getRowId={(r) => String(r.id)}
      emptyMessage="No active RFQs."
      actions={
        <Button asChild variant="outline" data-testid="link-contract-supply">
          <Link href="/sourcing/contract-supply">Contract / constant supply</Link>
        </Button>
      }
    />
  );
}
