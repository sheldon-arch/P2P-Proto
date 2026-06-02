# 10 Payments and Installments - Unified Procure-to-Pay

- **BPMN file:** 10-payments.bpmn
- **Spec:** .build/specs/10-payments.json

## Scope, trigger, outcome

- **Scope:** Building the payment schedule from payment terms, approving installments full or partial (with a single remainder), applying withholding tax, advance recoupment and retention, the maker prepares / checker releases segregation of duties, processing the payment with a receipt, rescheduling held entries (capturing the original date), the locked-schedule rule, the cash-float track for cash buys (no PO reference), the per-supplier creditor ledger, the paid / upcoming / overdue amount breakdown, and the overdue payment reminder. This is the expansion of the overview steps "Schedule and process payment (installments)" and "Approve payment release (checker)" after invoice match (diagram 09).
- **Trigger:** An invoice was matched and approved (diagram 09), or a PO was acknowledged with an advance term due at acknowledgement (diagram 05).
- **Outcome:** All schedule installments are PROCESSED (or accounted via a credit/debit note), GR/IR is cleared (diagram 09), the advance is recouped, retention is released per condition, withholding is remitted, the creditor ledger and ticket payment totals are updated, and the supplier (or cash handler) is confirmed. Feeds cycle close-out and analytics (diagram 12).

## Actors (lanes)

Canonical lane ids and names (SPEC-SCHEMA vocabulary):

- **Procurement / Buyer** (L_buyer): the cash-float track (cash buy, float reimbursement request).
- **Finance - Maker** (L_finmaker): builds the schedule, approves installments, prepares payment, processes payment, reschedules with reason. Maker only, never the checker.
- **Finance - Checker** (L_finchecker): the Chief Accountant who reviews and releases the prepared payment. The only second-person release gate.
- **Management** (L_mgmt): the terminal approval vertical. For releases at or above the configurable management threshold (releaseAmountInBase >= managementReleaseThreshold), Management approves the release before processing; this is where the MANAGEMENT vertical completion is exercised through the installment release. Below threshold the checker approval suffices and the step auto-passes. [SCOR OE1/S2.7 | source: RA MANAGEMENT vertical]
- **Supplier / Vendor** (L_supplier): receives the payment confirmation on the order thread.
- **Platform / System** (L_sys): lock guard, status transitions, withholding / advance / retention netting, process guard, total recomputation, creditor ledger, destination split, float top-up, overdue reminder timer, audit and SSE.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Each step is tagged [SCOR code | ISO clause | source].

1. **Approved payable / acknowledged PO** (Finance-Maker, start). Entry from diagram 09 or an advance term from diagram 05. [SCOR S2.7 | source: RA installments + AB payment terms]
2. **Build payment schedule (entries + terms)** (Finance-Maker). The schedule is a set of installment entries fixed when the supplier/PO is finalised; each entry carries amount, an event or a date, a description and a term (full field set and the locked term dropdown below). Editing payTerms or paymentSchedules reverts auto-approved Finance/Management completions to AWAITING_APPROVAL. [SCOR S2.7 / OE6 | source: AB locked term list + RA schedule]
3. **Schedule locked?** (System, exclusive). If any installment is APPROVED, PARTIAL_APPROVAL or PROCESSED the schedule is locked; upsert and delete of entries are silently skipped, new schedules (no id) are always created. Only null (pending) and RESCHEDULED entries are editable. [SCOR S2.7 | source: RA e03 locked schedule]
4. **Cash float buy (no PO) or credit/advance?** (Buyer, exclusive). A cash on-the-spot buy takes the cash-float track; credit / advance / reimbursement against PO and invoice takes the installment approval track. [SCOR S2.7 | source: AB local-purchase cash branch]
5. **Cash buy on float, log receipt (no PO)** (Buyer). Buys on the configurable cash float (default OMR 300), collects the vendor receipt; Stores raise a cash-purchase GRN against the requisition with no PO reference; the handler logs the receipt and deducts spend from the float. [SCOR S2.7 | source: AB cash float + cash GRN]
6. **Float nearing limit?** (Buyer, exclusive). If the float is at or below the reimbursement threshold (default about OMR 100 left), request reimbursement; otherwise the cash purchase closes and the float carries forward. [SCOR S2.7 | source: AB float reimbursement]
7. **Request float reimbursement** (Buyer). A reimbursement request that routes into the maker prepares step; the destination is the cash handler, not a supplier. [SCOR S2.7 | source: AB reimbursement to settlement]
8. **Approve installment: amount vs agreed?** (Finance-Maker, exclusive). Validation: amount greater than 0 and at most the agreed amount, else BadRequestException and the installment stays pending. amount equal to agreed sets APPROVED; amount between 0 and agreed sets PARTIAL_APPROVAL and creates one remainder. [SCOR S2.7 | source: RA e04 approve]
9. **Status = APPROVED (full)** (System). amount equal to agreed; no remainder; records approvedAmount equal to agreed. [SCOR S2.7 | source: RA approve full]
10. **Status = PARTIAL_APPROVAL + create ONE remainder** (System). amount between 0 and agreed; creates exactly one remainder installment (leftover = agreed minus approved; same date, schedule and description; status null). [SCOR S2.7 | source: RA e04 remainder]
11. **Apply withholding tax (TDS/WHT)** (System). Withholding on cross-border services; net payable = approvedAmount minus withholdingAmount; the withheld portion is remitted to the authority separately. [SCOR S2.7 | source: build-new tax service]
12. **Recoup advance, withhold retention** (System). Recovers an existing AdvancePayment against this and later invoices and withholds a configured retention percentage released on acceptance or warranty; the net release is approvedAmount minus withholding minus advance recouped minus retention withheld. [SCOR S2.7 | source: data-model AdvancePayment + Retention]
13. **Maker prepares payment for release** (Finance-Maker). Prepares the net release; maker is the preparer only, not the checker. Convergence point for the credit/advance track, the cash reimbursement track, the reschedule re-entry and the overdue reminder. [SCOR S2.7 | source: AB maker prepares + role-matrix SoD]
14. **Checker (Chief Accountant) reviews release** (Finance-Checker). Reviews against the schedule and cash flow and approves it to pay or holds it; maker is not the checker (financial-control segregation per SOX/COSO and ISO 37001, not ISO 9001). [SCOR S2.7 | source: AB Chief Accountant + financial-control SoD]
15. **Approved to pay?** (Finance-Checker, exclusive). Approve proceeds to the process guard; hold (signatory unavailable or cash flow) reschedules with reason. [SCOR S2.7 | source: AB approved-to-pay vs not-now]
16. **Processable status?** (System, exclusive). Only APPROVED or PARTIAL_APPROVAL are processable; otherwise the process call raises BadRequestException. [SCOR S2.7 | source: RA process guard]
17. **Process payment + upload receipt** (Finance-Maker). Sets PROCESSED with processedAt, processedById and the optional receipt; the receipt is stored at receipts/{ticketId}/{originalFilename}; an upload failure fails the whole operation; PROCESSED is terminal. Realized FX gain/loss is computed between PO date rate and payment date rate. [SCOR S2.7 | source: RA process + receipt path]
18. **Reschedule with reason (capture originalDate)** (Finance-Maker). The first reschedule captures the current date as originalDate (preserved thereafter); sets date to newDate and status RESCHEDULED; amount and originalDate are unchanged on later reschedules; re-enters prepare when due. [SCOR S2.7 | source: RA reschedule + AB hold-reschedule]
19. **Recompute totals, update ledgers + completions** (System). Recomputes the paid / upcoming / overdue / pending breakdown (precise rules below), updates the per-supplier creditor ledger, emits INSTALLMENT_STATUS_UPDATED, updates the MANAGEMENT vertical completion, and writes audit plus SSE. [SCOR S2.7 | source: RA getAmounts + post-commit + AB creditor ledger]
20. **Destination?** (System, exclusive). Supplier destination emails the confirmation on the order thread; cash-handler destination tops up the float. [SCOR S2.7 | source: AB destination split]
21. **Email payment confirmation to supplier** (Supplier). The supplier receives the payment confirmation / receipt copy on the order thread. [SCOR S2.7 | source: AB email confirmation]
22. **Top up cash float to ceiling** (System). The cash handler collects cash and the float is topped back to its configured ceiling; float carries forward. [SCOR S2.7 | source: AB float top-up]
23. **More schedule entries due?** (System, exclusive). Any pending or due RESCHEDULED entry with net amount remaining loops to the next entry (including remainders created by partial approval); otherwise close out. [SCOR S2.7 | source: AB next-entry loop + RA remainder]
24. **Overdue reminder timer (~28d before due)** (System, non-interrupting boundary on the schedule). Fires about 28 days before a 30-day term is due (the same number of days before due for 60/90-day terms), spawning the overdue reminder without interrupting the main flow. [SCOR S2.7 | source: AB overdue reminder ~28d]
25. **Send overdue payment reminder to Accounts** (System). Emails Accounts/Finance so the maker prepares the due credit installment; informational only, does not change installment status. [SCOR S2.7 | source: AB overdue reminder + platform-services notifications]
26. **Payments settled, ledger updated** (System, end). Feeds cycle close-out and analytics (diagram 12). [SCOR S2.7 to OE3 | source: RA + AB settlement]

## Gateways and branches (exact conditions)

| Gateway | Branch | Exact condition |
| --- | --- | --- |
| Schedule locked? | locked | any installment.status in {APPROVED, PARTIAL_APPROVAL, PROCESSED} (upsert + delete silently skipped) |
| | editable | else (only null and RESCHEDULED entries editable) |
| Cash float buy or credit/advance? | cash | purchaseChannel == 'cash' (on-the-spot, no PO reference) |
| | credit/advance | else (against PO + invoice) |
| Float nearing limit? | reimburse | floatBalance <= reimbursementThreshold (default about OMR 100 left of OMR 300) |
| | float ok | else (cash purchase closed, float carries forward) |
| Approve installment: amount vs agreed? | full | amount == installment.amount (agreed): APPROVED, no remainder |
| | partial | 0 < amount < installment.amount (agreed): PARTIAL_APPROVAL + one remainder |
| | rejected | amount <= 0 OR amount > agreed: BadRequestException, stays pending |
| Approved to pay? | approve | checkerDecision == 'approve' (to process guard) |
| | hold | checkerDecision == 'hold' (signatory unavailable / cash flow): reschedule |
| Processable status? | process | installment.status in {APPROVED, PARTIAL_APPROVAL} |
| | not processable | else: BadRequestException |
| Destination? | supplier | destination == 'supplier' (email confirmation) |
| | cash handler | destination == 'cashHandler' (float reimbursement, top up) |
| More schedule entries due? | next entry | any installment.status == null (pending) OR (RESCHEDULED with date due) AND net amount remaining > 0 |
| | all settled | else (close out) |
| Overdue reminder timer (boundary) | fire | non-interrupting; fires about 28 days before a 30-day term is due (same lead in days for 60/90) |

## Installment state machine (precise)

- States: null (pending, initial), APPROVED, PARTIAL_APPROVAL, PROCESSED, RESCHEDULED.
- null to APPROVED: approve with amount equal to agreed.
- null to PARTIAL_APPROVAL: approve with 0 less than amount less than agreed; creates exactly one remainder (null status, leftover = agreed minus approved, same date / schedule / description).
- APPROVED or PARTIAL_APPROVAL to PROCESSED: process; guard status in {APPROVED, PARTIAL_APPROVAL}; receipt optional; terminal, no un-process.
- null or PROCESSED to RESCHEDULED: reschedule; the first reschedule captures originalDate.
- Approve validation: amount greater than 0 and at most the agreed amount, else BadRequestException and stays pending.
- Schedule lock: any installment in {APPROVED, PARTIAL_APPROVAL, PROCESSED} locks the schedule; upsert and delete are silently skipped; only null and RESCHEDULED entries are editable; new schedules (no id) are always created.

## Amount breakdown (getAmounts, precise)

- **Paid** = sum of approvedAmount across PROCESSED installments.
- **Upcoming** = sum of non-processed installments with date >= start-of-today.
- **Overdue** = sum of non-processed installments with date < start-of-today. The overdue boundary is 00:00:00 start-of-today (no timezone handling); a null date is treated as upcoming, not overdue.
- **Pending** = totalAmount minus Paid; any shortfall is added to Upcoming.
- Writes Ticket.totalAmountPaid, upcomingPaymentAmount and overduePaymentAmount; recomputed live on each request, never cached.

## Fields and dropdowns (full detail)

### Schedule entry (TicketPaymentInstallment)

| Field | Type | Mandatory | Default | Validation | Owning role |
| --- | --- | --- | --- | --- | --- |
| amount | number > 0 | yes | none | > 0; stored as Float (null treated as 0) | Finance-Maker |
| event-or-date | event OR date | yes | none | one of the event values OR a fixed date | Finance-Maker |
| description | text | yes | none | non-empty | Finance-Maker |
| term | dropdown | yes | none | one of the locked term values | Finance-Maker |
| status | enum | system | null (pending) | one of {null, APPROVED, PARTIAL_APPROVAL, PROCESSED, RESCHEDULED} | System |

Event values for event-or-date: after PO, against documents, on delivery, on milestone acceptance (or a fixed date instead of an event).

### Payment term dropdown (locked allowed list, exact values)

- 100% advance
- part-advance + balance against documents
- part-advance + balance against shipment received
- 30/70 (and other split combinations)
- net 30
- net 60
- net 90

About 90% of local and US supplies are net 90.

### Approve installment (ApproveInstallmentDto)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| amount | number | yes | > 0 AND <= agreed (installment.amount), else BadRequestException |
| remarks | text | no | free text |

Records approvedAmount, approvedById, approvedAt, note.

### Process installment (ProcessInstallmentDto, multipart)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| paymentDate | ISO date | yes | valid date |
| notes | text | no | free text |
| file (receipt) | file | no | stored at receipts/{ticketId}/{originalFilename}; upload failure fails the op |

Sets PROCESSED, processedAt, processedById, receiptFile.

### Reschedule installment

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| newDate | ISO date | yes | valid date; sets date and RESCHEDULED |
| reason | text | no | hold reason (signatory / cash flow) |

First reschedule captures originalDate; amount and originalDate unchanged thereafter.

### Withholding, advance, retention (System netting)

| Field | Type | Notes |
| --- | --- | --- |
| withholdingTaxCodeId | ref TaxCode | TDS / WHT on cross-border services |
| withholdingAmount | number | remitted to authority separately |
| advanceRecouped | number | recovers AdvancePayment (status requested to paid to recouped; recoupedAgainstInvoiceIds) |
| retentionWithheldPercent | number (%) | held; released on acceptance or warranty (status withheld to released) |

Net release = approvedAmount minus withholdingAmount minus advanceRecouped minus retentionWithheld.

### Cash-float fields (Buyer)

| Field | Type | Mandatory | Default | Validation |
| --- | --- | --- | --- | --- |
| floatBalance | number (configurable currency) | yes | OMR 300 ceiling | currency + ceiling configurable |
| spendAmount | number > 0 | yes | none | > 0 |
| vendorReceipt | file | yes | none | receipt attached |
| reason | text | no | none | free text |
| reimbursementThreshold | number | system | about OMR 100 left | configurable |
| reimbursement amount | number > 0 | yes (on reimburse) | top-up to ceiling | > 0 |

The cash-purchase GRN carries no PO reference; cash-purchase spend is reported alongside credit.

### Configurable values and thresholds

| Value | Default | Fixed or configurable |
| --- | --- | --- |
| Cash float ceiling | OMR 300 | configurable (currency + amount) |
| Float reimbursement threshold | about OMR 100 left (about OMR 200 spent) | configurable |
| Overdue payment reminder lead | about 28 days before a 30-day term (same day-count lead for 60/90) | configurable |
| Overdue boundary (amount breakdown) | 00:00:00 start-of-today | fixed rule |
| Remainder per partial approval | exactly one | fixed rule |

## Edge cases and error handling

- **Partial approval remainder:** exactly one remainder is created per partial approval; the remainder is itself a pending entry that re-enters the next-entry loop and can be approved or partially approved again.
- **Locked schedule:** once any installment is APPROVED, PARTIAL_APPROVAL or PROCESSED, edits and deletes to existing entries are silently skipped (no error); new schedules are still created.
- **Approve out of range:** amount of 0 or less, or greater than the agreed amount, raises BadRequestException and leaves the installment pending.
- **Not processable:** processing a pending, RESCHEDULED or already-PROCESSED installment raises BadRequestException; PROCESSED is terminal with no un-process.
- **Receipt upload failure:** the whole process operation fails so status is not set without the intended receipt.
- **Hold and reschedule:** a checker hold (signatory unavailable or cash flow) reschedules with reason and re-enters prepare when due; the first reschedule preserves the original date.
- **Financial-info revert:** editing payTerms or paymentSchedules reverts auto-approved Finance/Management completions to AWAITING_APPROVAL.
- **Cash float low:** when the float is at or below threshold the reimbursement runs the same maker/checker pipeline with the cash handler (not a supplier) as the destination.
- **Null date entries:** in the amount breakdown a null date is treated as upcoming, not overdue.

## Business rules and invariants

- Maker is not the checker: a financial-control segregation per SOX/COSO and ISO 37001, not ISO 9001. The checker (Chief Accountant) is the only second-person release gate.
- The payment term dropdown is a locked allowed list; no free-text terms.
- The schedule is fixed when the supplier/PO is finalised; lock and revert rules protect committed money.
- Withholding, advance recoupment and retention all net down the release amount before processing.
- The cash-float track produces a cash GRN with no PO reference and reimburses when the float is low; cash spend is reported alongside credit.
- The creditor ledger is per supplier and read-only to procurement (name, amount, payment terms, transaction history).
- The amount breakdown is recomputed live and never cached; the overdue boundary is start-of-today.
- Every committed change emits INSTALLMENT_STATUS_UPDATED, updates the MANAGEMENT vertical completion, and writes audit plus SSE.

## Cross-references

- Upstream: 09 invoice capture and matching (approved net payable, credit/debit notes, GR/IR clearing), 05 purchase order (advance term at acknowledgement, exchange rate), 04 sourcing (payment terms agreed at award).
- Downstream: 12 analytics (DPO, savings realization, creditor ageing, cash-vs-credit spend).
- Returns: 11 returns / RMA / CAPA (a return acceptance adjusts the payable via the credit/debit note used in diagram 09).
- Benchmarks: SCOR S2.7 Authorize Supplier Payment (`analysis/scor-procurement-map.md`), financial-control segregation (SOX/COSO + ISO 37001, not ISO 9001, per `iso-supply-chain-standards`), DPO and AP KPIs (`procurement-metrics-kpis`).
- Platform services: tax (withholding, reverse-charge), FX (realized gain/loss between PO and payment), budget/commitment, document storage (receipts), notifications (overdue reminder, installment status), audit, SSE (`model/platform-services.md`); installment, schedule, advance, retention, creditor ledger, cash float entities (`model/data-model.md`).
