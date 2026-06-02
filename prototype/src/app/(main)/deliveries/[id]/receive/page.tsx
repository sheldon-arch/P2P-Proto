"use client";

/**
 * Goods receipt against a PO. Demonstrates two rules inline:
 *  - Quantity tolerance (e03): if received qty is over ordered but within the
 *    +/-10% band, the PO qty is amended before the GRN (a +7% carton delivery).
 *    Over the band is blocked.
 *  - COA hard gate (regulated/quality-sensitive items): the GRN is blocked until
 *    the Certificate of Analysis is on file.
 * Posting creates a GRN record and opens an inspection downstream.
 */
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { RuleBanner } from "@/components/patterns/RuleBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOne, useCreate } from "@/queries/hooks";
import { QTY_TOLERANCE_PERCENT } from "@/lib/domain/constants";

export default function ReceivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: poId } = use(params);
  const router = useRouter();
  const { data: po } = useOne<Record<string, unknown>>("purchaseOrders", poId);
  const createGrn = useCreate("grns");

  const ordered = Number(po?.contractQty ?? po?.orderedQty ?? 0) || 1000;
  const [received, setReceived] = useState(String(ordered));
  const [coaOnFile, setCoaOnFile] = useState(false);

  // Treat any PLANT-2 / import PO as quality-sensitive (COA-gated) for the demo.
  const coaRequired = (po?.incoterm as string) !== "FOB"; // imports (CIF/EXW) are gated; local FOB cartons are not

  const recv = Number(received) || 0;
  const overPct = useMemo(() => ((recv - ordered) / ordered) * 100, [recv, ordered]);
  const overTolerance = overPct > QTY_TOLERANCE_PERCENT;
  const withinAmend = overPct > 0 && overPct <= QTY_TOLERANCE_PERCENT;
  const coaBlocked = coaRequired && !coaOnFile;

  async function post() {
    if (overTolerance) {
      toast.error(`Received qty is ${overPct.toFixed(1)}% over: exceeds the ±${QTY_TOLERANCE_PERCENT}% tolerance.`);
      return;
    }
    if (coaBlocked) {
      toast.error("COA must be on file before goods receipt (regulated item).");
      return;
    }
    try {
      const grn = await createGrn.mutateAsync({
        poId,
        ticketId: po?.ticketId,
        grnDate: "2026-06-01",
        receivedQty: recv,
        orderedQty: ordered,
        toleranceAmended: withinAmend,
        status: "COMPLETED",
        note: withinAmend ? `PO qty amended +${overPct.toFixed(1)}% (within tolerance)` : "Full receipt",
      });
      toast.success("Goods receipt posted");
      router.push(`/deliveries/${(grn as { id: string }).id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader title={`Receive against ${poId}`} description="Record goods receipt; tolerance and COA rules apply" />

      <Card data-tour-id="receive.qty">
        <CardHeader><CardTitle className="text-base">Receipt</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Ordered qty</Label>
              <Input value={ordered} readOnly className="font-mono" />
            </div>
            <div>
              <Label className="text-xs">Received qty</Label>
              <Input value={received} onChange={(e) => setReceived(e.target.value)} inputMode="decimal" data-testid="received-qty" className="font-mono" />
            </div>
          </div>

          {coaRequired && (
            <div className="flex items-center gap-2">
              <Checkbox id="coa" checked={coaOnFile} onCheckedChange={(c) => setCoaOnFile(c === true)} data-testid="coa-checkbox" />
              <Label htmlFor="coa" className="text-sm">Certificate of Analysis (COA) on file</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {withinAmend && (
        <RuleBanner tone="info" title={`Quantity tolerance: +${overPct.toFixed(1)}% within ±${QTY_TOLERANCE_PERCENT}%`} testId="tolerance-amend-banner">
          The received quantity is over ordered but within tolerance. The PO quantity is amended to
          the received amount before the goods receipt is posted.
        </RuleBanner>
      )}
      {overTolerance && (
        <RuleBanner tone="danger" title={`Over tolerance: +${overPct.toFixed(1)}% exceeds ±${QTY_TOLERANCE_PERCENT}%`} testId="over-tolerance-banner">
          Receipt is blocked. A PO amendment and re-approval are required before this quantity can be received.
        </RuleBanner>
      )}
      {coaBlocked && (
        <RuleBanner tone="warning" title="COA hard gate" testId="coa-gate-banner">
          This is a quality-sensitive item. The goods receipt is blocked until the Certificate of
          Analysis is on file.
        </RuleBanner>
      )}

      <div className="mt-6 flex gap-2">
        <Button onClick={post} disabled={createGrn.isPending} data-testid="post-grn">Post goods receipt</Button>
        <Button variant="outline" onClick={() => router.push("/deliveries")}>Cancel</Button>
      </div>
    </div>
  );
}
