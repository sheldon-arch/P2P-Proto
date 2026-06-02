# Terminology Audit (Controlled Vocabulary)

The one correct word per concept, the wrong words it replaces, and the display rules for domain notation. A single wrong term signals a toy to a procurement professional, so this is enforced, not advisory: the prototype's strings come from the copy layer, and the copy layer uses only the canonical terms below. The "never say" column is the grep list for the pre-ship check.

This aligns with the model's controlled vocabulary (`model/ontology.md` section 4) and the source companies' real language (Al Bahja and Raphe), generalized to vendor-neutral industry terms.

## 1. Canonical terms (the spine of the cycle)

| Concept | Canonical term | Never say | Note |
| --- | --- | --- | --- |
| The originating demand record | Requisition | "ticket", "request form", "indent", "PR" (as a label) | The model's internal key is `TICKET` (Raphe lineage); on screen it is always "Requisition". "Indent" is regional; avoid. |
| A line within a requisition | Line / line item | "row", "entry" | |
| The order sent to a supplier | Purchase order (PO) | "order form", "buy order" | "PO" acceptable after first use. |
| A call against a framework agreement | Call-off / release | "mini PO", "sub-order" | |
| The standing priced agreement | Framework agreement / contract | "blanket" (unless that is the configured term) | |
| Request for quotation | RFQ | "quote request", "tender" (tender is a distinct formal process) | |
| A supplier's priced response | Quotation / quote | "bid" (bid implies auction), "estimate" | |
| Total cost incl. freight, duty, charges | Landed cost | "total cost", "all-in cost", "final price" | The marquee term; must be exact. |
| Receipt of goods | Goods receipt (GRN) | "delivery confirmation", "delivery note", "received note", "intake" | GRN = Goods Receipt Note. The single most-tested term. |
| A partial receipt against a PO | Partial delivery / partial goods receipt | "split delivery" | |
| Quality inspection record | Inspection / QC | "quality check" (loose) | |
| Certificate of analysis | COA | "lab report", "quality cert" | |
| Material safety data sheet | MSDS (or SDS) | "safety sheet" | |
| Non-conformance record | NCR | "defect report", "complaint", "issue" | NCR = Non-Conformance Report. |
| Corrective and preventive action | CAPA | "fix", "action item", "remediation" | |
| Supplier corrective action request | SCAR | "supplier complaint" | A SCAR is a CAPA issued to a supplier. |
| Approved Vendor List standing | AVL | "approved list", "preferred list" | AVL = Approved Vendor List. |
| The supplier rating | Supplier scorecard | "rating sheet", "report card" | "Scorecard" is the term. |
| Return to supplier | Return / RMA | "send-back", "goods return" (loose) | RMA = Return Merchandise Authorization. |
| Supplier invoice | Invoice | "bill" | |
| Credit owed by supplier | Credit note | "refund note", "return credit" | |
| Charge back to supplier | Debit note | "back-charge note" | |
| Matching PO + GRN + invoice | Three-way match | "invoice check", "verification", "reconciliation" | Two-way = PO + invoice (services). Both terms exact. |
| The accrual between receipt and invoice | GR/IR (goods received / invoice received) | "accrual" (alone), "pending invoice" | GR/IR clearing is the accounting term; keep it. |
| Tolerance on price/quantity | Tolerance | "allowance", "margin" | |
| Budget reservation at requisition | Commitment / encumbrance | "hold", "reservation" (loose), "earmark" | "Commitment" primary; "encumbrance" acceptable. Never "budget block". |
| Hard budget reservation at PO | Committed / hard-committed | "locked budget" | |
| Days payable outstanding | DPO | "payment days", "average pay time" | |
| On-time in-full | OTIF | "delivery rate", "fill rate" (fill rate is a different metric) | |
| On-time delivery | OTD | "punctuality" | |
| Purchase price variance | PPV | "price difference", "cost variance" | |
| Defects per million | PPM | "defect count" | |
| Spend under management | Spend under management | "managed spend" | |
| Off-contract / unmanaged spend | Maverick spend | "rogue spend", "uncontrolled spend" | "Maverick spend" is the term of art. |
| Cost reduction (real) | Hard savings | "savings" (alone, when mixed with avoidance) | Never summed with cost avoidance. |
| Cost avoidance | Cost avoidance / soft savings | "savings" | Reported separately from hard savings. |

## 2. Roles, money, and process terms

| Concept | Canonical term | Never say |
| --- | --- | --- |
| The person raising the requisition | Requester | "user", "originator", "indenter" |
| The procurement owner | Buyer | "purchaser", "procurement agent" |
| The approving authority | Approver | "manager" (loose), "authorizer" |
| Finance preparer / releaser | Finance (maker) / Finance (checker) | "AP clerk" / "AP manager" (the maker-checker control is the point) |
| Quality function | Quality / QC | "QA team" (loose) |
| Receiving / stores | Receiving | "warehouse guy", "stores" (as a role) |
| The base/reporting currency | Base currency | "home currency", "default money" |
| The deal/transaction currency | Transaction currency / deal currency | "foreign currency" |
| Exchange rate applied | Exchange rate (FX rate) | "conversion", "forex" |
| Amount before tax | Net amount (excl. tax) | "subtotal" (acceptable on a form section), "pre-tax" |
| Amount after tax | Total incl. tax / gross | "grand total" (loose) |
| Tax withheld at source | Withholding tax | "tax deduction", "TDS" (regional; configurable) |
| Reverse-charge tax | Reverse charge | "self-assessed tax" |
| Advance before delivery | Advance payment | "prepayment", "deposit" |
| Held-back amount | Retention | "holdback" |
| Payment in parts | Installments / payment schedule | "EMI", "tranches" (loose) |
| Automatic approval under a limit | Auto-approval | "instant approval", "skip approval" |
| Routing to the right approver | Routing | "assignment" (loose), "workflow" (loose) |
| Least-loaded assignment | Least-loaded assignment | "round-robin" (it is not round-robin) |

## 3. Incoterms and place

Incoterms are never shown bare; they always carry the named place or port, per Incoterms 2020 usage.

- Format: `<INCOTERM> <named place>`. Examples: "FOB Nhava Sheva", "CIF Rotterdam", "DAP Plant-2, Pune", "EXW Supplier warehouse, Basel".
- The Incoterm code comes from the enum (`01-enum-labels.md`); the place comes from the adjacent place field on the PO/RFQ. Showing "FOB" alone is a defect; an Incoterm without a place is incomplete in real trade.
- Sea modes (FOB, CIF, CFR) pair with a port; the rest pair with a place. The form should prompt for the place when an Incoterm is chosen.

## 4. Tax notation

- GST, VAT, customs duty, withholding tax, and reverse charge are distinct and never collapsed into "tax". An invoice tax line names the type and the code.
- Show the tax code and the rate: "GST 18% (HSN-3004)", "VAT 19% (DE)".
- Recoverable vs non-recoverable tax is labelled where it matters (input-credit eligibility): "Recoverable (input credit)" / "Non-recoverable".
- Tax IDs use their real names by region: GSTIN and PAN (India), VAT number (EU), TRN (UAE), EIN (US). Never "tax number" generically when the region is known.

## 5. Currency and number notation

- Currency shown with ISO code prefix in multi-currency contexts (`USD 1,250,000.00`), symbol acceptable in single-currency contexts (`$1,250,000.00`). Two decimals for money.
- Base-currency conversion marked approximate (`≈ USD 103,200.00`) because it is FX-derived; the rate and as-of date on hover.
- Quantities always carry the unit (`5,000 EA`, `250 KG`). Stock vs purchase UoM distinguished where both show.
- Percentages: KPIs to one decimal (`OTIF 93.9%`), tolerances and rates as configured. Never a raw ratio (`0.939`).
- Dates `DD-MMM-YYYY` (`01-Jun-2026`); datetimes add `HH:mm` in tenant timezone. Relative hints in queues ("due in 3 days", "overdue by 5 days").

## 6. Capitalization and acronym policy

- Labels and buttons: sentence case ("Request approval", "Issue PO", "Raise NCR"), except proper nouns and the established acronyms below.
- Established acronyms shown as-is, in caps, expanded on first use per screen via a tooltip: GRN, RFQ, PO, OTIF, OTD, DPO, PPV, PPM, AVL, COA, MSDS, SDS, NCR, CAPA, SCAR, HS code, GR/IR, ESG, DPA, MOOWR, POD, POL, UoM, EA, KG, RMA, FX.
- Expansions (first-use tooltip text):
  - GRN: Goods Receipt Note. RFQ: Request for Quotation. PO: Purchase Order.
  - OTIF: On-Time In-Full. OTD: On-Time Delivery. DPO: Days Payable Outstanding.
  - PPV: Purchase Price Variance. PPM: Defects Per Million. AVL: Approved Vendor List.
  - COA: Certificate of Analysis. MSDS/SDS: (Material) Safety Data Sheet.
  - NCR: Non-Conformance Report. CAPA: Corrective and Preventive Action. SCAR: Supplier Corrective Action Request.
  - HS code: Harmonized System code. GR/IR: Goods Received / Invoice Received. RMA: Return Merchandise Authorization.
  - ESG: Environmental, Social, Governance. DPA: Data Processing Agreement. FX: Foreign Exchange.
  - MOOWR: Manufacturing and Other Operations in Warehouse Regulations (bonded). POD: Port of Discharge. POL: Port of Loading.
  - UoM: Unit of Measure. EA: each. KG: kilogram.
- An acronym not on this list is spelled out in full on first use, with the acronym in parentheses, then used.

## 7. The "never appears" list (the grep gate)

Beyond the wrong-term column above, these strings are model/code only and must not appear in any user-facing copy. The pre-ship check greps the built UI for them:
- Raw enum values: any UPPER_SNAKE or kebab enum member (`PENDING_ONBOARDING`, `THREE_WAY`, `price-variance`, `ADVANCE_100`, `READY_FOR_APPROVAL`).
- System field names: `totalAmountInBase`, `isAutoApproved`, `projectOrCostCenterId`, `grIrEntry`, `lastPurchasePrice`, `postValueSync`, `duplicateKey`, `editableUntilReceipt`, `perfectOrderFourFactor`, `otifTwoFactor`, any `*Id` or `is*` identifier.
- Exception/guard strings: `BadRequestException`, `ForbiddenException`, `No eligible approver`, `Cannot advance`, raw HTTP status text, stack frames.
- Traceability metadata: axiom codes (A1-A15), SCOR codes (S1.1, S2.3, OE4, RS, RL), ISO clauses (ISO 8.4, ISO 9001), in any transaction screen. (Allowed only in an admin/debug inspector if one exists.)
- Internal role keys: `finance_maker`, `finance_checker`, `budget_owner`, `tax_compliance`. Shown as their display names.
- The word "ticket" anywhere user-facing. The word "vendor" except inside the established term "Approved Vendor List" / "AVL" (the entity is "Supplier" everywhere else; "AVL" is the one fixed exception because it is the industry name of the list).

## 8. One honesty note carried from the model

There is no AI/ML in this model. Do not label anything "AI", "smart", "intelligent", or "predictive". The genuinely system-computed capabilities are described in plain terms: "automatic approval within your limit", "landed-cost comparison", "supplier scorecard", "duplicate-invoice detection", "least-loaded assignment". A technical viewer will check; honest naming is more credible than a false "AI" label.
