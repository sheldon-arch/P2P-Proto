# 03 Approval Workflow - Unified Procure-to-Pay (Configurable Approval Engine)

- **BPMN file:** 03-approval.bpmn
- **Spec:** .build/specs/03-approval.json

## Scope, trigger, outcome

- **Scope:** The configurable, multi-stage approval engine that drives any record requiring authorization in the unified model: requisitions, purchase orders, sourcing awards, supplier onboarding, and payment schedules. One engine, parameterized by department, category, and value. This diagram covers chain resolution, per-stage completion creation, current-stage assignment (least-loaded eligible approver), threshold-based auto-approval (nearest-bucket minimum-sufficient approver), the configurable budget stage, manual review and decision, the approve / return-for-revision loop, advancing through stages, recording each stage approved, the more-stages gateway, and the fully-approved terminal. It also covers the auto-approval revert when financial information changes. Segregation of duties (SoD) is enforced throughout.
- **Trigger:** A requester submits a requisition for approval (or, reusing the same engine, a buyer submits a PO, award, supplier-onboarding, or payment-schedule record).
- **Outcome:** Every stage completion reaches APPROVED and the record is set FULLY_APPROVED and released to its downstream domain (sourcing for a requisition, issue for a PO, award for a selection, release for a payment schedule). Alternatively the record loops through return-for-revision until approved, or stalls if a routing rule or eligible approver is missing. Full approval is not record completion; record STATUS reaches COMPLETED only at end-of-cycle.

## Actors (lanes)

- **Requester** - owns the record being approved (for a requisition); submits, and revises on a return-for-revision.
- **Approver** - reviews and decides a manual stage; subject to SoD and designation-rank checks.
- **Budget Owner** - decides the configurable budget stage (approve, approve override, or return).
- **Platform / System** - automated: resolves the chain, creates completions, assigns approvers, evaluates thresholds, auto-approves, records decisions, advances stages, and runs the financial-edit revert.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Tags: [SCOR code | ISO clause | source].

1. **Requisition submitted for approval** (Requester, start). The submitted record carries recordType {Requisition|PurchaseOrder|Award|Supplier|PaymentSchedule}, recordId, requesterId (owner, immutable), departmentId, category {Items|Spares|Services|ProductDesign}, purchaseType {Local|Import} or {Direct|Indirect}, currency, totalAmount (record currency), totalAmountInBase (FX-normalized, the value all thresholds compare against), projectId/costCenterId, priority {ASAP|SameDay|Within2Days|Within1Week}. On submit, the record status becomes IN_PROGRESS and structural edits are locked except via return-for-revision. [SCOR OE2 | ISO 8.4 | source: RA submit + AB requisition-status]

2. **Resolve approval chain** (System, service). System resolves the ordered chain. Lookup: RoutingRuleEntry matched on (departmentId, category, recordType) with a value band; unique constraint (department, stage/verticalId). Default chain template (configurable, fixed order): Stage 1 REQ_DEPARTMENT (assignee = requester, pinned) -> Stage 2 PROCUREMENT -> Stage 3 BUDGET (conditional) -> Stage 4 FINANCE -> Stage 5 MANAGEMENT -> null (terminal). Al Bahja all-to-one and Raphe multi-stage are both configurations of this engine; a site/department-conditional stage models the AB factory-site Factory Manager rule (FM sites: Barka Engineering, Oman Hygienic Stores, Oman Hygienic Engineering; FM-skip sites: Oman Solar, Accommodation Maintenance, Flavour Division, Photon-01). No matching rule raises BadRequestException 'No routing rule'; the record stalls IN_PROGRESS until an Administrator fixes the rule. [SCOR OE2 | ISO 8.4 | source: RA routing strategies + AB FM-site config | platform-services 1]

3. **Create per-stage completions (NOT_STARTED)** (System, service). One VerticalCompletion per stage, status NOT_STARTED. Completion fields: completionId, recordId, verticalId/stage, status {NOT_STARTED|IN_PROGRESS|AWAITING_APPROVAL|APPROVED}, assignedToId (nullable), approvalRequestedToId (nullable), approvalLimit (nullable), isAutoApproved (default false), approvedAt (nullable), revertedCount (default 0). Record STAGE is independent of per-stage COMPLETION (RA three-dimension model); this diagram drives COMPLETION only. [SCOR OE2 | ISO 8.4 | source: RA three-dimension completion model | data-model]

4. **Assign current stage (least-loaded eligible approver)** (System, service). Stage 1 assignee is pinned to the requester; stage approver and later assignees are selected least-loaded from the routing-rule pool. Eligibility = active users in approverUserIds[] with permission approval.approve and satisfying SoD (userId != requesterId for a requisition, != buyerId for a PO). Least-loaded metric = urgency-weighted count of open (non-APPROVED) completions across assignedToId and approvalRequestedToId; weights ASAP=4, SameDay=2, Within2Days=1, Within1Week=0; lowest wins, ties by lowest userId. First assignment moves NOT_STARTED -> IN_PROGRESS and emits NOTIFY_ASSIGNED + SSE {recordId}. Manual reassignment guard: assigner designation rank >= the stage's required rank and completion not yet APPROVED. [SCOR OE2 | ISO 8.4 | source: RA findLeastLoadedUser + assignment guard | platform-services 1]

5. **Is current stage the Budget stage (configured)?** (System, exclusive). See gateways below. [SCOR OE11 | source: build-new]

6. **Budget Owner reviews commitment vs available budget** (Budget Owner, user). Permission budget.approve, scope own cost-center. Displayed read-only: costCenterId, period, budget.amount, availableAmount, committedAmount, actualAmount, this record's totalAmountInBase, projected available-after-commit = availableAmount - totalAmountInBase. Buttons: Approve budget; Approve override (sets budget.overrideFlag = true, mandatory overrideReason when availableAmount < totalAmountInBase, logged); Return for revision (mandatory returnNote). This is the SOFT check; the HARD commit/encumbrance happens at PO issue (Diagram 05). [SCOR OE11 | source: build-new budget service + AB over-budget override | platform-services 11]

7. **Budget approved or override approved?** (Budget Owner, exclusive). See gateways below. [SCOR OE11 | source: build-new]

8. **Within auto-approval threshold?** (System, exclusive). See gateways below. [SCOR OE2 | source: RA allowAutoApproval guard + nearest-bucket | raphe-routing-approval | platform-services 1]

9. **Auto-approve (nearest-bucket minimum-sufficient approver, logged)** (System, service). Nearest-bucket selection reserves high-limit approvers for large amounts: (1) load active eligible approvers; (2) effectiveLimit = approvalLimit ?? 200000 (configured 0 stays 0); (3) keep those with effectiveLimit >= totalAmountInBase (inclusive); (4) retain only those at the MINIMUM eligible limit (nearest bucket); (5) tie-break least-loaded. Effects: completion.status = APPROVED, isAutoApproved = true, approvedAt = now, approvalRequestedToId = the bucket approver (for audit), NO approval-requested email, audit 'AUTO_APPROVED' with limit and amount. Auto-approval does not run the OTIF/user-stats path and does not by itself complete the record. Empty pool at step 1 or 3 raises BadRequestException 'No eligible approver', transaction rolls back, record stalls. [SCOR OE2 | source: RA nearest-bucket auto-approval | raphe-routing-approval e01 | platform-services 1]

10. **Approver reviews requisition** (Approver, user). The resolved approver (approvalRequestedToId user, or an assignee of sufficient designation rank) opens the record. Authorization (service-layer, on top of the permission guard): acting user is approvalRequestedToId OR an assignee with required DESIGNATION_RANK; AND SoD holds (acting user not the requester for a requisition, not the buyer for a PO). On open, completion moves IN_PROGRESS -> AWAITING_APPROVAL if request-approval has fired; the approver sees the full record (header, lines, totals in record and base currency, attachments, prior decisions, prior return notes). Buttons: Approve; Return for revision (with mandatory note). [SCOR OE2 | ISO 8.4 | source: RA approve authorization + SoD | AB FM Approve/Reject/Return]

11. **Approve or return for revision?** (Approver, exclusive). See gateways below. [SCOR OE2 | source: RA approve/reject + AB reject-reason-mandatory]

12. **Revise and resubmit (same record, identifier unchanged)** (Requester, user). The record owner edits the SAME record per the return note; the identifier is immutable and unchanged across the revision (AB rule). Editable fields depend on recordType and the field engine (mandatory-field gating by stage/scope/purchaseType). On resubmit the record re-enters the approval flow at the first stage so changed financial information is re-checked; the financial-revert rule applies if payment terms or schedules changed. [SCOR OE2 | source: RA edit-same-record + AB return-for-revision, identifier immutable]

13. **Record stage APPROVED (manual or auto), update stats** (System, service). Transaction: completion.status = APPROVED, approvedAt = now, approvedById = acting approver (manual) or null (auto). For a manual approval only: update assignee and approver OTIF/user-stats streak (remainingTime = allowedDuration(priority) - elapsed(createdAt); <=0 = MISS resets streak to 0, >0 = HIT; same-day upgrades MISS->HIT once, new-day increments; longestStreak monotonic; otifPercentage = totalHits/(totalHits+totalMisses)*100). Emits NOTIFY_STAGE_APPROVED + SSE {recordId} + audit 'STAGE_APPROVED'. [SCOR OE2 | ISO 8.4 | source: RA approve transaction + e07 OTIF | platform-services 4/6/9]

14. **More stages remaining in chain?** (System, exclusive). See gateways below. [SCOR OE2 | source: RA handleRouting, Management terminal | raphe-routing-approval]

15. **Advance to next stage (handleRouting)** (System, service). Set the next not-APPROVED completion as current, resolve its approver per that stage's routing strategy (Procurement: assignee least-loaded, no auto-approver; Finance: approval-only, approver = assignee via finance nearest-bucket; Management/default: both from rule, least-loaded), then re-enter the assignment + threshold loop. If the next stage is auto-approvable and within limit, auto-approval recurses to the following stage (e.g. Finance auto-approves then routes to Management which always needs a human). Loops back to assignment. [SCOR OE2 | source: RA per-vertical routing + recurse-on-auto | raphe-routing-approval]

16. **Record fully approved, release to next domain** (System, service). All completions APPROVED. Sets the record FULLY_APPROVED and enables the next domain action. Emits NOTIFY_FULLY_APPROVED + SSE {recordId} + audit 'FULLY_APPROVED'. Full approval is not record completion. [SCOR OE2 | ISO 8.4 | source: RA chain terminal + three-dimension model]

17. **Approval chain complete** (System, end). The record proceeds to its downstream domain diagram. [SCOR OE2 | source: build-new]

18. **Financial info changed -> Revert auto-approved Finance / Management completions** (System, non-interrupting boundary on the fully-approved node + service). After any write the system recomputes total = sum(qty x unitPrice) and reconverts to base if it changed; THEN, only if payTerms OR paymentSchedules changed, it reverts every completion where verticalId IN {FINANCE, MANAGEMENT} AND status == APPROVED AND isAutoApproved == true back to AWAITING_APPROVAL, increments revertedCount, and re-queues those stages. Manual approvals are never reverted; REQ_DEPARTMENT and PROCUREMENT are never reverted. The hook always emits record.updated (SSE) and never aborts the write. The reverted stage re-enters the threshold evaluation. [SCOR OE2 | source: RA e02 postValueSync revert | platform-services 1]

## Gateways and branches (exact conditions)

- **Is current stage the Budget stage (configured)?** Expression: `currentStage.verticalId == 'BUDGET' && tenantConfig.budgetStageEnabled == true`. TRUE -> Budget Owner review. FALSE -> auto-approval threshold evaluation. If the budget stage is disabled, ResolveChain never creates it and this gateway only sees FALSE.
- **Budget approved or override approved?** Expression: `budgetDecision == 'APPROVE' || budgetDecision == 'OVERRIDE'`. TRUE (totalAmountInBase <= budget.availableAmount, or override approved with overrideReason) -> record stage approved. FALSE (returnNote supplied, no override) -> return for revision.
- **Within auto-approval threshold?** Expression: `stage.allowAutoApproval == true && totalAmountInBase <= effectiveApproverLimit`, where `effectiveApproverLimit = (assignedApprover.approvalLimit ?? 200000)` and 200000 is the configurable DEFAULT_LIMIT (a configured 0 stays 0, never falls back to 200000). Comparison is inclusive (amount == limit auto-approves). The limit comes from the resolved approver (approvalRequestedTo ?? assignedTo) and can diverge from the per-candidate eligibility limit used during nearest-bucket selection (documented Raphe behaviour). TRUE -> auto-approve. FALSE -> manual review.
- **Approve or return for revision?** Expression: `approverDecision == 'APPROVE'`. TRUE -> record stage approved. FALSE (`approverDecision == 'RETURN'`, mandatory returnNote) -> return for revision. The Approve button is permission-gated (approval.approve) and SoD-gated (`actingUserId != record.requesterId && actingUserId != record.buyerId`); if SoD fails the button is disabled with reason 'Cannot approve your own record'.
- **More stages remaining in chain?** Expression: `exists(completion where status != 'APPROVED')`. TRUE -> advance to next stage. FALSE -> fully approved. Management is terminal and never auto-approves.
- **Financial info changed (boundary, non-interrupting)** Condition: a write changed `payTerms` OR `paymentSchedules`. On fire, the revert path runs without cancelling the main flow.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owning role |
| --- | --- | --- | --- | --- | --- |
| recordType | enum {Requisition, PurchaseOrder, Award, Supplier, PaymentSchedule} | yes | Requisition | one of set | System (set on submit) |
| requesterId / buyerId | reference (User) | yes | n/a | immutable; drives SoD | System |
| totalAmountInBase | number | yes | n/a | FX-normalized; >= 0; the value all thresholds compare against | System (FX service) |
| priority | enum {ASAP, SameDay, Within2Days, Within1Week} | yes | inherited from record | one of set; drives urgency weight | Requester |
| completion.status | enum {NOT_STARTED, IN_PROGRESS, AWAITING_APPROVAL, APPROVED} | yes | NOT_STARTED | linear except revert | System |
| completion.isAutoApproved | boolean | yes | false | set true only by auto-approve | System |
| approvalLimit (per approver) | number | no | DEFAULT_LIMIT 200000 (configurable; 0 stays 0) | >= 0 | Administrator |
| overrideReason | text | yes when availableAmount < totalAmountInBase | empty | non-empty when override on over-budget | Budget Owner |
| returnNote | text | yes on return | empty | non-empty to submit a return | Approver / Budget Owner |
| revertedCount | integer | yes | 0 | incremented on each financial revert | System |

Dropdowns (exact value sets): recordType {Requisition | PurchaseOrder | Award | Supplier | PaymentSchedule}; priority {ASAP | SameDay | Within2Days | Within1Week}; budgetDecision {APPROVE | OVERRIDE | RETURN}; approverDecision {APPROVE | RETURN}; completion.status {NOT_STARTED | IN_PROGRESS | AWAITING_APPROVAL | APPROVED}.

## Edge cases and error handling

- **No routing rule matched.** BadRequestException 'No routing rule'; record stalls IN_PROGRESS; Administrator (routingRules.update) must add the rule. No partial chain is created.
- **No eligible approver (empty pool).** Auto-approve step 1 or 3, or assignment, finds no active eligible user; BadRequestException 'No eligible approver'; transaction rolls back; record stalls until rules/limits/user-status are fixed.
- **Amount exactly equal to the limit.** Auto-approves (comparison is `<=`, inclusive).
- **Configured approval limit of 0.** Stays 0; never falls back to 200000; effectively forces manual review for any positive amount at that approver.
- **SoD self-approval attempt.** The Approve button is disabled for the record's own requester/buyer; the only no-second-person path is auto-approval within threshold, which is logged.
- **Overdue approval.** Resets the approver's OTIF streak to 0 (the manual stats path on the next explicit approval records a MISS).
- **Financial edit after auto-approval.** postValueSync reverts only auto-approved Finance/Management completions to AWAITING_APPROVAL; manual approvals and REQ_DEPARTMENT/PROCUREMENT are untouched; the hook never aborts the write.
- **Limit divergence.** The limit used for the auto-approval decision (from the resolved approver) can differ from the per-candidate eligibility limit used in nearest-bucket selection; this is documented, intentional Raphe behaviour, not a defect.
- **Return loop with no end.** Each return re-enters the chain at the first stage; there is no system-imposed cap on rounds; the identifier never changes.

## Business rules and invariants

- One engine serves requisition, PO, award, supplier-onboarding, and payment-schedule approvals; it is parameterized by department, category, and value.
- The record identifier is immutable across the entire lifecycle, including returns and delays.
- All thresholds and comparisons use totalAmountInBase (FX-normalized), never the raw record-currency amount.
- DEFAULT_LIMIT is 200000, configurable per tenant; a configured 0 stays 0. Comparison `<=` is inclusive.
- SoD: a user can never approve their own requisition or PO; buyer != PO approver; auto-approval is the only no-second-person path and is always logged.
- Auto-approval sets APPROVED + isAutoApproved = true, sends no approval-requested email, and does not run the OTIF stats path; it does not by itself complete the record.
- Nearest-bucket selection keeps only approvers at the minimum eligible limit (reserving high-limit approvers for large amounts), tie-broken by least-loaded (urgency-weighted open completions).
- The budget stage is a configurable stage, not a hard-coded step; the budget check here is soft (warn/override) and the hard commit/encumbrance happens at PO issue.
- Full approval (all completions APPROVED) is not record completion; STATUS reaches COMPLETED only at end-of-cycle (POST_DELIVERY + all matches cleared + no open NCR/CAPA).
- Every decision, manual and auto, plus every assignment and revert, is audited; every committed change emits SSE {recordId}.

## Cross-references

- Diagram 00 system overview (steps 4-6 Route / Approve / Approved). Diagram 02 requisition (the record that enters this engine). Diagram 04 sourcing (a fully-approved requisition is released to sourcing; award approval reuses this engine). Diagram 05 purchase order (hard budget commit; PO approval reuses this engine). Diagram 10 payments (payment-schedule release reuses this engine and the financial-edit revert).
- Benchmarks: SCOR OE2 (Business Rules), ISO 9001:2015 clause 8.4 (control of external providers, the supplier-approval part). Sources: `raphe-routing-approval`, `raphe-edge-cases` (e01 nearest-bucket, e02 postValueSync revert, e07 OTIF), `albahja-requisition-approval`, `model/platform-services.md` (service 1 approval engine), `model/role-permission-matrix.md`, `model/data-model.md` (ApprovalChain/VerticalCompletion, Budget/Commitment).
