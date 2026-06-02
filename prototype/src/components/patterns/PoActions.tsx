"use client";

/**
 * PO-specific action area: shows the budget impact of issuing, an override
 * toggle (required when the PO value exceeds the linked budget's available),
 * and the generic ActionPanel (issue/acknowledge/amend/close) wired with the
 * override in its payload. Demonstrates the budget HARD commit at PO issue.
 */
import { useState } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ActionPanel } from "./ActionPanel";
import { RuleBanner } from "./RuleBanner";
import { useOne } from "@/queries/hooks";
import { useFieldVisibility } from "@/lib/rbac/useFieldVisibility";

const val = (po: Record<string, unknown>) =>
  Number(po.poValueInBase ?? po.value ?? po.poValue ?? 0);

export function PoActions({ po }: { po: Record<string, unknown> }) {
  const [override, setOverride] = useState(false);
  const budgetId = po.budgetId as string | undefined;
  const { data: budget } = useOne<Record<string, unknown>>("budgets", budgetId);
  const { hidden } = useFieldVisibility();

  const poValue = val(po);
  const available = budget ? Number(budget.availableAmount) : undefined;
  const overBudget = available != null && poValue > available;
  const isDraft = po.status === "DRAFT";
  // Commercial-field wall (A17): the budget-impact panel exposes PO value and
  // budget figures, so it is hidden from roles denied commercial visibility.
  const showBudgetImpact = !hidden("PurchaseOrder", "value");

  const isFreightForwarder = po.poType === "freight-forwarder";

  return (
    <div>
      {isFreightForwarder && (
        <RuleBanner tone="info" title="Freight-forwarder PO (buyer-arranged incoterm)" testId="ff-po-banner">
          The awarded incoterm ({String(po.incoterm ?? "EXW/FOB")}) is buyer-arranged, so this parallel
          purchase order is raised to the freight forwarder to cover freight, insurance, and customs
          clearing. A seller-arranged incoterm (CIF or CFR) would not need one.
          {po.linkedPoId ? ` Linked to supplier PO ${String(po.linkedPoId)}.` : ""}
        </RuleBanner>
      )}
      {isDraft && budget && showBudgetImpact && (
        <Card className="mt-6" data-tour-id="po.budget-impact">
          <CardHeader><CardTitle className="text-base">Budget impact (hard commit at issue)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">PO value</span><span className="font-mono">${poValue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Budget available</span><span className="font-mono">${available?.toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">After commit</span><span className="font-mono">${((available ?? 0) - poValue).toLocaleString()}</span></div>
            {overBudget && (
              <div className="pt-2">
                <RuleBanner tone="danger" title="PO value exceeds available budget" testId="po-over-budget">
                  Issuing will be blocked unless a budget override is approved.
                </RuleBanner>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox id="po-override" checked={override} onCheckedChange={(c) => setOverride(c === true)} data-testid="po-override" />
                  <Label htmlFor="po-override" className="text-sm">Approve budget override (logged)</Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <ActionPanel entity="purchaseOrders" id={String(po.id)} extraPayload={{ budgetOverride: override }} />
      {(po.status === "ACKNOWLEDGED" || po.status === "ISSUED") && (
        <div className="mt-4">
          <Button asChild variant="outline" data-testid="receive-link">
            <Link href={`/deliveries/${String(po.id)}/receive`}>
              <Truck className="mr-1 h-4 w-4" /> Receive goods against this PO
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
