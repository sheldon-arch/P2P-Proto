# e02 Budget Check and Commitment (Encumbrance Accounting) - Unified Procure-to-Pay

- **BPMN file:** e02-budget-commitment.bpmn
- **Spec:** .build/specs/e02-budget-commitment.json

## Scope, trigger, outcome
- **Scope:** Isolates the budget and commitment lifecycle: a soft check at requisition, an over-budget override gateway, a hard commit (encumbrance) at PO issue, relief to actual at goods receipt or invoice, and commitment-vs-actual reporting. This is a build-new finance control that neither source company had. Approval limits are not budget control; a real operation checks funds and encumbers them separately.
- **Trigger:** A requisition is submitted with a value in base currency (totalAmountInBase).
- **Outcome:** The budget is soft-checked at requisition, hard-committed (encumbered) at PO, and relieved to actual at GR/invoice, with over-commitment prevented and every posting audited.

## Actors (lanes)
Requester (submits, revises on a rejected override), Budget Owner (approves or rejects the over-budget override), Procurement/Buyer (issues the PO, the hard-commit point), Platform/System (checks, posts the encumbrance, relieves, reports). Permission detail in `model/role-permission-matrix.md` (Budget group: budget.view, budget.manage, budget.approve, commitment.view).

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Requisition submitted** (Requester, start). Value in base currency. [SCOR OE11 | data-model Budget/Commitment].
2. **Soft budget check** (System). Read the Budget for the requisition's costCenterId/projectId + period; compare value <= availableAmount; WARN only, no block, no ledger change. [SCOR OE11 | data-model soft-check + platform-services budget service].
3. **value <= availableAmount?** (System, exclusive). Within -> proceed (no warning); over -> warn and invoke the override gateway. [SCOR OE11 | data-model].
4. **Budget Owner override approved?** (Budget Owner, exclusive). Approve -> overrideApprovedBy + overrideReason captured and LOGGED, proceeds with the override carried forward; reject -> revise. [SCOR OE11 | data-model 'available >= amount or override-with-approval'].
5. **Revise requisition** (Requester). Reduce qty/price/scope or change cost-center; resubmit; identifier unchanged. [SCOR OE11 | data-model immutable identifier].
6. **Proceed to sourcing / PO** (System). Carry the override flag/reason forward; still no ledger movement. [SCOR OE11 | data-model 'hard commit happens later at PO issue'].
7. **Buyer issues PO** (Buyer). PO value in base currency; the hard-commit point; buyer cannot approve own PO; supplier must be ONBOARDED. [SCOR S2.1 / OE11 | ISO 8.4.3 | data-model PO state machine].
8. **availableAmount >= poValue OR override approved?** (System, exclusive). The over-commitment prevention guard. [SCOR OE11 | data-model hard-commit guard].
9. **Block commit** (System). Hold the PO; request override or reduce PO; no commitment created. [SCOR OE11 | data-model over-commitment prevention].
10. **Hard commit** (System). availableAmount -= poValue; committedAmount += poValue; create Commitment {budgetId, poId, amount, status = committed}; GL integration point; audit + SSE. [SCOR OE11 / OE4 | data-model Commitment].
11. **GR / invoice posted** (System). The relief trigger; partial GR relieves pro-rata. [SCOR S2.4 -> S2.7 / OE11 | data-model relief].
12. **Relieve commitment to actual** (System). committedAmount -= reliefAmount; actualAmount += reliefAmount; Commitment.status = relieved (or partially relieved); availableAmount unchanged at relief. [SCOR OE11 | data-model relief].
13. **Commitment-vs-actual reporting** (System). Open commitments, actual spend, remaining available, over-commitment exceptions per cost-center/period; feeds cost analytics (diagram 12). [SCOR OE11 / OE3 | data-model + platform-services].
14. **Budget reconciled to actual** (System, end).

## Gateways and branches (exact conditions)
- **value <= availableAmount?** `requisitionValueInBase <= Budget.availableAmount` -> within budget, proceed (no warning). `requisitionValueInBase > Budget.availableAmount` -> over budget, non-blocking warning, invoke override gateway.
- **Budget Owner override approved?** Approve -> proceed with overrideApprovedBy + overrideReason logged. Reject -> revise (does not proceed over budget without an approved, logged override).
- **availableAmount >= poValue OR override approved?**
  - `Budget.availableAmount >= poValueInBase` -> commit allowed.
  - `Budget.availableAmount < poValueInBase AND approved+logged override exists` -> commit allowed under override.
  - `Budget.availableAmount < poValueInBase AND no override` -> commit BLOCKED.

## Ledger postings (exact)
| Event | Posting | Notes |
| --- | --- | --- |
| Requisition (soft check) | none | informational warning only |
| PO issue (hard commit) | availableAmount -= poValue; committedAmount += poValue; create Commitment(status=committed) | encumbrance; reserves funds |
| GR / invoice (relief) | committedAmount -= reliefAmount; actualAmount += reliefAmount; Commitment.status = relieved | availableAmount unchanged at relief; partial GR relieves pro-rata |
| Return (diagram 11) | reverse the relief for the returned quantity | committed/actual adjusted back |

## Fields and values
- **Budget:** costCenterId / projectId, period, amount, availableAmount, committedAmount, actualAmount.
- **Commitment:** budgetId, poId, amount (= poValueInBase), status {committed, relieved} (+ partially relieved for partial GR/invoice).
- **Override:** overrideApprovedBy, overrideReason (mandatory on approve), logged to audit (category: budget).
- Soft check threshold: `value <= availableAmount` (warn if over). Hard-commit guard: `availableAmount >= amount OR override-with-approval`. Both comparisons inclusive.

## Edge cases and error handling
- **Soft over-budget at requisition:** warns only; the requisition can still be revised or sent for override; no ledger movement and no block at this stage.
- **Hard commit blocked at PO:** PO cannot issue until an override is obtained or the PO value reduced; this is the over-commitment prevention guard, not the soft check.
- **Override carried forward:** an approved override at requisition is honoured by the hard-commit guard so the PO is not re-blocked for the same shortfall.
- **Partial GR/invoice:** relieves committed -> actual pro-rata to the received/invoiced value; the Commitment can be partially relieved.
- **Returned quantity:** reverses the relief for that quantity (cross-link diagram 11).
- **FX:** poValueInBase and requisitionValueInBase are normalized via convertToBase; on rate failure the original amount is carried unconverted (graceful degradation), so the guard operates on approximate base values.
- **Multiple POs against one budget:** the encumbrance at first commit prevents a second PO from spending the same funds.

## Business rules and invariants
- Approval limits are not budget control; budget is a separate check + encumbrance.
- Soft check warns and never posts; hard commit posts the encumbrance; relief moves committed -> actual.
- availableAmount is reduced only at hard commit, not at relief.
- Over budget requires an approved, logged Budget Owner override to commit.
- Over-commitment is prevented by the hard-commit guard.
- The commitment posting is the natural GL integration point.
- Every posting emits audit + SSE.

## Cross-references
- **Diagram 02** (requisition): the soft check fires here on submit.
- **Diagram 05** (purchase order): the hard commit fires at PO issue.
- **Diagram 08 / 09** (GRN / invoice match): the relief fires at GR/invoice; GR/IR clearing runs alongside.
- **Diagram 11** (returns): a returned quantity reverses the relief.
- **Diagram 12** (analytics): commitment-vs-actual feeds the cost analytics.
- **e01** (approval routing): contrast - approval limits are not budget control.
- **Benchmarks:** SCOR OE11 Enterprise Business Planning; finance control (build-new). Sources: `model/data-model.md` (Budget/Commitment, state machine), `model/platform-services.md` service 11, `analysis/best-of-decisions.md`.
