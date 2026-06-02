# Transitions and Effects

How a `transition(id, action, payload, ctx)` call executes, and the concrete mapping from each state-machine transition (`../schema/state-machines.ts`, 10 machines) to its store mutation and side effects. This is the engine that makes actions real and illegal states unreachable.

## The transition algorithm (one path for every entity)

```
transition(id, action, payload, ctx):
  1. record   = store.get(entity, id)
  2. machine  = stateMachine(entity, dimension)
  3. t        = machine.transitions.find(from == record[dimension] && on == action)
                if none -> throw IllegalTransition  (-> "That action is not available in the current state")
  4. checkGuard(t.guard, record, payload, ctx)
                if fails -> throw the typed error mapped to the guard (see the guard map below)
  5. next     = { ...record, [dimension]: t.to, ...payload.allowedFields }
  6. applyEffect(t.effect, record, next, ctx)   // the concrete effects below
  7. store.put(entity, next)
  8. auditService.append({ entity, id, action, actor: ctx.currentUser, before: record, after: next, at: TODAY })
  9. eventBus.emit(`${entity}.${action}`, { id })
  10. return next
```

Steps 3 and 4 are why illegal states cannot be reached: there is no code that sets a state field outside this function, and a transition only fires if a matching, guard-satisfied transition exists. Step 9 is why the rest of the UI updates: subscribers re-query.

## Guard map (guard expression -> check -> user error if it fails)

The guards are written in the state machines as axiom-backed expressions; the engine evaluates them against the store + ctx + payload. The ones that are data rules (not just UI gating) are enforced here.

| Guard (from state-machines.ts) | Check | Error if false (`../copy/03`) |
| --- | --- | --- |
| `allMandatoryFieldsFilled(stage)` (A2) | every mandatory field for the stage is set (field config) | `err.stage.gate` (lists missing) |
| `newIndex == currentIndex+1` (A2) | one step forward only | `err.illegalTransition` |
| `NOT own req/PO` (A6) | ctx.currentUser != record.requesterId / creator | `err.selfApprove` |
| `actor==approvalRequestedTo \|\| qualified assignee` | ctx is the requested approver or a qualified assignee | `err.permission` |
| `FINANCE && amountInBase <= approverLimit` (A7) | auto-approval threshold | (no error; this is the auto path) |
| `isAutoApproved && (payTerms\|\|schedules) changed` (A7) | financial revert condition | (effect, not a block) |
| `budget committed && supplier ONBOARDED && buyer!=approver` | PO issue preconditions | `err.supplier.notOnboarded` / `err.selfApprove` |
| `status==ONBOARDED` (award) | supplier on AVL and not suspended | `err.supplier.suspended` |
| `stage==POST_DELIVERY && allStagesAPPROVED && allMatchesCleared && noOpenNcrCapaBlock` (A3) | the COMPLETED guard | (system-only; not user-triggered) |
| `matchType=THREE_WAY iff grnId set; within tolerance incl. tax` (A8) | match reconciliation | produces a MatchException, not an error |
| `mandatory note` (reschedule, return-for-revision, on-hold, accept-variance) | the note/remarks field is present | the matching `*.required` validation |
| `RMA number issued` / `reason in ReturnReason` (S4.2/S4.3) | return preconditions | `return.reason.required` |
| `amount>0 && amount<=agreed` (installment) | partial-approval bounds | `installment.amount.range` |
| schedule `locked` | edit blocked | `err.schedule.locked` |

## Concrete effects (the `effect` strings made real)

The model's `effect` annotations become store mutations and service calls. The marquee effects:

| Transition | Effect made concrete |
| --- | --- |
| Approval `requestApproval` -> AWAITING | resolve the approver (least-loaded, urgency-weighted from priority weight), set assignee, emit `approval.requested`, the record enters that approver's queue |
| Approval `approve` -> APPROVED | mark stage APPROVED; route to the next stage (set its completion to IN_PROGRESS); update the OTIF/cycle stat; if last stage, the status machine can evaluate COMPLETED; record leaves the approver's queue |
| Approval `autoApprove` -> APPROVED | set `isAutoApproved=true`; recurse to route the next stage; show the "Auto-approved" badge (A7) |
| Approval `financialRevert` | if an auto-approved schedule's terms/amounts changed, revert that stage to AWAITING_APPROVAL; surface `banner.financialRevert` (A7) |
| PO `issue` | `budgetService.commit(poId)` (hard commitment, A4); over-budget needs a logged `budgetOverride`; set status; emit `po.issued`; supplier-acknowledge becomes available; advance payment triggers per terms |
| PO `amend` (before first GR) | allowed only while `editableUntilReceipt`; audited; recompute totals (postValueSync) |
| GRN `create` | append a partial-delivery block; recompute the derived delivery status; if over PO qty within tolerance, amend the PO first (`banner.tolerance.amend`); if QC category, open an Inspection; emit `grn.posted` |
| Inspection fail | raise an NCR; `scorecardService.recompute` ticks the supplier's consecutive-below streak; may trip toward SUSPENDED (`banner.capa.nearSuspend`) |
| Invoice `runMatch` | `matchService.run` -> MatchResult or a typed MatchException; duplicate (supplier+invoiceNo+amount) -> hold + `banner.duplicate.hold` |
| MatchException `resolve` (accept/adjust) | clear the exception; relieve GR/IR; the invoice proceeds to payment; emit `match.cleared` |
| MatchException `resolve` (credit/debit-note) | create a CreditDebitNote; post to the creditor ledger |
| Installment `approve`/`partial-approve` | maker prepares, checker releases (maker != checker, A6); partial creates a remainder installment; status -> APPROVED/PARTIAL_APPROVAL |
| Installment `process` | record payment + receipt; post to creditor ledger; update DPO; emit `installment.processed` |
| Installment overdue | the seed stages one overdue; the demo-today computation fires the ~28-day reminder flag + `banner.overdue.installment` |
| Supplier `approve` -> ONBOARDED | qualification complete (certs/COA/AVL); supplier becomes awardable |
| Supplier `edit` (when ONBOARDED) | reverts to PENDING_APPROVAL; `isErpSynced=false` (A10) |
| Supplier `suspend` | guard: failed audit / expired cert / sanctions / active CAPA (A11); blocks new awards, existing commitments stand |
| Item lifecycle (same shape as Supplier) | the item state machine is identical to the supplier one (PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED, SUSPENDED, OFFBOARDED); the same transition rows apply, `edit` reverts to PENDING_APPROVAL and sets `isErpSynced=false` (A10) |
| Requisition `changeStatus` -> COMPLETED | system-evaluated when the A3 guard holds; `budgetService.relieve` moves commitment to actual; emit `ticket.completed` |
| Return `open` -> credit/debit note posted | RMA issued; reason recorded; links GRN/NCR; credit note posts to ledger (S4) |

## Determinism in effects

Effects that would normally use the clock use the pinned demo-today (2026-06-01): overdue/expiry computations, audit timestamps in the demo, reminder firing. Approver resolution (least-loaded) is deterministic given the seeded queue loads. The reset restores the exact pre-demo state.

## Why effects-as-engine (intent)

Without effects, an "Approve" button just flips a label and the next screen looks unchanged: a mockup. With effects, approving routes the record to the next person's real queue, issuing a PO moves a real budget number, clearing a match lets a real invoice flow to a real payment screen. The presenter can follow one requirement across roles and the system stays consistent the whole way, because every step is a guarded transition with a real effect, audited and broadcast. That coherence is the demo.
