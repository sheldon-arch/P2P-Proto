"use client";

import { PageHeader } from "@/components/patterns/PageHeader";
import { KpiCard } from "@/components/patterns/KpiCard";
import { useComputed } from "@/queries/hooks";
import { useSession } from "@/lib/session/SessionProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Kpis = {
  otifPercent: number;
  perfectOrderPercent: number;
  dpoDays: number;
  spend12mo: number;
  grades: Record<string, number>;
  openExceptions: number;
};

export default function DashboardPage() {
  const { user } = useSession();
  const { data } = useComputed<Kpis>("kpis");

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={`${user.title} · Harvest Foods procure-to-pay`}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" data-tour-id="dashboard.kpis">
        <KpiCard label="OTIF (2-factor)" value={data ? `${data.otifPercent}%` : "—"} sub="On-time AND in-full" tone="success" />
        <KpiCard label="Perfect Order (4-factor)" value={data ? `${data.perfectOrderPercent}%` : "—"} sub="+ damage-free, docs-accurate" />
        <KpiCard label="DPO" value={data ? `${data.dpoDays}d` : "—"} sub="Days payable outstanding" />
        <KpiCard label="Spend (12mo)" value={data ? `$${(data.spend12mo / 1_000_000).toFixed(0)}M` : "—"} sub="Under management" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier grades</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6">
            <div><span className="font-mono text-2xl font-semibold text-status-success">{data?.grades.A ?? 0}</span><div className="text-xs text-muted-foreground">Grade A</div></div>
            <div><span className="font-mono text-2xl font-semibold text-status-warning">{data?.grades.B ?? 0}</span><div className="text-xs text-muted-foreground">Grade B</div></div>
            <div><span className="font-mono text-2xl font-semibold text-status-danger">{data?.grades.C ?? 0}</span><div className="text-xs text-muted-foreground">Grade C</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open invoice exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-2xl font-semibold text-status-warning">{data?.openExceptions ?? 0}</span>
            <div className="text-xs text-muted-foreground">Awaiting resolution (price/qty/tax/duplicate)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
