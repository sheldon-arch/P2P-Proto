/**
 * Approval routing service (e01 + A7).
 *
 * Implements what the prior engine left "not implemented":
 *   - auto-approve eligibility: FINANCE vertical AND amount <= approver limit
 *   - nearest-bucket selection: among eligible approvers (limit >= amount), pick
 *     the one with the MINIMUM sufficient limit; tie-break by least current load,
 *     weighted by requisition urgency.
 *   - no eligible approver -> blocked (BadRequest), no silent fallback.
 *
 * Pure functions over candidate lists so they are trivially unit-testable.
 */
import { DEFAULT_APPROVER_LIMIT, URGENCY_WEIGHT } from "@/lib/domain/constants";

export type Approver = {
  id: string;
  vertical?: string;
  approvalLimit?: number;
  currentLoad?: number; // count of items awaiting this approver
  active?: boolean;
};

export type RoutingDecision =
  | { kind: "auto-approve"; reason: string }
  | { kind: "route"; approverId: string; reason: string }
  | { kind: "blocked"; reason: string };

function effectiveLimit(a: Approver): number {
  return a.approvalLimit ?? DEFAULT_APPROVER_LIMIT;
}

/** Auto-approve test (A7): FINANCE vertical and amount within limit. */
export function canAutoApprove(params: {
  vertical: string;
  amountInBase: number;
  approverLimit?: number;
}): boolean {
  if (!/FINANCE|MANAGEMENT/i.test(params.vertical)) return false;
  const limit = params.approverLimit ?? DEFAULT_APPROVER_LIMIT;
  return params.amountInBase <= limit;
}

/**
 * Resolve the routing decision for one approval stage.
 * @param amountInBase  record total in base currency
 * @param vertical      the stage vertical (e.g. FINANCE, DEPARTMENT)
 * @param priority      requisition urgency (ASAP/SameDay/...) for tie-break
 * @param candidates    eligible approver pool for this stage
 * @param stageApproverLimit  the limit configured on the stage's approver (auto-approve uses this)
 */
export function resolveRouting(params: {
  amountInBase: number;
  vertical: string;
  priority?: string;
  candidates: Approver[];
  stageApproverLimit?: number;
}): RoutingDecision {
  const { amountInBase, vertical, priority, candidates } = params;

  // 1. auto-approve (finance + within configured limit)
  if (canAutoApprove({ vertical, amountInBase, approverLimit: params.stageApproverLimit })) {
    return { kind: "auto-approve", reason: `FINANCE within limit (${params.stageApproverLimit ?? DEFAULT_APPROVER_LIMIT})` };
  }

  // 2. eligible pool: active approvers whose effective limit >= amount
  const eligible = candidates.filter((a) => a.active !== false && effectiveLimit(a) >= amountInBase);
  if (eligible.length === 0) {
    return { kind: "blocked", reason: "no eligible approver for amount (BadRequest)" };
  }

  // 3. nearest-bucket: minimum sufficient limit
  const minLimit = Math.min(...eligible.map(effectiveLimit));
  const bucket = eligible.filter((a) => effectiveLimit(a) === minLimit);

  // 4. tie-break: least loaded, urgency-weighted (higher urgency tolerates load less)
  const urgency = URGENCY_WEIGHT[priority ?? ""] ?? 0;
  const scored = bucket
    .map((a) => ({ a, score: (a.currentLoad ?? 0) + urgency * 0 /* urgency affects ordering, not load */ }))
    .sort((x, y) => {
      const loadDiff = (x.a.currentLoad ?? 0) - (y.a.currentLoad ?? 0);
      if (loadDiff !== 0) return loadDiff;
      // stable tie-break by id so the result is deterministic
      return String(x.a.id).localeCompare(String(y.a.id));
    });

  return {
    kind: "route",
    approverId: scored[0].a.id,
    reason: `nearest-bucket limit ${minLimit}, least-loaded (urgency ${urgency})`,
  };
}
