# 11 Returns and RMA - Unified Procure-to-Pay

- **BPMN file:** 11-returns-rma.bpmn
- **Spec:** .build/specs/11-returns-rma.json

## Scope, trigger, outcome
- **Scope:** The full source-return cycle (SCOR S4) for goods already received from a supplier: initiate, authorize (RMA), identify condition/reason, schedule the return shipment, and close or adjust the return order with the matching credit or debit note against the payable. This was a gap in both source companies and is built new against SCOR S4 and ISO 8.7/10.2.
- **Trigger:** Two entry conditions. (a) An NCR disposition is set to `return` at receiving inspection or post-GRN (the loop in e04 / the QC gate in diagram 08), carrying `linkedNcrId`. (b) A buyer-initiated return outside the NCR path (over-delivery beyond PO tolerance, wrong item shipped, supplier-acknowledged error), with `linkedNcrId = null`.
- **Outcome:** The Return is closed, goods are returned or written off, the payable is adjusted via a supplier credit note or a buyer debit note (or the GR/IR accrual is simply reversed when nothing was invoiced), the commitment is reconciled, the linked NCR (if any) is updated, and the supplier scorecard is fed. Fully audit-traceable.

## Actors (lanes)
Quality (initiates on NCR, classifies condition), Procurement/Buyer (handles the return, authorizes with the supplier), Supplier/Vendor (authorizes the RMA, confirms receipt, issues credit note), Receiving/Warehouse (schedules and dispatches the physical return), Finance-Maker (records credit note / raises debit note), Platform/System (closes, posts ledger and budget adjustments, feeds the NCR/CAPA loop and scorecard). Permission detail in `model/role-permission-matrix.md` (Returns/RMA group: return.initiate, return.authorize, return.schedule, return.close, return.view).

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Return trigger raised** (Quality, start). Entry from an NCR disposition = return, or a buyer-initiated return. [SCOR S4.1 | ISO 8.7 | build-new + AB NCR].
2. **S4.1 Initiate source return** (Quality). Create the Return/RMA record: returnId (auto, immutable), sourceOrderId (PO), supplierId (auto), linkedNcrId (mandatory if NCR-triggered, else null), returnType, lines with quantityToReturn and reasonCode. On submit Return status = raised. [SCOR S4.1 | ISO 8.7 | data-model Return/RMA].
3. **S4.2 Request / authorize product return** (Buyer). Request authorization from the supplier via the email + OTP external form; record the supplier-issued rmaNumber, authorizationStatus, supplierReturnAddress, restockingFeePercent. [SCOR S4.2 | ISO 8.7 | build-new + RA OTP form].
4. **authorizationStatus == authorized?** (Buyer, exclusive). Authorized with an rmaNumber proceeds; declined or no-response escalates.
5. **Escalate declined return** (Buyer). Record declineReason, set Return status = blocked, route back to the e04 NCR handler for an alternative disposition; a unilateral debit note may still be raised. [SCOR S4.2 | ISO 8.7 | build-new + e04].
6. **S4.3 Identify product condition / return reason** (Quality). Classify each line: reasonCode in {defective, damaged, wrong-item, over-delivery, expired, quality-fail}; conditionDescription, percentNonConformance, images. The reasonCode drives the financial direction at closure. [SCOR S4.3 | ISO 8.7 | AB NCR fields].
7. **S4.4 Schedule product shipment** (Receiving/Warehouse). Arrange the return: carrier, returnLabelRef + who-pays, pickupDate, returnTrackingNumber, returnIncoterm (Incoterms 2020 validated against transport mode), segregationLocation. On dispatch Return status = in-transit; ETA-approaching alarm fires. [SCOR S4.4 | ISO 8.7 | build-new + AB delivery tracking].
8. **Supplier confirms receipt of returned goods** (Supplier, receive). Supplier acknowledges via the external form: supplierReceiptDate, supplierReceiptCondition, creditNoteIssued, creditNoteRef. [SCOR S4.4/S4.5 | build-new + RA external form].
9. **Financial adjustment direction?** (Finance-Maker, exclusive). Branch on reasonCode + invoice state: credit note expected, debit note raised, or accrual-only reversal.
10. **Apply supplier credit note** (Finance-Maker). Record CreditNote: creditNoteRef, linkedReturnId, linkedInvoiceId, amount, taxAmount (reverses recoverable input tax on the returned portion), reason. Reduces the payable; posts against the creditor ledger; reverses the GR/IR accrual for the returned quantity. [ISO 8.7 | data-model CreditNote + AB creditor ledger].
11. **Raise buyer debit note** (Finance-Maker). Raise DebitNote for over-delivery / wrong-item / disputed credit: debitNoteRef, linkedReturnId, linkedInvoiceId, linkedMatchExceptionId, amount (+ supplier-paid return freight where applicable), taxAmount, reason. Reduces payable / raises receivable; posts against the creditor ledger; follows maker/checker control. [ISO 8.7 | data-model DebitNote].
12. **S4.5 Close or adjust return order** (System). Set Return status = closed; relieve/reverse commitment for the returned value; adjust the creditor ledger; reverse the GR/IR accrual; update the linked NCR; feed the supplier scorecard. [SCOR S4.5 | ISO 8.7 -> 8.4.1 | build-new].
13. **Update NCR + feed CAPA / scorecard** (System). If linkedNcrId is set, mark the NCR disposition `return` executed and hand systemic root-cause/effectiveness to e04; write the return event to the supplier scorecard period. [ISO 8.7 -> 10.2 -> 8.4.1 | iso loop + e04].
14. **Return closed and adjusted** (System, end).

## Gateways and branches (exact conditions)
- **authorizationStatus == authorized?** `authorizationStatus == 'authorized' AND rmaNumber != null` -> identify condition (S4.3). `authorizationStatus == 'declined' OR still 'requested' after the reminder SLA` -> escalate (re-disposition in e04). No goods move before an RMA number exists.
- **financial adjustment direction?**
  - Branch A (credit note): `reasonCode IN {defective, damaged, expired, quality-fail} AND value already invoiced/payable` -> expect supplier credit note (reduces payable).
  - Branch B (debit note): `reasonCode IN {over-delivery, wrong-item} OR supplier disputes/declines credit` -> buyer raises a debit note (reduces payable / raises receivable).
  - Branch C (no financial impact): `goods not yet invoiced` -> reverse the GR/IR accrual only; no note, commitment relief only.

## Fields and dropdowns (full detail)

### Return / RMA header (S4.1)
| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| returnId | string | auto | RET/##### pattern (configurable) | immutable | System |
| sourceOrderId | reference (PO) | yes | - | resolves to PO header | Initiator |
| supplierId | reference | auto | from PO | read-only | System |
| linkedNcrId | reference (NCR) | yes if NCR-triggered, else null | null | must exist if set | Initiator |
| initiatedBy | reference (user) | auto | current user | - | System |
| initiatedAt | datetime | auto | now | - | System |
| returnType | dropdown | yes | - | {full-lot, partial-lot, single-line} | Initiator |

### Return line (S4.1)
| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| poLineId | reference | yes | belongs to sourceOrderId |
| itemId | reference | yes | from PO line |
| quantityToReturn | number | yes | > 0 AND <= received quantity |
| unitPrice | number | auto | from PO line |
| reasonCode | dropdown | yes | see S4.3 set |

### Authorization (S4.2)
| Field | Type | Mandatory | Default | Notes |
| --- | --- | --- | --- | --- |
| rmaNumber | string | yes before shipment | - | supplier-issued authorization reference |
| authorizationStatus | dropdown | yes | requested | {requested, authorized, declined} |
| authorizedBy | string | - | - | supplier contact |
| authorizedAt | date | - | - | - |
| returnAuthorizationMethod | dropdown | yes | email+OTP supplier form | {email+OTP supplier form, phone-confirmed, contract-clause auto} |
| supplierReturnAddress | reference (SupplierAddress) | yes | - | where goods ship back |
| restockingFeePercent | number | no | 0 | configurable per contract |

### Condition / reason (S4.3)
- **reasonCode dropdown (exact set):** {defective, damaged, wrong-item, over-delivery, expired, quality-fail}.
  - defective = functional non-conformance to spec.
  - damaged = transit/handling physical damage (RL.3.22-24 damage-free).
  - wrong-item = SKU mismatch vs PO line (RL.3.13 item accuracy).
  - over-delivery = quantity beyond PO + tolerance (+/-5-10% for labels/cartons per AB; RL.3.14 quantity accuracy).
  - expired = shelf-life past at receipt (food/regulated RM).
  - quality-fail = COA/test fail at the QC gate.
- conditionDescription (text, mandatory); percentNonConformance (0-100, mandatory, copied from linked NCR if present); images (>=1 mandatory for defective/damaged/quality-fail); rootCauseSuspected (optional, seeds CAPA in e04).

### Shipment (S4.4)
- carrier (dropdown from carrier master / free-text); returnLabelRef (text/attachment); who-pays (dropdown {supplier-paid, buyer-paid, shared}, default supplier-paid for defective/quality-fail); pickupDate (date, mandatory, >= today); returnTrackingNumber (AWB/BL/LR/courier no.); returnIncoterm (Incoterms 2020, validated against transport mode: FOB/CIF sea-only, air/multimodal FCA/CPT/CIP/DAP); packingNote; segregationLocation (quarantine bin reference).

### Credit / debit note (S4.5)
- **CreditNote:** creditNoteRef (mandatory), linkedReturnId (auto), linkedInvoiceId, amount (= returned value), taxAmount (reverses recoverable input tax on the returned portion), reason (auto from reasonCode).
- **DebitNote:** debitNoteRef (auto), linkedReturnId (auto), linkedInvoiceId, linkedMatchExceptionId, amount (= over-billed/disputed value + supplier-paid return freight where applicable), taxAmount, reason.

## Edge cases and error handling
- **No RMA number.** Goods cannot be dispatched until rmaNumber is set and authorizationStatus = authorized; the S4.4 step is gated on it.
- **Declined / no-response authorization.** Return status = blocked; routed back to e04 for an alternative disposition; the underlying NCR is not closed by a declined return.
- **Already-paid invoice.** A credit note for goods already paid becomes a recoverable balance on the creditor ledger applied against the next payable.
- **Over-delivery and wrong-item.** Default to a buyer debit note (Branch B), since the buyer is recovering over-billed value rather than awaiting a supplier credit.
- **Not yet invoiced.** No note is raised (Branch C); only the GR/IR accrual and the commitment for the returned quantity are reversed.
- **Partial return.** quantityToReturn must be <= received quantity per line; the credit/debit and GR/IR reversal are pro-rata to the returned quantity.
- **Restocking fee.** A non-zero restockingFeePercent reduces the expected credit accordingly.

## Business rules and invariants
- returnId is immutable for the life of the return.
- No physical return ships before an authorized RMA number exists.
- The reasonCode determines the financial direction: supplier fault (defective/damaged/expired/quality-fail) expects a credit note; buyer recovery (over-delivery/wrong-item) or a disputed credit raises a debit note; both post against the creditor ledger.
- Closure always reverses the GR/IR accrual and reconciles the commitment for the returned quantity, and always feeds the supplier scorecard and (if linked) the NCR/CAPA loop.
- Debit notes follow the maker/checker financial control (Finance-Checker releases any payment adjustment).
- **Rejected-goods quarantine (axiom A20):** goods flagged for return (or non-conforming goods awaiting disposition) are physically quarantined immediately on NCR raise. The segregationLocation field on the shipment record identifies the quarantine bin. Quarantined goods must not be issued to production or stored alongside conforming stock.
- **Disposal SOP:** if a return authorization is not obtained and goods are not shipped back within approximately 90 days of quarantine, the disposal SOP is triggered. Under the disposal SOP: Quality confirms the goods are non-conforming, the Buyer raises a debit note for the value (if not already credited), and Receiving physically disposes of the goods (per local environmental and regulatory requirements for the material type). The disposal action and quantity disposed are recorded on the NCR/Return record; the GR/IR accrual for the disposed quantity is reversed and the commitment is relieved. A disposal event is audited and broadcast via SSE.
- Goods are physically segregated (quarantine) from raising until dispatch or disposal (ISO 8.7).

## Cross-references
- **e04** (NCR -> CAPA -> re-evaluation): the return disposition originates there and the closed return feeds back to it.
- **Diagram 08** (delivery/GRN, QC gate): the failing QC gate that raises the NCR.
- **Diagram 09 / e12** (invoice/match): a qty-over or wrong-item match exception can also originate a return (linkedMatchExceptionId).
- **Diagram 12** (analytics): the return event feeds the supplier scorecard (quality dimension; four-factor perfect-order delivery dimension).
- **e02** (budget/commitment): the returned quantity reverses the commitment relief.
- **Benchmarks:** SCOR S4.1-S4.5; ISO 8.7 (control of nonconforming outputs), 10.2 (corrective action), 8.4.1 (re-evaluation). Data model: Return/RMA, CreditNote/DebitNote, GrIrEntry, Commitment in `model/data-model.md`.
