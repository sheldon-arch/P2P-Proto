# e09 Contract and Constant Supply

- **BPMN file:** e09-contract-supply.bpmn

## Scope, trigger, outcome
- **Scope:** The pre-priced constant-supply branch that runs against a standing contract with no requisition, RFQ, or PO. It covers the 15-day renewal reminder, the supply-due check, the factory floating a load/quantity to the supplier, delivery and invoice, receiving and forwarding the invoice, logging the invoice as a reduced-field PO-format record, setting the DELIVERED flag to skip delivery tracking, handing to accounts, settlement, and closure. It does not cover normal competitive sourcing (04) or the standard PO and approval chain (05, 03).
- **Trigger:** A constant-supply contract is active and a supply cycle becomes due (daily or weekly cadence per the contract), or the renewal reminder fires.
- **Outcome:** Goods are received, the invoice is logged in a PO-format record, the DELIVERED flag is set, the invoice is settled at the contract price, and the cycle closes. The cycle repeats each cadence until the contract expires or is not renewed.

## Actors (lanes)
- **Approver (factory manager):** floats the required load/quantity to the supplier each cycle.
- **Supplier / Vendor:** delivers the floated quantity and sends the invoice at the contract price.
- **Receiving / Warehouse:** receives the goods and forwards the supplier invoice.
- **Procurement / Buyer (handler):** logs the invoice in a reduced-field PO-format record.
- **Finance - Maker:** settles the invoice at the contract price.
- **Platform / System:** fires the renewal reminder, sets the DELIVERED flag, routes to accounts, closes, audits.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Constant-supply contract active** (System, start). Standing contract with agreed price, validity, and renewal date; this branch skips requisition, RFQ, and PO. [SCOR OE6/S1.10 | source: AB constant supply].
2. **Renewal reminder 15 days before expiry** (System, timer). Notification to factory manager and buyer; if not renewed, the branch stops. [SCOR OE6 | source: AB 15-day reminder].
3. **Supply due for this cycle?** (Approver, exclusive). Due and active proceeds to float; expired or not renewed stops. [SCOR OE6 | source: AB cadence].
4. **Factory floats load / quantity to supplier** (Approver, send). Floats the cycle quantity against the contract; no requisition, RFQ, or PO. [SCOR S1.10/OE6 | source: AB].
5. **Supplier delivers + sends invoice** (Supplier, send). Delivers the floated quantity, invoices at the contract rate; no PO acknowledgement. [SCOR S2.2/S2.3 | source: AB].
6. **Stores receive + forward invoice** (Receiving). Count against the floated quantity; QC hard block still applies for COA items; forward the invoice. [SCOR S2.4 | ISO 8.6 | source: AB].
7. **Handler logs invoice in PO-format (reduced fields)** (Buyer). Lightweight PO-format record so spend ties to a document, without the full PO and approval chain. [SCOR S2.1/OE6 | source: AB].
8. **Set DELIVERED flag (skip delivery tracking)** (System). Skips the partial-block delivery-tracking machinery; routes straight to the financial step. [SCOR S2.4/S2.6 | source: AB DELIVERED flag].
9. **Hand to accounts for settlement** (System). Routes the record and invoice to Finance; accrues against the creditor ledger. [SCOR S2.7 | source: AB].
10. **Finance settles invoice** (Finance-Maker). Two-way match at the contract price, settle per contract terms, post to creditor ledger; often periodic (monthly) consolidation. [SCOR S2.7 | ISO 8.6 | source: AB].
11. **Close cycle; update ledger + analytics** (System). Ledger and contract-compliance analytics updated; audit and SSE; loops to the next cadence. [SCOR OE3/OE6 | source: AB].
12. **Cycle settled; await next supply** (System, end). Contract continues until expiry or non-renewal. [SCOR OE6 | source: AB].

## Gateways and branches (exact conditions)
- **Supply due for this cycle?** True: `today >= nextSupplyDate AND Contract.status == active AND today <= Contract.validityEnd` -> float load. False: expired or not renewed -> stop (revert to normal sourcing).

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| Contract.price | number (agreed) | system | contract | > 0 | Buyer / Admin |
| Contract.validityEnd | date | system | contract | valid date | Buyer / Admin |
| Contract.renewalDate | date | system | contract | reminder 15 days prior | Buyer / Admin |
| Contract.cadence | dropdown {daily, weekly, monthly} | system | per contract | one of set | Buyer / Admin |
| requestedQuantity | number | mandatory | none | > 0 | Approver (factory) |
| receivedQuantity | number | mandatory | none | > 0 | Receiving |
| deliveryNoteNumber | text | mandatory | none | free text | Receiving |
| PO-format record (reduced) | object {supplier, item, quantity, contract price, contract ref, invoice no, invoice date, amount, tax} | mandatory | none | ties to contract | Buyer |
| DELIVERED flag | boolean | system | set true | skips delivery tracking | System |

## Values, thresholds, and formats
- Renewal reminder lead time: 15 days before the contract validity end (configurable).
- No requisition, RFQ, or PO is created on this branch; the contract price applies to every cycle.
- The PO-format record uses a reduced field set, enough to match the invoice and report spend against the contract.
- The DELIVERED flag bypasses the partial-block delivery-tracking machinery used in e03 and 08.

## Edge cases and error handling
- **Contract not renewed.** When the renewal reminder is not actioned and validity lapses, the constant-supply branch stops and the need reverts to normal sourcing.
- **QC-controlled constant supply.** Materials requiring a COA still hit the QC hard block at receiving before the invoice is logged.
- **Quantity mismatch on a cycle.** Handled as a two-way match tolerance/exception at settlement (see e12), against the contract price.
- **Periodic settlement.** Invoices are commonly consolidated and settled monthly rather than per delivery; the creditor ledger accrues per cycle.

## Business rules and invariants
- Constant supply runs against a standing contract with no requisition, RFQ, or PO.
- The factory manager floats the load each cycle; the contract price is fixed.
- The invoice is logged in a reduced-field PO-format record so spend always ties to a document.
- The DELIVERED flag skips delivery tracking; settlement uses two-way match at the contract price (three-way where stores raised a GRN).
- The renewal reminder fires 15 days before expiry; cycles repeat until the contract expires or is not renewed.

## Cross-references
- 04 sourcing and 05 purchase order (the normal branch this one bypasses); e12 match condition (two-way match at contract price); 10 payments (settlement and creditor ledger); e11 permit expiry (contract and document expiry tracking share the reminder mechanism); 12 analytics (contract-compliance spend). Benchmarks: SCOR OE6 (contract management), S1.10 (agreements), S2.7 (payment), ISO 9001 8.6.
