# Unified Procure-to-Pay / Supply-Chain Model: Design Specification

Date: 2026-05-31
Status: Design specification for review (Phase C output)
Precedes: Phase D (BPMN diagram set + companions)

## 1. Architecture overview

A company-neutral, role-complete model of full source-to-pay. The skeleton is the six-pillar P2P capability framework; the canonical process spine and naming come from SCOR (Source S1-S4 and the operational procure steps); the content is the best of two real implementations (Al Bahja domain depth, Raphe implementation depth); the rules and metrics are grounded in ISO 9001 clause 8.4 and the broader ISO family plus standard procurement KPIs, with finance controls (budget/commitment, GR/IR, tax) added per senior-practitioner review. Currency is multi-currency with a configurable base and an FX service. Sourcing/RFQ and invoice three-way matching are first-class core (not roadmap).

Six pillars: Source-to-Contract, Procure-to-Pay core, Supplier Management, Master Data, Spend Analytics, Platform Foundation. The platform foundation (configurable approval engine, dynamic field engine, FX, audit, notifications, real-time, bulk import, document storage, analytics, RBAC, budget/commitment, tax, ERP boundary) is built once and every workflow is configured on top of it.

## 2. The fourteen generic roles

Requester, Approver (configurable multi-stage), Procurement/Buyer (with import/local/cash sub-roles), Finance-Maker, Finance-Checker, Management, Supplier/Vendor, Receiving/Warehouse, Quality, Engineering (spares/services receipt), Administrator, Platform/System, Budget Owner, Tax/Compliance Reviewer. Plus configurable approval participants (marketing/artwork reviewer, language/regulatory-text reviewer, customs/clearing agent). Full mapping of every Al Bahja and Raphe source role onto these is in `model/role-model.md`; segregation-of-duties ruleset is defined there.

## 3. The process spine (SCOR-named)

Strategic sourcing (S1.1 Define Business Need ... S1.10 Negotiate and Award Contract) -> operational procure (Establish Order Signal -> Schedule Product Delivery -> Manage Inbound Transport -> Receive Product -> Inspect and Verify -> Transfer Product -> Authorize Supplier Payment) -> Source Return (S4.1-S4.5). Direct vs indirect is a flag on one spine. Budget check at requisition; commitment at PO; GR/IR accrual at receipt; tax on lines throughout; two-way match for services/no-GRN, three-way for materials. SCOR provenance caveat per `analysis/scor-procurement-map.md`.

## 4. Data model

~30 core and platform entities with key fields, the finance-control entities (Budget, Commitment, GrIrEntry, TaxCode, CreditNote/DebitNote, AdvancePayment, Retention, PaymentMilestone, FrameworkAgreement/CallOffRelease), and the finalized state machines (requisition three-dimension model, budget/commitment, supplier/item lifecycle with SUSPENDED, PO, installment, match two-way/three-way, NCR/return/CAPA loop). Full detail and transitions/guards in `model/data-model.md`. Every entity is benchmark-tagged.

## 5. Role-by-permission matrix

A namespaced permission set (resource.action) across all domains, with a granted/conditional/none cell for every role x permission, conditions carrying SoD rules, and supplier-facing permissions scoped to own records via authenticated external forms. Full matrix in `model/role-permission-matrix.md`. Every action has a permission; every role has a defined cell.

## 6. Platform foundation services

Thirteen services specified once and reused: configurable approval engine, dynamic field engine, FX/currency, audit trail, notifications, real-time (SSE), bulk import, document storage, analytics engine, identity/RBAC, budget/commitment, tax, ERP boundary. Full specification with source and benchmark tags in `model/platform-services.md`.

## 7. The four (now eight) build-new gap-fills

First-class flows the benchmarks require that neither company fully had: three-way match + exception handling (incl. two-vs-three-way condition, tolerance, duplicate-invoice detection), returns/RMA full flow (S4), the CAPA-to-re-evaluation loop (8.6->8.7->10.2->8.4.1), and the ISO supplier risk/security/continuity/ESG/anti-bribery attribute set; plus the review-added finance controls (budget/commitment, GR/IR, tax/withholding, credit/debit notes, advance/retention/milestone, blanket/call-off, supplier SUSPENDED). All built as full first-class flows/screens per the user decision.

## 8. Finalized flow list for Phase D

Re-derived from the completed model. This supersedes the provisional list in the plan.

Domain flows:
1. 00 System overview (end-to-end source-to-pay, all roles).
2. 01 Configuration and master data setup (admin: masters, roles/RBAC, approval chain, routing rules, field config, budgets, tax codes).
3. 02 Requisition and intake (form, line items, budget soft-check, reference resolution, category/direct-indirect, submit).
4. 03 Approval workflow (configurable multi-stage, routing, load-balanced assignment, threshold auto-approval, nearest-bucket, return-for-revision, budget gate, SoD).
5. 04 Sourcing and RFQ to award and contract (market analysis, prequalify, RFQ to >=3, quote capture, negotiation, landed-cost comparison, selection, award, contract).
6. 05 Purchase order (issue from requisition+quote, budget commit, incoterms/terms, multiple PO types, acknowledgement, amend, PDF emit; framework + call-off).
7. 06 Supplier onboarding and qualification (single + bulk; draft->approval->active->suspended->offboarded; qualification docs/COA/AVL; risk/security/ESG attributes).
8. 07 Item and catalog onboarding (single + bulk; lifecycle; code generation; source priority).
9. 08 Delivery, goods receipt and inspection (inbound tracking + transport modes + customs; partial-delivery blocks; derived status; QC inspection + COA gate; GR/IR accrual; spares-to-engineering variant).
10. 09 Invoice capture and matching (capture; two-way vs three-way; tolerance; exception resolution; duplicate detection; tax reconcile; GR/IR clearing; credit/debit notes; approval).
11. 10 Payments and installments (schedule; approve full/partial+remainder; process+receipt; reschedule; advance/retention; cash float; maker/checker; overdue reminder; creditor ledger).
12. 11 Returns and RMA (initiate -> authorize -> identify condition -> schedule shipment -> close/adjust + credit/debit note).
13. 12 Spend analytics, supplier scorecard and KPIs (scorecard two-stage scoring, OTIF/perfect-order, savings, spike, cycle time, spend cuts, forecasting).

Edge-case flows:
1. e01 Approval routing edge cases (no eligible approver, nearest-bucket, reassignment/delegation, auto-approval revert on financial change).
2. e02 Budget check and commitment/encumbrance (soft vs hard, over-commitment override, relieve to actual).
3. e03 Quantity tolerance and partial deliveries (multiple GRNs, PO amend within +/-5-10%).
4. e04 Nonconformance to CAPA to supplier re-evaluation loop (the ISO closed loop, supplier SUSPENDED trigger).
5. e05 Auto-create supplier or item from a free-text reference (UUID vs name; default PENDING_ONBOARDING).
6. e06 Bulk import all-or-nothing with row-error accumulation.
7. e07 Currency conversion and graceful degradation (base/null short-circuit, fetch/invalid-rate fallback, FX gain/loss).
8. e08 Cash purchase and float reimbursement (cash GRN, no PO ref, float top-up).
9. e09 Contract and constant supply (no requisition/RFQ/PO; invoice-driven; delivered flag skips tracking).
10. e10 Artwork and new-product-development approval (parallel multi-reviewer: factory/marketing/quality/language).
11. e11 Permit and document expiry and validity tracking (alerts on selection + before expiry).
12. e12 Two-way vs three-way match condition and exception routing (match-type selection, duplicate-invoice, tax-mismatch).

Note: the list grew from the provisional 13 domain + 10 edge to 13 domain + 12 edge (added e02 budget/commitment and e12 match-condition as their own edge cases, reflecting the review). Total: 25 diagrams + the overview = 26, comfortably in the comprehensive ~20-30 range.

## 9. Document and traceability convention

Every companion-doc step in Phase D is tagged with its SCOR code, its ISO clause where applicable, and its source (Al Bahja / Raphe / blueprint / SCOR / ISO / build-new). The model is fully traceable to its benchmarks and sources.

## 10. Self-review

- Placeholder scan: no TBD/TODO; the flow list is final, not provisional.
- Internal consistency: roles in section 2 match `role-model.md` (14) and the matrix columns in `role-permission-matrix.md`; entities in section 4 match `data-model.md`; services in section 6 match `platform-services.md`; the build-new set in section 7 matches `best-of-decisions.md`.
- Ambiguity: match-type rule (three-way iff GRN exists, else two-way), OTIF two-vs-four-factor, currency base configurable, approval all-to-one-vs-multi-stage are each stated explicitly.
- Scope: focused on the model; manufacturing/Transform, People/Skills catalog, and deep ERP integration are explicitly out/boundary-only.

Supporting artifacts: `model/role-model.md`, `model/role-permission-matrix.md`, `model/data-model.md`, `model/platform-services.md`, `analysis/coverage-matrix.md`, `analysis/best-of-decisions.md`, `analysis/scor-procurement-map.md`.
