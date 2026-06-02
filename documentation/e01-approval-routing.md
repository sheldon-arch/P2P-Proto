# e01 Approval Routing, Nearest-Bucket Selection and Auto-Approval - Unified Procure-to-Pay

- **BPMN file:** e01-approval-routing.bpmn
- **Spec:** .build/specs/e01-approval-routing.json

## Scope, trigger, outcome
- **Scope:** Isolates the load-bearing rules of the configurable approval engine: resolving the chain, finding an eligible approver, deciding auto vs manual, nearest-bucket selection of exactly one approver, reassignment/delegation on leave, and the auto-approval revert when financial terms change. The detail is the Raphe engine generalized (per `model/platform-services.md` service 1).
- **Trigger:** The approval engine reaches a stage and request-approval is invoked for the current vertical (e.g. `POST /api/ticket/:id/vertical/:verticalId/request-approval`). Fixed example chain: REQ_DEPARTMENT -> PROCUREMENT -> FINANCE -> MANAGEMENT -> null; the diagram zooms the FINANCE/MANAGEMENT selection.
- **Outcome:** Every approval completion is resolved (APPROVED) or the stage is blocked with a BadRequestException. Auto-approvals are logged with no second person; manual approvals are OTIF-scored; financial edits force re-approval.

## Actors (lanes)
Approver (acts on a manual completion, may be reassigned/delegated), Platform/System (resolves the chain, selects the approver, auto-approves, reverts on financial change, routes onward). Permission detail in `model/role-permission-matrix.md` (Approval group: approval.requestApproval, approval.approve, approval.reject, approval.reassign, approval.delegate).

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Stage reached (request approval)** (System, start). [SCOR OE2 | ISO 8.4 | raphe-routing-approval + e01].
2. **Resolve approval chain** (System). Resolve the RoutingRuleEntry for (requester department, current vertical), unique key (department, verticalId); load active candidate approvers from approverUserIds. Per-vertical strategy: Req Department assignee = requester (pinned), approver from rule; Procurement assignee from rule, no auto-approver; Finance approval-only (approver = assignee, FinanceRoutingHelper); Management both from rule. [SCOR OE2 | raphe-routing-approval].
3. **eligible approver found?** (System, exclusive). Pool non-empty after load AND (finance) after the eligibility filter. [SCOR OE2 | raphe-routing-approval].
4. **BadRequest - stage blocked** (System, end). On empty pool: BadRequestException, transaction rolls back, requisition stalls; admin must fix the rule or a limit; no fallback. [SCOR OE2 | e01].
5. **within auto-approval threshold?** (System, exclusive). allowAutoApproval true only for FINANCE and totalAmountInBase <= approvalLimit. [SCOR OE2 | raphe-routing-approval 04].
6. **Nearest-bucket approver selection** (System). The four-step selection (below). [SCOR OE2 | e01 + raphe-routing-approval].
7. **Auto-approve** (System). Set APPROVED, isAutoApproved = true, approvedAt; no email; no OTIF stats; recurse to Management. [SCOR OE2 | raphe-routing-approval].
8. **Assign to selected approver** (System). Set AWAITING_APPROVAL, record approvalRequestedToId, emit TICKET_APPROVAL_REQUESTED; first assignment moves NOT_STARTED -> IN_PROGRESS; SoD pre-check (not own requisition/PO). [SCOR OE2 | ISO 8.4 | raphe-routing-approval].
9. **Approver approves or returns for revision** (Approver). Approve sets APPROVED + approvedAt, updates OTIF stats, routes onward; reject returns for revision with a mandatory note. [SCOR OE2 | raphe-routing-approval + e07].
10. **approver available?** (Approver, exclusive). Active-status re-checked per request; on leave/inactive -> reassign/delegate. [SCOR OE2 / OE5 | raphe-routing-approval + platform-services].
11. **Reassign / delegate** (System). Move approvalRequestedToId to another qualified approver; new notification; loops back to the decision. [SCOR OE2 / OE5 | raphe-routing-approval].
12. **postValueSync - revert auto-approval on financial change** (System). After any write, recompute total and reconvert; only if payTerms OR paymentSchedules changed, revert auto-approved FINANCE/MANAGEMENT completions to AWAITING_APPROVAL. [SCOR OE2 | e02].
13. **Route to next vertical / complete** (System). handleRouting advances to the successor and re-enters this flow; Management terminal; every decision audited. [SCOR OE2 | raphe-routing-approval].
14. **Approvals resolved for requisition** (System, end).

## Gateways and branches (exact conditions)
- **eligible approver found?** `pool non-empty after loading active approvers AND (finance) at least one candidate effectiveLimit >= totalAmountInBase` -> YES (threshold check). Else -> NO (BadRequestException, blocked). No auto-fallback to a default approver.
- **within auto-approval threshold?** `vertical == FINANCE AND totalAmountInBase <= approvalLimit` -> auto-approve. Else (over threshold or non-finance) -> nearest-bucket then manual. Boundary: amount exactly == limit auto-approves (inclusive <=). The limit used for this decision comes from the Req Department approver (`approvalRequestedTo ?? assignedTo`, `approver.approvalLimit ?? 200000`) and can DIVERGE from the per-candidate eligibility limits used in selection.
- **approver available?** `approver active AND able to act` -> route onward. `on leave / inactive / overloaded` -> reassign/delegate.
- **postValueSync revert condition:** `payTerms changed OR paymentSchedules changed` AND completion `vertical IN (FINANCE, MANAGEMENT) AND status == APPROVED AND isAutoApproved == true` -> revert to AWAITING_APPROVAL. Manual approvals and REQ_DEPARTMENT/PROCUREMENT are never reverted.

## Nearest-bucket selection (exact algorithm)
1. **Effective limit per candidate** = `approvalLimit ?? 200000` (DEFAULT_TICKET_APPROVAL_LIMIT; a configured 0 stays 0).
2. **Eligible** iff `effectiveLimit >= totalAmountInBase` (inclusive).
3. **Nearest bucket** = keep only candidates at the MINIMUM eligible limit (reserves high-limit approvers for big tickets).
4. **Tie-break = least-loaded:** urgency-weighted count of non-APPROVED completions across `assignedToId + approvalRequestedToId`; weights `ASAP = 4 / SameDay = 2 / Within2Days = 1 / Within1Week = 0`; pick the lowest.
- Returns exactly ONE approver. No fallback. Empty after step 2 -> BadRequestException (re-enters the eligible gate as NO).

## Fields and values
| Item | Value | Fixed / configurable |
| --- | --- | --- |
| Default approval limit | 200000 (DEFAULT_TICKET_APPROVAL_LIMIT, `approvalLimit ?? 200000`) | configurable per approver; default fixed in code |
| Configured limit of 0 | stays 0 (not coerced to default) | rule |
| Eligibility comparison | `effectiveLimit >= totalAmountInBase` | inclusive |
| Auto-approval comparison | `totalAmountInBase <= approvalLimit` | inclusive |
| Urgency weights | ASAP 4 / SameDay 2 / Within2Days 1 / Within1Week 0 | fixed |
| Auto-approval vertical | FINANCE only | rule |
| Auto-approval flags set | isAutoApproved = true, approvedAt, APPROVED | rule |
| OTIF on auto-approval | not run (no streak update) | rule |
| Revert trigger fields | payTerms OR paymentSchedules | rule |
| Revert scope | auto-approved FINANCE/MANAGEMENT completions only | rule |

## Edge cases and error handling
- **No routing rule / no active approver / no eligible limit:** BadRequestException 'No eligible approver', transaction rolls back, requisition stalls until admin fixes rules/limits. Deliberate hard stop, no silent fallback.
- **Amount exactly equals the limit:** auto-approves (inclusive <=) and is eligible (inclusive >=).
- **Limit divergence:** the auto-approval decision limit (Req-Dept approver) can differ from the per-candidate eligibility limits, so a ticket can fail auto-approval yet still find an eligible bucket for manual approval.
- **Overdue approval:** resets the OTIF streak to 0 on the human approve path; auto-approvals never touch streaks.
- **Approver on leave / deactivated:** active-status re-checked per request; reassignment/delegation moves the pending completion to a qualified approver (same-or-higher designation, not own requisition/PO).
- **Financial edit after auto-approval:** postValueSync reverts the auto-approved FINANCE/MANAGEMENT completion to AWAITING_APPROVAL; the hook never aborts and always emits ticket.updated; the reverted stage re-enters the threshold check.
- **SoD:** an approver may never approve their own requisition/PO (bounded self-approval); auto-approval is the only no-second-person path and is always logged.

## Business rules and invariants
- Exactly one approver is selected per manual stage (nearest-bucket + least-loaded tie-break).
- No fallback approver; an unresolvable stage blocks rather than mis-routes.
- Auto-approval is FINANCE-only, within limit, logged, with no second person and no OTIF effect.
- Financial-term changes (payTerms / paymentSchedules) force re-approval of auto-approved FINANCE/MANAGEMENT stages.
- Management is the terminal vertical and never auto-approves.
- Every decision (manual and auto) is audited.

## Cross-references
- **Diagram 03** (approval): the full multi-stage approval flow this edge case zooms into.
- **e02** (budget/commitment): approval limits are not budget control; budget is checked and committed separately (note in `model/data-model.md`).
- **Diagram 12** (analytics): the OTIF streak and approval SLA computed from these decisions.
- **Benchmarks:** SCOR OE2 Business Rules; ISO 8.4 (supplier-approval part). Sources: memory `raphe-routing-approval`, `raphe-edge-cases` (e01 nearest-bucket, e02 postValueSync, e07 OTIF), `model/platform-services.md` service 1.
