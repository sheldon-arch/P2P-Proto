"use client";

import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { KpiCard } from "@/components/patterns/KpiCard";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { GradeBadge } from "@/components/patterns/StatusBadge";
import { SpendChart } from "@/components/patterns/SpendChart";
import { Button } from "@/components/ui/button";
import { useComputed, useList } from "@/queries/hooks";

type Kpis = { otifPercent: number; perfectOrderPercent: number; dpoDays: number; spend12mo: number };
type Scorecard = Record<string, unknown>;

const scorecardColumns: Column<Scorecard>[] = [
  { key: "supplierCode", header: "Supplier", mono: true },
  { key: "period", header: "Period" },
  { key: "otifTwoFactor", header: "OTIF", mono: true, className: "text-right",
    render: (r) => (r.otifTwoFactor != null ? `${r.otifTwoFactor}%` : "—") },
  { key: "perfectOrderFourFactor", header: "Perfect Order", mono: true, className: "text-right",
    render: (r) => (r.perfectOrderFourFactor != null ? `${r.perfectOrderFourFactor}%` : "—") },
  { key: "compositeScore", header: "Composite", mono: true, className: "text-right" },
  { key: "grade", header: "Grade", render: (r) => <GradeBadge grade={r.grade as string} /> },
];

export default function AnalyticsPage() {
  const { data: kpis } = useComputed<Kpis>("kpis");
  const { data: scorecards, isLoading, error } = useList<Scorecard>("scorecards");

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Portfolio KPIs and supplier scorecards"
        actions={
          <Button asChild variant="outline" data-testid="link-currency">
            <Link href="/analytics/currency">Currency conversion</Link>
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4" data-tour-id="analytics.kpis">
        <KpiCard label="OTIF (2-factor)" value={kpis ? `${kpis.otifPercent}%` : "—"} tone="success" />
        <KpiCard label="Perfect Order (4-factor)" value={kpis ? `${kpis.perfectOrderPercent}%` : "—"} />
        <KpiCard label="DPO" value={kpis ? `${kpis.dpoDays}d` : "—"} />
        <KpiCard label="Spend (12mo)" value={kpis ? `$${(kpis.spend12mo / 1_000_000).toFixed(0)}M` : "—"} />
      </div>
      <div className="mb-6">
        <SpendChart />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Supplier scorecards</h2>
      <DataTable<Scorecard>
        columns={scorecardColumns}
        rows={scorecards}
        isLoading={isLoading}
        error={error}
        getRowId={(r) => String(r.supplierId ?? r.supplierCode)}
        emptyMessage="No scorecards available."
      />
    </div>
  );
}
