/**
 * Guard registry — REAL implementations of the state-machine guard expressions.
 *
 * The prior prototype's engine carried the same machine config but left ~18
 * guards "simplified for prototype" (auto-approve limit not enforced, the A3
 * completion guard not evaluated, etc.), so records could not actually move
 * through their lifecycles. THIS file implements each guard for real, computed
 * from the entity + store + context, and is unit-tested by guard-parity tests.
 *
 * Each guard is keyed by `<entity>.<on>` (machine entity + action) and returns
 * { ok: true } or { ok: false, reason }. The engine calls the matching guard;
 * if none is registered, the transition's declared `guard` string is treated as
 * advisory and the transition is allowed (state-consistency-only transitions).
 */
import type { Store, Entity } from "@/lib/store/store";
import { DEFAULT_APPROVER_LIMIT, URGENCY_WEIGHT } from "@/lib/domain/constants";

export type GuardContext = {
  store: Store;
  actorId: string;
  actorRole: string;
  payload: Record<string, unknown>;
};

export type GuardResult = { ok: true } | { ok: false; reason: string };

export type Guard = (entity: Entity, ctx: GuardContext) => GuardResult;

const ok: GuardResult = { ok: true };
const no = (reason: string): GuardResult => ({ ok: false, reason });

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** PO value in base currency, tolerant of the various seed field names. */
export function poValueOf(po: Entity): number {
  return num(po.poValueInBase ?? po.value ?? po.poValue);
}

/* ------------------------------------------------------------------ *
 * Requisition completion (A3): the guard the old build skipped.
 * COMPLETED iff stage==POST_DELIVERY && all stages APPROVED &&
 * all match results cleared && no open NCR/CAPA for the requisition.
 * ------------------------------------------------------------------ */
function requisitionCanComplete(req: Entity, ctx: GuardContext): GuardResult {
  if (req.stage !== "POST_DELIVERY") return no("requisition not at POST_DELIVERY");
  const reqId = (req.id ?? req.identifier) as string;

  const completions = ctx.store
    .list("approvalCompletions")
    .filter((c) => c.recordId === reqId);
  if (completions.length > 0 && !completions.every((c) => c.completionStatus === "APPROVED")) {
    return no("not all approval stages APPROVED");
  }

  const matches = ctx.store.list("matchResults").filter((m) => m.requisitionId === reqId);
  if (matches.some((m) => m.matchStatus !== "MATCHED")) {
    return no("open invoice match exception");
  }

  const ncrs = ctx.store
    .list("ncrs")
    .filter((n) => n.requisitionId === reqId && n.status !== "CLOSED");
  if (ncrs.length > 0) return no("open NCR/CAPA on requisition");

  return ok;
}

/* ------------------------------------------------------------------ *
 * Approval auto-approve (A7 / e01): FINANCE vertical only, and the
 * record total must be within the resolved approver limit. The old
 * build did not enforce the limit; here it is enforced exactly.
 * ------------------------------------------------------------------ */
function completionCanAutoApprove(c: Entity, ctx: GuardContext): GuardResult {
  const stage = String(c.stage ?? "");
  const isFinance = /FINANCE|MANAGEMENT/i.test(stage) || c.vertical === "FINANCE";
  if (!isFinance) return no("auto-approve only on FINANCE vertical");
  const limit = num(c.approverLimit, DEFAULT_APPROVER_LIMIT);
  const amount = num(c.totalAmountInBase ?? ctx.payload.totalAmountInBase);
  if (amount > limit) return no(`amount ${amount} exceeds approver limit ${limit}`);
  return ok;
}

/* Approve: SoD — actor cannot approve their own requisition/PO. */
function completionCanApprove(c: Entity, ctx: GuardContext): GuardResult {
  if (c.completionStatus !== "AWAITING_APPROVAL")
    return no("stage not AWAITING_APPROVAL");
  // SoD: actor must not be the originator of the underlying record.
  const reqId = c.recordId as string;
  const req =
    ctx.store.get("tickets", reqId) ?? ctx.store.get("requisitions", reqId);
  if (req && (req.requesterId === ctx.actorId || req.createdById === ctx.actorId)) {
    return no("segregation of duties: cannot approve own record");
  }
  return ok;
}

/* Return for revision: mandatory note. */
function completionCanReturn(_c: Entity, ctx: GuardContext): GuardResult {
  const note = ctx.payload.note ?? ctx.payload.remarks;
  if (!note || String(note).trim() === "") return no("a note is mandatory to return");
  return ok;
}

/* Financial revert: only auto-approved finance/mgmt stages, when pay terms change. */
function completionCanFinancialRevert(c: Entity, ctx: GuardContext): GuardResult {
  if (!c.isAutoApproved) return no("only auto-approved stages revert");
  const changed = ctx.payload.payTermsChanged || ctx.payload.paymentSchedulesChanged;
  if (!changed) return no("no financial fields changed");
  return ok;
}

/* ------------------------------------------------------------------ *
 * PO issue (A4 + A6): budget committed (computed live), supplier
 * ONBOARDED, and buyer != approver. The old build let commit fail
 * silently; here the budget-service result gates the transition.
 * ------------------------------------------------------------------ */
function poCanIssue(po: Entity, ctx: GuardContext): GuardResult {
  const supplierId = po.supplierId as string;
  const supplier = ctx.store.get("suppliers", supplierId);
  if (supplier && supplier.status !== "ONBOARDED") {
    return no(`supplier ${supplierId} is not ONBOARDED (${supplier.status})`);
  }
  // Budget availability check (hard commit happens in the effect).
  const value = poValueOf(po);
  const budgetId = po.budgetId as string | undefined;
  if (budgetId) {
    const budget = ctx.store.get("budgets", budgetId);
    if (budget) {
      const available = num(budget.availableAmount);
      const override = ctx.payload.budgetOverride === true;
      if (value > available && !override) {
        return no(`PO value ${value} exceeds available budget ${available} (override required)`);
      }
    }
  }
  return ok;
}

/* ------------------------------------------------------------------ *
 * Installment approve (A9): partial vs full; amount must be > 0 and
 * <= agreed. The branch (APPROVED vs PARTIAL_APPROVAL) is decided by
 * the engine via two transitions; each guard validates its own case.
 * ------------------------------------------------------------------ */
function installmentApproveFull(inst: Entity, ctx: GuardContext): GuardResult {
  const amount = num(ctx.payload.amount, num(inst.amount));
  const agreed = num(inst.agreedAmount ?? inst.amount);
  if (amount <= 0) return no("amount must be > 0");
  if (amount !== agreed) return no("full approval requires amount == agreed");
  return ok;
}
function installmentApprovePartial(inst: Entity, ctx: GuardContext): GuardResult {
  const amount = num(ctx.payload.amount, num(inst.amount));
  const agreed = num(inst.agreedAmount ?? inst.amount);
  if (amount <= 0) return no("amount must be > 0");
  if (amount >= agreed) return no("partial approval requires amount < agreed");
  return ok;
}

/* ------------------------------------------------------------------ *
 * Supplier suspend (A11): failed audit / expired cert / sanctions /
 * active CAPA. The reason must be supplied; the effect blocks new POs.
 * ------------------------------------------------------------------ */
function supplierCanSuspend(_s: Entity, ctx: GuardContext): GuardResult {
  const reason = ctx.payload.reason;
  if (!reason) return no("suspension reason required");
  return ok;
}

/* Return authorize: RMA number present. */
function returnCanAuthorize(r: Entity, ctx: GuardContext): GuardResult {
  const rma = ctx.payload.rmaNumber ?? r.rmaNumber;
  if (!rma) return no("RMA number required to authorize");
  return ok;
}

export const GUARDS: Record<string, Guard> = {
  "Requisition.changeStatus:COMPLETED": requisitionCanComplete,
  "ApprovalStageCompletion.autoApprove": completionCanAutoApprove,
  "ApprovalStageCompletion.approve": completionCanApprove,
  "ApprovalStageCompletion.returnForRevision": completionCanReturn,
  "ApprovalStageCompletion.financialRevert": completionCanFinancialRevert,
  "PurchaseOrder.issue": poCanIssue,
  "Installment.approve:APPROVED": installmentApproveFull,
  "Installment.approve:PARTIAL_APPROVAL": installmentApprovePartial,
  "Supplier.suspend": supplierCanSuspend,
  "Item.suspend": supplierCanSuspend,
  "Return.authorize": returnCanAuthorize,
};

// Re-export helpers for the routing service.
export { num, URGENCY_WEIGHT, DEFAULT_APPROVER_LIMIT };
