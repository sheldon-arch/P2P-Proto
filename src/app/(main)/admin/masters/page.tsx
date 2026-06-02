"use client";

/**
 * Admin: Master data & base currency (diagram 01 — ChooseBase, SeedMasters).
 * Shows the base/reporting currency and the master-data sets, each maintainable
 * individually or via bulk import (all-or-nothing).
 */
import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useList } from "@/queries/hooks";
import { BASE_CURRENCY } from "@/lib/domain/constants";

const MASTERS: { entity: string; label: string }[] = [
  { entity: "currencies", label: "Currencies" },
  { entity: "uoms", label: "Units of measure" },
  { entity: "taxCodes", label: "Tax codes" },
  { entity: "warehouses", label: "Warehouses" },
  { entity: "paymentTerms", label: "Payment terms" },
  { entity: "projects", label: "Projects / cost centers" },
];

function MasterCard({ entity, label }: { entity: string; label: string }) {
  const { data } = useList(entity);
  return (
    <Card data-testid={`master-${entity}`}>
      <CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent>
        <span className="font-mono text-2xl font-semibold">{data?.length ?? "—"}</span>
        <span className="ml-1 text-xs text-muted-foreground">records</span>
      </CardContent>
    </Card>
  );
}

export default function AdminMasters() {
  return (
    <div>
      <PageHeader
        title="Master Data"
        description={`Base / reporting currency: ${BASE_CURRENCY}`}
        actions={
          <Button asChild data-testid="masters-bulk-import">
            <Link href="/admin/bulk-import"><Upload className="mr-1 h-4 w-4" /> Bulk import</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {MASTERS.map((m) => <MasterCard key={m.entity} {...m} />)}
      </div>
    </div>
  );
}
