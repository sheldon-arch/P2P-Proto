"use client";

import { RuleBanner } from "./RuleBanner";

type Ticket = Record<string, unknown>;
type Override = { approvedBy?: string; reason?: string; at?: string };

/**
 * Budget soft-check banner (e02). If the requisition was raised over the
 * available budget, show the warning and the logged override — the soft check
 * warns at intake; the hard commit happens at PO issue.
 */
export function BudgetBanner({ ticket }: { ticket: Ticket }) {
  const override = ticket.budgetOverride as Override | undefined;
  if (!override) return null;
  return (
    <RuleBanner tone="warning" title="Over available budget — soft check" testId="budget-over-banner" tourId="req.budget-banner">
      This requisition exceeds the cost center&apos;s available budget. The soft check warns at
      intake; the hard commitment is enforced at PO issue.
      {override.reason && (
        <div className="mt-1">
          <span className="font-medium">Override:</span> {override.reason}
          {override.approvedBy && <span className="text-muted-foreground"> — {override.approvedBy}</span>}
        </div>
      )}
    </RuleBanner>
  );
}
