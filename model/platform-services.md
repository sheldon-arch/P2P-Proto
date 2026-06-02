# Platform Foundation Services

The cross-cutting services every domain relies on. Each is specified once and reused, with its source and benchmark tag. This is what turns the model from a set of flows into a platform. Drawn from Raphe (RA) implementation depth, Al Bahja (AB) where it adds, and the benchmark layers. Parent: [[p2p-blueprint-overview]] pillar 6.

## 1. Configurable approval engine [SCOR OE2; ISO 8.4 supplier-approval part]
Multi-stage chains parameterized by department, category, and value. Per stage: a routing rule (assigneeUserIds, approverUserIds) resolves the approver; load-balanced assignment to the least-loaded eligible user (RA findLeastLoadedUser, urgency-weighted). Threshold-based auto-approval: within an approver's limit -> auto-approve (RA); nearest-bucket selection picks the minimum-sufficient approver, reserving high-limit approvers for large amounts (RA e01); default limit configurable (RA 200000). Per-approver limits + delegation/reassignment on leave (both companies). Return-for-revision loop (both). Auto-approval REVERT when financial info changes (RA e02). A tenant configures all-to-one (AB style) or multi-stage-with-auto-approval (RA style); a site/department-conditional stage models AB's "factory site needs Factory Manager." SoD rules enforced (role-model SoD ruleset). Every decision (manual + auto) audited.

## 2. Dynamic forms / field engine [SCOR OE2; ISO 7.5]
Admin-defined fields by stage, scope (ticket-level / item-level / block-level), and purchase type (RA FIELDS_CONFIG). Mandatory-field gating drives stage progression (a stage cannot advance until its mandatory fields are filled; isEmpty rule: null/blank/[]/{}/invalid-date are empty, 0 and false are present). Reference fields resolve to live records via the entity normalizer (RA e09; project/vertical/user/supplier -> name, item/ticket-item -> description; missing resolver = 500 config defect, dangling id = 400). Auto fields never gate. Intake and detail forms adapt per category without code changes.

## 3. FX / currency service [decision 3.5]
Multi-currency transactions; a configurable base/reporting currency (NOT hard-coded INR or OMR). convertToBase(amount, currency): base/null -> unchanged, no call; else fetch live rate (e.g. Frankfurter), round to 2dp; on fetch failure or invalid rate (0/NaN/Inf/negative) -> log + return original amount unconverted (graceful degradation, never throws; RA e08). Per-PO manual exchange-rate override (AB). FX rate carries date + source; realized FX gain/loss computed between PO date and payment date (review addition). The base amount drives thresholds, comparison, and analytics.

## 4. Audit trail [SCOR OE4; ISO 7.5 records]
Immutable, append-only, queryable record of every significant action, with field-level change detail (recursive humanised diff, RA buildUpdateMetadata; AB append-only timestamped log that cannot be deleted). Categorized (ticket/supplier/admin/...). Serves internal-audit needs via read access rather than a separate role. Records retained per configurable retention/disposition (ISO 7.5). Underpins the ISO records requirements (8.4.1 evaluation records, 8.6 release records, 8.7/10.2 NCR/CAPA records).

## 5. Notifications [both companies]
Templated emails on key events (assignment, approval-requested, vertical-approved, installment-status, supplier/item-approval-requested, overdue payment ~28d, contract renewal 15-day, ETA-approaching alarm, permit/cert expiry). A dedicated system-generated email identity, separate from human inboxes, that humans CC for audit context (AB). Fire-and-forget post-commit. Delivery failures logged, not retried.

## 6. Real-time updates (SSE) [RA]
Server-sent events on any committed change; payload carries the entity id only (e.g. {ticketId}); clients re-query. Access control is enforced on the guarded re-fetch, not the stream (so no data leaks over SSE). Per-process listener set; no cross-instance delivery (RA e10). Keeps queues and statuses live.

## 7. Bulk import [RA]
One generic pipeline for every master (suppliers, items, UoM, currency, segments, pay-terms, warehouses, asset proposals, supplier groups, tax codes). Exact header validation (no missing/extra columns). Per-row validate + resolve foreign refs, ACCUMULATE all row errors (never fail-fast), report all together with row numbers. All-or-nothing: one transaction, upsert by natural key, commit-all or rollback-all (RA e06). Imported records default PENDING_ONBOARDING.

## 8. Document storage [SCOR OE4; ISO 7.5]
Attachments on requisitions, suppliers (permits/COA/MSDS/certs/artwork - AB), POs (ISO doc ref), receipts (RA), invoices (customs docs - AB), NCRs (images - AB). Documents at two levels (AB): permanent against a supplier (MSDS/vendor-registration/COA/certs) vs per-shipment (AWB/BL/Bayan). Expiry + quantity tracking on permits/certs with alerts (AB: on selection + >=1 week before expiry).

## 9. Analytics engine [SCOR RL/RS/CO/AM; ISO 8.4.1 monitoring; procurement-metrics-kpis]
Canonical grain: PO header / PO line / GR line / invoice line / payment. Two-stage scoring: (1) normalize each raw metric to 0-100 vs configurable threshold bands; (2) weighted roll-up to a composite per supplier per period. Supplier scorecard dimensions: quality (PPM/defect/NCR), delivery (OTD, two-factor OTIF + four-factor perfect-order RL.1.2 - labelled distinctly), cost (PPV/TCO), responsiveness (RFQ turnaround, CAPA responsiveness), compliance (cert validity, doc completeness - GATE not weighted). Weights/bands configurable (default 40 delivery/30 quality/20 cost/10 service; pharma raises quality). Grade A>=90/B>=70-89/C<70; AVL gate = certs 100% + composite >= threshold; preferred = sustained Grade A. Cycle KPIs: requisition-to-PO (7-10 day SLA - both), approval SLA, PPV, spend-under-management, three-way-match exception rate, DPO, invoice accuracy. Spend cuts: by category/supplier/dept/region, tail spend, contract compliance. Savings (AB: baseline = last purchase price; negotiation + comparison layers, two-factor, negative if extra expense). Abnormal price spike >5% (AB). Forecasting (AB: manual, procurement-only, month/quarter x qty, variance flag). Market-price watch (AB). Time-series: rolling averages, streak counters, trend slope, failure-reason breakdown.

## 10. Identity and RBAC [SCOR OE5]
Auth: email OTP + SSO (Microsoft/SAML/OIDC generalized from RA Better Auth); pre-seeded users, pre-validation on send + sign-in, per-request active-status re-check + forced logout on deactivation (RA). Session cookie. RBAC: effective permissions = deduplicated union of role + direct user grant + designation + business-unit, plus super-admin `all` (RA). Guard chain: authenticate -> resolve permissions -> check required permission. No-metadata = authentication-only. Service-layer checks (approval/assignment eligibility by designation rank) on top of the guard. No caching -> changes apply next request. See [[role-permission-matrix]].

## 11. Budget / commitment service [SCOR OE11; finance control - BUILD NEW]
Budget check at requisition (soft, warns) and PO issue (hard commit/encumbrance; guard: available >= amount or override-with-approval). Commitment relieved to actual at GR/invoice. Commitment-vs-actual reporting. Prevents over-commitment. (The reviewer's load-bearing addition.)

## 12. Tax service [multi-country - BUILD NEW]
Tax codes/rates by jurisdiction; tax on PO/invoice lines (GST/VAT/duty); withholding (TDS/WHT) on payment; reverse-charge for imports; input-VAT/GST credit on recoverable tax. Tax must reconcile in three-way match (amounts incl. tax). See [[procurement-metrics-kpis]] and data-model tax entities.

## 13. ERP integration boundary [SCOR OE4]
Synchronizes master data and orders with an external system of record (RA Ramco-sync generalized; AB Oracle inventory/finance). Boundary only in scope (both companies thin here): a sync flag + outbound hooks, not a deep integration. GR/IR and commitment postings are the natural integration points to a GL.

## Service-to-benchmark check
Each service tagged with its SCOR code and ISO clause/benchmark where applicable (above). No service without a source and a benchmark.

Parent: [[p2p-blueprint-overview]]. Drives the Platform/System lane behaviour in every Phase D diagram. Sources: [[raphe-edge-cases]], [[raphe-auth-rbac]], [[albahja-cross-cutting-rules]], [[procurement-metrics-kpis]].
