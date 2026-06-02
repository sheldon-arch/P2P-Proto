# Unified Procure-to-Pay / Source-to-Pay: Diagram Set Index and Reading Guide

This folder holds the BPMN 2.0 diagram set for the company-neutral Unified Procure-to-Pay model, plus a markdown companion for each diagram. The model is generalized from two real implementations (Al Bahja domain depth, Raphe implementation depth), structured on the vendor-neutral six-pillar P2P framework, named on the SCOR process spine, and grounded in ISO 9001 clause 8.4, the broader ISO family, and standard procurement metrics, with finance controls (budget/commitment, GR/IR, tax) added per senior-practitioner review.

## How the set is organized

- Domain diagrams (`00`-`12`): the primary flows, one per major capability. Read these first, starting at `00`.
- Edge-case diagrams (`e01`-`e12`): focused diagrams that isolate a single tricky rule or branch that a domain diagram only references.

Every `.bpmn` has a matching `.md` companion with the same base name. The `.bpmn` shows the shape; the `.md` carries the field-level and rule-level detail. The `.bpmn` files are bpmn.io / Camunda-flavour BPMN 2.0 with embedded layout, rendered from the JSON specs in `.build/specs/` by `.build/render-all.sh`.

## Notation

Lanes are actors (roles). Rounded boxes are activities (user tasks = human, service tasks = automated system steps); diamonds are gateways (exclusive = one branch, parallel = fork/join); circles are start and end events. Follow the sequence-flow arrows from the start event; read gateway branch labels for the condition. Text annotations carry rules the shapes cannot show. Every node documentation and every companion step is tagged `[SCOR code | ISO clause | source]` where source is one of Al Bahja, Raphe, blueprint, SCOR, ISO, or build-new.

## The fourteen roles (lanes)

Requester, Approver (configurable multi-stage), Procurement/Buyer, Finance-Maker, Finance-Checker, Management, Supplier/Vendor, Receiving/Warehouse, Quality, Engineering, Budget Owner, Tax/Compliance, Administrator, Platform/System. Plus configurable approval participants (marketing/artwork reviewer, language reviewer, customs/clearing agent). Full definitions in `../model/role-model.md`; permissions in `../model/role-permission-matrix.md`.

## Table of contents

### Domain diagrams

| # | Title | Description | Companion | Diagram |
|---|---|---|---|---|
| 00 | System Overview | End-to-end source-to-pay across all roles; the top-level map. | [00-system-overview.md](00-system-overview.md) | [00-system-overview.bpmn](../diagrams/00-system-overview.bpmn) |
| 01 | Configuration and Master Data | Admin seeds masters, RBAC, approval chain, budgets, tax, field config; single + bulk. | [01-configuration.md](01-configuration.md) | [01-configuration.bpmn](../diagrams/01-configuration.bpmn) |
| 02 | Requisition and Intake | Raising a requisition: full field set, line items, budget soft-check, new-item sub-flow. | [02-requisition.md](02-requisition.md) | [02-requisition.bpmn](../diagrams/02-requisition.bpmn) |
| 03 | Approval Workflow | Configurable multi-stage chain, routing, load-balanced assignment, threshold auto-approval. | [03-approval.md](03-approval.md) | [03-approval.bpmn](../diagrams/03-approval.bpmn) |
| 04 | Sourcing and RFQ to Award | Strategic sourcing S1: RFQ, quote capture, negotiation, landed-cost comparison, award, contract. | [04-sourcing.md](04-sourcing.md) | [04-sourcing.bpmn](../diagrams/04-sourcing.bpmn) |
| 05 | Purchase Order | PO issue with budget commit, terms, incoterms, tax, PDF emit; framework call-off. | [05-purchase-order.md](05-purchase-order.md) | [05-purchase-order.bpmn](../diagrams/05-purchase-order.bpmn) |
| 06 | Supplier Onboarding | Lifecycle draft to active to suspended/offboarded; qualification, AVL, ISO attributes; single + bulk. | [06-supplier-onboarding.md](06-supplier-onboarding.md) | [06-supplier-onboarding.bpmn](../diagrams/06-supplier-onboarding.bpmn) |
| 07 | Item Onboarding | Item lifecycle; code generation; source priority; single, implicit, bulk. | [07-item-onboarding.md](07-item-onboarding.md) | [07-item-onboarding.bpmn](../diagrams/07-item-onboarding.bpmn) |
| 08 | Delivery, Goods Receipt, Inspection | Inbound tracking + customs; partial-delivery blocks; QC gate; GR/IR accrual; spares-to-engineering. | [08-delivery-grn.md](08-delivery-grn.md) | [08-delivery-grn.bpmn](../diagrams/08-delivery-grn.bpmn) |
| 09 | Invoice Capture and Matching | Two-way vs three-way match, tolerance, exception routing, credit/debit notes, GR/IR clearing. | [09-invoice-match.md](09-invoice-match.md) | [09-invoice-match.bpmn](../diagrams/09-invoice-match.bpmn) |
| 10 | Payments and Installments | Schedule, approve full/partial+remainder, process, reschedule, advance/retention, cash float, maker/checker. | [10-payments.md](10-payments.md) | [10-payments.bpmn](../diagrams/10-payments.bpmn) |
| 11 | Returns and RMA | SCOR S4: initiate, authorize, identify condition, schedule shipment, close with credit/debit note. | [11-returns-rma.md](11-returns-rma.md) | [11-returns-rma.bpmn](../diagrams/11-returns-rma.bpmn) |
| 12 | Spend Analytics and Scorecard | Two-stage scoring, OTIF/perfect-order, savings, cycle time, spend cuts, forecasting. | [12-analytics.md](12-analytics.md) | [12-analytics.bpmn](../diagrams/12-analytics.bpmn) |

### Edge-case diagrams

| # | Title | Description | Companion | Diagram |
|---|---|---|---|---|
| e01 | Approval Routing Edge Cases | No eligible approver, nearest-bucket selection, reassignment/delegation, auto-approval revert. | [e01-approval-routing.md](e01-approval-routing.md) | [e01-approval-routing.bpmn](../diagrams/e01-approval-routing.bpmn) |
| e02 | Budget Check and Commitment | Soft vs hard check, over-budget override, encumbrance, relieve to actual. | [e02-budget-commitment.md](e02-budget-commitment.md) | [e02-budget-commitment.bpmn](../diagrams/e02-budget-commitment.bpmn) |
| e03 | Quantity Tolerance and Partial Deliveries | +/-5-10% tolerance, amend PO before GRN, multiple GRNs per PO. | [e03-qty-tolerance.md](e03-qty-tolerance.md) | [e03-qty-tolerance.bpmn](../diagrams/e03-qty-tolerance.bpmn) |
| e04 | NCR to CAPA to Re-evaluation | The ISO closed loop 8.6 to 8.7 to 10.2 to 8.4.1; supplier suspension trigger. | [e04-ncr-capa.md](e04-ncr-capa.md) | [e04-ncr-capa.bpmn](../diagrams/e04-ncr-capa.bpmn) |
| e05 | Auto-create Supplier or Item | UUID lookup vs free-text auto-create; default PENDING_ONBOARDING. | [e05-auto-create.md](e05-auto-create.md) | [e05-auto-create.bpmn](../diagrams/e05-auto-create.bpmn) |
| e06 | Bulk Import All-or-Nothing | Exact header, row-error accumulation, single-transaction natural-key upsert. | [e06-bulk-import.md](e06-bulk-import.md) | [e06-bulk-import.bpmn](../diagrams/e06-bulk-import.bpmn) |
| e07 | Currency Conversion and Degradation | Base short-circuit, fetch/invalid-rate fallback, FX gain/loss. | [e07-currency.md](e07-currency.md) | [e07-currency.bpmn](../diagrams/e07-currency.bpmn) |
| e08 | Cash Purchase and Float | Cash branch, cash GRN (no PO ref), float reimbursement. | [e08-cash-float.md](e08-cash-float.md) | [e08-cash-float.bpmn](../diagrams/e08-cash-float.bpmn) |
| e09 | Contract and Constant Supply | No requisition/RFQ/PO; invoice-driven; delivered flag skips tracking. | [e09-contract-supply.md](e09-contract-supply.md) | [e09-contract-supply.bpmn](../diagrams/e09-contract-supply.bpmn) |
| e10 | Artwork and NPD Approval | NPD sample loop; parallel multi-reviewer artwork approval. | [e10-artwork-npd.md](e10-artwork-npd.md) | [e10-artwork-npd.bpmn](../diagrams/e10-artwork-npd.bpmn) |
| e11 | Permit and Document Expiry | Expiry + quantity tracking, alerts, regulated-item permits. | [e11-permit-expiry.md](e11-permit-expiry.md) | [e11-permit-expiry.bpmn](../diagrams/e11-permit-expiry.bpmn) |
| e12 | Two-way vs Three-way Match | Match-type selection, tolerance, duplicate-invoice and tax-mismatch exceptions. | [e12-match-condition.md](e12-match-condition.md) | [e12-match-condition.bpmn](../diagrams/e12-match-condition.bpmn) |

## Supporting model documents

- `../model/role-model.md` - the 14 roles and the mapping of every source role.
- `../model/role-permission-matrix.md` - permission namespace and the role x permission matrix.
- `../model/data-model.md` - entities, fields, and state machines.
- `../model/platform-services.md` - the 13 cross-cutting foundation services.
- `../model/knowledge-graph.md` - the capability ontology (Mermaid + graph.json).
- `../analysis/` - SCOR mapping, coverage matrix, best-of decisions (the derivation trail).
- `../docs/2026-05-31-unified-p2p-design-spec.md` - the design specification.

## Regenerating the diagrams

Edit a spec under `.build/specs/`, then run `bash .build/render-all.sh` to render and validate all diagrams. The renderer computes layout automatically from the spec.
