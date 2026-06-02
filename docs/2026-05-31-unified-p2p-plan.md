# Unified Procure-to-Pay / Supply-Chain Flow: Plan and Design Brief

Date: 2026-05-31
Status: Plan for approval (precedes the implementation plan)
Owner: Procurement platform initiative

## 1. Purpose

Produce one generic, company-neutral, role-complete model of the procure-to-pay process, extended to full source-to-pay, expressed as a BPMN diagram set with companion documentation, a knowledge graph, a data model, and a role/permission matrix. The model is the foundation for an investor and enterprise prototype. It must feel real from the first role a user touches: every field, action, control, and role has a defined purpose, and the flows are internally consistent end to end.

The model is built by extracting the best of two real implementations (Al Bahja and Raphe), reconciled against industry benchmarks (SCOR and the relevant ISO standards plus standard procurement metrics), and framed by a vendor-neutral blueprint.

## 2. Inputs and how each is used

| Input | What it provides | Use in the model |
| --- | --- | --- |
| P2P Blueprint (vendor-neutral) | Six capability pillars, generic roles, ten-stage spine, capability knowledge graph, investor framing | Skeleton and framing. Not the coverage boundary. |
| SCOR (ASCM/APICS reference) | Canonical process decomposition (Orchestrate, Plan, Order, Source, Transform, Fulfill, Return) to level 2, plus Performance, People, Practices | Canonical process spine and naming, and the completeness benchmark. Surfaces gaps neither company covers (for example Source Return). |
| Al Bahja | Procurement domain depth | Source content for sourcing and RFQ, landed cost, artwork and new-product development, customs and permits, cash float, contract supply, manual import tracking. |
| Raphe | Implementation depth of a built system | Source content for the ticket state model, configurable approval engine and auto-approval, installments, RBAC, bulk import, real-time updates, on-time-in-full, delivery blocks, dynamic field engine. |
| ISO standards and procurement KPIs | Formal requirements, evaluation criteria, and metric formulas | The rules that make the model credible: ISO 9001 clause 8.4 supplier control and the nonconformance-to-corrective-action loop, the broader ISO supplier criteria, and the standard scorecard and cycle metrics (OTD, OTIF, PPM, PPV, DPO, TCO). |

Benchmark precedence: where SCOR and ISO overlap, SCOR is primary. ISO supplements vendor-evaluation criteria, quality-management clause requirements, and records. The two companies are the reality check. The blueprint is the framing.

## 3. Locked scope decisions

1. Deliverable form: BPMN 2.0 diagram set (overview, per-domain flows, edge-case flows), each with a code and standard-cited markdown companion, plus a knowledge graph, an entity and data model, and a role-by-permission matrix.
2. Reconciliation method: blueprint six pillars and generic roles as the skeleton; SCOR codes as the canonical process spine and naming; Al Bahja domain depth and Raphe implementation depth slotted into each node; where the two companies conflict, prefer the more complete and benchmark-aligned option and record the variant.
3. SCOR scope: map the entire SCOR taxonomy into the knowledge base for benchmark completeness, but deep-dive and build flows around the procurement-relevant areas (Orchestrate, Order, Source, and the procure-to-pay-touching parts of Plan, Fulfill, and Return).
4. Core scope: promote competitive Sourcing and RFQ with landed-cost comparison, and invoice three-way matching, into the first-class core. The model represents full source-to-pay, not a partial core. This overrides the blueprint's roadmap labelling for those two areas.
5. Currency: multi-currency transactions with a configurable base and reporting currency (not hard-coded to any one currency) and an FX service that normalizes values for thresholds, comparison, and analytics.
6. Diagram set size: comprehensive, on the scale of the larger reference set. Overview plus roughly ten to fourteen per-domain flows plus roughly ten edge-case flows, each with a full companion document.

## 4. Coverage guarantee

The blueprint is the starting frame, never the boundary. The unified model covers the union of all sources at the leaf level: every role, business flow, user flow, and edge case present in Al Bahja or Raphe, plus those that SCOR or ISO require that neither company implements.

Phase B produces a coverage matrix as the auditable proof:

- Rows: every SCOR process (to level 2), every ISO requirement relevant to procurement, and every distinct role, flow, and edge case found in Al Bahja or Raphe.
- Columns: Blueprint, Al Bahja, Raphe, SCOR, ISO.
- Cells: covered, thin, or absent.

Anything not covered by the blueprint but present in Raphe, Al Bahja, SCOR, or ISO is flagged and pulled into the unified model. Examples that the blueprint omits and that the model must include:

- From Al Bahja: artwork and new-product-development approval, customs and permits and landed cost, cash float and reimbursement, contract and constant supply, manual import tracking, and the Factory Manager, Purchase Head, Quality, translator, and marketing roles.
- From Raphe: installment payments, RBAC permission resolution, bulk import, real-time updates, on-time-in-full streaks, the dynamic field engine, the maker and checker split, and the four-vertical chain.
- From SCOR and ISO: Source Return and return material authorization, supplier re-evaluation triggers, and the corrective-action loop that neither company fully implements.

## 5. Phases

The execution is sequential and memory-first (Approach 1). Each phase is persisted and reviewed at its boundary. The boundaries after Phase B and after Phase C are explicit approval gates before any diagram is drawn. Parallel multi-agent work is used only within Phase D, after the foundation is locked.

### Phase A: Map SCOR fully

Extract the complete SCOR taxonomy into the knowledge base: all seven process areas to level 2, plus the Performance metric pillars, People, and Practices. Produce a SCOR reference and a procurement-focused SCOR detail. Output: the benchmark spine, ready to map against.

### Phase B: Reconciliation and gap analysis

Build the coverage matrix described in section 4. For each SCOR process and blueprint stage, record what Al Bahja has, what Raphe has, where each is deep or thin, and what neither covers. Decide the best-of choice per area. Produce the generic role model and the first cut of the unified data model. Output: a reconciliation document and decision table. Approval gate.

### Phase C: Design the generic model

Define the generic roles and the role-by-permission matrix; the unified entity and data model; the master-data set; the stage, status, and lifecycle state machines; and the cross-cutting platform services (approval engine, field engine, FX service, audit, notifications, analytics). Each section is reviewed before moving on. Output: the design specification. Approval gate.

### Phase D: Produce the BPMN set and companions

Produce the numbered diagram set: a system overview, the per-domain flows, and the edge-case flows. Each diagram gets a companion document with every field, rule, role, and edge case, cross-referenced to its SCOR code and ISO clause and tagged with the source company. Domain diagrams that are independent of one another are drafted in parallel once the foundation is locked. Output: the diagram set plus companions plus the knowledge graph.

### Phase E: Validate against benchmarks

Check the finished model for coverage against SCOR processes and ISO requirements, confirm role-completeness so that a user entering at any role has a coherent experience, and flag anything still thin. Output: a validation report and any final adjustments.

## 6. Provisional domain and edge-case flow list

This list is provisional and will be confirmed at the end of Phase B, when the coverage matrix determines exactly which flows the model needs.

Domain flows (provisional):
1. System overview (end-to-end source-to-pay).
2. Configuration and master data setup.
3. Requisition and intake.
4. Approval workflow (configurable, multi-stage, threshold auto-approval).
5. Sourcing and RFQ to award and contract (with landed-cost comparison).
6. Purchase order issue and acknowledgement.
7. Supplier onboarding and qualification (single and bulk).
8. Item and catalog onboarding (single and bulk).
9. Delivery and goods receipt, including quality inspection.
10. Invoice capture and three-way matching.
11. Payments and installments.
12. Returns and return material authorization.
13. Spend analytics, supplier scorecard, and KPIs.

Edge-case flows (provisional):
1. Approval routing edge cases (no eligible approver, nearest-bucket selection, reassignment and delegation, auto-approval revert on financial change).
2. Quantity tolerance and partial deliveries (multiple goods-receipt notes against one order).
3. Nonconformance to corrective-action loop and supplier re-evaluation.
4. Auto-create supplier or item from a free-text reference.
5. Bulk import all-or-nothing with row-error accumulation.
6. Currency conversion and graceful degradation.
7. Cash purchase and float reimbursement.
8. Contract and constant supply (no requisition, no RFQ, no purchase order).
9. Artwork and new-product-development approval (parallel multi-reviewer).
10. Permit and document expiry and validity tracking.

## 7. Output location and traceability

The model is produced as a self-contained workspace separate from the source folders. Every element in the companion documentation is tagged with its SCOR code, its ISO clause where applicable, and the source it came from (Al Bahja, Raphe, blueprint, SCOR, or ISO), so the model is fully traceable back to its benchmarks and sources.

## 8. Approval requested

Please confirm this plan, the phase structure, and the provisional flow list. On approval, the next step is to write the detailed implementation plan and begin Phase A (mapping SCOR fully).
