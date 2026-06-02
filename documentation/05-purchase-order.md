# 05 Purchase Order - Unified Procure-to-Pay / Source-to-Pay

- **BPMN file:** 05-purchase-order.bpmn

## Scope, trigger, outcome
- **Scope:** Issuing a purchase order from an approved requisition and awarded quote, through budget hard-commitment (encumbrance), segregation-of-duties approval, PDF issue to the supplier, supplier acknowledgement, advance-payment trigger, pre-receipt amendment, and the framework/blanket call-off release variant. Covers the four PO types (item, service, maintenance, freight-forwarder). Stops at the handoff to fulfilment/receiving.
- **Trigger:** Diagram 04 (Sourcing) produces an APPROVED award: a selected Quotation linked to an approved Requisition, with the supplier ONBOARDED (Diagram 06).
- **Outcome:** The PO (or call-off release) is issued, budget-committed, sent to the supplier, acknowledged, any advance triggered, optionally amended pre-receipt, and handed to fulfilment. PO state moves draft -> issued -> acknowledged and remains open until all lines are received, matched, and paid (then closed downstream).

## Actors (lanes)
- **Procurement / Buyer** (`L_buyer`): drafts the PO and lines, sets tolerance and tax, submits for approval, amends pre-receipt, drafts call-off releases. Cannot approve own PO.
- **Approver** (`L_appr`): approves or rejects the PO. Never the PO creator (SoD).
- **Budget Owner** (`L_budget`): approves over-budget overrides.
- **Supplier / Vendor** (`L_supplier`): acknowledges the PO via authenticated external form (email + OTP).
- **Platform / System** (`L_sys`): encumbers budget, issues the PO, generates the number, renders and sends the PDF, triggers the advance, draws down framework ceilings, hands off to fulfilment.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Award approved, ready to order** (Buyer, start). Pre-conditions verified by the System: requisition approved, selected quotation present, supplier ONBOARDED, budget available. [SCOR S2.1 | ISO 8.4.3 | source: AB + RA award handoff]
2. **Standard PO or framework call-off?** (Buyer, exclusive). Routes to the call-off branch when an active in-validity framework with remaining ceiling exists for the item/quantity; otherwise to the standard PO draft. [SCOR S3.1 / OE6 | source: data-model, build-new]
3. **Draft PO from requisition + awarded quote** (Buyer). Full header field set (see fields table). [SCOR S2.1 | ISO 8.4.3 a-f | source: AB PO form + RA field engine]
4. **Enter PO lines, tax, tolerance** (Buyer). Line field set, tax as a first-class line attribute, qty tolerance for labels/cartons, computed totals in PO currency and base. [SCOR S2.1 | ISO 8.4.3 | source: AB tolerance + data-model POLine/TaxCode + FX/tax services]
5. **Budget available for hard commit?** (Budget Owner, exclusive). availableAmount >= poValueInBase -> commit; else over-budget override. [SCOR OE11 | source: build-new]
6. **Budget Owner approves over-budget override** (Budget Owner). Approve with mandatory reason (logged) or reject (back to draft). [SCOR OE11 | source: build-new]
7. **Create commitment, encumber budget** (System). Commitment created; availableAmount reduced, committedAmount increased. [SCOR OE11 | source: build-new, platform-services 11]
8. **Submit PO for approval (SoD)** (Buyer). Routed to a PO approver who is not the creator. PO state draft -> awaiting-approval. [SCOR S2.1 / OE2 | ISO 8.4 | source: role-permission-matrix SoD + RA engine]
9. **Approve or reject PO** (Approver). Approve, reject (with note, back to draft), or auto-approve within limit. [SCOR OE2 | ISO 8.4 | source: RA auto-approval]
10. **PO approved?** (Approver, exclusive). Approved -> issue; rejected -> revise. [source: build-new]
11. **Issue PO, generate number, render PDF** (System). State issued, number finalized from the configurable pattern (immutable), PDF rendered and stored, audit + SSE. [SCOR S2.1 | ISO 8.4.3 / 7.5 | source: AB PDF + RA SSE/audit]
12. **Email PO PDF to supplier** (System, send). Templated email; legacy MS-Word fallback recorded as attachment. [SCOR S2.1 | source: AB + platform-services 5]
13. **Supplier acknowledges PO** (Supplier). Acknowledge (state issued -> acknowledged) or raise discrepancy (back to buyer). [SCOR S2.1 | ISO 8.4.3(d) | source: AB ack + RA portal]
14. **Advance payment due on acknowledgement?** (Supplier, exclusive). Advance-bearing terms -> trigger; else proceed. [SCOR S2.7 | source: AB terms + RA installments]
15. **Trigger advance payment per schedule** (System). Creates AdvancePayment (requested), handed to Diagram 10; recouped against later invoices. [SCOR S2.7 | source: AB + data-model AdvancePayment]
16. **Pre-receipt amendment needed?** (Buyer, exclusive). Editable only until first GRN. Amend or proceed. [SCOR S2.1 | source: AB editable-until-receipt]
17. **Amend PO (audited, re-commit delta)** (Buyer). Field-level audited edit; commitment delta adjusted; revised PDF re-issued and re-acknowledged. [SCOR S2.1 | ISO 7.5 | source: AB amend + build-new]
18. **Hand off to fulfilment / receiving** (System). Requisition stage INITIATION -> ORDERED; handed to Diagram 08. [SCOR S2.2-S2.6 | source: data-model]
19. **PO live, fulfilment underway** (System, end).

### Call-off branch
- **Draft call-off release against framework** (Buyer). CallOffRelease with inherited read-only price/terms; drawdown validated against the remaining ceiling. [SCOR S3.1 / OE6 | source: data-model CallOffRelease]
- **Draw down ceiling, encumber, emit release** (System). Ceiling reduced, commitment created, release reference generated, document emitted; joins at supplier acknowledgement. No competitive approval (framework pre-approved); SoD still applies to value-changing edits. [SCOR S3.1 / OE6 | source: build-new]

## Gateways and branches (exact conditions)
- **Standard PO or framework call-off?**: `requisition.frameworkAgreementId set AND FrameworkAgreement.status = active AND needDate within FrameworkAgreement.validity AND requested item+quantity <= remaining ceiling` -> call-off; else standard PO.
- **Budget available for hard commit?**: `Budget(costCenter/project, period).availableAmount >= poValueInBase` -> commit; else over-budget override.
- **Budget Owner override**: `decision = approve-override` (with reason) -> encumber; `decision = reject` -> revise lines.
- **PO approved?**: `ApprovePO.decision = approve OR (poValueInBase <= approverLimit AND auto-approved)` -> issue; else revise (same draft, rejectionNote).
- **Advance payment due on acknowledgement?**: `paymentTerm in {100% advance, part-advance + balance against documents, part-advance + balance against shipment received} AND advance installment scheduled at acknowledgement` -> trigger; else no advance.
- **Pre-receipt amendment needed?**: `change required AND no GRN exists for PO (state in {issued, acknowledged})` -> amend; else proceed.

## Fields and dropdowns (full detail)

### PO header
| Field | Type | M/O | Default | Validation / rule | Owner |
| --- | --- | --- | --- | --- | --- |
| poNumber | string | M (auto) | pattern `PO-{YYYY}-{#####}` | configurable prefix/year/width; max+1 transactional; immutable once issued | System |
| poType | dropdown | M | derived from requisition.category | `item \| service \| maintenance \| freight-forwarder`; drives dynamic form | Buyer |
| requisitionRef | reference | M | from award | read-only, immutable | System |
| quotationRef | reference | M | from award | read-only | System |
| supplierName + supplierCode | reference | M | from award | read-only; code `S/#####`; supplier must be ONBOARDED | System |
| currency | dropdown | M | quotation.currency | `USD \| OMR \| SAR \| AED \| EUR \| CHF \| INR` (configurable) | Buyer |
| exchangeRate | decimal | O | live convertToBase rate | manual per-PO override; carries rateDate + source; blank -> FX service rate | Buyer |
| incoterm | dropdown | M | quotation.incoterm | Incoterms 2020 `EXW \| FCA \| FOB \| CFR \| CIF \| CPT \| CIP \| DAP \| DPU \| DDP`; FOB/CFR/CIF sea-only | Buyer |
| scopeOfWork | long text | M for service/maintenance, O for item | from quotation | - | Buyer |
| termsAndConditions | long text | M | tenant standard T&C template | editable per PO | Buyer |
| deliveryPlace | text/reference | M | - | warehouse or site address | Buyer |
| deliveryDate | date | M | requisition.needDate | >= today | Buyer |
| contactPerson | text | M | buyer name + phone | - | Buyer |
| isoDocRef | text | O | - | ISO 8.4.3 records traceability tag | Buyer |
| notes | long text | O | - | - | Buyer |
| attachments | file[] | O | - | - | Buyer |

### PO line
| Field | Type | M/O | Default | Validation / rule | Owner |
| --- | --- | --- | --- | --- | --- |
| itemRef | reference | M for item type | requisition line | ONBOARDED item or auto-created (Diagram 07); free-text for service/maintenance | Buyer |
| description | text | M | from item | editable | Buyer |
| quantity | decimal | M | requisition line | > 0 | Buyer |
| unitOfMeasure | dropdown | M | item.purchaseUom | UoM master | Buyer |
| agreedPrice | decimal | M | quotation line price | >= 0, in PO currency | Buyer |
| tolerancePercent | decimal | O | 0 | `+/-5 to 10` for labels/cartons/printed PM; applies to qty | Buyer |
| taxCodeRef | reference | M where jurisdiction requires | - | TaxCode master `GST \| VAT \| duty \| reverse-charge` | Buyer / Tax |
| taxableAmount | decimal | computed | quantity x agreedPrice | - | System |
| taxAmount | decimal | computed | taxableAmount x rate | reverse-charge for imports | System |
| lineValue | decimal | computed | taxableAmount + taxAmount | - | System |

### Computed totals
- `poValue = sum(lineValue)` in PO currency.
- `poValueInBase = convertToBase(poValue, currency)` using the exchangeRate override if set, else the FX service rate. Graceful degradation: on FX failure the original amount is used unconverted and logged (e08).

### Over-budget override
| Field | Type | M/O | Rule |
| --- | --- | --- | --- |
| decision | dropdown | M | `approve-override \| reject` |
| overrideReason | text | M when approve-override | logged to audit |
| overrideAmount | decimal | read-only | poValueInBase - availableAmount |

### Call-off release
| Field | Type | M/O | Rule |
| --- | --- | --- | --- |
| frameworkAgreementId | reference | M | active + in-validity |
| requisitionId | reference | M | - |
| item + quantity | from requisition | M | - |
| price + terms | read-only | - | inherited from FrameworkAgreement |
| value | computed | - | quantity x agreed price; drawdown <= remaining ceiling |

## Edge cases and error handling
- **Supplier not ONBOARDED**: PO cannot be issued; SUSPENDED/OFFBOARDED suppliers fail the Diagram 05 pre-condition (Diagram 06 gate).
- **FX fetch failure**: original amount used unconverted, logged, never throws (e08); thresholds operate on the approximate base.
- **Over-budget without override**: PO blocked; buyer revises lines or cancels.
- **Buyer attempts to approve own PO**: blocked by SoD; the approval engine excludes the creator from the eligible approver pool.
- **Amendment after first receipt**: PO is locked from full edits; only the qty-tolerance amend at receiving (Diagram 08) is allowed.
- **Material amendment**: a value increase re-enters the budget and approval gates; revised PDF re-issued and re-acknowledged.
- **Call-off exceeds ceiling**: release blocked; a new framework or a standard competitive PO is required.
- **PDF email delivery failure**: logged, not retried (fire-and-forget); supplier may still acknowledge via the portal.

## Business rules and invariants
- Buyer who creates a PO cannot approve it (SoD, role-permission-matrix).
- Budget is HARD-committed (encumbrance) at PO issue, distinct from the soft check at requisition; approval limits are not budget control.
- PO number is immutable once issued; generated transactionally from a configurable pattern.
- PO is editable only until the first goods receipt; after first GRN only the qty-tolerance amend at receiving is allowed.
- Tax is a first-class line attribute so the three-way match (Diagram 09) reconciles amounts including tax.
- Multi-currency with a configurable base currency; per-PO manual exchange-rate override, else the FX service rate.
- PO type set is `item | service | maintenance | freight-forwarder`; service/maintenance use scope of work + milestone acceptance (two-way match, no GRN); freight-forwarder ranks carriers and tracks AWB/BL.
- **One-time tooling charge (die/cylinder):** a die or cylinder tooling charge applies on the FIRST print order for a given packaging item only. On repeat orders for the same item the tooling charge is waived (the die/cylinder already exists). The PO line carries a `toolingApplicable` flag (true on first order, false on repeats) and the buyer confirms or overrides it. The tooling amount is a separate PO line, not folded into the unit price, so it is visible in the invoice match. (axiom A19) [SCOR S2.1 | source: AB die/cylinder tooling]
- **Freight-forwarder PO:** when the incoterm on the awarded quotation is buyer-arranged (EXW or FOB), the platform emits a second PO of type `freight-forwarder` in parallel with the supplier PO; this FF-PO covers freight, insurance, and customs clearing costs and is issued to the selected freight forwarder. When the incoterm is seller-arranged (CIF or CFR), no freight-forwarder PO is emitted (the seller bears freight and insurance). The FF-PO is subject to the same approval and budget-commitment rules as any PO. (axiom A19) [SCOR S2.3 | OE6 | source: AB freight-forwarder as supplier type]
- Framework call-off draws down a pre-approved ceiling without re-sourcing; SoD still applies to value-changing edits.
- Every committed change emits audit + SSE.

## Cross-references
- Upstream: 02 requisition, 03 approval, 04 sourcing, 06 supplier onboarding (PO gate), 07 item onboarding (line items).
- Downstream: 08 delivery/GRN, 09 invoice/match, 10 payments (advance/retention/installments), 12 analytics; e08 currency degradation.
- Benchmarks: SCOR S2.1 / S3.1 (Establish Order Signal), OE6 (Contracts and Agreements), OE11 (budget/commitment); ISO 8.4.3 (a-f information to providers), 7.5 (records). Sources: `model/data-model.md` (PurchaseOrder, POLine, FrameworkAgreement, CallOffRelease, Commitment, TaxCode, AdvancePayment), `model/platform-services.md` (FX, budget, tax, notifications, document storage).
