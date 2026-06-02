/**
 * Transition engine — THE ONLY MUTATOR of domain state.
 *
 * Algorithm (per transition):
 *   1. Resolve the entity from the store.
 *   2. Find the state machine for (entity).
 *   3. Find candidate transitions matching (from == currentState && on == action).
 *   4. For each candidate, evaluate the REAL guard (guards.ts). Pick the first
 *      whose guard passes. (Branch selection, e.g. installment APPROVED vs
 *      PARTIAL_APPROVAL, falls out of which guard passes.)
 *   5. Set the new state on the dimension field.
 *   6. Apply the REAL effect (effects.ts).
 *   7. Append an audit entry.
 *   8. Emit a domain event.
 *
 * Idempotent re-entry: firing a transition whose target state already equals
 * the current state (and no matching from-transition exists) is a no-op success
 * — critical so the guided tour can replay steps without corrupting state.
 *
 * Unlike the prior engine, guards and effects are REAL (see guards.ts /
 * effects.ts) — illegal moves are rejected and side effects actually happen.
 */
import { store, type Entity, type AuditEntry } from "@/lib/store/store";
import { eventBus } from "@/lib/events/event-bus";
import { ALL_MACHINES, type StateMachine, type Transition } from "@/lib/domain/state-machines";
import { GUARDS, type GuardContext, type GuardResult } from "./guards";
import { EFFECTS, type EffectContext } from "./effects";
import { DEMO_TODAY } from "@/lib/domain/constants";

/** Map a collection name (store) to the entity key used by the machines. */
const COLLECTION_TO_ENTITY: Record<string, string> = {
  tickets: "Requisition",
  requisitions: "Requisition",
  approvalCompletions: "ApprovalStageCompletion",
  suppliers: "Supplier",
  items: "Item",
  purchaseOrders: "PurchaseOrder",
  pos: "PurchaseOrder",
  installments: "Installment",
  matchResults: "MatchResult",
  ncrs: "NCR",
  returns: "Return",
};

/** audit category by entity */
const AUDIT_CATEGORY: Record<string, string> = {
  Requisition: "TICKET",
  ApprovalStageCompletion: "TICKET",
  Supplier: "SUPPLIER",
  Item: "ITEM",
  PurchaseOrder: "TICKET",
  Installment: "PAYMENT",
  MatchResult: "PAYMENT",
  NCR: "TICKET",
  Return: "TICKET",
};

/**
 * Resolve the machine for an entity. An entity can own multiple machines on
 * different dimensions (Requisition has both `stage` and `status`); when an
 * action is given, pick the machine whose transitions declare that action so we
 * read state from the correct dimension. Falls back to the first machine.
 */
function machineFor(entityName: string, action?: string): StateMachine | undefined {
  const machines = ALL_MACHINES.filter((m) => m.entity === entityName);
  if (machines.length === 0) return undefined;
  if (action) {
    const byAction = machines.find((m) => m.transitions.some((t) => t.on === action));
    if (byAction) return byAction;
  }
  return machines[0];
}

export type TransitionInput = {
  collection: string;
  id: string;
  action: string;
  payload?: Record<string, unknown>;
  actorId?: string;
  actorRole?: string;
};

export type TransitionResult =
  | { ok: true; entity: Entity; from: string; to: string; noop?: boolean }
  | { ok: false; error: string; code: "NOT_FOUND" | "NO_MACHINE" | "ILLEGAL" | "GUARD_FAILED" };

let auditSeq = 0;

function evalGuard(
  machineEntity: string,
  t: Transition,
  entity: Entity,
  ctx: GuardContext,
): GuardResult {
  // branch-specific key first, then generic
  const branchKey = `${machineEntity}.${t.on}:${t.to}`;
  const genericKey = `${machineEntity}.${t.on}`;
  const guard = GUARDS[branchKey] ?? GUARDS[genericKey];
  if (!guard) return { ok: true }; // state-consistency-only transition
  return guard(entity, ctx);
}

function applyEffect(machineEntity: string, t: Transition, entity: Entity, ctx: EffectContext): void {
  const branchKey = `${machineEntity}.${t.on}:${t.to}`;
  const genericKey = `${machineEntity}.${t.on}`;
  const effect = EFFECTS[branchKey] ?? EFFECTS[genericKey];
  if (effect) effect(entity, ctx);
}

export function transition(input: TransitionInput): TransitionResult {
  const { collection, id, action } = input;
  const payload = input.payload ?? {};
  const actorId = input.actorId ?? "system";
  const actorRole = input.actorRole ?? "Platform / System";

  const entity = store.get(collection, id);
  if (!entity) return { ok: false, error: `${collection}/${id} not found`, code: "NOT_FOUND" };

  const entityName = COLLECTION_TO_ENTITY[collection] ?? collection;
  const machine = machineFor(entityName, action);
  if (!machine) return { ok: false, error: `no machine for ${entityName}`, code: "NO_MACHINE" };

  const current = String(entity[machine.dimension] ?? machine.initial);

  // candidate transitions for (from == current && on == action)
  const candidates = machine.transitions.filter((t) => t.from === current && t.on === action);

  if (candidates.length === 0) {
    // idempotent re-entry: if some transition with this action targets the
    // current state, treat as a successful no-op (tour replay safety).
    const alreadyThere = machine.transitions.some((t) => t.on === action && t.to === current);
    if (alreadyThere) {
      return { ok: true, entity, from: current, to: current, noop: true };
    }
    return {
      ok: false,
      error: `illegal: cannot '${action}' from '${current}' on ${entityName}`,
      code: "ILLEGAL",
    };
  }

  const gctx: GuardContext = { store, actorId, actorRole, payload };

  // When an action maps to multiple target states (e.g. changeStatus ->
  // ON_HOLD | CANCELLED | COMPLETED), the caller selects the branch via an
  // explicit target: payload.to, or a payload field named after the machine
  // dimension (e.g. payload.status === "COMPLETED"). Honor it so guard
  // evaluation runs against the intended transition, not the first listed.
  const explicitTarget =
    (typeof payload.to === "string" && payload.to) ||
    (typeof payload[machine.dimension] === "string" && (payload[machine.dimension] as string)) ||
    undefined;

  let pool = candidates;
  if (explicitTarget) {
    const filtered = candidates.filter((t) => t.to === explicitTarget);
    if (filtered.length === 0) {
      return {
        ok: false,
        error: `illegal: cannot '${action}' from '${current}' to '${explicitTarget}' on ${entityName}`,
        code: "ILLEGAL",
      };
    }
    pool = filtered;
  }

  // pick the first candidate whose real guard passes
  let chosen: Transition | undefined;
  let lastReason = "";
  for (const t of pool) {
    const g = evalGuard(entityName, t, entity, gctx);
    if (g.ok) {
      chosen = t;
      break;
    }
    lastReason = g.ok ? "" : g.reason;
  }
  if (!chosen) {
    return { ok: false, error: lastReason || "guard failed", code: "GUARD_FAILED" };
  }

  // 5. set new state (+ allowed payload merge: shallow, excluding control keys)
  const controlKeys = new Set(["note", "remarks", "budgetOverride", "payTermsChanged", "paymentSchedulesChanged"]);
  const merged: Partial<Entity> = { [machine.dimension]: chosen.to };
  for (const [k, v] of Object.entries(payload)) {
    if (!controlKeys.has(k)) merged[k] = v;
  }
  const updated = store.patch(collection, id, merged) as Entity;

  // 6. apply real effect
  const emitted: { type: string; payload?: Record<string, unknown> }[] = [];
  const ectx: EffectContext = {
    ...gctx,
    emit: (type, p) => emitted.push({ type, payload: p }),
  };
  applyEffect(entityName, chosen, updated, ectx);

  // 7. audit
  auditSeq += 1;
  const audit: AuditEntry = {
    id: `AUD-${String(auditSeq).padStart(5, "0")}`,
    at: DEMO_TODAY,
    category: AUDIT_CATEGORY[entityName] ?? "ADMIN",
    entity: collection,
    entityId: id,
    action,
    actorId,
    from: current,
    to: chosen.to,
    detail: payload,
  };
  store.appendAudit(audit);

  // 8. emit (a default entity event + any effect-emitted events)
  eventBus.emit({ type: `${entityName.toLowerCase()}.${action}`, entity: collection, entityId: id });
  for (const e of emitted) {
    eventBus.emit({ type: e.type, entity: collection, entityId: id, payload: e.payload });
  }

  return { ok: true, entity: store.get(collection, id) as Entity, from: current, to: chosen.to };
}

/** Read-only helper: which actions are legal now, across ALL of the entity's
 * machines/dimensions (for UI gating). */
export function legalActions(collection: string, id: string): string[] {
  const entity = store.get(collection, id);
  if (!entity) return [];
  const entityName = COLLECTION_TO_ENTITY[collection] ?? collection;
  const machines = ALL_MACHINES.filter((m) => m.entity === entityName);
  const actions = new Set<string>();
  for (const machine of machines) {
    const current = String(entity[machine.dimension] ?? machine.initial);
    for (const t of machine.transitions) {
      if (t.from === current) actions.add(t.on);
    }
  }
  return [...actions];
}
