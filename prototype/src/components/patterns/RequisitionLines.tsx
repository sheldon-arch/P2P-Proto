"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "./DataTable";
import { useList } from "@/queries/hooks";

type Line = Record<string, unknown>;

const columns: Column<Line>[] = [
  { key: "itemId", header: "Item", mono: true },
  { key: "quantity", header: "Qty", mono: true, className: "text-right" },
  { key: "unitOfMeasure", header: "UoM" },
  { key: "hsCode", header: "HS Code", mono: true, render: (r) => (r.hsCode ? String(r.hsCode) : "—") },
  { key: "unitPrice", header: "Est. Unit Price", mono: true, className: "text-right",
    render: (r) => (r.unitPrice != null ? `$${Number(r.unitPrice).toLocaleString(undefined, { maximumFractionDigits: 3 })}` : "—") },
  { key: "needDate", header: "Need Date", mono: true },
];

/** Line items for a requisition. Import lines surface HS code (dynamic field). */
export function RequisitionLines({ ticketId }: { ticketId: string }) {
  const { data, isLoading, error } = useList<Line>("requisitionLines");
  const lines = (data ?? []).filter((l) => l.ticketId === ticketId);

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
