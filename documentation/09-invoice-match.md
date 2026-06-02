# 09 Invoice Capture and Matching - Unified Procure-to-Pay

- **BPMN file:** 09-invoice-match.bpmn
- **Spec:** .build/specs/09-invoice-match.json

## Scope, trigger, outcome

- **Scope:** Capturing the supplier invoice with its documents, detecting duplicates, selecting the match type by GRN existence (three-way for materials, two-way for services/no-GRN with milestone acceptance), running the match within tolerance on price, quantity and amount including tax, auto-clearing and relieving the GR/IR liability, and routing match exceptions to the correct resolver with the accept / adjust / credit-note / debit-note / reject resolution set. Invoice approval precedes accounts. This is the expansion of the overview step "Capture invoice, two/three-way match" between goods receipt (diagram 08) and payment (diagram 10).
- **Trigger:** A GRN was raised (materials, diagram 08), or a service/spares requisition was closed "received as per order" (no GRN), or a service milestone was accepted; the supplier submits the invoice against the PO.
- **Outcome:** The invoice is matched (auto-cleared or resolved), approved, the GR/IR is relieved where applicable, the net payable is posted to the creditor ledger, and control hands to diagram 10 payments and installments. Rejected and confirmed-duplicate invoices exit without a payable.

## Actors (lanes)

Canonical lane ids and names (SPEC-SCHEMA vocabulary):

- **Supplier / Vendor** (L_supplier): submits the invoice and supporting documents.
- **Finance - Maker** (L_finmaker): captures the invoice into AP, normalizes to base currency, holds duplicates.
- **Procurement / Buyer** (L_buyer): resolves price-variance exceptions.
- **Receiving / Warehouse** (L_recv): resolves quantity and missing-GR exceptions.
- **Tax / Compliance** (L_tax): resolves tax-mismatch exceptions.
- **Engineering** (L_eng): confirms service milestone acceptance on the two-way path.
- **Approver** (L_appr): approves the invoice before accounts (SoD: receiver is not the approver).
- **Platform / System** (L_sys): duplicate detection, match-type selection, the match engine, GR/IR clearing, exception routing, note posting, release to payment, audit and SSE.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Each step is tagged [SCOR code | ISO clause | source].

1. **Goods received / service accepted** (Supplier, start). Entry from diagram 08. [SCOR S2.7 | source: build-new + AB invoice package]
2. **Submit invoice + supporting documents** (Supplier). Submitted via the authenticated external form (email + OTP), scoped to own records; the buyer may assemble the package on the supplier's behalf. Full field and document set below. [SCOR S2.7 | ISO 7.5 | source: AB invoice package + data-model Invoice]
3. **Capture invoice in AP, normalize to base currency** (Finance-Maker). The FX service normalizes the tax-inclusive total to base currency (base/null unchanged; else live rate rounded to 2dp; on failure return original unconverted, never throws). Tax is a first-class line attribute; reverse-charge / import VAT is flagged for imports; recoverable input-VAT/GST credit is tracked. Captures the realized-FX basis (PO date rate versus payment date rate, computed at payment). [SCOR S2.7 | source: build-new + platform-services FX/tax]
4. **Duplicate invoice?** (System, exclusive). Detection key = supplier + invoice number + amount. A match routes to the duplicate hold; otherwise proceeds. [SCOR S2.7 | ISO 8.6 | source: data-model DUPLICATE-INVOICE]
5. **GRN exists for this PO/category?** (System, exclusive). A GRN forces a three-way match; no GRN forces a two-way match plus milestone acceptance for service POs. Rule: three-way iff a GRN exists for the category, else two-way. [SCOR S2.7 | ISO 8.6 | source: data-model match logic]
6. **Confirm service milestone acceptance** (Engineering). Two-way path only. For service/contract POs the PaymentMilestone acceptance is the third-leg proxy; confirm milestone acceptanceStatus == accepted so payment releases on acceptance. A simple service with no milestone proceeds straight to the two-way match. [SCOR S2.7 | source: data-model PaymentMilestone + AB engineering completion]
7. **Two-way match (PO + invoice, incl. tax)** (System). Checks price, quantity and tax-inclusive amount against the PO within configurable tolerance. [SCOR S2.7 | ISO 8.6 | source: data-model MatchTolerance]
8. **Three-way match (PO + GRN + invoice, incl. tax)** (System). Checks price against PO agreed price, quantity against GRN accepted quantity (not ordered quantity), and the tax-inclusive amount, within configurable tolerance. [SCOR S2.7 | ISO 8.6 | source: data-model MatchResult THREE_WAY]
9. **Within tolerance?** (System, exclusive). Within all bands sets matchStatus = matched (auto-clear); outside any band sets matchStatus = exception with an exceptionReason. First-time-match rate and three-way-match exception rate are tracked KPIs. [SCOR S2.7 | ISO 8.6 | source: data-model Match state machine]
10. **Auto-clear, relieve GR/IR** (System). For three-way, sets the GrIrEntry invoiceId, clearedAmount and status cleared (or partially-cleared) to relieve the goods-received-not-invoiced liability; for two-way there is no GR/IR and the payable posts directly. Posts the payable to the creditor ledger; emits audit and SSE. [SCOR S2.7 | ISO 8.6 | source: build-new GR/IR clearing]
11. **Exception type, route to resolver** (System, exclusive). Routes price to Buyer, quantity and missing-GR to Receiving, tax to Tax/Compliance, duplicate to Finance-Maker. [SCOR S2.7 | ISO 8.6 | source: data-model MatchException routing]
12. **Buyer resolves price variance** (Buyer). Resolution dropdown accept / adjust / credit-note / debit-note / reject. [SCOR S2.7 | ISO 8.6 | source: data-model resolution set]
13. **Receiving resolves quantity / missing-GR** (Receiving). qty-over, qty-under, or missing-GR; missing-GR is resolved by raising the GRN (diagram 08) or confirming the line is two-way. [SCOR S2.7 | ISO 8.6 | source: data-model qty routing]
14. **Tax/Compliance resolves tax mismatch** (Tax/Compliance). Confirms tax code, rate, amount and reverse-charge; confirms recoverable input-VAT/GST eligibility. [SCOR S2.7 | ISO 8.6 | source: data-model tax routing]
15. **Hold / reject duplicate invoice** (Finance-Maker). No payable while a duplicate hold is open; reject closes it, accept (false positive) re-routes to match. [SCOR S2.7 | ISO 8.6 | source: data-model DUPLICATE-INVOICE control]
16. **Resolution outcome?** (System, exclusive). accept or adjust re-run the match; credit-note or debit-note post the note then clear; reject returns the invoice to the supplier. [SCOR S2.7 | ISO 8.6 | source: data-model resolution]
17. **Post credit / debit note to creditor ledger** (System). CreditNote (supplier-issued, reduces payable) or DebitNote (buyer-raised); the adjusted net payable then clears GR/IR (three-way) or posts directly (two-way). [SCOR S2.7 | ISO 8.6 | source: build-new credit/debit note]
18. **Return invoice to supplier (rejected)** (System). Returned with the reason; the supplier may resubmit a corrected invoice (re-enters at submit). Terminal for the current invoice. [SCOR S2.7 | source: data-model resolution reject]
19. **Approve invoice before accounts (SoD)** (Approver). The matched (or note-adjusted) invoice/package is approved; the approver must not be the receiver of the same goods. Sets Invoice.approvedBy. [SCOR S2.7 | ISO 8.4 | source: AB invoice-package approval + role-matrix SoD]
20. **Release approved payable to payment** (System). Releases to the payment schedule (diagram 10); the creditor ledger reflects the net amount after any note and withholding; GR/IR is cleared for three-way lines. [SCOR S2.7 | source: build-new to diagram 10]
21. **Matched and approved, to payment** (System, end). Hands off to diagram 10. Rejected/duplicate invoices exit without a payable. [SCOR S2.7 | source: build-new]

## Gateways and branches (exact conditions)

| Gateway | Branch | Exact condition |
| --- | --- | --- |
| Duplicate invoice? | duplicate | EXISTS another invoice with same (supplierId AND invoiceNumber AND amount) |
| | not duplicate | else (proceed to match-type) |
| GRN exists for this PO/category? | three-way | a GRN exists for the PO/category (materials, S2 direct) |
| | two-way | no GRN (services / freight / spares received by Engineering, S3 / T2 / T3); plus milestone acceptance for service POs |
| Within tolerance? | matched | pricePercent <= tolerance.pricePercent AND qtyPercent <= tolerance.qtyPercent AND abs(amountVariance) <= tolerance.absolute (all incl. tax) |
| | exception | else (set exceptionReason) |
| Exception type, route to resolver | price | type == 'price-variance' to Buyer |
| | quantity | type in {'qty-over', 'qty-under', 'missing-GR'} to Receiving |
| | tax | type == 'tax-mismatch' to Tax/Compliance |
| | duplicate | type == 'DUPLICATE-INVOICE' to Finance-Maker (hold, no payable) |
| Resolution outcome? | re-match | resolution in {accept, adjust} (corrected invoice/PO/GRN/tax re-enters matching) |
| | note | resolution in {credit-note, debit-note} (post to ledger then clear) |
| | reject | resolution == reject (return to supplier, no payable) |

The match-type gateway is also the re-entry target after accept/adjust, so a corrected invoice is re-evaluated against the same three-way / two-way logic.

## Match definitions (precise)

- **pricePercent** = abs(invoiceUnitPrice - poAgreedPrice) / poAgreedPrice.
- **qtyPercent (three-way)** = abs(invoiceQty - grnAcceptedQty) / grnAcceptedQty (against GRN accepted quantity, not ordered quantity).
- **qtyPercent (two-way)** = abs(invoiceQty - poQty) / poQty.
- **amountVariance** = invoiceTotalInclTax - expectedTotalInclTax, where expectedTotalInclTax for three-way = grnAcceptedQty * agreedPrice + tax, and for two-way = PO value incl. tax.
- **matched** requires all three within their configurable bands (tolerance.pricePercent, tolerance.qtyPercent, tolerance.absolute).
- All comparisons are amount-inclusive-of-tax; tax must reconcile, with reverse-charge flagged for imports.

## Fields and dropdowns (full detail)

### Invoice submission (Supplier)

| Field | Type | Mandatory | Default | Validation | Owning role |
| --- | --- | --- | --- | --- | --- |
| invoiceNumber | text | yes | none | non-empty (part of duplicate key) | Supplier |
| invoiceDate | date | yes | none | valid date | Supplier |
| poReference | ref PO | yes | none | resolves to an open PO | Supplier |
| currency | dropdown of configured currencies | yes | PO currency | one of configured currencies | Supplier |
| lines | array of {poLineId, description, quantity > 0, unitPrice >= 0, taxCodeId, taxableAmount, taxAmount} | yes | none | poLineId resolves; quantity > 0 | Supplier |
| invoiceTotalInclTax | number > 0 | yes | none | > 0; reconciles to lines | Supplier |

### Invoice documents (AB package)

| Document | Mandatory |
| --- | --- |
| invoice | yes |
| packingList | conditional (goods) |
| certificateOfOrigin | conditional (import) |
| awbBl | conditional (import) |
| bayan | conditional (import) |
| healthCert | conditional (food RM import) |
| dgDeclaration | conditional (dangerous goods) |

### Milestone acceptance (Engineering, two-way path)

| Field | Type | Mandatory | Validation |
| --- | --- | --- | --- |
| milestoneId | ref | conditional (service PO) | resolves to a PaymentMilestone |
| acceptanceStatus | dropdown {pending, accepted, rejected} | yes (gates) | accepted releases payment |
| paymentReleaseOnAcceptance | boolean | no | default true for milestone POs |

### Match tolerance (configurable, MatchTolerance)

| Field | Type | Default | Fixed or configurable |
| --- | --- | --- | --- |
| pricePercent | number (%) | tenant default | configurable per tenant |
| qtyPercent | number (%) | tenant default | configurable per tenant |
| absolute | number (amount band) | tenant default | configurable per tenant |

### Exception reasons (MatchException.type, exact set)

price-variance, qty-over, qty-under, missing-GR, DUPLICATE-INVOICE, tax-mismatch.

### Resolution dropdown (exact set, per resolver)

accept, adjust, credit-note, debit-note, reject. For the duplicate hold the effective set is reject (confirmed duplicate) or accept (false positive, override with note, re-route to match).

### Credit / debit note fields

| Field | Type | Mandatory | Notes |
| --- | --- | --- | --- |
| linkedInvoiceId | ref | yes | the invoice being adjusted |
| linkedMatchExceptionId | ref | conditional | the exception that triggered the note |
| amount | number | yes | CreditNote reduces payable; DebitNote is buyer-raised |
| taxAmount | number | conditional | where tax applies |
| reason | text | yes | non-empty |

### Approval fields

| Field | Type | Mandatory | Owning role |
| --- | --- | --- | --- |
| invoiceApprovalDecision | dropdown {approve, reject} | yes | Approver |
| approvedBy | ref User | set on approve | Approver |

## Edge cases and error handling

- **Duplicate invoice:** no payable is created while the hold is open; reject closes it, a false positive is overridden with a note and re-routed to match.
- **Missing-GR exception:** for a goods invoice with no GRN, Receiving raises the GRN (diagram 08) or confirms the line is two-way (service); the corrected invoice re-matches.
- **Quantity over/under billing:** qty-over and qty-under route to Receiving; over-billed quantity is typically resolved by a credit-note, an under-bill by adjust or accept.
- **Tax mismatch:** routes to Tax/Compliance, including reverse-charge reconciliation on imports and recoverable input-credit confirmation.
- **Reject and resubmit:** a rejected invoice returns to the supplier with the reason and may be resubmitted; it re-enters at submission.
- **FX failure:** the FX service degrades gracefully and returns the original amount unconverted rather than throwing; the base amount drives thresholds and analytics.
- **Partial invoice:** a partial three-way clear sets the GrIrEntry status to partially-cleared; the remaining GR/IR clears on the next matched invoice.
- **Service with no milestone:** proceeds straight to the two-way match without a milestone confirmation.

## Business rules and invariants

- Match type is decided by GRN existence, not by category name: three-way iff a GRN exists, else two-way.
- Three-way quantity is compared to GRN accepted quantity, not ordered quantity.
- All comparisons are amount-inclusive-of-tax; tax is a first-class line attribute and must reconcile.
- Duplicate detection key is supplier + invoice number + amount.
- Cleared three-way match relieves the GR/IR liability; two-way posts the payable directly.
- accept and adjust re-run the match; credit-note and debit-note adjust the payable via a note rather than a re-issued invoice; reject produces no payable.
- Invoice approval precedes accounts and is subject to SoD: the receiver of the goods is not the invoice approver, and a buyer who received the goods may not approve the invoice. This is operational control, distinct from the financial maker/checker SoD on payment release in diagram 10.
- Every committed change emits an audit entry and an SSE event.

## Cross-references

- Upstream: 08 delivery, goods receipt and inspection (GRN existence sets the match type; GR/IR accrued at GRN), 05 purchase order (PO agreed price, lines, tax), 04 sourcing (agreed terms).
- Downstream: 10 payments and installments (approved net payable, withholding, advance, retention), 12 analytics (first-time-match rate, three-way-match exception rate, invoice accuracy, DPO).
- Returns: 11 returns / RMA / CAPA (a return acceptance adjusts the payable via a credit/debit note, the same note mechanism used here).
- Benchmarks: SCOR S2.7 Authorize Supplier Payment (`analysis/scor-procurement-map.md`), ISO 9001 clause 8.6 release verification and 7.5 records (`iso-supply-chain-standards`), AP and match KPIs (`procurement-metrics-kpis`).
- Platform services: FX (base-currency normalization, realized FX), tax (codes, rates, reverse-charge, input credit), budget/commitment, document storage, audit, SSE (`model/platform-services.md`); match logic, GR/IR, credit/debit note, milestone entities (`model/data-model.md`).
