"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ListPage } from "@/components/patterns/ListPage";
import { StatusBadge, GradeBadge } from "@/components/patterns/StatusBadge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/patterns/DataTable";

type Supplier = Record<string, unknown>;
const columns: Column<Supplier>[] = [
  { key: "code", header: "Code", mono: true },
  { key: "name", header: "Supplier" },
  { key: "classification", header: "Class" },
  { key: "purchaseType", header: "Type" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as string} /> },
  { key: "grade", header: "Grade", render: (r) => <GradeBadge grade={r.grade as string} /> },
];

export default function SuppliersPage() {
  return (
    <ListPage<Supplier>
      title="Suppliers"
      description="Approved vendor list with qualification status and scorecard grade"
      entity="suppliers"
      columns={columns}
      detailBase="/suppliers"
      getRowId={(r) => String(r.id)}
      emptyMessage="No suppliers onboarded."
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline" data-testid="link-discover"><Link href="/suppliers/discover">Discover suppliers</Link></Button>
          <Button asChild data-testid="new-supplier"><Link href="/suppliers/new"><Plus className="mr-1 h-4 w-4" /> Onboard Supplier</Link></Button>
        </div>
      }
    />
  );
}
