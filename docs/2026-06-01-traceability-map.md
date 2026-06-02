# End-to-End Traceability Map

One page proving coverage across the whole model: for each BPMN flow, which SCOR codes and ISO clauses it implements, which build-spec screens and dictionary entities realize it, and where each piece came from (Al Bahja, Raphe, SCOR, ISO, or build-new). Every figure below is extracted from the actual files, not asserted.

Purpose: a builder or auditor can pick any field or screen and trace it back to a benchmark and a source, and trace it forward to a built thing. This is the artifact that shows nothing was dropped between the flows, the standards, and the prototype.

## Coverage at a glance

| Layer | Count | Location |
| --- | --- | --- |
| BPMN flows (13 core + 13 edge-case) | 26 diagrams + 27 companions | `diagrams/`, `documentation/` |
| Build-spec screens | 71 (65 internal + 6 portal) | `build-spec/screens/` |
| Dictionary entities / fields | 64 entities / 680+ fields (7 new entities added for G1-G7) | `build-spec/data-dictionary/` |
| Fields carrying a SCOR/ISO tag | all non-plumbing fields tagged | each entity field's `scorIso` |
| Distinct SCOR families used | S1, S2, S3, S4, OE1-OE11, RL, RS, CO, P3, O2 | tags + companions |
| Distinct ISO standards used | 7.5, 8.4, 8.4.1, 8.4.3, 8.6, 8.7, 10.2, 14001, 20400, 22301, 27001, 28000, 31000, 37001, HACCP, GMP, ICH | tags + companions |

The untagged fields are pure platform plumbing (ids, internal timestamps) with no benchmark equivalent, which is correct.

## Source provenance (where the 627 fields came from)

| Source | Fields | Share | Meaning |
| --- | --- | --- | --- |
| build-new | 181 | 28.9% | Designed new; no source-company precedent (finance controls, commitment, GR/IR, ISO loops) |
| Al Bahja (AB) | 160 | 25.5% | Domain depth from company 1 |
| Raphe (RA) | 136 | 21.7% | Implementation depth from company 2 |
| AB+RA | 55 | 8.8% | Merged from both |
| data-model | 36 | 5.7% | Derived from entity relationships |
| RA+AB | 26 | 4.1% | Raphe primary, Al Bahja secondary |
| ISO | 11 | 1.8% | Driven by an ISO standard |
| RA/AB + build-new | 16 | 2.6% | Source baseline plus a new extension |
| SCOR / AB+ISO / others | 6 | 0.9% | SCOR-only, AB+ISO, three-way synthesis |

Reading: roughly 60% reuses proven patterns from the two source companies, ~29% is net-new (mostly the finance-control and ISO-compliance layers neither company had), and the rest is synthesis. A healthy mix: high reuse where the companies were strong, deliberate build-new where they had gaps.

## The traceability matrix (flow -> benchmark -> screens -> entities -> source)

Each row: a BPMN flow, the SCOR/ISO it implements, the build-spec screens that realize it, the dictionary entities in that domain, and the dominant source.

| BPMN flow | SCOR | ISO | Screens (build-spec) | Entities | Source mix |
| --- | --- | --- | --- | --- | --- |
| 00 System overview | S1.1-S4, OE1-OE11 | 7.5, 8.4, 8.4.1, 8.4.3, 8.6, 8.7 | S00.1-3 shell + landings | AuditLog | AB+RA blueprint |
| 01 Configuration & master data | OE2, OE4, OE5, OE11 | 7.5, 8.4, 8.4.1 | S01.1-4 (masters, RBAC, routing, fields) | 14 (Currency, UoM, Category, Project, Role, Permission, RoutingRule, FieldConfig, TaxCode, User, Designation, BusinessUnit, Warehouse, AssetProposal) | RA + blueprint |
| 02 Requisition & intake | S1.1, OE2, OE4, OE11 | 7.5, 8.4 | S02.1-3 (list, form, detail) | Requisition, RequisitionLine | AB fields + RA structure |
| 03 Approval workflow | OE2, OE11 | 8.4, 8.4.3 | S03.1-3 (queue, approve modal, budget-stage modal) | ApprovalStageCompletion, RoutingRule | RA routing + AB FM-site |
| 04 Sourcing & RFQ to award | S1.2-S1.10, OE6 | 8.4.1, 8.6, 20400, 28000, 31000 | S04.1-6 (pipeline, RFQ, tracker, **landed-cost compare**, award, call-off) | RFQ, Quotation, QuotationLine, LandedCost, Contract, FrameworkAgreement, CallOffRelease | AB landed-cost + RA AVL + build-new framework |
| 05 Purchase order | S2.1, S3.1, OE2, OE11 | 8.4.3, 7.5 | S05.1-3 (list, issue, detail) | PurchaseOrder, POLine | AB PO form + build-new encumbrance |
| 06 Supplier onboarding | S1.6, OE4, OE9, OE10 | 8.4.1, 8.4, 8.7, 10.2, 20400, 22301, 27001, 28000, 31000, 37001 | S06.1-4 (list, form, detail, import) | Supplier, SupplierAddress, SupplierAddressTaxDetail, SupplierGroup | RA lifecycle + AB AVL + ISO attrs + multi-country tax |
| 07 Item onboarding | OE4, S1.6 | 7.5, 8.4.1, 8.6 | S07.1-2 (list, form) | Item, ItemSourcePriority | RA item lifecycle |
| 08 Delivery, GRN & inspection | S2.2-S2.6, OE8 | 8.4.3, 8.6, 8.7, 7.5 | S08.1-5 (deliveries, block, QC queue, inspect, GRN) | GoodsReceipt, PartialDeliveryBlock, Inspection, GrIrEntry | AB delivery + factory-import + build-new GR/IR |
| 09 Invoice capture & match | S2.7, OE4 | 8.6, 8.4, 7.5, 8.7, 10.2 | S09.1-5 (queue, capture, **match workbench**, resolve, approve) | Invoice, MatchResult, MatchException, CreditDebitNote | build-new GR/IR + AB matching rules |
| 10 Payments & installments | S2.7, OE1, OE6, OE3 | 8.4, 8.6, 37001, 7.5 | S10.1-7 (schedule, approve, release queue, process, reschedule, cash float, ledger) | Payment, PaymentSchedule, Installment, AdvancePayment, Retention, PaymentMilestone, CreditorLedger | AB maker/checker + RA installments + build-new |
| 11 Returns & RMA | S4.1-S4.5 | 8.7, 10.2, 8.4.1 | S11.1-6 (list, initiate, authorize, classify, close, NCR/CAPA workbench) | Return | build-new + AB NCR |
| 12 Analytics & scorecard | OE3, RL, RL.1.2, RS, CO, P3 | 8.4.1, 7.5 | S12.1-4 (dashboard, scorecard, spend, savings) | SupplierScorecard, Forecast | procurement-metrics-kpis |
| 13 Inventory replenishment | P3, O2, S2.6 | 8.4, 7.5 | (worklist view + reorder raise action on S02 and item detail) | Inventory, StockMovement | build-new (G7) |

### Edge-case flows (e01-e12): shown inline, not as separate screens

The 13 edge cases are behaviors layered onto the primary screens, not standalone screens. Each still traces to a benchmark and an entity:

| Edge flow | SCOR / ISO | Realized inline on | Entities | Source |
| --- | --- | --- | --- | --- |
| e01 Approval routing | OE2 / 8.4 | S03 approval queue | RoutingRule | RA routing |
| e02 Budget commitment | OE11 / 8.4.3, 7.5 | S02 budget banner, S05 hard-commit | Budget, Commitment | build-new |
| e03 Qty tolerance & partial delivery | S2.1, S2.6 / 8.4.3, 8.6 | S08.2 GRN block | PartialDeliveryBlock | AB + RA |
| e04 NCR to CAPA loop | S2.5, S4, OE3 / 8.6, 8.7, 10.2, 8.4.1 | S11.6 NCR/CAPA workbench, S12 scorecard | NCR, CorrectiveAction | build-new (the ISO loop) |
| e05 Auto-create from free-text | S1.1, OE4 / 8.4.1, 7.5 | S02 line entry | Supplier, Item (PENDING) | RA normalizer |
| e06 Bulk import all-or-nothing | OE4 / 7.5 | S01 / S06 / S07 import dialogs | (all masters) | RA bulk-import |
| e07 Currency & graceful degradation | OE4 | all money fields | Currency (FX service) | platform-services |
| e08 Cash float & reimbursement | S2.7 / 8.6, 7.5 | S10.6 cash float widget | CashFloat | AB local-purchase |
| e09 Contract & constant supply | OE6, S1.10 / 8.6, 8.4.3 | S04.6 call-off, S10 settlement | FrameworkAgreement, CallOffRelease | build-new |
| e10 Artwork & NPD approval | S1.10, OE4 / 8.6, 8.4.1 | S02/S03 (ProductDesign category) | RequisitionLine, ApprovalStageCompletion | AB new-product + artwork |
| e11 Permit & document expiry | OE4, S1.6 / 8.4.3, 8.4.1, 7.5 | S06 supplier, S04 sourcing gate | Supplier (cert fields) | AB regulated-chemical |
| e12 Two-way vs three-way match | S2.7, OE4 / 8.6, 8.4 | S09.3 match workbench | MatchResult, MatchException | data-model match logic |

## The benchmark chain along the golden path

The end-to-end SCOR/ISO spine the prototype's hero requirement walks:

```
S1.1 define need (02 Requisition)
  -> OE2/OE11 + 8.4 approve & budget (03 Approval, e02)
  -> S1.2-S1.10 + 8.4.1/8.6 source, qualify, landed-cost, award (04 Sourcing)
  -> S2.1 + 8.4.3 order, commit budget (05 PO, e02 hard-commit)
  -> S2.2-S2.6 + 8.6/8.4.3 receive, inspect, GR/IR (08 GRN, e03 tolerance)
  -> 8.6->8.7->10.2->8.4.1 nonconformance loop (e04 NCR->CAPA->re-evaluate->suspend)
  -> S2.7 + 8.6/8.4 match, clear GR/IR, pay (09 Match e12, 10 Payments)
  -> OE3 + RL/RS/CO/P3 + 8.4.1 close-out scorecard & KPIs (12 Analytics)
```

This is the same path the guided demo (`build-spec/guided-demo/`) walks, so the demo is a literal traversal of the benchmark chain.

### Inventory-driven demand trace (G7 addition)

```
P3 reorder trigger: Inventory.available <= Item.reorderPoint (13 Inventory, Diagram 13)
  -> O2 + S1.1 replenishment requisition raised by Inventory Manager (02 Requisition, reorderOrigin=true)
  -> OE2/OE11 + 8.4 approve & budget (03 Approval, same chain as standard)
  -> S1.8-S1.10 sourcing if no framework (04 Sourcing) OR S3.1 call-off (05 PO direct)
  -> S2.4-S2.6 + 8.6 receive, inspect, GRN (08 GRN)
  -> S2.6 + P3 RECEIPT movement increments stockOnHand, worklist clears (13 Inventory, StockMovement)
```

### Per-line award trace (G1 addition, hero path for TKT-HERO)

```
TKT-HERO (requisition with lines: API-grade material + carton packaging)
  -> RFQ-2026-0042 (API material line, invited 3 suppliers including Synthex)
     + RFQ-2026-0043 (carton packaging line, invited 3 suppliers including Cartonex)
  -> Quotations received: Synthex wins API line, Cartonex wins carton line (per-line award)
  -> Award event groups: Synthex lines -> PO-HERO-SYNTHEX; Cartonex lines -> PO-HERO-CTN
  -> Two POs issued from one sourcing event; both proceed to GRN/match/payment independently
```

This trace demonstrates axiom A16 (one PO per distinct winning supplier) and the per-line QuotationLine award linkage.

## How to use this map

- **Adding a field:** tag it with its `scorIso` and `source` in the dictionary JSON, so it stays traceable.
- **Adding a screen:** set its `Realizes` (the BPMN tasks) and `Tags` (SCOR + source), so coverage stays provable.
- **Auditing compliance:** pick an ISO clause (e.g. 8.4.1 supplier qualification) and grep the dictionary for it to see every field that implements it, then the screens that surface it.
- **Note on display:** the SCOR/ISO codes are traceability metadata only; they never appear in the user-facing UI (the copy layer's no-leak rule). They live in the spec for builders and auditors.

Prepared 2026-06-01. Source files: `Unified P2P/diagrams/`, `documentation/`, `build-spec/`, `analysis/scor-taxonomy.md`.
