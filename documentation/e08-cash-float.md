# e08 Cash Purchase and Float Reimbursement

- **BPMN file:** e08-cash-float.bpmn

## Scope, trigger, outcome
- **Scope:** The local cash-purchase branch that runs on a petty-cash float instead of a PO, and the float reimbursement loop. It covers the Head's cash-versus-credit decision at assignment, the showroom availability inquiry, the float-sufficiency check, the cash buy, the cash GRN with no PO reference, the float deduction, the low-water reimbursement trigger, the maker/checker reimbursement approval, the top-up, and the unified cash-versus-credit spend reporting. It does not cover the credit/PO branch in detail (overview, 04, 05) or general payment scheduling (10).
- **Trigger:** An approved local need is assigned, and the Purchase Head sets the purchase mode to cash.
- **Outcome:** Goods are received into inventory via a cash GRN with no PO reference, the float balance is deducted, and when the float falls to about one third of its allotment a reimbursement is approved by maker and checker and the float is topped back up. Cash spend is reported alongside credit spend.

## Actors (lanes)
- **Procurement / Buyer (cash buyer):** inquires availability, buys on the float, requests reimbursement.
- **Supplier / Vendor (showroom):** confirms stock and cash price.
- **Receiving / Warehouse:** raises the cash GRN with no PO reference.
- **Finance - Maker:** prepares the reimbursement.
- **Finance - Checker:** approves the reimbursement before disbursement.
- **Platform / System:** logs the receipt, deducts and tops up the float, audits, emits SSE, and feeds unified spend reporting.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Approved local need to fulfil** (Buyer, start). Local only; imports always go credit + PO. [SCOR S1.1 | source: AB cash branch].
2. **Head assigns cash or credit?** (Buyer, exclusive). Only the Head sets the mode; cash routes here, credit routes to the PO branch. [SCOR S1.1 | source: AB].
3. **Inquire showroom availability** (Buyer, send). Confirm stock and price; no RFQ. [SCOR S1.2 | source: AB].
4. **Confirm stock + price** (Supplier, receive). Showroom confirms; if unavailable, try another or escalate to credit. [SCOR S1.2 | source: AB].
5. **Cash price <= available float balance?** (Buyer, exclusive). Buy on float if sufficient, else request reimbursement first. [SCOR S2.7 | source: AB float amount].
6. **Buy on cash float** (Buyer). Pay from petty cash, collect goods and receipt; no PO. [SCOR S2.7 | source: AB cash buy].
7. **Raise cash GRN (NO PO ref)** (Receiving). poId = null; QC applies if the item requires it. [SCOR S2.4 | ISO 8.6 | source: AB cash GRN].
8. **Log receipt + deduct from float balance** (System). Deduct the cash price; tag the spend for unified reporting; audit and SSE. [SCOR S2.7/OE4 | source: AB].
9. **Float low (<= ~1/3 of allotment)?** (Buyer, exclusive). If low, request reimbursement; else done. [SCOR S2.7 | source: AB float-low trigger].
10. **Request float reimbursement** (Buyer). Sum of vouchers since last top-up; attach receipts. [SCOR S2.7 | source: AB].
11. **Finance prepares reimbursement (maker)** (Finance-Maker). Verify vouchers, prepare amount = allotment minus current balance. [SCOR S2.7 | source: AB + SoD].
12. **Finance approves reimbursement (checker)** (Finance-Checker). maker != checker; hold with reason if vouchers do not reconcile. [SCOR S2.7 | source: AB + SoD].
13. **Top up float to allotment** (System). Restore balance to allotment; audit, SSE, reporting. [SCOR S2.7/OE4 | source: AB].
14. **Goods in stock; float maintained; spend reported** (System, end). [SCOR S2.7 | source: AB].
15. **Route to credit / PO branch (out of scope here)** (Buyer, end). The alternate branch of the Head's decision; detailed elsewhere. [SCOR S1.2-S2.1 | source: AB credit branch].

## Gateways and branches (exact conditions)
- **Head assigns cash or credit?** Cash: `purchaseMode == CASH AND purchaseType == Local` -> float branch. Credit: `purchaseMode == CREDIT` -> PO branch.
- **Cash price <= available float balance?** True: `cashPrice <= cashFloat.balance` -> buy on float. False -> request reimbursement first.
- **Float low (<= ~1/3 of allotment)?** True: `cashFloat.balance <= cashFloat.allotment * (1/3)` -> request reimbursement. False -> done.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| purchaseMode | dropdown {CASH, CREDIT} | mandatory | CREDIT | set by Head at assignment | Purchase Head |
| purchaseType | dropdown {Local, Import} | mandatory | none | cash requires Local | Buyer |
| item / quantity / cashPrice | text / number / number | mandatory | none | quantity > 0, cashPrice > 0 | Buyer |
| vendor name | text | mandatory | none | free text | Buyer |
| cash receipt / voucher | attachment | mandatory | none | file ref | Buyer |
| cashFloat.allotment | number (config) | system | e.g. OMR 300 | configurable per buyer | Administrator |
| cashFloat.balance | number | system | allotment | >= 0 | System |
| cash GRN poId | reference | system | null | always null on cash branch | Receiving |
| reimbursementAmount | number | system | allotment - balance | > 0 | Finance-Maker |

## Values, thresholds, and formats
- Cash float allotment: configurable per tenant/buyer; example OMR 300.
- Low-water reimbursement trigger: balance at or below one third of the allotment (configurable), example OMR 100 of a 300 allotment.
- Cash GRN: poId is always null; this is the defining difference from a credit GRN.
- Reimbursement amount restores the float to its full allotment.

## Edge cases and error handling
- **Item not in stock at the showroom.** Buyer tries another showroom or escalates to the Head to switch to credit.
- **Float insufficient for the buy.** The buyer requests reimbursement before buying, or the Head routes the buy to credit.
- **Vouchers do not reconcile.** The checker holds the reimbursement with a reason until the float ledger and cash GRNs reconcile.
- **Cash buy of a QC-controlled item.** QC applies the same hard block as on the credit branch before the cash GRN is finalised.
- **Self-election of cash.** Not permitted; only the Head sets purchaseMode.

## Business rules and invariants
- The cash branch is local only; imports always go credit and PO.
- Only the Purchase Head sets cash versus credit at assignment.
- A cash buy has no PO; the cash GRN carries poId = null.
- Maker and checker must differ on the reimbursement (financial-control SoD per SOX/COSO and ISO 37001).
- The float is reimbursed back to its allotment; cash spend is tagged and reported alongside credit spend in one unified view.

## Cross-references
- 05 purchase order and 04 sourcing (the credit branch); 08 delivery and GRN (cash GRN shares the receiving and QC mechanics); 10 payments (maker/checker SoD and float management); 12 analytics (unified cash-vs-credit spend). Benchmarks: SCOR S2.7 (payment), S1.2 (identify sources), financial-control SoD (SOX/COSO, ISO 37001).
