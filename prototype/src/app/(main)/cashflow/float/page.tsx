"use client";

/**
 * e08 — Cash purchase & float reimbursement. A local on-the-spot buy runs with
 * NO PO: it deducts from the buyer's cash float and a cash-purchase GRN is
 * raised with no PO reference. When the float falls to about a third of its
 * ceiling, a maker/checker-approved reimbursement tops it back up.
 */
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuleBanner } from "@/components/patterns/RuleBanner";

const CEILING = 300;

export default function CashFloat() {
  const [balance, setBalance] = useState(300);
  const [amount, setAmount] = useState("45");

  const lowThreshold = CEILING / 3;
  const isLow = balance <= lowThreshold;

  function buy() {
    const v = Number(amount) || 0;
    if (v > balance) { toast.error("Insufficient float balance."); return; }
    setBalance((b) => Math.round((b - v) * 100) / 100);
    toast.success(`Cash buy $${v} — cash GRN raised (no PO)`);
  }
  function reimburse() {
    setBalance(CEILING);
    toast.success("Float reimbursed to ceiling (maker/checker approved)");
  }

  return (
    <div>
      <PageHeader title="Cash Float" description="Cash purchase & float reimbursement (e08)" />

      <Card className="max-w-md">
        <CardHeader><CardTitle className="text-base">Float balance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Current balance</span>
            <span className="font-mono text-2xl font-semibold" data-testid="float-balance">${balance.toFixed(2)}</span>
          </div>
          <div className="text-xs text-muted-foreground">Ceiling ${CEILING} · low at ${lowThreshold.toFixed(0)}</div>
          <div className="flex items-end gap-2 pt-2">
            <div>
              <Label className="text-xs">Cash buy amount</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-32 font-mono" data-testid="cash-amount" />
            </div>
            <Button onClick={buy} data-testid="cash-buy">Buy on float (no PO)</Button>
          </div>
        </CardContent>
      </Card>

      {isLow && (
        <RuleBanner tone="warning" title="Float low — reimbursement needed" testId="float-low">
          The float is at or below a third of its ceiling. A maker/checker-approved reimbursement
          tops it back to ${CEILING}.
          <div className="mt-2">
            <Button size="sm" onClick={reimburse} data-testid="float-reimburse">Reimburse float</Button>
          </div>
        </RuleBanner>
      )}
    </div>
  );
}
