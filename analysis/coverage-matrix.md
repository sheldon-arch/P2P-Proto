# Coverage Matrix (the auditable proof that nothing is dropped)

Rows = the union of (every procurement-relevant SCOR process, every ISO requirement relevant to procurement, every distinct role/business-flow/user-flow/edge-case found in Al Bahja or Raphe). Columns = Blueprint / Al Bahja (AB) / Raphe (RA) / SCOR / ISO. Cells = `covered` / `thin` / `absent`, with short evidence. Anything not `covered` by the Blueprint but `covered` elsewhere is pulled into the unified model (the gap-fill). This is the binding artifact per the coverage guarantee in the plan.

Legend: `cov` = covered (deep), `thin` = present but shallow, `--` = absent.

---

## A. Roles

| Role (generic) | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Requester / Req Department | cov | cov (8-9 dept requesters) | cov (REQ_DEPARTMENT vertical) | OE5 | -- | Keep; pin requester as Req-Dept assignee (RA). |
| Approver (multi-stage) | cov | cov (Factory Manager, Purchase Head) | cov (vertical approvers) | OE2 | 8.4 (selection auth) | Merge FM + Purchase Head + RA vertical approvers into one configurable chain. |
| Procurement / Buyer / Handler | cov | cov (procurement handlers, import/local/cash) | cov (PROCUREMENT vertical) | S1-S3 | -- | Keep; supports import/local/cash sub-roles as config. |
| Finance maker | thin | thin (accounts, meet-9) | cov (Accounts-Maker) | S2.7 | -- | Adopt RA maker/checker. AB had accounts external then in-system. |
| Finance checker | -- | thin (chief accountant) | cov (Chief Accountant) | S2.7 | financial control (SOX/COSO); 37001 | Adopt RA Chief Accountant checker. (Payment SoD is financial-control / anti-bribery, NOT ISO 9001 8.4.) |
| Management (final approval) | -- (folded into approver) | -- | cov (MANAGEMENT vertical, approves via installments) | OE1 | -- | Keep as terminal approval vertical (RA). |
| Supplier / Vendor | cov | cov | cov | S1.6 | 8.4 | Keep. |
| Receiving / Warehouse / Stores | cov | cov (Barka/Vadi Kabir stores) | cov (Receiving) | S2.4-2.6 | 8.6 | Keep. |
| Quality / QC | -- | cov (QA/QC, COA approval) | thin (inspection in GRN) | S2.5 | 8.6/8.7 | Promote QC to first-class (AB depth). Blueprint gap. |
| Engineering (spares/services receipt) | -- | cov (Engineering closes spares reqs) | -- | T3 (MRO) | -- | Add as receiving variant for spares/services (AB). |
| Specialist reviewers (Marketing, Arabic translator) | -- | cov (artwork approval) | -- | -- | -- | Add as configurable approval participants (AB). Blueprint+RA gap. |
| Freight forwarder / carrier | -- | cov (forwarder as supplier + service PO) | thin | S2.3 | 28000 | Model as a supplier type + inbound-transport actor (AB). |
| System Admin | cov | thin | cov (seeds masters, RBAC) | OE4 | -- | Adopt RA admin. |
| Platform / System (automated) | cov | thin | cov (routing/FX/SSE/audit) | OE4 | -- | Adopt RA system lane. |
| Customs / clearing agent | -- | cov (Bayan, clearance) | -- | S2.3 | 28000 | Add as inbound-transport/customs actor (AB). Blueprint+RA gap. |

## B. Sourcing / RFQ / Award (SCOR S1)

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Define business need / intake | cov | cov (requisition) | cov (ticket) | S1.1 | -- | Core. |
| Supply market analysis / new-supplier discovery | thin | cov (AI sourcing IndiaMart/Alibaba; market price) | thin | S1.2 | 31000 | AB depth; promote to core. |
| Sourcing strategy / repeat vs competitive | thin (roadmap) | cov (repeat clause, preferred) | thin (preferred supplier) | S1.3 | -- | Core; repeat/preferred bypass vs competitive event. |
| Prequalify suppliers | thin | cov (vendor qualification, 3-batch COA, ISO 9001 AVL) | cov (onboarding gate) | S1.6 | 8.4.1 | AB qualification depth + RA lifecycle. |
| RFQ issue (>=3 suppliers, template, OTP form) | thin (roadmap) | cov (RFQ form, email+OTP, min 3) | thin | S1.8 | -- | Promote to core. RA form mechanics + AB sourcing rules. |
| Quote capture (price/terms/incoterms) | thin | cov (structured quote, payment+delivery terms) | thin | S1.8 | -- | Core. |
| Negotiation loop | thin | cov (supplier re-opens form; off-system WhatsApp) | thin | S1.9 | -- | Core (AB). |
| Landed-cost / total-cost comparison | -- | cov (full landed-cost formula, charges) | -- | S1.9 | -- | Promote to core. AB is the only deep source. Blueprint+RA gap. |
| Supplier selection + ranking + scorecard-weighted | thin | cov (1-10 colour-coded, override+justify) | cov (compare, least-loaded) | S1.9 | 8.4.1 | Merge AB ranking + RA selection. |
| Award + contract capture | thin (roadmap) | thin (PO carries terms) | thin | S1.10 | OE6 | Core; promote (decision: sourcing in core). |

## C. Requisition / Intake

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Requisition form + line items | cov | cov (rich fields, categories) | cov (CreateTicketDto) | O2/S1.1 | -- | Merge AB field richness + RA structure. |
| Dynamic form by category/stage/type | thin | thin (category-driven fields) | cov (FIELDS_CONFIG, field engine) | OE2 | 7.5 | Adopt RA field engine. |
| Requisition categories | cov | cov (Items/Spares/Services/Product Design) | cov (purchase type LOCAL/IMPORT) | -- | -- | Merge: category + direct/indirect + purchase-type. |
| New-item-on-the-fly | thin | cov (handler approves) | cov (auto-create non-UUID) | -- | -- | Adopt both (RA auto-create + lifecycle). |
| Identifier generation | cov | cov (OHP-PR-67-25 format) | cov ({YYYY}{MM}{DEPT}07{run}) | -- | -- | Configurable identifier pattern (generalize both). |
| Available stock / need date / product-used-for | -- | cov | thin | -- | -- | AB fields. |
| Immutable requisition number across delays | -- | cov (meet-9) | thin | -- | -- | AB rule. |
| Requester visibility scoping | thin | cov (own/dept only) | cov (RBAC) | -- | -- | Both. |

## D. Approval Workflow

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Configurable multi-stage chain | cov | thin (FM->Purchase Head fixed) | cov (routing rules by dept/vertical) | OE2 | 8.4 | Adopt RA configurable engine. |
| Routing by department/category/value | cov | thin | cov (RoutingRuleEntry) | OE2 | -- | RA. |
| Load-balanced assignment (least-loaded) | cov | -- | cov (findLeastLoadedUser) | -- | -- | RA. |
| Threshold-based auto-approval | cov | -- (all to Himanshu) | cov (Finance <= limit) | -- | -- | RA. Blueprint+AB gap on auto-approval. |
| Nearest-bucket approver selection | -- | -- | cov (e01) | -- | -- | RA edge case. Blueprint+AB gap. |
| Per-approver limits + default limit | thin | thin | cov (approvalLimit, default 200000) | -- | 8.4 | RA. |
| Delegation / reassignment on leave | thin | cov (reassign if FM unavailable) | cov (reassign) | -- | -- | Both. |
| Return-for-revision loop | cov | cov (reject+note+resubmit) | cov (rework) | -- | -- | Both. |
| Auto-approval revert on financial change | -- | -- | cov (postValueSync e02) | -- | -- | RA edge case. Blueprint+AB gap. |
| FM approval only for factory sites | -- | cov (Barka Eng + OHP) | -- | -- | -- | AB rule -> generalize as site/dept-conditional stage. |

## E. Purchase Order

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| PO issue from requisition+quote | cov | cov (prefilled, editable terms) | cov | S2.1 | 8.4.3 | Both. |
| PO as in-system PDF, emitted to supplier | cov | cov (PDF emit, no Word) | thin | -- | -- | AB. |
| Multiple PO types (item/service/maintenance/freight) | thin | cov (separate templates; up to 3 POs/item) | thin | S2/T2 | -- | AB. |
| Incoterms / scope / currency + exchange rate | thin | cov (EXW/FOB/CIF, manual FX) | thin | S2.3 | -- | AB + FX service. |
| PO acknowledgement | cov | cov | cov | -- | -- | Both. |
| PO editable until receipt (for tolerance) | -- | cov (open until received) | thin | -- | -- | AB rule. |
| ISO doc reference on PO | -- | cov (compulsory) | -- | -- | 7.5 | AB + ISO records. |
| Information for external providers (8.4.3 a-f) | -- | thin | thin | -- | 8.4.3 | ISO requirement -> add structured PO fields. Both thin. |

## F. Supplier + Item Onboarding

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Supplier lifecycle (draft->approval->active->offboard) | cov | thin (qualification) | cov (4-state, edit-reverts) | S1.6 | 8.4.1 | RA lifecycle + AB qualification depth. |
| Supplier qualification docs (cert/COA/AVL) | thin | cov (3-batch COA, ISO 9001 AVL) | thin | S1.6 | 8.4.1 | AB depth + ISO AVL. |
| Supplier addresses + tax details | cov | thin | cov (GST/PAN, replace-on-update) | -- | -- | RA. |
| Supplier groups / classification | cov | thin | cov | OE12 | -- | RA. |
| Bulk import (all-or-nothing) | cov | -- | cov (9 masters, natural-key upsert) | -- | -- | RA. Blueprint thin, AB gap. |
| Item lifecycle + code generation | cov | cov (RM/PM Excel codes) | cov (DEP/SG/SSG/run) | -- | -- | RA lifecycle + configurable codes. |
| Item source priority (mfg/purch/subcon/transfer) | -- | -- | cov | -- | -- | RA. Blueprint+AB gap. |
| Ramco/ERP sync flag | thin | -- | cov (isRamcoSynced) | -- | -- | RA -> generalize to ERP sync. |
| Supplier risk/security/continuity/ESG attributes | -- | thin (permits) | -- | OE9/OE10 | 28000/22301/31000/20400/37001 | ISO-driven gap-fill. Blueprint+both companies thin. |

## G. Delivery / Goods Receipt / Inspection

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Delivery tracking (transport modes) | thin | cov (air/sea/road/courier, manual, ETA alarm) | thin | S2.3 | 28000 | AB depth (manual + modes) configurable. |
| Customs / Bayan / import docs | -- | cov (legalization, health cert, permits, DG) | -- | S2.3 | 28000 | AB. Blueprint+RA gap. |
| Derived delivery status from receipts | -- | -- | cov (blocks, derived status) | S2.4 | -- | RA. Blueprint+AB gap. |
| Goods receipt / GRN | cov | cov (stores->QC->GRN) | cov (partial-delivery blocks) | S2.4 | 8.6 | Merge. |
| QC inspection + approval gate | -- | cov (COA+sample to QC, hard block) | thin | S2.5 | 8.6 | AB depth. Blueprint+RA gap. |
| Partial deliveries -> multiple GRNs | thin | cov | cov | -- | -- | Both. |
| Quantity tolerance (+/-5-10%, amend PO) | -- | cov (labels/cartons) | -- | -- | -- | AB rule. Blueprint+RA gap. |
| Spares/services receipt (engineering, no GRN) | -- | cov | -- | T3 | -- | AB. |
| OTIF / on-time-in-full | thin | thin (delivery date tracking) | cov (OTIF streak e07) | RL.1.2 | -- | RA + SCOR RL metrics. |

## H. Invoice + Three-Way Match

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Invoice capture | thin (roadmap) | cov (invoice package + customs docs) | thin | S2.7 | -- | Promote to core (decision). |
| Three-way match (PO/GRN/invoice) | thin (roadmap) | thin (manual) | thin | S2.7 | 8.6 | Promote to core; build from SCOR/ISO + both. Genuine gap. |
| Match exception handling | -- | -- | -- | -- | -- | Build new (SCOR/ISO-driven). All sources absent. |
| Invoice approval before accounts | -- | cov (Purchase Head approves) | thin | -- | -- | AB. |

## I. Payments + Installments

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Payment schedule (amount/event/date/desc) | cov | cov (terms-based schedule) | cov (schedule table) | S2.7 | -- | Both. |
| Installments approve/process/reschedule | cov | thin | cov (full/partial+remainder, receipt) | -- | -- | RA depth. |
| Partial approval + remainder | -- | -- | cov (e04) | -- | -- | RA edge. Blueprint+AB gap. |
| Locked schedule (no delete if approved) | -- | -- | cov (e03) | -- | -- | RA edge. Blueprint+AB gap. |
| Payment terms (advance/credit/net 30-60-90) | thin | cov (locked term list, 90% 90-day) | cov (dropdown) | -- | -- | Merge. |
| Maker/checker settlement | thin | cov (maker + chief accountant) | cov | S2.7 | financial control (SOX/COSO); 37001 | Both. (Financial SoD, not ISO 9001.) |
| Overdue reminder (~28d) | -- | cov | thin | -- | -- | AB. |
| Cash float / petty cash + reimbursement | -- | cov (OMR 300 float, cash GRN) | -- | -- | -- | AB. Blueprint+RA gap. |
| Creditor ledger per supplier | -- | cov (read-only ledger) | thin | -- | -- | AB. |
| Payables aging / DPO | cov | thin | thin (paid/upcoming/overdue) | AM | -- | RA fields + KPI. |

## J. Returns / RMA (SCOR S4)

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Initiate source return | -- | thin (NCR replacement) | -- | S4.1 | 8.7 | Build new (SCOR-driven). Blueprint+both thin. |
| Request/authorize product return (RMA) | -- | -- | -- | S4.2 | -- | Build new. All absent. |
| Identify condition / return reason | -- | thin (NCR fields) | -- | S4.3 | 8.7 | Build from AB NCR + SCOR. |
| Schedule return shipment | -- | -- | -- | S4.4 | -- | Build new. |
| Close/adjust return order | -- | thin (NCR closure) | -- | S4.5 | 10.2 | Build from AB + SCOR/ISO. |
| Non-conformance (NCR) | -- | cov (item/note#/date/%/image; QC/FM/requester) | thin | S2.5 | 8.7 | AB depth. |
| Corrective action / CAPA loop -> re-eval | -- | thin (supplier rating impact) | -- | OE3 | 10.2/8.4.1 | ISO-driven; build the 8.6->8.7->10.2->8.4.1 loop. Genuine gap. |

## K. Analytics / Scorecard / KPI

| Capability | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| Supplier scorecard (delivery/quality/price/responsiveness) | cov | cov (1-10, ISO 9001, 4-factor) | cov (OTIF, stats) | RL | 8.4.1 | Merge + ISO criteria + SCOR RL metrics. |
| Weighted scoring + grade bands | thin | cov (weightage, colour) | thin | -- | 8.4.1 | AB + ISO convention. |
| Spend analytics (category/supplier/dept) | cov | cov (category spend, finished-product) | thin | CO | -- | Merge. |
| Savings (vs baseline + negotiation) | -- | cov (baseline=last price, two-layer) | -- | -- | -- | AB. Blueprint+RA gap. |
| Abnormal price spike (>5%) | -- | cov | -- | -- | -- | AB. |
| Cycle time / approval SLA (req->PO 7-10d) | cov | cov (7-10 day KPI) | thin | RS | -- | Both. |
| Forecasting (manual, procurement-only) | thin | cov (marketing forecast, variance flag) | -- | P3 | -- | AB. Blueprint thin, RA gap. |
| Market price watch / alarm | -- | cov (Alibaba/Global Sources) | -- | -- | -- | AB. |

## L. Platform Foundation (cross-cutting)

| Service | Blueprint | AB | RA | SCOR | ISO | Unified decision |
| --- | --- | --- | --- | --- | --- | --- |
| RBAC / permission resolution | cov | thin | cov (4-source union, SystemAdmin, all) | OE5 | -- | RA. |
| Auth (OTP + SSO) | cov | thin | cov (email OTP + Microsoft, Better Auth) | -- | -- | RA. |
| Audit trail (immutable) | cov | cov (append-only log) | cov (audit.log) | OE4 | 7.5 | Both. |
| Notifications (templated email) | cov | cov | cov | -- | -- | Both. |
| Real-time updates (SSE) | cov | thin | cov (ticket.updated, anon broadcast) | -- | -- | RA. |
| Dynamic field engine | thin | thin | cov (FIELDS_CONFIG, normalizer) | OE2 | -- | RA. |
| FX / currency service | cov | thin (manual FX) | cov (INR convert, graceful degrade) | -- | -- | RA service + multi-currency base (decision 3.5). |
| Document storage / attachments | cov | cov (permits/COA/artwork) | cov (receipts) | -- | 7.5 | Both. |
| Bulk import service | cov | -- | cov | -- | -- | RA. |
| ERP integration boundary | cov | thin (Oracle inventory/finance) | thin (Ramco sync) | OE4 | -- | Boundary only (both thin). |
| Field/entity normalizer + resolvers | -- | -- | cov (e09) | -- | -- | RA. Blueprint+AB gap. |

---

## Verification of binding coverage-guarantee examples

Every example named in the plan's coverage guarantee appears as a row above, blueprint-thin/absent but covered elsewhere and pulled in:
- AB artwork/NPD approval: row A (specialist reviewers), F, and an edge case. cov-AB, absent-Blueprint. PULLED IN.
- AB customs/permits/landed-cost: rows B (landed cost), E, G (customs). cov-AB, absent-Blueprint. PULLED IN.
- AB cash float: row I (cash float). cov-AB, absent-Blueprint+RA. PULLED IN.
- AB contract/constant supply: edge-case row (section I/E). cov-AB. PULLED IN.
- AB manual import tracking: row G (delivery tracking). cov-AB. PULLED IN.
- AB FM/PurchaseHead/QA/translator/marketing roles: rows A. cov-AB. PULLED IN.
- RA installments: row I. cov-RA. PULLED IN.
- RA RBAC resolution: row L. cov-RA. PULLED IN.
- RA bulk import: rows F, L. cov-RA. PULLED IN.
- RA SSE: row L. cov-RA. PULLED IN.
- RA OTIF: rows G, K. cov-RA + SCOR RL. PULLED IN.
- RA field engine: rows C, L. cov-RA. PULLED IN.
- RA maker/checker: rows A, I. cov-RA. PULLED IN.
- RA four verticals: row A (merged into configurable chain). cov-RA. PULLED IN.
- SCOR Source Return S4/RMA: row J. SCOR-driven, all sources thin/absent. BUILD NEW.
- ISO supplier re-eval triggers + CAPA loop: rows J, K. ISO-driven, genuine gap. BUILD NEW.

Genuine build-new gaps (no source covers deeply; SCOR/ISO drive them): three-way match exception handling (H), returns/RMA full flow (J), CAPA-to-re-evaluation loop (J), supplier risk/security/continuity/ESG attributes (F).

Parent: [[scor-procurement-map]]. Decisions derived from this: best-of-decisions.md, role-model.md, data-model.md.
