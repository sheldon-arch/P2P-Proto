"use client";

/**
 * Invoice three-way match workbench — the AP-controls marquee. Shows the match
 * type (2-way vs 3-way), the exception (if any) and which role it routes to, the
 * duplicate-invoice hold, and a resolution control (accept / adjust /
 * credit-note / debit-note / reject). Resolving clears the exception (or rejects
 * the invoice). Demonstrates that AP is a real control, not a rubber stamp.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RuleBanner } from "./RuleBanner";
import { StatusBadge } from "./StatusBadge";
import { useUpdate } from "@/queries/hooks";
import { useSession } from "@/lib/session/SessionProvider";

type Invoice = Record<string, unknown>;

const EXCEPTION_LABEL: Record<string, string> = {
  "price-variance": "Price variance",
  "qty-over": "Quantity over",
  "qty-under": "Quantity under",
  "missing-GR": "Missing goods receipt",
  "duplicate-invoice": "Duplicate invoice",
  "tax-mismatch": "Tax mismatch",
};

// Which role each exception routes to (from diagram 09).
const ROUTE_LABEL: Record<string, string> = {
  "price-variance": "Buyer",
  "qty-over": "Receiving",
  "qty-under": "Receiving",
  "missing-GR": "Receiving",
  "duplicate-invoice": "Finance Maker",
  "tax-mismatch": "Tax / Compliance",
};

const RESOLUTIONS = ["accept", "adjust", "credit-note", "debit-note", "reject"];

export function InvoiceMatch({ invoice }: { invoice: Invoice }) {
  const { user } = useSession();
  const update = useUpdate("invoices");
  const [resolution, setResolution] = useState("accept");

  const matchType = invoice.matchType as string;
  const matchStatus = invoice.matchStatus as string;
  const exception = invoice.exceptionType as string | undefined;
  const onHold = invoice.onHold === true;
  const isException = matchStatus === "exception" || matchStatus === "EXCEPTION";

  async function resolve() {
    const next = resolution === "reject" ? "REJECTED" : "MATCHED";
    try {
      await update.mutateAsync({
        id: String(invoice.id),
        body: {
          matchStatus: next.toLowerCase(),
          onHold: false,
          resolution,
          resolvedBy: user.id,
        },
      });
      toast.success(resolution === "reject" ? "Invoice rejected" : `Resolved (${resolution})`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mt-6" data-testid="invoice-match" data-tour-id="invoice.match">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>{matchType === "THREE_WAY" ? "Three-way match" : "Two-way match"} (PO {matchType === "THREE_WAY" ? "+ GRN " : ""}+ invoice)</span>
            <StatusBadge status={matchStatus} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {matchType === "THREE_WAY"
              ? "Invoice reconciled against the PO and the GRN-accepted quantity (incl. tax)."
              : "Service/indirect invoice reconciled against the PO and milestone acceptance."}
          </p>

          {onHold && (
            <RuleBanner tone="danger" title="Duplicate invoice: held, no payable created" testId="duplicate-hold">
              This invoice matches an existing supplier + invoice number + amount. It is held and no
              payable is posted until reviewed. Resolve as reject (confirmed duplicate) or accept
              (false positive, with an override note).
            </RuleBanner>
          )}

          {isException && exception && (
            <RuleBanner tone="warning" title={`Exception: ${EXCEPTION_LABEL[exception] ?? exception}`} testId="match-exception">
              Routed to <span className="font-medium">{ROUTE_LABEL[exception] ?? "the owner"}</span> for
              resolution. The exception type determines the resolver.
            </RuleBanner>
          )}

          {isException && (
            <div className="flex items-end gap-2 pt-2" data-testid="resolve-controls">
              <div>
                <label className="text-xs uppercase tracking-wide text-muted-foreground">Resolution</label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="mt-1 w-48" data-testid="resolution-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={resolve} disabled={update.isPending} data-testid="resolve-btn">
                Resolve exception
              </Button>
            </div>
          )}

          {!isException && matchStatus !== "rejected" && (
            <RuleBanner tone="success" title="Matched: cleared to pay" testId="matched-banner">
              Within tolerance on price, quantity, and amount (incl. tax). GR/IR relieved; payable
              posted to the creditor ledger.
            </RuleBanner>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
