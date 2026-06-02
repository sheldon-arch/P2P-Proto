# Unified Procure-to-Pay / Supply-Chain Model: Implementation Plan

> **For agentic workers:** This plan produces a documentation and modeling deliverable (BPMN diagrams, companion docs, knowledge graph, data model, role matrix), not application code. Each task produces a concrete artifact with explicit verification criteria instead of unit tests. Steps use checkbox (`- [ ]`) syntax. **Hard rule: stop and request user permission after each phase (A, B, C, D, E). Do not start the next phase until the user approves.**

**Goal:** Build one company-neutral, role-complete, benchmark-traceable model of full source-to-pay as a BPMN diagram set plus companion docs, knowledge graph, data model, and role/permission matrix, extracting the best of Al Bahja and Raphe and measured against SCOR and ISO.

**Architecture:** Skeleton = P2P Blueprint six pillars and generic roles. Canonical process spine and naming = SCOR codes. Node content = best-of Al Bahja (domain depth) and Raphe (implementation depth). Rules and metrics = ISO 9001 clause 8.4 plus the broader ISO family and standard procurement KPIs. Diagrams are authored as compact JSON specs and rendered to valid BPMN by a reused deterministic toolchain.

**Tech Stack:** Markdown for docs and matrices; Mermaid for the knowledge graph; JSON specs rendered to BPMN 2.0 XML via the existing `bpmn-builder.mjs` / `render.mjs` / `render-all.sh` toolchain (Node v25, optional xmllint for validation); Python 3 (stdlib) for SCOR JSON extraction and coverage tabulation.

**Spec:** `/Users/apple/Desktop/User Flows/Unified P2P/docs/2026-05-31-unified-p2p-plan.md`

**Source inputs (read-only):**
- Al Bahja: memory files `albahja-*`; source `/Users/apple/Desktop/User Flows/Al Bahja/`
- Raphe: memory files `raphe-*`; source `/Users/apple/Desktop/User Flows/Raphe/`
- Blueprint: memory files `p2p-blueprint-*`; source `/Users/apple/Desktop/User Flows/Procure-to-Pay Platform/`
- SCOR: `/Users/apple/Downloads/scordata.json`
- Benchmarks: memory files `iso-supply-chain-standards`, `procurement-metrics-kpis`

**Output workspace:** `/Users/apple/Desktop/User Flows/Unified P2P/`
- `docs/` plan and design docs
- `analysis/` SCOR extraction and coverage matrix
- `.build/` toolchain (copied) and `.build/specs/` JSON specs
- `diagrams/` rendered `.bpmn`
- `documentation/` companion `.md` per diagram
- `model/` knowledge graph, data model, role matrix
- Memory: `/Users/apple/.claude/projects/-Users-apple-Desktop-User-Flows/memory/`

---

## Phase A: Map SCOR fully

**Outcome:** Complete SCOR taxonomy extracted to a readable reference plus a procurement-focused detail, persisted to memory as `scor-model` (resolving the existing forward-links from the ISO files) and to `analysis/`.

### Task A1: Extract the full SCOR taxonomy to a structured file

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/scor-taxonomy.md`
- Read: `/Users/apple/Downloads/scordata.json`

- [ ] **Step 1: Extract every process area, level, code, and name into Markdown.**

Run a Python stdlib script (inline via Bash, no file needed) that loads `scordata.json` and, for chapter "Processes", walks each tab's sections ordered by (level, order), emitting an indented tree per process area with `[externalId] name` at each level (L0 to L2). Then do the same for People (Experiences, Trainings) and Practices (Best Practices by Category and by Pillar) as flat lists with codes. Write the result to `scor-taxonomy.md` under headed sections: Orchestrate, Plan, Order, Source, Transform, Fulfill, Return, then Performance (metric pillar names), People, Practices.

- [ ] **Step 2: Verify completeness.**

Confirm the file contains all 7 process-area roots (OE, P, O, S, T, F, R), the Source subtree (S1-S4 with their S1.1..S4.5 leaves), and the Practices list (BP.xxx). Cross-check counts against the dataset: section level distribution is 15 L0, 734 L1, 891 L2. Expected: the Markdown tree row count for Processes tabs matches the dataset's Processes section count.

- [ ] **Step 3: Confirm no fabrication.**

Every code and name in the file must come verbatim from `scordata.json`. Spot-check 5 random leaf codes against the JSON. Expected: exact match. If the dataset lacks prose bodies (it does; sections carry structure only), state that explicitly at the top of the file so no descriptive text is invented.

### Task A2: Write the procurement-focused SCOR mapping

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/scor-procurement-map.md`
- Read: `analysis/scor-taxonomy.md`

- [ ] **Step 1: Identify the procurement-relevant SCOR processes.**

From the taxonomy, list the processes that touch procure-to-pay: all of Source (S1 Strategic Source, S2 Direct Procure, S3 Indirect Procure, S4 Source Return) with their leaves; Order; the relevant Orchestrate elements; and the touch-points in Plan (supply planning), Fulfill (receiving/delivery overlap), and Return. For each, write one line: the SCOR code, the canonical SCOR step name, and which unified-model domain it maps to.

- [ ] **Step 2: Mark the procurement spine.**

Explicitly designate the canonical procurement spine using SCOR names and codes (for example: Define Business Need S1.1, Conduct Supply Market Analysis S1.2, ... Negotiate and Award Contract S1.10; then Establish Order Signal S2.1/S3.1, Schedule Product Delivery, Manage Inbound Transport, Receive Product, Inspect and Verify, Transfer Product, Authorize Supplier Payment; and Source Return S4.1-S4.5). This is the naming the diagrams will use.

- [ ] **Step 3: Verify against the spec scope decision.**

Confirm the map covers Orchestrate, Order, Source deeply and notes the P2P-touching parts of Plan, Fulfill, Return (per spec section 3.3). Expected: every Source leaf appears; Plan/Transform/Fulfill/Return appear at least at L1 with a note on procurement relevance.

### Task A3: Persist SCOR to memory

**Files:**
- Create: `/Users/apple/.claude/projects/-Users-apple-Desktop-User-Flows/memory/scor-model.md`
- Modify: `/Users/apple/.claude/projects/-Users-apple-Desktop-User-Flows/memory/MEMORY.md`

- [ ] **Step 1: Write the `scor-model` memory file.**

Frontmatter `name: scor-model`, `description:` one line, `metadata.type: reference`. Body: the 7 process areas and what each means; the Source decomposition S1-S4 with leaves; the Performance/People/Practices pillars; the procurement spine designation; and the note that SCOR is the process benchmark and is primary over ISO where they overlap. Link `[[iso-supply-chain-standards]]`, `[[procurement-metrics-kpis]]`, `[[p2p-blueprint-overview]]`. Keep it one fact-dense file (it is the benchmark spine).

- [ ] **Step 2: Update MEMORY.md index.**

Replace the placeholder line `- scor-model — (to be written) ...` with a real index entry: `- [scor-model](scor-model.md) — SCOR DS taxonomy: Orchestrate/Plan/Order/Source/Transform/Fulfill/Return (L0-L2) + Performance/People/Practices; procurement spine + benchmark-primary-over-ISO note`.

- [ ] **Step 3: Verify links resolve.**

Run the memory link-check (the for-loop that flags `[[name]]` with no matching file). Expected: no MISSING lines; `scor-model` now resolves the forward references from the ISO files.

### Phase A stop gate

- [ ] **Report to user:** summarize what SCOR contains, the procurement spine, and confirm `scor-model` is in memory. **Request permission to start Phase B. Do not proceed until granted.**

---

## Phase B: Reconciliation and gap analysis

**Outcome:** A coverage matrix (the auditable proof nothing is dropped), a best-of decision table, the generic role model, and a first-cut unified data model. Approval gate.

### Task B1: Build the coverage matrix

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/coverage-matrix.md`
- Read: memory `scor-model`, `albahja-*`, `raphe-*`, `p2p-blueprint-*`, `iso-supply-chain-standards`, `procurement-metrics-kpis`

- [ ] **Step 1: Assemble the row set.**

Build the row list from the union of: every SCOR procurement-relevant process (from `scor-procurement-map.md`); every ISO requirement relevant to procurement (clause 8.4 activities, 8.6, 8.7, 10.2, plus the supplier-criteria dimensions from 28000/22301/31000/20400/27001/14001/37001); and every distinct role, business/user flow, and edge case found in Al Bahja or Raphe. Group rows by capability area (sourcing, requisition, approval, PO, supplier mgmt, item mgmt, receiving/QC, invoice/match, payments, returns, analytics, platform/foundation, roles).

- [ ] **Step 2: Fill the columns.**

For each row, a cell per source (Blueprint, Al Bahja, Raphe, SCOR, ISO) marked `covered` / `thin` / `absent`, with a few words of evidence (for example "Raphe: nearest-bucket auto-approval e01"; "Al Bahja: landed-cost formula meet-8"). Render as Markdown tables per capability area.

- [ ] **Step 3: Verify the binding examples are present.**

Confirm every example named in the spec coverage guarantee appears as a row: Al Bahja artwork/NPD, customs/permits/landed-cost, cash float, contract/constant supply, manual import tracking, FM/PurchaseHead/QA/translator/marketing roles; Raphe installments, RBAC resolution, bulk import, SSE, OTIF, field engine, maker/checker, four verticals; SCOR Source Return S4/RMA, ISO supplier re-eval triggers and CAPA loop. Expected: each is a row with its source cell marked covered and the blueprint cell marked thin or absent.

### Task B2: Write the best-of decision table

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/best-of-decisions.md`
- Read: `analysis/coverage-matrix.md`

- [ ] **Step 1: One decision per capability area.**

For each area, record: which source the unified model takes its primary structure from and why; what is grafted from the other source; what SCOR/ISO adds that neither has; and the SCOR code and ISO clause it maps to. Apply the tie-breaker from spec 3.2 (prefer the more complete and benchmark-aligned option, record the variant).

- [ ] **Step 2: Resolve the known cross-company conflicts explicitly.**

Decide and record at minimum: approval model (Raphe configurable multi-stage engine + auto-approval vs Al Bahja FM-then-PurchaseHead) into one configurable chain; currency (multi-currency + FX base per spec 3.5); sourcing/invoice-matching promoted to core (spec 3.4); supplier/item lifecycle (Raphe four-state) merged with Al Bahja qualification depth; tracking (Raphe derived delivery status vs Al Bahja manual transport-mode + ETA alarm) as a configurable union.

- [ ] **Step 3: Verify every matrix gap has a decision.**

Cross-check: every row in the coverage matrix marked covered by any source must appear in a decision (carried in or explicitly deferred with reason). Expected: no orphan capability.

### Task B3: Define the generic role model

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/role-model.md`
- Read: `analysis/best-of-decisions.md`, memory role content from both companies

- [ ] **Step 1: Map all source roles onto a generic set.**

List the generic roles (Requester, Approver across configurable stages, Procurement/Buyer, Finance maker, Finance checker, Management, Supplier/Vendor, Receiving/Warehouse, Quality, Administrator, Platform/System). For each, list which Al Bahja and Raphe roles it absorbs (for example Approver absorbs Factory Manager + Purchase Head + Raphe vertical approvers; Quality absorbs Al Bahja QA/QC; note specialist reviewers like Arabic translator and marketing as configurable approval participants).

- [ ] **Step 2: Verify no source role is dropped.**

Cross-check against the role rows in the coverage matrix. Expected: every distinct role from either company maps to exactly one generic role (or is explicitly noted as a configurable participant).

### Task B4: Draft the unified data model (first cut)

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/data-model.md`
- Read: memory `raphe-masters-and-data-model`, `albahja-masters-and-fields`, `p2p-blueprint-knowledge-graph`

- [ ] **Step 1: List core entities and key fields.**

Entities: Requisition/PurchaseRequest, RequisitionLine, ApprovalChain/Stage/Completion, RFQ, Quotation, Contract, PurchaseOrder, POLine, Supplier (+Address+TaxDetail+Group), Item (+SourcePriority), GoodsReceipt/DeliveryBlock, Inspection/NCR, Invoice, MatchResult, Payment/Installment, Project/CostCenter, plus masters (UoM, Currency, Warehouse, PaymentTerms, Category/Segment) and platform entities (User, Role, Permission, Designation, Vertical/BusinessUnit, AuditLog, FieldConfig, RoutingRule, SupplierScorecard). For each, the key fields, drawing from both companies (note where a field is Al Bahja-specific, Raphe-specific, or merged).

- [ ] **Step 2: State the state machines.**

Requisition/ticket stage, status, per-stage completion; supplier/item lifecycle; installment status; delivery-status derivation; PO status. Use the merged set from best-of-decisions.

- [ ] **Step 3: Verify entity-to-SCOR/ISO traceability.**

Each entity tagged with the SCOR process that produces it and any ISO record requirement it satisfies (for example Inspection/NCR satisfies ISO 8.6/8.7/10.2 records). Expected: no entity without a benchmark tag.

### Phase B stop gate

- [ ] **Report to user:** present the coverage matrix summary (counts of covered/thin/absent per area, the gaps being filled), the best-of decisions, the role model, and the data-model first cut. **Request permission and section-level feedback before Phase C. Do not proceed until granted.**

---

## Phase C: Design the generic model (the design specification)

**Outcome:** The full design spec: finalized roles and role-by-permission matrix, finalized data model, master-data set, lifecycle state machines, and cross-cutting platform services. Approval gate. Sections reviewed as presented.

### Task C1: Role-by-permission matrix

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/role-permission-matrix.md`
- Read: `model/role-model.md`, memory `raphe-auth-rbac`

- [ ] **Step 1: Define the permission namespace.**

List the namespaced permissions for every action in the model (requisition.create, ticketVertical.approve, suppliers.approve, payments.schedules.process, routingRules.update, and so on), generalized from Raphe's set plus actions Al Bahja implies (artwork.approve, permit.manage, cashFloat.reimburse). Note RBAC resolution as the union of role, direct grant, designation, business-unit, with a super-admin grant (from `raphe-auth-rbac`).

- [ ] **Step 2: Build the matrix.**

Rows = generic roles; columns = permissions (or permission groups); cells = granted/conditional/none. Conditional cells carry the condition (for example Approver.approve conditional on being the requested approver or an assignee of sufficient designation).

- [ ] **Step 3: Verify completeness.**

Every action that appears in any planned flow must have a permission, and every generic role must have a defined cell for it. Expected: no action without a permission; no blank cells.

### Task C2: Finalize the data model and lifecycle state machines

**Files:**
- Modify: `/Users/apple/Desktop/User Flows/Unified P2P/model/data-model.md`

- [ ] **Step 1: Incorporate Phase B feedback and lock entity fields.**

Apply any user changes from the Phase B gate. Finalize every entity's fields, types, enums, defaults, code formats (generalized: configurable requisition/PO/supplier/item identifier patterns, not the company-specific literals), and relationships.

- [ ] **Step 2: Lock the state machines with transitions and guards.**

For each lifecycle, the states, allowed transitions, the guard on each transition, and the cross-dimension rules (for example completion guard, financial-revert rule, locked-schedule rule), generalized from both companies.

- [ ] **Step 3: Verify internal consistency.**

Every enum value referenced in a transition is defined; every entity referenced by a relationship exists; every state machine has an initial and terminal state. Expected: no dangling reference.

### Task C3: Cross-cutting platform services design

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/platform-services.md`
- Read: memory `raphe-*`, `p2p-blueprint-overview`, `procurement-metrics-kpis`

- [ ] **Step 1: Specify each foundation service.**

Configurable approval engine (multi-stage by department/category/value, load-balanced assignment, threshold auto-approval, nearest-bucket, delegation, limits); dynamic field engine (fields by stage/scope/purchase-type, mandatory gating, reference resolution); FX/currency service (multi-currency, configurable base, graceful degradation); audit trail; notifications; real-time updates; bulk import (all-or-nothing, natural-key upsert); document storage; analytics engine (the scorecard and KPI formulas from `procurement-metrics-kpis`, two-stage scoring, OTIF streaks); RBAC; ERP integration boundary.

- [ ] **Step 2: Verify each service maps to its benchmark.**

Each service tagged with the SCOR practice and ISO clause it embodies where applicable (for example analytics scorecard to ISO 8.4.1 monitoring and the KPI formulas; approval engine to ISO segregation-of-duties). Expected: no service without a source and a benchmark.

### Task C4: Assemble and self-review the design specification

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/docs/2026-05-31-unified-p2p-design-spec.md`

- [ ] **Step 1: Assemble.**

One spec document linking the role model, role-permission matrix, data model, state machines, and platform services, with an architecture overview (pillars, generic roles, SCOR spine, the layering). Follow the user document style (no emojis, no em dashes, plain professional English, exhaustive detail).

- [ ] **Step 2: Self-review.**

Placeholder scan (no TBD/TODO); internal consistency (sections agree); ambiguity check (pick one interpretation, make it explicit); scope check (focused on the model). Fix inline.

- [ ] **Step 3: Confirm the provisional flow list against the design.**

Re-derive the domain and edge-case flow list from the finalized model (spec section 6 was provisional). Produce the final flow list for Phase D and note any change from the provisional list.

### Phase C stop gate

- [ ] **Report to user:** present the design spec and the finalized flow list. **Request permission before Phase D. Do not proceed until granted.**

---

## Phase D: Produce the BPMN set and companions

**Outcome:** The rendered BPMN diagram set, a companion doc per diagram, and the knowledge graph. Independent domain diagrams are authored in parallel once the toolchain is in place.

### Task D1: Set up the diagram toolchain in the workspace

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/.build/bpmn-builder.mjs` (copy)
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/.build/render.mjs` (copy)
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/.build/render-all.sh` (adapted ROOT path)
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/.build/specs/` (dir)

- [ ] **Step 1: Copy the builder and renderer.**

Copy `bpmn-builder.mjs` and `render.mjs` verbatim from `/Users/apple/Desktop/User Flows/Procure-to-Pay Platform/.build/`. Copy `render-all.sh` and change `ROOT` to the Unified P2P workspace and the output to a `diagrams/` subfolder.

- [ ] **Step 2: Smoke-test with a one-node spec.**

Create a throwaway `specs/_smoke.json` with one lane, a start node (col 0), an end node (col 1), and one flow between them. Run `node .build/render.mjs .build/specs/_smoke.json diagrams/_smoke.bpmn`. Expected: `ok diagrams/_smoke.bpmn (2 nodes, 1 flows)`. Then `xmllint --noout diagrams/_smoke.bpmn` if available. Expected: no error. Delete the smoke files.

- [ ] **Step 3: Record the spec schema for authors.**

Write `/Users/apple/Desktop/User Flows/Unified P2P/.build/SPEC-SCHEMA.md`: a spec is `{id, name, lanes:[{id,name}], nodes:[{id, type, name, lane, col, doc?}], flows:[{id, source, target, name?, doc?}], annotations?:[...]}`. Node types: start, end, intermediateCatch, intermediateThrow, boundary, user, service, manual, task, send, receive, script, business, exclusive, parallel, inclusive, event, subprocess. Every non-start node needs an incoming flow; every non-end node needs an outgoing flow; lanes ordered top to bottom; col increases left to right along the happy path. doc fields carry the rule text.

### Task D2: Author and render the system overview diagram

**Files:**
- Create: `.build/specs/00-system-overview.json`
- Create: `diagrams/00-system-overview.bpmn` (rendered)
- Create: `documentation/00-system-overview.md`

- [ ] **Step 1: Author the spec.**

Lanes = the generic roles. Nodes = the end-to-end source-to-pay happy path using SCOR step names (Define Business Need ... Negotiate and Award Contract, then requisition/approval/PO/onboarding/receipt/inspect/invoice-match/payment/returns/close). Each node `doc` cites its SCOR code and source. Include the single rework loop. Render with `render.mjs`.

- [ ] **Step 2: Render and validate.**

Run the renderer. Expected: `ok` with node/flow counts. Run `xmllint --noout` if available. Expected: no error.

- [ ] **Step 3: Write the companion doc.**

Structure mirroring the reference companions: BPMN file, scope/trigger/outcome, actors (lanes), step-by-step narrative (each step tagged with SCOR code, ISO clause where relevant, and source company), gateways and branches, edge cases, business rules and invariants, cross-references. Follow the user document style.

- [ ] **Step 4: Verify traceability.**

Every step in the companion has a SCOR or source tag. Expected: no untagged step.

### Task D3: Author and render the per-domain diagrams

**Files (per the finalized flow list from Task C4; one set each):**
- Create: `.build/specs/NN-<domain>.json`, `diagrams/NN-<domain>.bpmn`, `documentation/NN-<domain>.md`

Domains (final list confirmed in C4; provisional): configuration-master-data, requisition-intake, approval-workflow, sourcing-rfq-award, purchase-order, supplier-onboarding, item-onboarding, delivery-grn-inspection, invoice-three-way-match, payments-installments, returns-rma, analytics-scorecard.

- [ ] **Step 1: Author each spec.**

For each domain, author the JSON spec: lanes = the roles involved, nodes = the full flow with gateways and branch labels, each node `doc` carrying the field/rule detail and tagged with SCOR code, ISO clause, and source company. Pull the depth from the richer company (for example sourcing-rfq from Al Bahja + SCOR S1; approval-workflow from Raphe engine; payments-installments from Raphe; delivery-grn from both). Include the cross-cutting hooks (audit, notify, real-time) as the reference diagrams do.

- [ ] **Step 2: Render and validate each.**

Run `bash .build/render-all.sh` to render every spec at once and validate. Expected: `=== Done: N ok, 0 failed ===` and the BPMN count equals the spec count. Fix any `SPEC INVALID` or `XMLLINT FAIL` before continuing.

- [ ] **Step 3: Write each companion doc.**

Same structure as D2 step 3, per domain. Every field and rule stated; every step tagged.

- [ ] **Step 4: Parallelization note.**

Independent domain diagrams may be authored concurrently by separate workers, but all specs must pass `render-all.sh` together at the end of the task so naming and lane vocabulary stay consistent. Verify consistency: lane ids and role names are identical across all specs (same generic role set).

### Task D4: Author and render the edge-case diagrams

**Files (per the finalized edge-case list; one set each):**
- Create: `.build/specs/eNN-<rule>.json`, `diagrams/eNN-<rule>.bpmn`, `documentation/eNN-<rule>.md`

Edge cases (provisional): approval routing edge cases, quantity-tolerance-partial-GRN, nonconformance-CAPA-supplier-reeval, auto-create-supplier-item, bulk-import-all-or-nothing, currency-degradation, cash-purchase-float, contract-constant-supply, artwork-npd-approval, permit-document-expiry.

- [ ] **Step 1: Author each spec.**

Each isolates one tricky rule, modeled as a focused flow with the exact decision conditions and guards, `doc` carrying the algorithm and tagged with source and benchmark. Use Raphe's edge cases plus Al Bahja's tricky rules plus the SCOR/ISO-revealed ones (Source Return, CAPA loop, supplier re-eval triggers).

- [ ] **Step 2: Render and validate.**

Run `bash .build/render-all.sh`. Expected: all ok, 0 failed.

- [ ] **Step 3: Write each companion doc.**

Rule name, the exact algorithm with conditions and ordering, fields/enums touched, invariants, edge-cases-within, cross-references and benchmark tags.

### Task D5: Knowledge graph and README

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/knowledge-graph.md` (Mermaid)
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/model/graph.json`
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/documentation/README.md`

- [ ] **Step 1: Author the knowledge graph.**

A Mermaid capability map (generalized from the blueprint graph but expanded to the unified model's actual scope): generic actors, the six pillars with the unified processes and entities, master data, platform services, insights, external systems, and the typed edges (next/produces/uses/governed by/performs/feeds/sync). Mirror it as `graph.json` with node ids matching.

- [ ] **Step 2: Write the index README.**

Reading guide and table of contents listing every diagram (domain and edge case) with its title, description, SCOR codes covered, companion doc, and BPMN file. Mirror the structure of the reference READMEs. Include the notation legend and the actor/role model.

- [ ] **Step 3: Verify the set is internally linked.**

Every diagram listed in the README exists in `diagrams/` and has a companion in `documentation/`. Every cross-reference in a companion points to a real diagram. Expected: no broken reference.

### Phase D stop gate

- [ ] **Report to user:** the rendered diagram count, the companion count, the knowledge graph, and confirm all specs render and validate clean. **Request permission before Phase E. Do not proceed until granted.**

---

## Phase E: Validate against benchmarks

**Outcome:** A validation report confirming coverage against SCOR and ISO, role-completeness, and traceability; any final fixes applied.

### Task E1: Coverage and traceability validation

**Files:**
- Create: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/validation-report.md`
- Read: `analysis/coverage-matrix.md`, all `documentation/*.md`, `model/*`

- [ ] **Step 1: Re-check the coverage matrix against the produced model.**

For every row in the coverage matrix marked covered by any source, confirm the produced diagrams or model documents implement it. List any row that the final model still leaves thin or absent, with a reason or a fix.

- [ ] **Step 2: SCOR coverage check.**

Confirm every procurement-relevant SCOR process (from `scor-procurement-map.md`) appears in at least one diagram step, by SCOR code. List any uncovered SCOR code.

- [ ] **Step 3: ISO requirement check.**

Confirm the ISO anchors are present: the 8.6 to 8.7 to 10.2 to 8.4.1 nonconformance-to-corrective-action-to-re-evaluation loop; supplier evaluation/selection/monitoring/re-evaluation; the records the model must keep; the supplier-criteria dimensions. List any missing.

### Task E2: Role-completeness and coherence check

**Files:**
- Modify: `/Users/apple/Desktop/User Flows/Unified P2P/analysis/validation-report.md`

- [ ] **Step 1: Walk each generic role end to end.**

For each role in the role model, trace the diagrams that role appears in and confirm the role has a coherent, complete journey (a user entering at that role sees sensible work, not dead ends or missing handoffs). Note any role with a gap.

- [ ] **Step 2: Confirm the prototype-realism criterion.**

Confirm every field, action, and control in the companions has a stated purpose and a source/benchmark tag, so nothing reads as dummy. Spot-check 10 fields across diagrams. Expected: each has a purpose and a tag.

- [ ] **Step 3: Apply final fixes.**

Fix any gap found in E1 or E2 by editing the relevant spec (re-render) or companion. Re-run `render-all.sh` after any spec edit. Expected: all ok, 0 failed.

### Task E3: Persist the unified model to memory

**Files:**
- Create: `/Users/apple/.claude/projects/-Users-apple-Desktop-User-Flows/memory/unified-p2p-model.md`
- Modify: `/Users/apple/.claude/projects/-Users-apple-Desktop-User-Flows/memory/MEMORY.md`

- [ ] **Step 1: Write the unified-model memory file.**

A map of the produced model: the generic roles, the pillars and domains, the diagram set, the data model and platform services, and where each lives in the workspace. Link the source and benchmark memory files.

- [ ] **Step 2: Update MEMORY.md and verify links.**

Add the index entry under a new "Unified P2P model" section. Run the link-check. Expected: no MISSING lines.

### Phase E stop gate

- [ ] **Report to user:** present the validation report (coverage confirmed, gaps and fixes, role-completeness, traceability) and the workspace contents. The model is complete and ready to underpin the prototype. **This is the final phase; confirm completion with the user.**

---

## Self-review (run against the spec)

- Spec section 1 purpose: covered by the whole plan, output in Phase D and E.
- Spec section 2 inputs and layering: Phases A (SCOR), B (reconciliation), C (design), D (build) use all five inputs as described.
- Spec section 3 locked decisions: deliverable form (D), reconciliation method (B2), SCOR scope (A2), core scope promote sourcing+invoice (D3 domains include sourcing-rfq and invoice-three-way-match), currency (C3 FX service), diagram set size (D3 + D4 produce ~12 domain + ~10 edge, plus overview).
- Spec section 4 coverage guarantee: Task B1 builds the matrix; B1 step 3 verifies every named example is a row; E1 re-checks against the produced model.
- Spec section 5 phases: A-E map one-to-one.
- Spec section 6 provisional flow list: confirmed final in C4 step 3; built in D3/D4.
- Spec section 7 traceability: every companion step tagged with SCOR code, ISO clause, source (D2-D4 verify steps, E1/E2 re-verify).
- Stop gates after every phase: present at the end of A, B, C, D, E.
- Placeholder scan: provisional flow lists in D3/D4 are explicitly resolved in C4; no TBDs in steps.
- Consistency: role/lane vocabulary fixed in B3/C1 and enforced consistent across specs in D3 step 4.
