"use client";

/**
 * Landed-cost comparison matrix — the marquee sourcing screen, now PER-LINE.
 * Quotes are grouped by requisition line; for each line the buyer picks a winning
 * supplier (defaulting to lowest landed cost). Awarding splits the selections
 * into ONE PO per distinct supplier (real multi-supplier sourcing). A
 * single-line RFQ behaves exactly as before (one group, one PO). Shows the
 * landed-cost flip and the price-spike flag per line; a justification is required
 * when any line is awarded to a non-lowest-landed supplier.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useList, useAwardRfq } from "@/queries/hooks";
import { rankQuotes, rankingFlipped, type Quote } from "@/lib/services/landed-cost";
import { RuleBanner } from "./RuleBanner";
import { cn } from "@/lib/utils";

const money = (v: number, ccy?: string) =>
  `${ccy ? ccy + " " : ""}${v.toLocaleString(undefined, { maximumFractionDigits: 3 })}`;

type Q = Quote & Record<string, unknown>;

export function CompareMatrix({ rfqId }: { rfqId: string }) {
  const router = useRouter();
  const { data: quotesRaw, isLoading } = useList<Q>("quotes");
  const { data: rfqs } = useList<Record<string, unknown>>("rfqs");
  const { data: suppliers } = useList<Record<string, unknown>>("suppliers");
  const award = useAwardRfq();
  const [picked, setPicked] = useState<Record<string, string>>({}); // lineId -> supplierId
  const [justification, setJustification] = useState("");
  const [awardedPoIds, setAwardedPoIds] = useState<string[] | null>(null);

  const rfq = (rfqs ?? []).find((r) => String(r.id) === rfqId);
  const supplierName = (id: string) => String((suppliers ?? []).find((s) => s.id === id)?.name ?? id);

  // group this RFQ's quotes by lineId (fall back to itemId for single-line RFQs)
  const lines = useMemo(() => {
    const qs = (quotesRaw ?? []).filter((q) => q.rfqId === rfqId);
    const groups = new Map<string, Q[]>();
    for (const q of qs) {
      const key = String(q.lineId ?? q.itemId ?? "line");
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(q);
    }
    return [...groups.entries()].map(([lineId, quotes]) => ({
      lineId,
      itemId: String(quotes[0].itemId ?? ""),
      ranked: rankQuotes(quotes),
    }));
  }, [quotesRaw, rfqId]);

  if (isLoading) return null;
  if (lines.length === 0) {
    return <RuleBanner tone="info" title="No quotes yet" testId="no-quotes">Quotes appear here once suppliers respond to the RFQ.</RuleBanner>;
  }

  const isMultiLine = lines.length > 1;
  const anyFlip = lines.some((l) => rankingFlipped(l.ranked));

  // default each line's pick to its lowest-landed supplier
  function supplierForLine(lineId: string): string {
    if (picked[lineId]) return picked[lineId];
    const line = lines.find((l) => l.lineId === lineId)!;
    return line.ranked.find((q) => q.isLowestLanded)?.supplierId ?? line.ranked[0].supplierId;
  }

  // is any selection a non-lowest-landed pick (requires justification)?
  const needsJustification = lines.some((l) => {
    const sel = supplierForLine(l.lineId);
    return !l.ranked.find((q) => q.supplierId === sel)?.isLowestLanded;
  });

  // distinct suppliers across selections (preview of how many POs will result)
  const distinctSuppliers = new Set(lines.map((l) => supplierForLine(l.lineId))).size;

  async function doAward() {
    if (needsJustification && justification.trim() === "") {
      toast.error("A justification is required to award a non-lowest-landed quote.");
      return;
    }
    const awards = lines.map((l) => {
      const sel = supplierForLine(l.lineId);
      const q = l.ranked.find((x) => x.supplierId === sel)!;
      // quantity from the matching RFQ line item (match by lineId, else by itemId
      // for single-line RFQs whose quotes carry only itemId)
      const rfqLines = (rfq?.lineItems as Array<Record<string, unknown>>) ?? [];
      const li = rfqLines.find((x) => x.lineId === l.lineId) ?? rfqLines.find((x) => x.itemId === l.itemId);
      return {
        lineId: String(li?.lineId ?? l.lineId), itemId: l.itemId,
        quantity: Number(li?.quantity ?? 1), uom: String(li?.uom ?? "EA"),
        supplierId: sel, unitPrice: q.landed, currency: q.currency,
      };
    });
    try {
      const res = await award.mutateAsync({ rfqId, awards, justification });
      setAwardedPoIds(res.poIds);
      toast.success(
        res.supplierCount > 1
          ? `Awarded across ${res.supplierCount} suppliers — ${res.poIds.length} POs created`
          : `Awarded — PO created`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mt-6" data-testid="compare-matrix">
      {anyFlip && (
        <RuleBanner tone="info" title="Landed-cost reorders the recommendation" testId="landed-flip-banner" tourId="sourcing.compare">
          The cheapest unit price is not the lowest landed cost. Once freight and duty are included,
          the recommended award changes. Each line is ranked by landed cost.
        </RuleBanner>
      )}
      {isMultiLine && (
        <RuleBanner tone="info" title="Multi-line RFQ — award per line" testId="multi-line-banner">
          This RFQ covers multiple lines. Pick the winning supplier per line; awarding creates one
          purchase order per distinct supplier. Current selection: {distinctSuppliers} supplier
          {distinctSuppliers > 1 ? "s" : ""} → {distinctSuppliers} PO{distinctSuppliers > 1 ? "s" : ""}.
        </RuleBanner>
      )}

      {awardedPoIds && (
        <RuleBanner tone="success" title={`Awarded — ${awardedPoIds.length} PO${awardedPoIds.length > 1 ? "s" : ""} created`} testId="award-result">
          {awardedPoIds.map((id) => (
            <Button key={id} variant="link" className="h-auto p-0 text-sm" data-testid={`go-po-${id}`} onClick={() => router.push(`/purchase-orders/${id}`)}>
              {id}
            </Button>
          ))}
        </RuleBanner>
      )}

      {lines.map((line) => {
        const sel = supplierForLine(line.lineId);
        return (
          <Card className="mt-4" key={line.lineId} data-testid={`compare-line-${line.lineId}`}>
            <CardHeader>
              <CardTitle className="text-base">
                {isMultiLine ? `Line ${line.itemId}` : "Landed-cost comparison"} — pick a supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${line.ranked.length}, minmax(220px, 1fr))` }}>
                {line.ranked.map((q) => {
                  const isSelected = sel === q.supplierId;
                  return (
                    <div
                      key={q.id}
                      data-testid="quote-card"
                      className={cn(
                        "rounded-lg border p-4",
                        q.isLowestLanded && "border-status-success bg-status-success-bg",
                        isSelected && "ring-2 ring-primary",
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
                        variant={isSelected ? "default" : "outline"}
                        disabled={!!awardedPoIds}
                        onClick={() => setPicked((p) => ({ ...p, [line.lineId]: q.supplierId }))}
                        data-testid={`pick-${line.lineId}-${q.supplierId}`}
                      >
                        {isSelected ? <><CheckCircle2 className="mr-1 h-4 w-4" /> Selected</> : "Select"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {!awardedPoIds && (
        <div className="mt-4">
          {needsJustification && (
            <>
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
            </>
          )}
          <Button className="mt-3" onClick={doAward} disabled={award.isPending} data-testid="award-submit">
            Award {isMultiLine ? `(${distinctSuppliers} PO${distinctSuppliers > 1 ? "s" : ""})` : ""}
          </Button>
        </div>
      )}
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
