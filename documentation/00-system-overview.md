# 00 System Overview - Unified Procure-to-Pay / Source-to-Pay

- **BPMN file:** 00-system-overview.bpmn

## Scope, trigger, outcome
- **Scope:** The end-to-end source-to-pay cycle for a single requirement, across all roles, from administrator setup through sourcing, ordering, receipt, matching, payment, and closure, with the build-new finance controls (budget/commitment, GR/IR, tax) and the returns/CAPA loop. This is the top-level map; each labelled area expands into a per-domain diagram (02-12) and the edge cases (e01-e12).
- **Trigger:** A requester identifies a purchase need (after administrator setup is complete).
- **Outcome:** The cycle closes when stage is POST_DELIVERY, all approval stages are APPROVED, all invoice matches are cleared, payments are settled, and no NCR/CAPA blocks remain; or it exits via on-hold/cancelled status. Analytics and audit update throughout.

## Actors (lanes)
Administrator (pre-seeds masters/roles/approval chain/budgets/tax), Requester, Budget Owner, Approver, Procurement/Buyer, Supplier/Vendor, Receiving/Warehouse, Quality, Finance-Maker, Finance-Checker, Management (terminal approval vertical), Platform/System (automated). Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative
Each step is detailed fully in its per-domain diagram; this overview states the spine. Tags: [SCOR code | ISO clause | source].

1. **Setup begins -> Configure masters, roles, approval chain, budgets, tax** (Administrator). Pre-seed before any transaction. [SCOR OE2/OE4/OE5/OE11 | source: blueprint + build-new]. Detail: 01-configuration.
2. **Need identified -> Raise requisition** (Requester). Header + lines with full field set; soft budget check on submit. [SCOR S1.1/O2 | ISO 7.5 | AB fields + RA structure]. Detail: 02-requisition.
3. **Within budget or override?** (Budget Owner, exclusive). value <= cost-center available -> proceed; over -> override (logged) or revise. [SCOR OE11 | build-new]. Detail: e02.
4. **Route into configurable approval chain** (System). Resolve chain by department/category/value, create per-stage completions, assign first stage least-loaded. [SCOR OE2 | ISO 8.4 | RA]. Detail: 03, e01.
5. **Approve through stages** (Approver). Auto-approve within threshold (nearest-bucket) else manual; SoD enforced. [SCOR OE2 | RA + AB]. Detail: 03.
6. **Approved?** (exclusive). Approved -> source; Rejected -> revise loop.
7. **Source: RFQ, compare landed cost, select, award** (Buyer). Full sourcing depth. [SCOR S1.2-S1.10 | AB + RA]. Detail: 04.
8. **Onboard / qualify supplier (if new)** (Supplier). Gates ordering. [SCOR S1.6 | ISO 8.4.1 + family | RA + AB]. Detail: 06.
9. **Issue PO (budget commit, terms, PDF)** (Buyer). Hard budget commit; tax on lines; editable until receipt; buyer != PO approver. [SCOR S2.1 | ISO 8.4.3 | AB + build-new]. Detail: 05.
10. **Acknowledge PO** (Supplier). Advance payment triggers per schedule. [SCOR S2.1 | both]. Detail: 05.
11. **Manufacture, ship, share documents** (Supplier). Docs after dispatch; import docs. [SCOR S2.2/S2.3 | AB]. Detail: 08.
12. **Receive, inspect (GRN), QC gate** (Receiving/Quality). Blocks + transport tracking; COA->QC->GRN; GR/IR accrual; qty tolerance amends PO; spares to Engineering. [SCOR S2.4-S2.6 | ISO 8.6/8.7 | AB + RA]. Detail: 08, e03.
13. **QC pass?** (Quality, exclusive). Pass -> invoice; Fail -> NCR.
14. **Raise NCR -> RMA / CAPA loop** (Quality). NCR -> disposition -> return (S4) + corrective action -> re-evaluation -> may SUSPEND supplier. [SCOR S4 | ISO 8.6->8.7->10.2->8.4.1 | build-new]. Detail: 11, e04.
15. **Capture invoice, two/three-way match** (Finance-Maker). Three-way for materials, two-way for services; tolerance + tax-inclusive; exception routing; GR/IR clearing; credit/debit notes. [SCOR S2.7 | ISO 8.6 | build-new + AB]. Detail: 09, e12.
16. **Schedule and process payment (installments)** (Finance-Maker). Terms; partial+remainder; advance/retention; cash float; withholding; overdue reminder. [SCOR S2.7 | RA + AB]. Detail: 10, e08.
17. **Approve payment release (checker)** (Finance-Checker). maker != checker (financial-control SoD, SOX/COSO + ISO 37001). Detail: 10.
17a. **Management final approval (terminal vertical)** (Management). Management gives final sign-off, frequently exercised through approving the final payment installment release; marks the Management completion APPROVED, the last gate before the COMPLETED guard. [SCOR OE1/S2.7 | source: RA MANAGEMENT vertical]. Detail: 03, 10.
18. **Close out, update analytics + audit** (System). Commitment relieved to actual; scorecard/cycle-time/savings/spend updated; audit + SSE throughout. [SCOR OE3 + RL/RS/CO | ISO 8.4.1 | both + KPIs]. Detail: 12.
19. **Source-to-pay complete** (System, end).

## Gateways and branches
- **Within budget or override?** within / override-approved -> route; over, no override -> revise.
- **Approved?** Approved -> source; Rejected -> revise (same identifier, mandatory note).
- **QC pass?** Pass -> invoice; Fail -> NCR -> (resolved/accepted) -> invoice.

## Business rules and invariants
- Requisition identifier is immutable across the whole cycle including delays. Budget soft-checked at requisition, hard-committed at PO, relieved to actual at GR/invoice. Approval limits are not budget control. SoD: buyer != PO approver, receiver != invoice approver, maker != checker, never self-approve own requisition. Match type: three-way iff a GRN exists, else two-way. Completion requires POST_DELIVERY + all stages APPROVED + matches cleared + no NCR/CAPA block. Currency multi-currency with configurable base + FX service. Every committed change emits audit + SSE.

## Cross-references
01 configuration, 02 requisition, 03 approval, 04 sourcing, 05 purchase order, 06 supplier onboarding, 07 item onboarding, 08 delivery/GRN, 09 invoice/match, 10 payments, 11 returns/RMA, 12 analytics; edge cases e01-e12. Benchmarks: `scor-model`, `iso-supply-chain-standards`, `procurement-metrics-kpis`.
