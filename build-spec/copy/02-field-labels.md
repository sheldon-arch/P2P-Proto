# Field Labels and Display Formats

How a field name becomes the words and the formatted value a user sees. The data dictionary (`build-spec/data-dictionary/<Entity>.json`) already carries a `label` per field for all 627 fields; that label is the canonical default. This file does three things: (1) states the resolution rule, (2) lists the small set of context overrides where a bare dictionary label is ambiguous on a shared screen, (3) pins the value-formatting conventions (money, dates, quantities, percentages, booleans, references) so a computed value never renders raw.

## 1. Resolution rule (restated from `_SCHEMA.md`)

`fieldLabel(entity, field)` resolves: override map below first, then the dictionary `label`, never the raw `name`. The dictionary label covers ~99% of fields. A field with no dictionary label is a dictionary bug, not a reason to print camelCase.

The 487 leak-prone fields (auto, computed, camelCase, `*Id`, `is*`, `*InBase`) were audited against their dictionary labels: every one has a clean human label already. Examples that must never surface raw and their labels:
- `totalAmountInBase` -> "Total (base currency)"
- `isAutoApproved` -> "Auto-approved"
- `projectOrCostCenterId` -> "Project / cost center"
- `perfectOrderFourFactor` -> "Perfect order"
- `landedTotalInBase` -> "Landed total (base currency)"
- `editableUntilReceipt` -> "Editable until receipt"
- `duplicateKey` -> "Duplicate key" (internal; not shown on the invoice form, only referenced by the duplicate-hold logic; if surfaced anywhere it is in an admin/debug view)

Apply sentence case at render (the dictionary stores Title Case labels for legacy reasons; the prototype lowercases to sentence case except acronyms and proper nouns, per `_SCHEMA.md` style). So the dictionary "Total Amount" renders "Total amount"; "HS Code" stays "HS code"; "PO No." stays "PO No.".

## 2. Context overrides (where the bare label is ambiguous)

A field's dictionary label is sometimes too terse when several entities put a same-named field on one screen. Override only in these cases; everywhere else use the dictionary label.

| Entity.field | Dictionary label | On-screen override | Where / why |
| --- | --- | --- | --- |
| Requisition.status | Status | Requisition status | Requisition detail header, where stage + status + per-vertical completion all show; disambiguate the three. |
| Requisition.stage | Stage | Lifecycle stage | Same screen; distinguish from the approval-stage column. |
| ApprovalStageCompletion.status | Status | Approval status | Approval accordion, alongside requisition status. |
| PurchaseOrder.status | Status | PO status | PO detail, alongside the requisition's own status. |
| Invoice.status | Status | Invoice status | Match workbench shows PO, GRN, and invoice together. |
| MatchResult.matchStatus | Match Status | Match result | The word "status" is overloaded on the workbench; "Match result" reads cleaner. |
| RequisitionLine.needDate | Need Date | Need-by date | Hyphenate; "need-by" is the procurement term and avoids "need date" reading as a verb. |
| PurchaseOrder.deliveryDate | Delivery Date | Promised delivery date | Distinguish the supplier's promise from the GRN's actual receipt date. |
| GoodsReceipt.receiptDate | GRN Date | Receipt date | The date goods were received; clearer than "GRN date" next to "Raised at". |
| Invoice.amount | Net Amount | Net amount (excl. tax) | Sits next to Tax amount and Total incl. tax; spell out "excl. tax". |
| SupplierScorecard.composite | Composite Score | Overall score | "Composite" is jargon to a non-procurement viewer; "Overall score" with the four sub-scores beside it. |
| Supplier.code / Item.code / etc. | Supplier Code / Item Code | keep | These are correct; listed to confirm they are NOT shown as `code`. |

Anywhere the value displayed is a reference (`requesterId`, `supplierId`, `projectOrCostCenterId`), show the referenced display field (the dictionary's `referenceTarget`, e.g. `User.name`, `Supplier.name`, `Project.name`), never the id. A `supplierId` cell renders the supplier name (with the code as secondary text), never the UUID.

## 3. Value formatting conventions

The formatter the prototype applies by `dataType`. A value never renders in its raw stored form.

### Money (71 fields, dataType `money`)
- Display: currency symbol or ISO code + thousands separators + 2 decimals. `USD 1,250,000.00` or `$1,250,000.00`; configurable per tenant, default ISO-code prefix for clarity in a multi-currency list.
- The transaction-currency amount and the base-currency amount are shown together where both exist: primary value in transaction currency, base value as secondary muted text, e.g. `EUR 95,400.00` with `≈ USD 103,200.00` beneath. The `*InBase` fields are the secondary line; their label is "(base currency)" not "InBase".
- A converted value shows an "approx." marker (`≈`) because it is FX-derived; the rate and as-of date are available on hover (the FX service, axiom A12). If FX failed (graceful degradation), the base value is omitted and a small "rate unavailable" note shows rather than a wrong number.
- Negative amounts (credit notes, debit notes, ledger entries) show in parentheses or with a leading minus, colored `danger` for debits owed, `success` for credits, never a bare `-1200`.

### Dates (dataType `date`)
- Display `DD-MMM-YYYY` (e.g. `01-Jun-2026`), the dictionary's stated display format. Relative hints in queue context where useful ("due in 3 days", "overdue by 5 days") computed from the demo "today" (2026-06-01).
- Datetime audit/log fields show `DD-MMM-YYYY HH:mm` in tenant timezone.
- Never the ISO timestamp (`2026-06-01T00:00:00Z`) on screen.

### Quantities (dataType `number` / `integer` with a UoM)
- Always paired with the unit: `5,000 EA`, `250 KG`, `40 DRUM`. The UoM comes from the line's `unitOfMeasure`; quantity without a unit never renders.
- Stock vs purchase UoM: where both apply (items), label which is shown ("Order qty: 40 DRUM", "Stock qty: 8,000 KG").

### Percentages
- The model stores no `percent` dataType; percentages are computed (tolerances, scorecard scores, OTIF, savings). Display with a `%` suffix and the appropriate precision: KPIs 1 decimal (`OTIF 93.9%`), tolerances whole or 1 decimal (`Price tolerance 5%`), scorecard scores whole numbers out of 100 or as a percentage as configured. Never a raw `0.939`.

### Booleans (35 fields, dataType `boolean`)
A boolean never renders as `true`/`false`. The rendering depends on the field's meaning:
- State flags shown as a Badge or checkmark with a labelled meaning, not the word "true":
  - `PurchaseOrder.acknowledged` -> "Acknowledged" badge (success) when true; "Awaiting acknowledgement" (progress) when false.
  - `GoodsReceipt.coaAttached` / `Inspection.coaReceived` -> "COA received" (success) / "COA pending" (warning).
  - `Inspection.msdsReceived` -> "MSDS received" / "MSDS pending".
  - `Item.regulatedItem` -> a "Regulated" badge (info) when true; nothing when false.
  - `Supplier.isErpSynced` / `Item.isErpSynced` -> "ERP synced" (success) / "Not synced" (muted).
  - `ApprovalStageCompletion.isAutoApproved` -> "Auto-approved" badge (info) when true; absent when false (the manual path shows the approver name instead).
  - `MatchResult.taxInclusive` -> "Tax-inclusive" / "Tax-exclusive" label, not a checkbox on read views.
  - `PaymentSchedule.locked` -> a lock icon + "Schedule locked" when true.
  - `PaymentSchedule.financialRevertOnEdit` -> not a user-facing field; it is behavior, surfaced only as the warning copy in `03-messages.md` when an edit would revert finance approval.
  - `Invoice.reverseCharge` -> "Reverse charge / import VAT" badge when true.
  - `SupplierScorecard.complianceGate` -> "Compliance gate: passed" (success) / "Compliance gate: failed" (danger). Never a checkbox; this is a gate, not a score.
  - `TaxCode.recoverable` -> "Recoverable (input credit)" / "Non-recoverable".
- Configuration toggles on admin/edit forms render as a shadcn `Switch` with the label and a one-line helper, where on/off is the natural control (`RoutingRule.allowAutoApproval`, `Budget.overCommitAllowed`, `Supplier.autoInvoicing`, `Role.isSystem` read-only). On read-only views these show as the labelled badge form above, not a disabled switch.

### Identifiers
- `identifier` / `number` / `code` fields show the formatted business key (`REQ-...`, `PO-...`, `GRN-...`, `INV-...`), monospace, copyable. Never the database UUID. The pattern is configurable (the dictionary documents the generated pattern); the prototype shows the generated value, immutable for the cycle (axiom A1).

### Long text / JSON
- `remarks` (Activity Log), `budgetOverride`, `attachments` render as structured UI (a timeline, an override card, a file list), never as raw JSON. `budgetOverride` shows "Over budget by USD X. Override approved by <name> on <date>. Reason: <reason>.", never the `{approvedBy, reason, at}` object.

## 4. The acronym and unit reference

Acronyms allowed on screen without expansion (industry-standard, expanded on first use per screen via tooltip): GRN, RFQ, PO, OTIF, OTD, DPO, PPV, AVL, COA, MSDS, NCR, CAPA, SCAR, HS code, GR/IR, ESG, DPA, MOOWR, POD, POL, UoM, EA, KG. See `05-terminology-audit.md` for the expansion of each and the first-use rule. Everything else is spelled out.
