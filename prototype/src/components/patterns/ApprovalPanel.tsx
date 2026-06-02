"use client";

/**
 * Approval chain panel for a requisition. Shows each stage's completion status
 * and offers Approve / Return actions on the current (IN_PROGRESS or
 * AWAITING_APPROVAL) stage. Actions go through useTransition -> the engine,
 * which enforces SoD (no self-approval), the auto-approve limit, and next-stage
 * routing. The UI only offers what is legal; the engine is the source of truth.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, RotateCcw, Circle, Clock } from "lucide-react";
import { useList, useTransition } from "@/queries/hooks";
import { useSession } from "@/lib/session/SessionProvider";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

type Completion = Record<string, unknown>;

const STAGE_LABEL: Record<string, string> = {
  REQ_DEPARTMENT: "Req Department",
  PROCUREMENT: "Procurement",
  FINANCE: "Finance",
  MANAGEMENT: "Management",
};

export function ApprovalPanel({ recordId, requesterId }: { recordId: string; requesterId?: string }) {
  const { user } = useSession();
  const { data: all } = useList<Completion>("approvalCompletions");
  const transition = useTransition("approvalCompletions");
  const [note, setNote] = useState("");

  const chain = (all ?? [])
    .filter((c) => c.recordId === recordId)
    .sort((a, b) => Number(a.stageOrder) - Number(b.stageOrder));

  if (chain.length === 0) return null;

  const current = chain.find(
    (c) => c.completionStatus === "IN_PROGRESS" || c.completionStatus === "AWAITING_APPROVAL",
  );

  // SoD: the active persona must not be the requester to approve.
  const isOwnRecord = requesterId != null && user.id === requesterId;
  const canApprove = user.roleId === "approver" || user.roleId === "management" || user.roleId === "administrator";

  async function act(action: string, payload?: Record<string, unknown>) {
    if (!current) return;
    const id = current.completionId as string;
    try {
      // For approve, first ensure it's awaiting (requestApproval moves IN_PROGRESS->AWAITING)
      if (action === "approve" && current.completionStatus === "IN_PROGRESS") {
        await transition.mutateAsync({ id, action: "requestApproval", payload: {} });
      }
      await transition.mutateAsync({ id, action, payload });
      toast.success(action === "approve" ? "Stage approved" : "Returned for revision");
      setNote("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card className="mt-6" data-testid="approval-panel" data-tour-id="req.approval-panel">
      <CardHeader>
        <CardTitle className="text-base">Approval chain</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {chain.map((c) => {
            const status = c.completionStatus as string;
            const isCurrent = c === current;
            const Icon =
              status === "APPROVED" ? CheckCircle2
                : status === "AWAITING_APPROVAL" ? Clock
                  : status === "IN_PROGRESS" ? Clock : Circle;
            return (
              <li
                key={c.completionId as string}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2",
                  isCurrent && "border-primary bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", status === "APPROVED" ? "text-status-success" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{STAGE_LABEL[c.stage as string] ?? c.stage}</span>
                  {c.isAutoApproved ? <StatusBadge status="APPROVED" /> : <StatusBadge status={status} />}
                  {c.isAutoApproved ? <span className="text-xs text-muted-foreground">auto-approved (within limit)</span> : null}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  limit ${Number(c.approverLimit ?? 0).toLocaleString()}
                </span>
              </li>
            );
          })}
        </ol>

        {current && (
          <div className="mt-4 border-t pt-4" data-testid="approval-actions">
            {isOwnRecord ? (
              <p className="text-sm text-status-warning">
                Segregation of duties: you raised this requisition and cannot approve it. Switch to an approver persona.
              </p>
            ) : !canApprove ? (
              <p className="text-sm text-muted-foreground">
                Your role cannot act on this approval stage.
              </p>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Note (required to return for revision)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  data-testid="approval-note"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => act("approve")}
                    disabled={transition.isPending}
                    data-testid="approve-btn"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve stage
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => act("returnForRevision", { note })}
                    disabled={transition.isPending}
                    data-testid="return-btn"
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Return for revision
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
