"use client";

import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge } from "@/components/patterns/StatusBadge";
import type { Column } from "@/components/patterns/DataTable";

type Ncr = Record<string, unknown>;
const columns: Column<Ncr>[] = [
  { key: "id", header: "NCR", mono: true },
  { key: "supplierId", header: "Supplier", mono: true },
  { key: "itemId", header: "Item", mono: true },
  { key: "percentNonConformance", header: "% Non-conf.", mono: true, className: "text-right",
    render: (r) => (r.percentNonConformance != null ? `${r.percentNonConformance}%` : "—") },
  { key: "disposition", header: "Disposition" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
];

export default function QualityPage() {
  return (
    <ListPage<Ncr>
      title="Quality"
      description="Incoming inspections, non-conformance reports, and CAPA"
      entity="ncrs"
      columns={columns}
      detailBase="/quality/ncr"
      getRowId={(r) => String(r.id)}
      emptyMessage="No open quality items."
    />
  );
}
