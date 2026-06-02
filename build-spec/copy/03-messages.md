# Messages: Validation, Confirmation, Toasts, and Rewritten Exceptions

Every string the system speaks to the user: form validation, action confirmations, success and error toasts, and the model's internal exception strings rewritten as plain sentences. Each row names the trigger (the model guard, state-machine transition, or invariant it corresponds to) so the message is tied to a real rule, not invented. Internal strings (`BadRequestException`, guard expressions, camelCase) never appear; the user reads the right-hand column only.

Style: plain professional English, sentence case, no em dashes, no emojis, no marketing. A validation message states what is wrong and what to do. A confirmation states what will happen. A toast states what happened. (User global style rules.)

Message keys are stable; the prototype references `messages.<key>`. Where a message takes a value it is shown as `{placeholder}`.

## 1. Form validation (field-level and form-level)

| Key | Trigger (model rule) | Message |
| --- | --- | --- |
| `required.generic` | a mandatory field is empty | "{Field} is required." |
| `req.lines.min` | a requisition has no lines | "Add at least one line before submitting." |
| `req.line.qty.positive` | RequisitionLine.quantity <= 0 | "Quantity must be greater than zero." |
| `req.line.needDate.future` | need-by date in the past | "Need-by date cannot be in the past." |
| `req.justification.max` | justification > 2000 chars | "Justification cannot exceed 2000 characters." |
| `req.project.inactive` | selected project not ACTIVE (dictionary validation) | "This project or cost center is inactive and cannot be charged." |
| `mandatory.gate.advance` | guard `allMandatoryFieldsFilled(stage)` fails on stage advance (axiom A2) | "Complete the required fields for this stage before moving it forward. Missing: {fieldList}." |
| `currency.unconfigured` | currency not in the currency master | "Select a configured currency." |
| `supplier.gstin.format` | GSTIN regex fails (SupplierAddressTaxDetail) | "Enter a valid GSTIN (15 characters, e.g. 27ABCDE1234F1Z5)." |
| `supplier.pan.format` | PAN regex fails | "Enter a valid PAN (10 characters, e.g. ABCDE1234F)." |
| `supplier.vat.format` | EU VAT regex fails | "Enter a valid VAT number for {country}." |
| `supplier.trn.format` | UAE TRN regex fails | "Enter a valid 15-digit TRN." |
| `supplier.minOrder.positive` | minimumOrderValue < 0 | "Minimum order value cannot be negative." |
| `po.value.mismatch` | PO total does not reconcile with awarded quote | "PO value does not match the awarded quote. Re-check the lines." |
| `rfq.justification.required` | non-top-pick selected without justification (sourcing rule) | "Selecting a quote that is not the lowest landed cost requires a justification." |
| `installment.amount.range` | guard `amount>0 && amount<=agreed` fails | "Approved amount must be greater than zero and no more than the installment amount of {agreed}." |
| `reschedule.reason.required` | guard `mandatory note` on reschedule | "A reason is required to reschedule a payment." |
| `match.resolution.note.required` | guard `mandatory note` on accept-variance | "Add a note explaining why this variance is accepted." |
| `ncr.disposition.required` | disposition not chosen | "Select a disposition before closing the inspection." |
| `return.reason.required` | guard `reason in ReturnReason` | "Select a return reason." |
| `budget.override.reason.required` | budgetOverride.reason empty (axiom A4) | "An over-budget requisition needs a reason before it can proceed." |
| `import.file.empty` | bulk-import empty file (Raphe pattern) | "The file is empty. Download the template and add at least one row." |
| `import.headers.mismatch` | import header row wrong | "The column headers do not match the template. Download the template and try again." |

## 2. Action confirmations (AlertDialog / Dialog before a consequential action)

| Key | Action / transition | Title | Body | Confirm label |
| --- | --- | --- | --- | --- |
| `confirm.req.submit` | requestApproval on requisition | "Submit for approval?" | "This sends the requisition to the {stage} approver and locks the submitted fields." | "Submit" |
| `confirm.req.cancel` | cancel | "Cancel this requisition?" | "Cancelling stops the requirement. This cannot be undone." | "Cancel requisition" |
| `confirm.approve` | approve | "Approve {identifier}?" | "You are approving the {stage} stage for {amount}." | "Approve" |
| `confirm.return.revision` | returnForRevision | "Send back for revision?" | "The requester will be asked to revise. Add a note explaining what to change." | "Send back" |
| `confirm.po.issue` | issue PO (guard: budget committed, supplier ONBOARDED, buyer != approver) | "Issue this purchase order?" | "Issuing commits {amount} against {project} and sends the PO to {supplier}." | "Issue PO" |
| `confirm.po.amend` | amend (guard: before first GR, editableUntilReceipt) | "Amend this PO?" | "The PO can be amended until the first goods receipt. The change is recorded in the audit trail." | "Amend" |
| `confirm.grn.post` | create goods receipt | "Post goods receipt?" | "Receiving {qty} of {item}. Quantities over the PO tolerance will be flagged." | "Post GRN" |
| `confirm.ncr.raise` | raiseCapa / NCR | "Raise an NCR?" | "This records a non-conformance against {supplier} and starts a corrective action. It affects the supplier scorecard." | "Raise NCR" |
| `confirm.supplier.suspend` | suspend (guard: failed audit, expired cert, sanctions, or active CAPA, axiom A11) | "Suspend {supplier}?" | "Suspension blocks new awards. Existing commitments are unaffected. Reason is required." | "Suspend supplier" |
| `confirm.supplier.offboard` | offboard | "Offboard {supplier}?" | "Offboarding permanently deactivates the supplier. It cannot be selected for new business." | "Offboard" |
| `confirm.installment.process` | process (status in APPROVED/PARTIAL_APPROVAL) | "Process this payment?" | "Recording payment of {amount} to {supplier}. Attach the payment receipt." | "Process payment" |
| `confirm.schedule.edit.revert` | edit on a schedule where financialRevertOnEdit (axiom A7) | "Editing reverts the finance approval" | "This schedule was auto-approved. Changing the terms or the amounts will send it back for finance approval." | "Edit and revert" |
| `confirm.return.create` | open RMA | "Create a return?" | "This raises an RMA to {supplier} for {qty} of {item} ({reason})." | "Create return" |

## 3. Success toasts (after a mutation; sonner pattern from the reference UI)

| Key | After | Message |
| --- | --- | --- |
| `toast.req.created` | requisition created | "Requisition {identifier} created." |
| `toast.req.submitted` | submitted for approval | "Sent to {approver} for approval." |
| `toast.approved` | approve | "{identifier} approved." |
| `toast.autoApproved` | autoApprove (under limit, axiom A7) | "Approved automatically (within the approval limit)." |
| `toast.sentBack` | returnForRevision | "Sent back to {requester} for revision." |
| `toast.po.issued` | PO issued | "PO {number} issued to {supplier}. Budget committed." |
| `toast.po.acknowledged` | supplier acknowledges | "{supplier} acknowledged PO {number}." |
| `toast.grn.posted` | GRN posted | "Goods receipt {grnNumber} posted." |
| `toast.match.cleared` | match exception resolved | "Match cleared. The invoice can proceed to payment." |
| `toast.ncr.raised` | NCR raised | "NCR {identifier} raised against {supplier}." |
| `toast.capa.closed` | closeCapa (effectiveness verified) | "Corrective action closed." |
| `toast.supplier.onboarded` | supplier approved onto AVL | "{supplier} onboarded to the Approved Vendor List." |
| `toast.payment.processed` | installment processed | "Payment of {amount} recorded for {supplier}." |
| `toast.installment.rescheduled` | reschedule | "Installment moved to {newDate}." |
| `toast.import.complete` | bulk import (reference UI wording) | "Import complete: {created} created, {updated} updated." |
| `toast.saved` | generic save | "Changes saved." |

## 4. Error toasts (user-fixable failures; rewritten from model exceptions)

The model raises typed exceptions with developer strings. The user reads these instead. None of the raw exception text reaches the screen.

| Key | Internal exception / guard | User message |
| --- | --- | --- |
| `err.noApprover` | `BadRequestException 'No eligible approver'` (approver resolution) | "No approver is available for this stage. Contact your administrator to set up routing for {department}." |
| `err.selfApprove` | guard `NOT own req/PO` (axiom A6) | "You cannot approve your own requisition." |
| `err.maker.checker` | guard maker != checker on payment release (axiom A6) | "The person who prepared this payment cannot also release it." |
| `err.receiver.approver` | guard receiver != invoice approver (axiom A6) | "You received these goods, so you cannot approve the matching invoice." |
| `err.stage.gate` | `'Cannot advance: mandatory fields missing'` (A2) | "This stage cannot move forward yet. Complete: {fieldList}." |
| `err.illegalTransition` | a transition not in the state machine | "That action is not available in the current state." |
| `err.over.limit` | over the auto-approval / approver limit (A7) | "This amount is above your approval limit of {limit}. It needs a higher approver." |
| `err.supplier.notOnboarded` | PO issue guard `supplier ONBOARDED` | "{supplier} is not on the Approved Vendor List yet. Complete onboarding before issuing a PO." |
| `err.supplier.suspended` | award attempted to a SUSPENDED supplier (A11) | "{supplier} is suspended and cannot be awarded new business." |
| `err.budget.exceeded` | over budget without override (A4) | "This requisition is over the available budget for {project} by {amount}. Record an over-budget reason to proceed." |
| `err.duplicate.invoice` | duplicate-invoice exception (supplier+invoiceNo+amount) | "This invoice looks like a duplicate of {existingInvoice} and has been put on hold. Review before releasing." |
| `err.schedule.locked` | edit on a locked PaymentSchedule | "This payment schedule is locked and cannot be changed." |
| `err.fx.unavailable` | FX service failure (graceful degradation, A12) | "The exchange rate is unavailable, so the base-currency total is not shown. The transaction amount is correct." |
| `err.permission` | `ForbiddenException` / RBAC fail | "You do not have permission to do that." |
| `err.generic` | unhandled server error | "Something went wrong. Try again, and if it persists, contact your administrator." |

## 5. Inline rule banners (shown on the screen, not a toast)

Persistent context, displayed inline on the relevant screen (an `Alert` / banner), tied to a model rule the screen demonstrates.

| Key | Screen / condition | Banner |
| --- | --- | --- |
| `banner.duplicate.hold` | invoice match, duplicate-invoice on hold | "On hold: possible duplicate of {existingInvoice} (same supplier, invoice number, and amount). Confirm it is not a duplicate before releasing." |
| `banner.priceSpike` | sourcing, a quote > 5% above the last purchase price | "Price alert: this quote is {pct} above the last purchase price of {lastPrice}." |
| `banner.landedFlip` | landed-cost comparison, cheapest unit != lowest landed | "Lowest unit price is not the lowest landed cost. {supplierA} is cheapest per unit; {supplierB} is lowest landed once freight and duty are included." |
| `banner.budget.over` | requisition over budget | "Over budget: this requisition exceeds the available budget for {project} by {amount}. Proceeding requires an over-budget reason." |
| `banner.tolerance.amend` | GRN quantity within PO tolerance | "Received quantity is {pct} over the order, within the {tol} tolerance. The PO will be amended to match before the goods receipt is posted." |
| `banner.cert.expiring` | supplier certificate within the alert window | "{supplier}'s {certName} expires in {days} days. Renew it to keep the supplier on the Approved Vendor List." |
| `banner.capa.nearSuspend` | supplier 2 periods below threshold with an open CAPA | "{supplier} has been below target for {n} periods with an open corrective action. One more failure triggers suspension." |
| `banner.overdue.installment` | installment past due | "Overdue by {days} days. A reminder was sent to {supplier}." |
| `banner.financialRevert` | editing an auto-approved schedule | "This schedule was auto-approved. Saving changes to the terms or amounts will send it back for finance approval." |

These nine banners are the model's most distinctive rules made visible. They are the difference between a form that holds data and a system that enforces procurement logic; each one is an acceptance criterion on its screen (`build-spec/screens/`).
