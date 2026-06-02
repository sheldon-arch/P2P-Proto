# MVP Slice + Demo Golden-Path Storyboard

Defines which of the 25 flows are built to what depth for the prototype, and the scripted end-to-end narrative an investor/enterprise demo walks. This governs where build effort concentrates (per the PM and exec reviews). A prototype must feel complete along the golden path and plausibly broad everywhere else.

## 1. The demo company (the single fictional tenant)

**Meridian Consumer Health** - a mid-market OTC / personal-care manufacturer (chosen per the exec review because a regulated input lights up the most flows: COA/MSDS quality gate, ministry permits, food/pharma KPI bands, packaging artwork/NPD, imports with customs, MRO/spares via Engineering). Base/reporting currency: USD. Two plants: Plant-1 domestic (USD), Plant-2 in a duty regime so imports/customs are real. Departments: Production, R&D/NPD, Maintenance/Engineering, QA/QC, Marketing (artwork), Procurement, Finance. The full seed dataset (task #3) is built against this one company so every screen hangs together.

## 2. MVP slice (build depth per flow)

**Build-real (full screens, interactive, seeded, walk end-to-end) - 9 flows + supplier onboarding:**
- 02 Requisition and intake
- 03 Approval workflow (incl. auto-approval + SoD + budget gate)
- 04 Sourcing / RFQ / landed-cost comparison / award
- 05 Purchase order
- 06 Supplier onboarding (at least to "active supplier with profile + scorecard")
- 08 Delivery / GRN / QC inspection
- 09 Invoice capture / two-vs-three-way match / exceptions
- 10 Payments and installments (maker/checker)
- 11 + e04 Returns / NCR / CAPA loop
- 12 Analytics / supplier scorecard / KPIs

**Show-light (one representative screen each, partially interactive or read-only seeded):**
- 01 Configuration (an admin settings screen proving it is configurable; not a full wizard)
- 07 Item onboarding (one form + the list)
- Supplier-portal slices of 04/05/09 (one good external form proves "two-sided")
- e02 Budget (a budget-vs-commitment-vs-actual view; the logic shows inline in 02/05)
- e08 Cash float (a cash-purchase + float widget)

**Roadmap / shown-inline (nav entry + placeholder, OR surfaced as inline behaviour inside built flows, NOT separate screens):**
- e01 approval routing, e03 qty tolerance, e05 auto-create, e06 bulk import, e07 currency degradation, e09 contract supply, e10 artwork/NPD, e11 permit expiry, e12 match condition.
- Most of these are RULES visible inside the built flows (tolerance badge in GRN, duplicate-invoice flag in match, currency-fallback note in totals, auto-create on the requisition line, permit-expiry alert on item select). Surface them as inline badges/messages/alerts in the real flows; that demonstrates depth without building 12 more screens. Bulk import (e06) and artwork/NPD (e10) get one light screen each since they are visually distinctive.

Rationale: this slice walks the entire source-to-pay cycle end to end (the thing that makes it feel complete) while concentrating polish on the screens a buyer probes hardest.

## 3. The golden path (the scripted demo narrative)

One requirement followed the full distance across role switches, plus deliberate exceptions. Each beat names the persona, the screen, the action, what the audience sees, and the wow.

**Hero record:** requisition for a regulated raw material (an API/excipient) for Plant-2 (import), plus a packaging item (printed carton, Plant-1). Pre-seeded "today" date so dates and alerts sit sensibly.

1. **Requester (R&D/NPD) raises the requisition.** Screen: requisition form. Fills lines, sees the soft budget check warn (over the quarter's available), submits. WOW: the dynamic form adapts to category/import (HS code, incoterm fields appear), budget awareness at intake.
2. **Approval routes; one stage auto-approves, one needs a human.** Screen: approval queue (Approver persona). The low-value carton line's finance stage auto-approves by nearest-bucket; the high-value API needs a manual approver. SoD visible (the requester cannot approve their own). WOW: intelligent, configurable auto-approval, not a rubber stamp.
3. **Buyer sources the API: RFQ to 3 suppliers -> landed-cost comparison.** Screen: the comparison workbench. The cheapest unit price is NOT the lowest landed cost (high freight + duty on the cheap import flips the ranking); a >5% price-spike flag shows on one quote; the buyer must justify a non-top pick. WOW: THE marquee screen - normalized landed-cost decision support that reorders the recommendation.
4. **Supplier acknowledges the PO.** Screen: supplier portal (external persona). Confirms the order; advance payment per terms triggers. WOW: a real two-sided system, not a single-tenant mock.
5. **Receiving + Quality: goods arrive, one lot fails QC.** Screen: GRN + inspection. COA hard-block until the certificate is in; the carton arrives at +7% (tolerance amends the PO before GRN); the API lot fails QC -> NCR raised. WOW: the quality gate and tolerance handling competitors skip.
6. **NCR -> CAPA -> supplier toward SUSPENDED.** Screen: NCR/CAPA workbench + supplier record. The CAPA loop opens, the supplier's consecutive-below streak ticks, the AVL grade drops, the supplier trips toward SUSPENDED (blocked from new POs). WOW: the closed quality-to-re-qualification loop - the differentiated story.
7. **Finance: invoice capture -> three-way match exception -> resolve; maker/checker pay.** Screen: invoice match workbench + payment. A price-variance exception auto-flags and routes to the buyer; a duplicate-invoice is caught and held; maker prepares, checker (Chief Accountant) releases (maker != checker). WOW: real AP controls - exception routing, duplicate detection, segregation of duties.
8. **Management dashboard: the payoff.** Screen: analytics/scorecard. Supplier scorecard with the AVL grade dropped after the NCR, spend-by-category, OTIF (two-factor) and perfect-order (four-factor) shown distinctly, savings (vs last-purchase baseline), req-to-PO cycle time, budget commitment-vs-actual. WOW: visibility as a byproduct - the loop closes visually.

## 4. Wow-factor ranking (build these to feel real first)
1. Landed-cost comparison that reorders the ranking (04).
2. Supplier scorecard + AVL + the CAPA-to-suspend loop (12 + 11/e04 + 06).
3. Nearest-bucket auto-approval + financial revert (03 + e01).
4. Three-way-match exception routing + duplicate detection (09 + e12).
5. Budget commitment vs actual (e02 + 05).

## 5. Honesty guardrail (PM review)
There is no AI/ML in the model. Do NOT label anything "AI" in the demo. Position the genuinely impressive, system-computed capabilities truthfully: automated nearest-bucket approval, normalized landed-cost decision support, the two-stage supplier scorecard, the closed CAPA loop. "Automated sourcing intelligence" / "decision support" is accurate and still strong.

## 6. Per-role "first 30 seconds" landings (each persona lands on their work, never an empty page)
- Requester -> My Requisitions (drafts + in-flight + status badges) + "New Requisition" CTA.
- Approver -> Approval Queue (pending, aging badges, amount, SoD-aware).
- Buyer -> Sourcing pipeline (open RFQs, requisitions awaiting sourcing, POs to issue).
- Supplier (portal) -> Open RFQs to quote + POs to acknowledge + invoices to submit.
- Receiving -> Inbound/expected deliveries + GRNs to raise.
- Quality -> Lots awaiting inspection + open NCRs/CAPAs.
- Finance-Maker -> Invoices to match + payment schedule due.
- Finance-Checker -> Payments awaiting release.
- Management -> Scorecard + spend + KPI dashboard.
- Budget Owner -> Budgets (available/committed/actual) + over-budget overrides to action.
- Administrator -> Masters, roles, approval chains, field config.

This drives task #6 (per-role home) and task #4 (screen inventory must cover these landings).

Source: synthesized from the 3 expert reviews (`../docs/2026-05-31-pre-prototype-readiness.md`) + the model. Shapes the seed (task #3) and screen inventory (task #4).
