"use client";

/**
 * Payment installment actions — the maker/checker pipeline (SoD: maker != checker).
 *  - Finance Maker: approve (full, or partial which creates a remainder), then
 *    process (release) the payment.
 *  - Finance Checker: hold / reschedule.
 * The engine enforces the amount rules (full == agreed, partial < agreed) and
 * creates the remainder installment on partial approval.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuleBanner } from "./RuleBanner";
import { useTransition, useLegalActions } from "@/queries/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session/SessionProvider";

type Installment = Record<string, unknown>;

export function PaymentActions({ installment }: { installment: Installment }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const id = String(installment.id);
  const transition = useTransition("installments");
  const { data } = useLegalActions("installments", id);
  const agreed = Number(installment.agreedAmount ?? installment.amount ?? 0);
  const [amount, setAmount] = useState(String(agreed));

  const legal = new Set(data?.actions ?? []);
  const isMaker = user.roleId === "finance_maker" || user.roleId === "administrator";
  const isChecker = user.roleId === "finance_checker" || user.roleId === "administrator";

  async function run(action: string, payload?: Record<string, unknown>) {
    try {
      await transition.mutateAsync({ id, action, payload });
      await qc.invalidateQueries({ queryKey: ["installments", "actions", id] });
      toast.success(`${action} done`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const showApprove = legal.has("approve") && isMaker;
  const showProcess = legal.has("process") && isMaker;
  const showReschedule = legal.has("reschedule") && isChecker;

  if (!showApprove && !showProcess && !showReschedule) {
    return (
      <RuleBanner tone="info" title="Maker / checker pipeline" testId="maker-checker-info">
        Finance Maker approves and processes; Finance Checker holds or reschedules. Switch to the
        Finance Maker or Finance Checker persona to act (segregation of duties).
      </RuleBanner>
    );
  }

  return (
    <Card className="mt-6" data-testid="payment-actions">
      <CardHeader><CardTitle className="text-base">Payment actions (maker / checker)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {showApprove && (
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs">Approve amount (≤ agreed ${agreed.toLocaleString()})</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-48 font-mono" data-testid="approve-amount" />
            </div>
            <Button onClick={() => run("approve", { amount: Number(amount) })} disabled={transition.isPending} data-testid="installment-approve">
              Approve (maker)
            </Button>
            <span className="pb-2 text-xs text-muted-foreground">A partial amount creates a remainder installment.</span>
          </div>
        )}
        <div className="flex gap-2">
          {showProcess && (
            <Button onClick={() => run("process")} disabled={transition.isPending} data-testid="installment-process">
              Process payment (maker)
            </Button>
          )}
          {showReschedule && (
            <Button variant="outline" onClick={() => run("reschedule", { newDate: "2026-07-01", reason: "cash timing" })} disabled={transition.isPending} data-testid="installment-reschedule">
              Hold / reschedule (checker)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
