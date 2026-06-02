"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeBadge } from "./StatusBadge";
import { useList } from "@/queries/hooks";

type Scorecard = Record<string, unknown>;

const pct = (v: unknown) => (v != null ? `${v}%` : "—");

/**
 * Supplier scorecard panel — the closed-loop payoff. Shows OTIF (two-factor)
 * vs perfect-order (four-factor) distinctly, the component scores, and the
 * current grade. Reflects quality events (an NCR/CAPA drops the grade), so the
 * Chapter 6 -> Chapter 8 ripple is visible on the supplier record.
 */
export function SupplierScorecard({ supplierId }: { supplierId: string }) {
  const { data } = useList<Scorecard>("scorecards");
  const cards = (data ?? [])
    .filter((s) => (s.supplierId ?? s.supplier) === supplierId)
    .sort((a, b) => String(b.period).localeCompare(String(a.period)));
  if (cards.length === 0) return null;
  const latest = cards[0];

  return (
    <Card className="mt-6" data-testid="supplier-scorecard">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Supplier scorecard · {String(latest.period)}</span>
          <GradeBadge grade={latest.grade as string} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="OTIF (2-factor)" value={pct(latest.otifTwoFactor)} />
          <Metric label="Perfect Order (4-factor)" value={pct(latest.perfectOrderFourFactor)} />
          <Metric label="Quality" value={pct(latest.qualityScore)} />
          <Metric label="Delivery" value={pct(latest.deliveryScore)} />
          <Metric label="Cost" value={pct(latest.costScore)} />
          <Metric label="Responsiveness" value={pct(latest.responsivenessScore)} />
          <Metric label="Composite" value={String(latest.compositeScore ?? "—")} />
          <Metric label="Compliance gate" value={latest.complianceGate ? "Pass" : "—"} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          OTIF is on-time AND in-full; perfect order adds damage-free AND documentation-accurate
          (always &le; OTIF). Repeated non-conformance lowers the grade and can suspend the supplier.
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-lg font-semibold">{value}</dd>
    </div>
  );
}
