# Best-of Decision Table

One decision per capability area: which source the unified model takes its primary structure from, what is grafted from the other source, what SCOR/ISO adds that neither has, and the SCOR code + ISO clause it maps to. Tie-breaker (per plan 3.2): prefer the more complete and benchmark-aligned option; record the variant. Source: `coverage-matrix.md`.

## Cross-company conflict resolutions (the big five)

1. **Approval model.** Conflict: Al Bahja (fixed FM -> Purchase Head, all to Himanshu) vs Raphe (configurable multi-stage engine, routing rules by dept/category/value, load-balanced, threshold auto-approval). DECISION: adopt Raphe's configurable approval engine as the base; represent Al Bahja's FM-then-head as one CONFIGURATION of that engine (a site/department-conditional stage). Add auto-approval (Raphe) with nearest-bucket selection. Al Bahja's "factory-site requires FM" becomes a conditional stage rule, not hard-coded. Variant recorded: a tenant can configure all-to-one-approver (Al Bahja style) or multi-stage with auto-approval (Raphe style). Maps: OE2, ISO 8.4.

2. **Currency.** Conflict: Raphe normalizes to INR; Al Bahja is OMR with multi-currency master + manual FX. DECISION (plan 3.5): multi-currency transactions with a CONFIGURABLE base/reporting currency (neither INR nor OMR hard-coded) + FX service (Raphe's convertToInr generalized to convertToBase, with graceful degradation) normalizing for thresholds/comparison/analytics. Manual exchange-rate entry (Al Bahja) retained as a per-PO override. Maps: FX service.

3. **Sourcing + invoice-matching scope.** Conflict: Blueprint marks both as roadmap; Al Bahja proves deep sourcing demand. DECISION (plan 3.4): PROMOTE competitive sourcing/RFQ/landed-cost (Al Bahja + SCOR S1) AND invoice three-way matching (SCOR S2.7 + ISO 8.6) into the first-class core. Full source-to-pay. Maps: S1.1-S1.10, S2.7, ISO 8.6.

4. **Supplier + item lifecycle.** Conflict: Raphe (clean 4-state lifecycle: PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED -> OFFBOARDED, edit-reverts-to-pending, isRamcoSynced) vs Al Bahja (deep qualification: vendor registration, 3-batch COA, ISO 9001 AVL, certifications). DECISION: adopt Raphe's lifecycle state machine as the structure; graft Al Bahja's qualification depth (documents, COA, AVL with scope-of-approval/grade) as the content of the PENDING_APPROVAL gate; add ISO supplier-criteria attributes (risk/security/continuity/ESG). Maps: S1.6, ISO 8.4.1.

5. **Delivery tracking.** Conflict: Raphe (derived delivery status from receipt blocks, OTIF) vs Al Bahja (manual transport-mode tracking air/sea/road/courier, customs/Bayan, ETA alarm). DECISION: configurable union. The receipt-block model + derived status (Raphe) is the data backbone; the transport-mode tracking fields + customs docs + ETA alarm (Al Bahja) are an optional "inbound logistics" layer enabled for import purchases. OTIF (Raphe e07) + SCOR RL.1.2 feed the scorecard. Maps: S2.3, S2.4, RL.1.2.

## Per-area decisions

| Area | Primary structure from | Grafted from | SCOR/ISO adds | Maps to |
| --- | --- | --- | --- | --- |
| Roles | Blueprint generic set | AB specialist roles (QC, Engineering, Marketing, translator, customs); RA verticals/maker-checker/admin | OE5 role governance | OE5 |
| Sourcing/RFQ | AB (RFQ, quote, negotiate, landed-cost) | RA form mechanics (OTP, structured capture); RA selection (least-loaded) | SCOR S1 step naming; supply market analysis S1.2; collaboration S1.7 | S1.1-S1.10 |
| Requisition/intake | RA (ticket structure, field engine) | AB field richness (categories, product-used-for, available stock, immutable number) | SCOR order signal framing | O2, S1.1, ISO 7.5 |
| Approval | RA (configurable engine) | AB site-conditional stage; both delegation/return loop | -- | OE2, ISO 8.4 |
| Purchase order | AB (templates, incoterms, PDF emit, open-until-receipt) | RA PO state | ISO 8.4.3 a-f structured fields | S2.1, ISO 8.4.3 |
| Supplier onboarding | RA (4-state lifecycle) | AB qualification depth (COA/AVL/certs) | ISO supplier criteria (risk/security/continuity/ESG/anti-bribery); SCOR S1.6 | S1.6, ISO 8.4.1 + family |
| Item onboarding | RA (lifecycle, codes, source priority) | AB RM/PM coding | -- | OE4 |
| Delivery/GRN | RA (receipt blocks, derived status) + AB (transport modes, customs) | merged | SCOR receive/inspect; ISO 8.6 release records | S2.4-2.6, ISO 8.6 |
| QC/inspection | AB (COA gate, hard block) | RA inspection-in-GRN | SCOR S2.5; ISO 8.6/8.7 | S2.5, ISO 8.6/8.7 |
| Invoice/3-way match | BUILD NEW (SCOR/ISO) | AB invoice package + approval | SCOR S2.7; ISO 8.6 match | S2.7, ISO 8.6 |
| Payments/installments | RA (installments, partial+remainder, locked schedule) | AB terms list, overdue reminder, cash float, creditor ledger, maker/checker | SCOR authorize payment; financial control SoD (SOX/COSO, ISO 37001) | S2.7 |
| Returns/RMA | BUILD NEW (SCOR S4) | AB NCR fields/flow | SCOR S4.1-S4.5; ISO 8.7/10.2 | S4, ISO 8.7/10.2 |
| Non-conformance/CAPA | AB (NCR) + BUILD NEW (CAPA loop) | RA inspection | ISO 8.6->8.7->10.2->8.4.1 loop | ISO 8.7/10.2/8.4.1, OE3 |
| Analytics/scorecard | AB (savings, spike, weighted scorecard) + RA (OTIF) | merged | SCOR RL metrics + Practices; ISO 8.4.1 monitoring; KPI formulas | RL/RS/CO, ISO 8.4.1 |
| Forecasting | AB (manual, variance flag) | -- | SCOR P3 Plan Source | P3 |
| Platform foundation | RA (RBAC, auth, SSE, field engine, FX, bulk import, normalizer) | AB audit/documents | OE2/OE4; ISO 7.5 records | OE2/OE4, ISO 7.5 |

## Genuine build-new (no deep source; SCOR/ISO/finance-control drive)

- Three-way match + exception handling, incl. two-way-vs-three-way condition, match tolerance, duplicate-invoice detection (S2.7, ISO 8.6).
- Returns / RMA full flow (S4.1-S4.5, ISO 8.7).
- CAPA-to-re-evaluation loop (ISO 8.6->8.7->10.2->8.4.1, OE3).
- Supplier risk/security/continuity/ESG/anti-bribery attribute set (ISO 28000/22301/31000/20400/37001; SCOR OE9/OE10).

Added after senior-practitioner review (load-bearing finance controls neither company had):
- Budget check + commitment/encumbrance accounting (OE11; finance control). Approval limits != budget control.
- GR/IR clearing (received-not-invoiced / invoiced-not-received reconciliation; backbone of 3-way match).
- Tax / withholding as first-class line attributes (GST/VAT/TDS/WHT/reverse-charge/duty; multi-country).
- Credit / debit notes (resolve returns + match exceptions against the payable).
- Advance/down-payment recoupment + retention/holdback; milestone-based payment for services; blanket/framework + call-off releases; supplier SUSPENDED state.

## Orphan check

Every coverage-matrix row marked `cov` by any source maps to a decision above (carried in) or is explicitly build-new. No capability is orphaned. Deferred (noted, not core): full ERP integration (boundary only, both thin); People/Skills competency catalog (SCOR People pillar - reference only, not a flow); Transform/manufacturing (out of P2P core).

Parent: [[scor-procurement-map]]. Drives: role-model.md, data-model.md, and the Phase D flow list.
