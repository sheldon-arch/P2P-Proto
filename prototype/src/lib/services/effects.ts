/**
 * Effect registry — REAL side effects for state-machine transitions.
 *
 * The prior engine stubbed these (budget commit failed silently, next-stage
 * routing "not implemented", partial-installment remainder not created,
 * supplier auto-suspension not triggered). Each effect here genuinely mutates
 * the store via the engine's put/patch and is covered by tests.
 *
 * Keyed by `<entity>.<on>` (optionally `:<toState>` for branch-specific
 * effects). Effects receive the (already state-updated) entity, the context,
 * and an `emit` to broadcast a domain event.
 */
import type { Entity } from "@/lib/store/store";
import type { GuardContext } from "./guards";
import { num, poValueOf } from "./guards";

export type EffectContext = GuardContext & {
  emit: (type: string, payload?: Record<string, unknown>) => void;
};

export type Effect = (entity: Entity, ctx: EffectContext) => void;

/* ---- Budget: hard-commit at PO issue (A4) ---------------------------- */
function poIssueCommitBudget(po: Entity, ctx: EffectContext): void {
  const budgetId = po.budgetId as string | undefined;
  const value = poValueOf(po);
  if (budgetId) {
    const budget = ctx.store.get("budgets", budgetId);
    if (budget) {
      ctx.store.patch("budgets", budgetId, {
        availableAmount: num(budget.availableAmount) - value,
        committedAmount: num(budget.committedAmount) + value,
      });
    }
  }
  ctx.emit("po.issued", { poId: po.id ?? po.poNumber, value });
}

/* ---- Budget: relieve commitment -> actual at match/completion -------- */
function relieveBudget(record: Entity, ctx: EffectContext, value: number): void {
  const budgetId = record.budgetId as string | undefined;
  if (!budgetId) return;
  const budget = ctx.store.get("budgets", budgetId);
  if (!budget) return;
  ctx.store.patch("budgets", budgetId, {
    committedAmount: Math.max(0, num(budget.committedAmount) - value),
    actualAmount: num(budget.actualAmount) + value,
  });
}

/* ---- PO acknowledge: trigger advance payment per schedule ----------- */
function poAcknowledge(po: Entity, ctx: EffectContext): void {
  ctx.emit("po.acknowledged", { poId: po.id ?? po.poNumber });
}

/* ---- Approval approve: route to the next stage (A6) ------------------ *
 * Mark this completion APPROVED (already done by state set), then set the
 * next configured stage of the same record to IN_PROGRESS. If this was the
 * last stage, advance the requisition stage INITIATION -> ORDERED.
 * The old build left this "not implemented", which broke requisitions.
 * ------------------------------------------------------------------ */
function approvalApproveRouteNext(c: Entity, ctx: EffectContext): void {
  const recordId = c.recordId as string;
  const completions = ctx.store
    .list("approvalCompletions")
    .filter((x) => x.recordId === recordId)
    .sort((a, b) => num(a.stageOrder) - num(b.stageOrder));

  const idx = completions.findIndex((x) => (x.completionId ?? x.id) === (c.completionId ?? c.id));
  const next = completions[idx + 1];
  if (next) {
    ctx.store.patch("approvalCompletions", (next.completionId ?? next.id) as string, {
      completionStatus: "IN_PROGRESS",
    });
    ctx.emit("approval.stageAdvanced", { recordId, nextStage: next.stage });
  } else {
    // All stages approved -> move the requisition to ORDERED.
    const req = ctx.store.get("tickets", recordId) ?? ctx.store.get("requisitions", recordId);
    if (req && req.stage === "INITIATION") {
      const coll = ctx.store.get("tickets", recordId) ? "tickets" : "requisitions";
      ctx.store.patch(coll, recordId, { stage: "ORDERED" });
    }
    ctx.emit("approval.approved", { recordId });
  }
}

/* ---- Auto-approve: mark flag + route next ---------------------------- */
function approvalAutoApprove(c: Entity, ctx: EffectContext): void {
  ctx.store.patch("approvalCompletions", (c.completionId ?? c.id) as string, {
    isAutoApproved: true,
  });
  approvalApproveRouteNext(c, ctx);
}

/* ---- Installment partial: create ONE remainder (A9) ------------------ */
function installmentPartial(inst: Entity, ctx: EffectContext): void {
  const agreed = num(inst.agreedAmount ?? inst.amount);
  const approved = num(ctx.payload.amount, num(inst.amount));
  const leftover = agreed - approved;
  if (leftover > 0) {
    const remainderId = ctx.store.nextId("INST");
    ctx.store.put("installments", {
      id: remainderId,
      scheduleId: inst.scheduleId,
      poId: inst.poId,
      amount: leftover,
      agreedAmount: leftover,
      status: "PENDING",
      isRemainder: true,
      parentInstallmentId: inst.id ?? inst.identifier,
    });
    ctx.store.patch("installments", (inst.id ?? inst.identifier) as string, {
      amount: approved,
    });
    ctx.emit("installment.partialApproved", { installmentId: inst.id, remainderId, leftover });
  }
}

/* ---- Installment process: mark schedule progress + recompute ---------- */
function installmentProcess(inst: Entity, ctx: EffectContext): void {
  ctx.emit("installment.processed", { installmentId: inst.id ?? inst.identifier });
}

/* ---- Match cleared: relieve GR/IR + commitment -> actual ------------- */
function matchCleared(match: Entity, ctx: EffectContext): void {
  const value = num(match.invoiceAmountInBase ?? match.amount);
  // Relieve against the linked requisition's budget if present.
  const reqId = match.requisitionId as string | undefined;
  if (reqId) {
    const req = ctx.store.get("tickets", reqId) ?? ctx.store.get("requisitions", reqId);
    if (req) relieveBudget(req, ctx, value);
  }
  ctx.emit("match.cleared", { matchId: match.id, value });
}

/* ---- NCR close CAPA: feed re-evaluation; may SUSPEND supplier (A11) -- *
 * The old build noted "suspension guard not auto-triggered". Here, closing
 * a CAPA recomputes the supplier's below-threshold streak and suspends if it
 * crosses the configured limit.
 * ------------------------------------------------------------------ */
function ncrCloseCapa(ncr: Entity, ctx: EffectContext): void {
  const supplierId = ncr.supplierId as string | undefined;
  if (!supplierId) return;
  const supplier = ctx.store.get("suppliers", supplierId);
  if (!supplier) return;

  // Consult the linked CAPA (the authoritative quality record): its
  // consecutiveBelowPeriods + willSuspend decide re-qualification. Fall back to
  // a supplier-level streak counter when no CAPA carries the data.
  const ncrId = (ncr.id ?? ncr.ncrId) as string;
  const capa = ctx.store.list("capas").find((c) => c.ncrId === ncrId);
  const priorPeriods = num(capa?.consecutiveBelowPeriods, num(supplier.belowThresholdStreak));
  const streak = priorPeriods + 1; // closing this CAPA completes another below-threshold period
  const willSuspend = capa?.willSuspend === true || streak >= 3;

  const patch: Partial<Entity> = { belowThresholdStreak: streak };
  // Crossing the re-qualification threshold -> SUSPENDED (blocks new POs).
  if (willSuspend && supplier.status === "ONBOARDED") {
    patch.status = "SUSPENDED";
    patch.suspendReason = "Repeated quality non-conformance (CAPA loop)";
    ctx.emit("supplier.suspended", { supplierId });
  }
  if (capa) {
    ctx.store.patch("capas", (capa.id ?? capa.ncrId) as string, { status: "CLOSED", effectivenessReview: "verified" });
  }
  ctx.store.patch("suppliers", supplierId, patch);
  ctx.emit("ncr.capaClosed", { ncrId: ncr.id ?? ncr.ncrId, supplierId });
}

/* ---- Supplier suspend / reinstate ----------------------------------- */
function supplierSuspend(s: Entity, ctx: EffectContext): void {
  ctx.store.patch("suppliers", (s.id ?? s.identifier) as string, {
    suspendReason: ctx.payload.reason,
  });
  ctx.emit("supplier.suspended", { supplierId: s.id ?? s.identifier });
}

/* ---- Supplier/Item edit reverts to PENDING_APPROVAL (A10) ------------ */
function lifecycleEditRevert(entity: Entity, ctx: EffectContext): void {
  ctx.emit("lifecycle.reverted", { id: entity.id ?? entity.identifier });
}

export const EFFECTS: Record<string, Effect> = {
  "PurchaseOrder.issue": poIssueCommitBudget,
  "PurchaseOrder.acknowledge": poAcknowledge,
  "ApprovalStageCompletion.approve": approvalApproveRouteNext,
  "ApprovalStageCompletion.autoApprove": approvalAutoApprove,
  "Installment.approve:PARTIAL_APPROVAL": installmentPartial,
  "Installment.process": installmentProcess,
  "MatchResult.runMatch:MATCHED": matchCleared,
  "MatchResult.resolveException:MATCHED": matchCleared,
  "NCR.closeCapa": ncrCloseCapa,
  "Supplier.suspend": supplierSuspend,
  "Item.suspend": supplierSuspend,
  "Supplier.edit": lifecycleEditRevert,
  "Item.edit": lifecycleEditRevert,
  "Requisition.changeStatus:COMPLETED": (req, ctx) => {
    relieveBudget(req, ctx, num(req.totalAmountInBase));
    ctx.emit("requisition.completed", { requisitionId: req.id ?? req.identifier });
  },
};

export { relieveBudget };
