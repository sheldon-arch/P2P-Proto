# e12 Two-way vs Three-way Match Condition

- **BPMN file:** e12-match-condition.bpmn

## Scope, trigger, outcome
- **Scope:** The invoice-match decision that selects two-way versus three-way matching, the duplicate-invoice pre-check, the tax-inclusive tolerance evaluation, the exception classification and routing to the correct resolver, the resolution outcomes, and the GR/IR relief and commitment actualisation on a cleared match. It does not cover invoice capture detail (09) or payment scheduling and release (10), which it hands to.
- **Trigger:** Finance-Maker captures a supplier invoice linked to a PO.
- **Outcome:** The invoice is matched (auto-cleared within tolerance or resolved through an exception), the GR/IR clearing entry is relieved, the budget commitment moves to actual, and the payable posts to the creditor ledger ready for payment; or the invoice is rejected with no payable posted.

## Actors (lanes)
- **Finance - Maker:** captures the invoice and resolves duplicate-invoice exceptions.
- **Procurement / Buyer:** resolves price-variance exceptions.
- **Receiving / Warehouse:** resolves quantity and missing-GR exceptions.
- **Tax / Compliance:** resolves tax-mismatch exceptions.
- **Platform / System:** runs the duplicate check, selects the match type, evaluates tolerance, classifies exceptions, clears the match, and relieves GR/IR.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Invoice captured against PO** (Finance-Maker, start). Header and lines including taxCodeId, taxAmount, taxableAmount, totalIncTax. [SCOR S2.7 | ISO 8.6 | source: build-new + AB].
2. **Duplicate invoice?** (System, exclusive). Three-key signature check before matching; a duplicate routes to the Finance resolver and does not post. [SCOR S2.7 | source: build-new duplicate detection].
3. **GRN exists for the line / category?** (System, exclusive). A GRN selects three-way; no GRN selects two-way plus milestone acceptance. [SCOR S2.7 | ISO 8.6 | source: data-model matchType].
4. **Three-way match (PO + GRN + invoice)** (System). Compare price, quantity (against GRN), and amounts including tax. [SCOR S2.7 | ISO 8.6 | source: build-new].
5. **Two-way match (PO + invoice) + milestone acceptance** (System). Match against the PO with milestone acceptance gating payment. [SCOR S2.7 | source: data-model two-way].
6. **Tolerance check (price%, qty%, absolute, tax-incl)** (System, business rule). Apply the MatchTolerance config tax-inclusive. [SCOR S2.7 | ISO 8.6 | source: data-model MatchTolerance].
7. **Within tolerance on all checks?** (System, exclusive). All within auto-clears; any outside classifies an exception. [SCOR S2.7 | source: build-new].
8. **Exception type?** (System, exclusive). Classify one type and route to its resolver. [SCOR S2.7 | ISO 8.6 | source: data-model MatchException].
9. **Buyer resolves price-variance** (Buyer). Resolution accept, adjust, credit-note, debit-note, or reject. [SCOR S2.7 | source: data-model].
10. **Receiving resolves qty / missing-GR** (Receiving). Raise or correct the GRN, confirm receipt, accept, or reject. [SCOR S2.7 | ISO 8.6 | source: data-model].
11. **Tax/Compliance resolves tax-mismatch** (Tax/Compliance). Verify and correct line tax or raise a note. [SCOR S2.7 | source: data-model].
12. **Finance resolves duplicate-invoice** (Finance-Maker). Confirm and void, or override a coincidental signature with reason. [SCOR S2.7 | source: build-new].
13. **Exception resolved to a match?** (System, exclusive). Resolved within tolerance matches; reject ends with no payment. [SCOR S2.7 | source: data-model].
14. **Mark matched; relieve GR/IR; commitment to actual** (System). Clear GR/IR, move commitment to actual, post the payable. [SCOR S2.7/OE11 | ISO 8.6 | source: build-new GR/IR + commitment].
15. **Rejected; no payment posted** (System, end). GR/IR stays accrued until a corrected invoice arrives. [SCOR S2.7 | source: build-new].
16. **Matched; ready for payment** (System, end). Hands to 10 payments. [SCOR S2.7 | source: build-new].

## Gateways and branches (exact conditions)
- **Duplicate invoice?** True: `exists another invoice with same supplierId AND same invoiceNumber AND same totalIncTax` -> duplicate-invoice exception. False -> match-type selection.
- **GRN exists for the line / category?** True: `a GRN exists for the invoice line's PO line` (materials) -> three-way. False (service, freight, no-GRN) -> two-way plus milestone acceptance.
- **Within tolerance on all checks?** True: `priceWithin AND qtyWithin AND amountWithin`. Where `priceWithin = abs(invoiceUnitPrice - agreedPrice) <= agreedPrice * pricePercent/100`, `qtyWithin = abs(invoiceQty - matchedQty) <= matchedQty * qtyPercent/100`, `amountWithin = abs(invoiceTotalIncTax - expectedTotalIncTax) <= absolute`. matchedQty is the GRN received quantity (three-way) or the PO/milestone quantity (two-way). False -> classify exception.
- **Exception type?** price-variance -> Buyer; qty-over and qty-under -> Receiving; missing-GR -> Receiving; duplicate-invoice -> Finance; tax-mismatch -> Tax/Compliance.
- **Exception resolved to a match?** True: `resolution in {accept, adjust, credit-note, debit-note} AND adjusted figures within tolerance` -> matched. False (reject) -> rejected.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| invoiceNumber | text | mandatory | none | unique per supplier (duplicate check) | Finance-Maker |
| invoiceDate | date | mandatory | none | valid date | Finance-Maker |
| line.unitPrice | number | mandatory | none | > 0 | Finance-Maker |
| line.quantity | number | mandatory | none | > 0 | Finance-Maker |
| line.taxCodeId | reference | mandatory | none | valid tax code | Finance-Maker |
| line.taxAmount / taxableAmount | number | mandatory | none | consistent with code/rate | Finance-Maker |
| totalIncTax | number | mandatory | none | sum of lines incl. tax | Finance-Maker |
| MatchTolerance.pricePercent | number (config) | system | configurable | 0..100 | Administrator |
| MatchTolerance.qtyPercent | number (config) | system | configurable | 0..100 | Administrator |
| MatchTolerance.absolute | number (config) | system | configurable | >= 0 | Administrator |
| matchType | derived {TWO_WAY, THREE_WAY} | system | per GRN existence | one of set | System |
| exception type | dropdown {price-variance, qty-over, qty-under, missing-GR, duplicate-invoice, tax-mismatch} | system | derived | one of set | System |
| resolution | dropdown {accept, adjust, credit-note, debit-note, reject} | mandatory on exception | none | one of set | resolver role |

## Values, thresholds, and formats
- Match type rule: three-way iff a GRN exists for the line/category; otherwise two-way plus milestone acceptance.
- Tolerance is evaluated tax-inclusive on three checks (price percent, quantity percent, absolute amount); all must be within for auto-clear.
- Duplicate signature: supplierId plus invoiceNumber plus totalIncTax.
- Exception types and resolvers: price-variance to Buyer, qty-over/qty-under/missing-GR to Receiving, duplicate-invoice to Finance, tax-mismatch to Tax/Compliance.
- Resolution outcomes: accept, adjust, credit-note, debit-note, reject.

## Edge cases and error handling
- **Missing-GR on a three-way line.** Cannot clear until Receiving raises a GRN; the invoice is held.
- **Coincidental duplicate signature.** A legitimate distinct invoice that matches the three-key signature is overridden with a reason by Finance and proceeds.
- **Service PO without milestone acceptance.** Two-way match cannot release payment until the milestone is accepted.
- **Tax-inclusive variance.** A price within band but a tax error still fails the amount check and routes to Tax/Compliance.
- **Reject outcome.** No payable posts; the GR/IR entry remains accrued (goods-received-not-invoiced) until a corrected invoice arrives.

## Business rules and invariants
- The duplicate-invoice control runs before matching and never posts a confirmed duplicate.
- Match type is determined solely by GRN existence for the line/category.
- Tolerance is tax-inclusive and must pass all three checks to auto-clear.
- Each exception type routes to a single accountable resolver role.
- A cleared match relieves the GR/IR clearing entry and moves the commitment from committed to actual before payment.

## Cross-references
- 09 invoice and match (invoice capture); e03 quantity tolerance (amended PO and GRNs feeding the three-way match); 10 payments (receives the matched payable, maker/checker release); e07 currency (base amounts on cross-currency invoices); 11 returns (credit/debit notes from disposition). Benchmarks: SCOR S2.7 (authorise supplier payment), OE11 (commitment), ISO 9001 8.6 (release of products and services).
