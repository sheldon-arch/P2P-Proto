# Per-Role Landing Screens (the "first 30 seconds")

Each persona's home: where the role redirects to on login and what it shows so the prototype feels real and relevant the instant any role enters. Baseline patterns: Raphe `task-center` (My Focus queue + ExecutionStreak/OTIF metric cards), `cashflow` (Finance two-pane), `analytics-dashboard` (KPI tiles + charts). Each landing = KPI/stat tiles + the role's primary work queue (with status/aging badges) + an alerts strip + the primary CTA, all populated from the seed (task #3). Consumes `build-spec/mvp-and-storyboard.md` section 6, `nav-config.json`, the seed data.

Convention per landing: Route | KPI tiles | Primary queue (the dominant element) | Alerts | Primary CTA. All data references seed entities.

## Requester -> /dashboard (My Requisitions)
- KPI tiles: My open requisitions, Awaiting my action (rework/send-back), Approved this month, Avg req-to-PO days.
- Queue: My Requisitions list (own/department), columns identifier/category/priority badge/totalAmountInBase/stage badge/status badge; drafts surfaced first.
- Alerts: any send-back needing revision; over-budget warnings on own requisitions.
- CTA: "New Requisition" (-> /requisitions/new). Seed: REQ-HERO (draft/in-flight) + the requester's own history.

## Approver -> /dashboard (Approval Queue)
- KPI tiles: Pending my approval, Aging > SLA, Approved this week, Avg approval time.
- Queue: Approval Queue, columns requisition/requester/amount/aging badge/stage; SoD-aware (own records not actionable). This is the dominant element.
- Alerts: items breaching the approval SLA.
- CTA: act on the top pending item. Seed: the two threshold-boundary requisitions (one auto, one manual) + REQ-HERO's API line awaiting manual approval.

## Buyer (Procurement) -> /dashboard (Sourcing & PO pipeline)
- KPI tiles: Requisitions to source, Open RFQs, POs to issue, Savings YTD (vs last-purchase baseline).
- Queue: a pipeline (requisitions awaiting sourcing -> open RFQs -> awarded/PO-ready), plus POs needing issue.
- Alerts: a price-spike flag on an open quote; an NCR/CAPA to resolve with a supplier.
- CTA: "Source" the top requisition (-> the RFQ/comparison flow). Seed: RFQ-HERO (3 quotes ready, the landed-cost flip), the partially-delivered PO, the open exceptions routed to the buyer.

## Finance-Maker -> /payments (or /cashflow)
- KPI tiles: Invoices to match, Payments due this week, Overdue payables, DPO.
- Queue: the payment schedule / invoices-to-match list (the cashflow two-pane: ticket list + installments). Dominant element.
- Alerts: a duplicate-invoice on hold; an overdue installment (the ~28-day reminder).
- CTA: match the top invoice / prepare the next due payment. Seed: the 4 invoice exceptions, the partial-approval+remainder installment, the overdue installment.

## Finance-Checker (Chief Accountant) -> /payments/release
- KPI tiles: Payments awaiting my release, Released today, Total value pending release, Held/rescheduled.
- Queue: the release queue (maker-prepared payments awaiting checker approval); maker != checker enforced (a payment this user prepared is not actionable).
- Alerts: high-value releases (management threshold), held items.
- CTA: review and release the top payment. Seed: PAY-HERO (maker-prepared, awaiting release).

## Management -> /analytics/dashboard
- KPI tiles (hero dashboard): OTIF (two-factor) + perfect-order (four-factor) shown distinctly, total spend, savings, supplier risk summary, budget commitment-vs-actual.
- Queue: items at the top of the approval chain (final approvals) + the supplier scorecard summary (the AVL grade movements).
- Alerts: a supplier dropping toward SUSPENDED (the CAPA loop); a budget over-commitment.
- CTA: review the scorecard / approve the top item. Seed: the computed scorecards, spend cube, the near-suspend supplier.

## Quality -> /quality (Inspection queue)
- KPI tiles: Lots awaiting inspection, Open NCRs, Open CAPAs, Supplier defect rate (PPM) trend.
- Queue: the inspection queue (incoming lots, COA status) + open NCRs/CAPAs. Dominant element.
- Alerts: a COA-missing hard block; a supplier near SUSPENDED.
- CTA: inspect the top lot. Seed: GRN-HERO (API lot to fail), NCR-LV-1 -> CAPA-LV-1.

## Receiving / Warehouse -> /deliveries (Inbound)
- KPI tiles: Expected today, Awaiting GRN, Partial deliveries open, Received this week.
- Queue: inbound/expected deliveries + GRNs to raise (incl. partial-delivery blocks). Dominant element.
- Alerts: a delivery past its ETA; a quantity-tolerance amend pending before GRN.
- CTA: record the top delivery. Seed: the partially-delivered PO (2 of 3 GRNs), the carton at +7% tolerance.

## Engineering -> /deliveries (Spares & service receipt)
- KPI tiles: Spares to receive, Open service completions, Items to onboard, MRO requisitions open.
- Queue: spares/engineering items to receive (no-GRN close-as-received) + service-completion sign-offs.
- Alerts: an overdue service contract; an item awaiting onboarding approval.
- CTA: receive/close the top spares line. Seed: MRO/spares history + an item in PENDING_APPROVAL.

## Budget Owner -> /budgets
- KPI tiles: Owned budgets (available/committed/actual), Over-budget overrides to action, Commitment this quarter, Variance to plan.
- Queue: budgets by cost-center (available vs committed vs actual) + over-budget requisitions awaiting override.
- Alerts: a cost-center nearing/over its quarter budget; an override request.
- CTA: action the top override. Seed: the budgets (44 = project x quarter), REQ-HERO's over-budget override.

## Tax / Compliance -> /dashboard (Compliance focus)
- KPI tiles: Tax exceptions to resolve, Supplier certs expiring, Sanctions re-screens due, Customs items in clearance.
- Queue: tax-mismatch invoice exceptions routed here + supplier compliance items (expiring certs, screening).
- Alerts: the near-expiry GMP cert (12 days), a sanctions re-screen due, a customs hold.
- CTA: resolve the top tax exception. Seed: the tax-mismatch invoice, the near-expiry-cert supplier.

## Administrator -> /admin (or /analytics/dashboard)
- KPI tiles: Users active, Pending master-data approvals, Routing rules configured, Field config coverage.
- Queue: admin tasks (users to provision, masters to review, routing gaps).
- Alerts: a routing rule missing for a (department, stage) -> would stall a requisition.
- CTA: configure / manage. Seed: the 22 users, masters, routing rules.

## Supplier (portal) -> /portal
- KPI tiles: Open RFQs to quote, POs to acknowledge, Invoices submitted, Returns to action.
- Queue: open RFQs (respond), POs awaiting acknowledgement, invoice submission. Scoped to own records only.
- Alerts: an RFQ deadline approaching; a return/RMA to action.
- CTA: "Submit Quote" / "Acknowledge PO". Seed: RFQ-HERO invitation, PO-HERO to acknowledge.

## Notes
- Every queue has a designed EMPTY state (Raphe `EmptyMessage`): "No approvals waiting. You're all caught up." - never a blank table (the seed keeps the demo personas non-empty, but other personas must still degrade gracefully).
- KPI tile values come from the seed's computed KPIs (OTIF ~94%, DPO ~45d, savings, etc.) - defensible, not placeholder.
- The home redirect logic lives in the shell (`01-information-architecture.md`); these landings are the targets.
