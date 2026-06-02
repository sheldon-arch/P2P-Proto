"use client";

/**
 * Supplier portal home (for Synthex / SUP-0001). The "two-sided system" view:
 * open RFQs to quote, POs to acknowledge, and a link to submit invoices.
 * Reads the same store the internal app uses (one source of truth).
 */
import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import { useList } from "@/queries/hooks";

const SUPPLIER_ID = "SUP-0001";
type Row = Record<string, unknown>;

const rfqCols: Column<Row>[] = [
  { key: "reference", header: "RFQ", mono: true },
  { key: "deadline", header: "Deadline", mono: true },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
];
const poCols: Column<Row>[] = [
  { key: "id", header: "PO", mono: true },
  { key: "poDate", header: "Date", mono: true },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
];

export default function PortalHome() {
  const { data: rfqs } = useList<Row>("rfqs");
  const { data: pos } = useList<Row>("purchaseOrders");
  const myRfqs = (rfqs ?? []).filter((r) => (r.invitedSupplierIds as string[] | undefined)?.includes(SUPPLIER_ID));
  const myPos = (pos ?? []).filter((p) => p.supplierId === SUPPLIER_ID);

  return (
    <div>
      <PageHeader title="Welcome, Synthex Food Ingredients" description="Your open requests from Harvest Foods" />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">RFQs to quote</h2>
      <DataTable<Row>
        columns={[...rfqCols, { key: "_a", header: "", render: (r) => (
          <Button asChild size="sm" variant="outline" data-testid={`portal-quote-${r.id}`}>
            <Link href={`/portal/rfq/${r.id}`}>Submit quote</Link>
          </Button>
        ) }]}
        rows={myRfqs}
        getRowId={(r) => String(r.id)}
        emptyMessage="No open RFQs."
      />

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Purchase orders</h2>
      <DataTable<Row>
        columns={[...poCols, { key: "_a", header: "", render: (r) => (
          <Button asChild size="sm" variant="outline" data-testid={`portal-po-${r.id}`}>
            <Link href={`/portal/po/${r.id}`}>View / acknowledge</Link>
          </Button>
        ) }]}
        rows={myPos}
        getRowId={(r) => String(r.id)}
        emptyMessage="No purchase orders."
      />
    </div>
  );
}
