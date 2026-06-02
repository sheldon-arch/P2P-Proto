"use client";

/**
 * Landed-cost comparison matrix — the marquee sourcing screen. Shows each
 * supplier's quote side by side, breaks landed cost into unit + freight + duty,
 * highlights the lowest-landed winner, flags the cheapest-unit-but-not-winner
 * (the flip) and the >5% price spike, and lets the buyer award (with a
 * justification required when not picking the lowest-landed quote).
 */
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import { useList, useUpdate } from "@/queries/hooks";
import { rankQuotes, rankingFlipped, type Quote } from "@/lib/services/landed-cost";
import { RuleBanner } from "./RuleBanner";
import { cn } from "@/lib/utils";

const money = (v: number, ccy?: string) =>
  `${ccy ? ccy + " " : ""}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function CompareMatrix({ rfqId }: { rfqId: string }) {
  const { data: quotesRaw, isLoading } = useList<Quote & Record<string, unknown>>("quotes");
  const { data: suppliers } = useList<Record<string, unknown>>("suppliers");
  const updateRfq = useUpdate("rfqs");
  const [awarded, setAwarded] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  if (isLoading) return null;
  const quotes = (quotesRaw ?? []).filter((q) => q.rfqId === rfqId);
  if (quotes.length === 0) {
    return <RuleBanner tone="info" title="No quotes yet" testId="no-quotes">Quotes appear here once suppliers respond to the RFQ.</RuleBanner>;
  }

  const ranked = rankQuotes(quotes);
  const flipped = rankingFlipped(ranked);
  const supplierName = (id: string) =>
    String((suppliers ?? []).find((s) => s.id === id)?.name ?? id);

  async function award(quoteId: string, supplierId: string, isLowestLanded: boolean) {
    if (!isLowestLanded && justification.trim() === "") {
      toast.error("A justification is required to award a non-lowest-landed quote.");
      return;
    }
    try {
      await updateRfq.mutateAsync({
        id: rfqId,
        body: { status: "awarded", awardedQuoteId: quoteId, awardedSupplierId: supplierId, awardJustification: justification },
      });
      setAwarded(quoteId);
      toast.success(`Awarded to ${supplierName(supplierId)}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mt-6" data-testid="compare-matrix">
      {flipped && (
        <RuleBanner tone="info" title="Landed-cost reorders the recommendation" testId="landed-flip-banner" tourId="sourcing.compare">
          The cheapest unit price is not the lowest landed cost. Once freight and duty are
          included, the recommended award changes. Rank below is by landed cost.
        </RuleBanner>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Landed-cost comparison</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${ranked.length}, minmax(220px, 1fr))` }}>
            {ranked.map((q) => (
              <div
                key={q.id}
                data-testid="quote-card"
                className={cn(
                  "rounded-lg border p-4",
                  q.isLowestLanded && "border-status-success bg-status-success-bg",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{supplierName(q.supplierId)}</span>
                  {q.isLowestLanded && (
                    <Badge variant="outline" className="border-status-success/40 bg-status-success-bg text-status-success" data-testid="winner-badge">
                      <Trophy className="mr-1 h-3 w-3" /> Lowest landed
                    </Badge>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <Row label="Unit price" value={money(q.unitPrice, q.currency)} hint={q.isCheapestUnit ? "cheapest unit" : undefined} />
                  <Row label="Freight / unit" value={money(q.freightPerUnit ?? 0, q.currency)} />
                  <Row label="Duty / unit" value={money(q.dutyPerUnit ?? 0, q.currency)} />
                  <div className="my-2 border-t" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Landed / unit</span>
                    <span className="font-mono text-lg font-semibold">{money(q.landed)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Incoterm {q.incoterm} · {q.paymentTerms}</div>
                </div>

                {q.priceSpikeFlag && (
                  <div className="mt-2 flex items-center gap-1 rounded bg-status-warning-bg px-2 py-1 text-xs text-status-warning" data-testid="spike-flag">
                    <AlertTriangle className="h-3 w-3" /> Price spike +{q.priceSpikePct}% vs last purchase
                  </div>
                )}
                {q.isCheapestUnit && !q.isLowestLanded && (
                  <div className="mt-2 flex items-center gap-1 rounded bg-status-info-bg px-2 py-1 text-xs text-status-info" data-testid="flip-flag">
                    <TrendingUp className="h-3 w-3" /> Cheapest unit, but freight + duty raise the landed cost
                  </div>
                )}

                <Button
                  className="mt-3 w-full"
                  size="sm"
                  variant={q.isLowestLanded ? "default" : "outline"}
                  disabled={!!awarded || updateRfq.isPending}
                  onClick={() => award(q.id, q.supplierId, q.isLowestLanded)}
                  data-testid={`award-${q.supplierId}`}
                >
                  {awarded === q.id ? "Awarded" : "Award"}
                </Button>
              </div>
            ))}
          </div>

          {!awarded && (
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Justification (required to award a non-lowest-landed quote)
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="e.g. faster lead time, strategic dual-sourcing…"
                className="mt-1 text-sm"
                data-testid="award-justification"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">
        {label}
        {hint && <span className="ml-1 text-xs text-status-info">({hint})</span>}
      </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
