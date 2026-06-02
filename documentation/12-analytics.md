# 12 Spend Analytics, Supplier Scorecard and KPIs - Unified Procure-to-Pay

- **BPMN file:** 12-analytics.bpmn
- **Spec:** .build/specs/12-analytics.json

## Scope, trigger, outcome
- **Scope:** The computation and dashboard flow that turns the transactional record into supplier scorecards, cycle and process KPIs, spend cuts, savings, price-spike alerts, and a manual forecast. This is not a human workflow; it is the System computing while roles view. It covers the two-stage scoring engine, the configurable weights/bands, the grade and AVL logic, the distinct two-factor OTIF and four-factor perfect-order metrics, and the role-scoped dashboards.
- **Trigger:** (a) Every committed transaction (incremental, via the post-commit SSE hook, keeping live tiles current) and (b) a scheduled period close (month / quarter) for the full scorecard roll-up.
- **Outcome:** Scorecards, KPIs, spend cuts, savings, forecasts, and alerts are published and consumed by role; they feed sourcing (diagram 04 AVL/preferred), the CAPA/suspend loop (e04), and continuous improvement (SCOR OE3).

## Actors (lanes)
Platform/System (computes everything), Procurement/Buyer (reviews scorecards/spend/savings/forecast, configures weights and the AVL threshold), Approver in the Management view (aggregate performance, read-only), Quality (quality KPIs), Finance-Maker (AP / match KPIs). Supplier sees only its own scorecard (conditional, via the external portal). Permission detail in `model/role-permission-matrix.md` (Analytics group: analytics.view, scorecard.view, scorecard.configure, spend.view, forecast.manage, forecast.view).

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **Period close / on-commit event** (System, start). Incremental on commit plus scheduled period close. Canonical grain: PO header / PO line / GR line / invoice line / payment. [SCOR OE3 | ISO 8.4.1 | platform-services + procurement-metrics-kpis grain].
2. **Ingest + cleanse facts** (System). Dedup/normalize supplier names, roll up to parent hierarchy, classify lines to the category taxonomy, normalize amounts to base currency via convertToBase (graceful degradation). Track classification coverage % and unclassified-spend % as data-health KPIs. [SCOR OE4 | procurement-metrics-kpis cleansing + platform-services FX].
3. **Stage 1: normalize each metric to 0-100** (System, business rule). Each raw metric normalized to a 0-100 sub-score against configurable bands. [SCOR RL/RS/CO | ISO 8.4.1 | procurement-metrics-kpis formulas].
4. **Compute OTIF (2-factor) AND perfect-order (4-factor) distinctly** (System, business rule). Two-factor OTIF = on-time AND in-full (operational streak). Four-factor perfect order = on-time AND in-full AND damage-free AND documentation-accurate (RL.1.2; re-qualification gate). Both stored, labelled distinctly. [SCOR RL.1.2 | data-model OTIF clarification].
5. **Stage 2: weighted composite per supplier per period** (System, business rule). composite = sum(sub-score x weight); default weights delivery 40 / quality 30 / cost 20 / service 10. Time-series maintained (rolling avg, trend slope, variance, failure-reason breakdown). [SCOR OE3 | platform-services roll-up].
6. **Compliance GATE** (System, business rule). cert validity % (binary, must be 100%) and doc completeness % as an eligibility gate, not a weighted score. [ISO 8.4.1 + 7.5 | procurement-metrics-kpis compliance-as-gate].
7. **grade band?** (System, exclusive). composite >= 90 -> A; >= 70 and < 90 -> B; < 70 -> C. AVL gate = certs 100% AND composite >= threshold (default 70). Preferred = sustained A.
8. **Persist scorecard + AVL status + streak counters** (System). Persist period scorecard, grade, AVL status {Approved, Conditional, Suspended, Disqualified, Preferred}, and update the consecutive-at-or-above and consecutive-below streak counters. [SCOR OE3 | ISO 8.4.1 records | iso AVL status set].
9. **Compute cycle / process KPIs** (System, business rule). req-to-PO cycle (7-10 day SLA), approval SLA, PPV, spend-under-management, three-way-match exception rate, DPO, invoice accuracy, rush-purchase ratio. [SCOR RS/CO | procurement-metrics-kpis].
10. **Compute spend cuts + savings + price-spike** (System, business rule). Cuts by category/supplier/dept/region, tail spend, contract compliance; savings (baseline = last purchase price; negotiation + comparison layers; hard vs avoidance separated); abnormal price spike > 5% above baseline; manual forecast with variance flag. [SCOR CO / P3 | procurement-metrics-kpis + AB].
11. **Publish dashboards + alerts** (System). RBAC-scoped dashboards; alerts for price-spike, expiry, two-consecutive-below, SLA breach; SSE then guarded re-query. [SCOR OE3 | platform-services + role-permission-matrix].
12. **Buyer / Management / Quality / Finance views** (respective lanes). Role-scoped consumption (steps 12a-12d below).
13. **Analytics published** (System, end).

## Gateways and branches (exact conditions)
- **grade band? (composite vs A/B/C + gate):**
  - `composite >= 90` -> Grade A.
  - `composite >= 70 AND composite < 90` -> Grade B.
  - `composite < 70` -> Grade C.
  - AVL eligible iff `compliance gate == PASS (certs 100%) AND composite >= AVL threshold (default 70)`.
  - Preferred iff `sustained Grade A over multiple consecutive periods AND no single red dimension AND low risk tier AND competitive TCO`.
  - A compliance-gate FAIL caps status at Conditional/Suspended regardless of composite.

## Two-stage scoring engine

### Stage 1 - normalize each metric to 0-100 (against configurable bands)
| Dimension | Metric | Formula | Default band / target |
| --- | --- | --- | --- |
| Quality | Defect rate % | defective / total-received x 100 | target <= 1% |
| Quality | PPM / DPPM | rejects / inspected x 1,000,000 | automotive 50-500, food/bev <= 1000 (denominator = inspected under AQL; DPPM != DPMO) |
| Quality | NCR / non-conformance rate % | NCRs / lots x 100 | configurable |
| Delivery | OTD % | on-time / total x 100 | >= 95 green / 90-94 amber / < 90 red |
| Delivery | Fill rate % | delivered / ordered x 100 | >= 98 |
| Cost | PPV / PPV% | (actual - baseline) x qty; (actual-baseline)/baseline x 100 | negative = favorable; baseline = last purchase price |
| Responsiveness | RFQ turnaround | quote-returned - RFQ-issued (days) | configurable |
| Responsiveness | CAPA responsiveness | avg days to close a CAPA | configurable |

### Delivery: two-factor OTIF vs four-factor perfect order (computed distinctly, never conflated)
- **Two-factor OTIF %** = orders (grain: per ORDER LINE, fixed and disclosed) delivered on-time AND in-full / total x 100. The intersection, all-or-nothing: on-time-but-short fails; complete-but-late fails. Used by the operational dashboard streak (RA e07).
- **Four-factor perfect order** = on-time AND in-full AND damage-free AND documentation-accurate (SCOR RL.1.2 Perfect Supplier Order Fulfillment; components RL.2.6 on-time, RL.2.5 in-full, RL.3.22-24 damage-free, RL.2.7/RL.3.17-20 documentation-accurate). Used by the supplier re-qualification gate.

### Stage 2 - weighted composite
- `composite = sum(sub-score x weight)` over the four scored dimensions.
- Weights configurable, sum to 100. **Default: delivery 40 / quality 30 / cost 20 / service (responsiveness) 10.** Pharma/food raises quality.
- Compliance is NOT a weighted input; it is a separate hard gate (cert validity 100% + doc completeness).

## Cycle / process KPIs (formulas)
- Requisition-to-PO cycle time: SLA 7-10 days (both companies; APQC reference top ~5h / poor ~48h).
- Approval SLA: avg approval time + % within SLA.
- PPV: as above (cost dimension).
- Spend-under-management % = (approved spend - maverick) / total x 100 (mature 80%+).
- Three-way-match exception rate % = 100 - first-time-match rate.
- DPO = avg AP / COGS x 365.
- Invoice accuracy / first-time-match rate %.
- Emergency/rush purchase ratio %.

## Spend cuts, savings, price-spike, forecasting
- **Spend cuts:** by category (taxonomy), by supplier (+ parent hierarchy = concentration/risk), by department/cost-center, by region/plant; tail spend (~20% of spend across ~80% of suppliers); contract compliance/utilization % = on-contract/addressable x 100 (inverse of maverick).
- **Savings (AB two-layer):** baseline = last purchase price; negotiation layer (quoted-increase vs negotiated-increase) + comparison layer (selected vs alternative quotes). Hard savings = baseline - actual; cost avoidance reported separately, never summed with hard savings; savings can be negative.
- **Abnormal price spike:** unit price > 5% above baseline (AB threshold, configurable) raises a market-price-watch alert to the buyer.
- **Forecasting (AB, procurement-only, manual):** month/quarter x quantity entries; variance flag when actual deviates beyond a configurable band.

## Role-scoped dashboards (step 12)
- **12a Buyer** (analytics.view, scorecard.view, spend.view, forecast.manage, scorecard.configure): full scorecard, spend, savings, price-spike, manual forecast; can configure weights/bands and the AVL threshold; feeds sourcing (04) and the suspend loop (e04).
- **12b Approver / Management** (analytics.view, in-scope): aggregate cycle times, approval SLA, spend-under-management, savings vs target, top suppliers/categories, exception trends; read-only.
- **12c Quality** (analytics.view, conditional quality KPIs): PPM/defect/NCR trends, lot acceptance %, CAPA responsiveness, failure-reason breakdown; feeds e04.
- **12d Finance-Maker** (analytics.view, payments.analytics.view): DPO, three-way-match exception rate, invoice accuracy, creditor-ledger ageing; feeds diagram 09 / e12.

## Edge cases and error handling
- **FX rate failure:** convertToBase logs and carries the original amount unconverted; never throws (graceful degradation). Thresholds and analytics then operate on approximate base values.
- **Low classification coverage:** a spend cut is flagged untrustworthy below a configurable coverage threshold; unclassified-spend % is itself a data-health KPI.
- **Compliance-gate fail with high composite:** status is capped (cannot be AVL/Preferred) despite a high composite.
- **DPPM vs DPMO:** kept distinct; DPMO (defect opportunities, Six Sigma) is not used as the supplier PPM.
- **Hard vs soft savings:** never summed; reported in separate columns.
- **OTIF grain:** fixed at the order-line level and disclosed; changing the grain materially changes the number.

## Business rules and invariants
- Two-stage scoring: normalize to 0-100, then weight to a composite per supplier per period.
- Compliance is a hard gate, not a weighted score.
- Grade bands A >= 90 / B >= 70 / C < 70; AVL gate = certs 100% + composite >= threshold; Preferred = sustained Grade A.
- Two-factor OTIF (operational) and four-factor perfect order (re-qualification) are computed and labelled distinctly.
- Abnormal price spike threshold > 5% above baseline (configurable).
- Forecasting is manual, procurement-only, month/quarter x quantity, with a variance flag.
- All weights, bands, thresholds, and the AVL cut are configurable defaults (ISO prescribes no fixed numbers).
- Access is RBAC-scoped; SSE carries the entity id only and clients re-query through the guarded endpoint (no data leaks over the stream).

## Cross-references
- **Diagram 04** (sourcing): consumes AVL status and preferred suppliers for selection.
- **e04** (NCR/CAPA): quality failures and the consecutive-below counter feed the suspend gate; CAPA responsiveness feeds the responsiveness dimension.
- **Diagram 11** (returns): return events feed the quality and four-factor perfect-order dimensions.
- **Diagram 09 / e12** (invoice/match): three-way-match exception rate and invoice accuracy source from here.
- **e02** (budget/commitment): commitment-vs-actual feeds the cost analytics.
- **Benchmarks:** SCOR RL.1.2 and the RL/RS/CO pillars; ISO 8.4.1 monitoring. Formulas: `model/platform-services.md` (analytics engine), memory `procurement-metrics-kpis`, `scor-model`.
