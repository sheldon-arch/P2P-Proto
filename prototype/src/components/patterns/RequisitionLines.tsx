"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "./DataTable";
import { useList } from "@/queries/hooks";

type Line = Record<string, unknown>;

// Goods lines: item / qty / UoM / HS / est price / need date.
const goodsColumns: Column<Line>[] = [
  { key: "itemId", header: "Item", mono: true },
  { key: "quantity", header: "Qty", mono: true, className: "text-right" },
  { key: "unitOfMeasure", header: "UoM" },
  { key: "hsCode", header: "HS Code", mono: true, render: (r) => (r.hsCode ? String(r.hsCode) : "—") },
  { key: "unitPrice", header: "Est. Unit Price", mono: true, className: "text-right",
    render: (r) => (r.unitPrice != null ? `$${Number(r.unitPrice).toLocaleString(undefined, { maximumFractionDigits: 3 })}` : "—") },
  { key: "needDate", header: "Need Date", mono: true },
];

// Service lines: scope of work, not goods fields (02-requisition.md).
const serviceColumns: Column<Line>[] = [
  { key: "serviceName", header: "Service", render: (r) => (r.serviceName ? String(r.serviceName) : "—") },
  { key: "itemReferenceNumber", header: "Reference", mono: true, render: (r) => (r.itemReferenceNumber ? String(r.itemReferenceNumber) : "—") },
  { key: "contractDuration", header: "Contract Duration", render: (r) => (r.contractDuration ? String(r.contractDuration) : "—") },
  { key: "needDate", header: "Need Date", mono: true, render: (r) => (r.needDate ? String(r.needDate) : "—") },
];

/** Line items for a requisition. Service lines show scope-of-work columns;
 *  goods lines show item/qty/HS/price. Import lines surface HS code. */
export function RequisitionLines({ ticketId }: { ticketId: string }) {
  const { data, isLoading, error } = useList<Line>("requisitionLines");
  const lines = (data ?? []).filter((l) => l.ticketId === ticketId);
  const isService = lines.some((l) => l.serviceName != null && String(l.serviceName).trim() !== "");
  const columns = isService ? serviceColumns : goodsColumns;

  return (
    <Card className="mt-6" data-tour-id="req.lines">
      <CardHeader>
        <CardTitle className="text-base">Line items</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable<Line>
          columns={columns}
          rows={lines}
          isLoading={isLoading}
          error={error}
          getRowId={(r) => String(r.id)}
          emptyMessage="No line items."
        />
      </CardContent>
    </Card>
  );
}
