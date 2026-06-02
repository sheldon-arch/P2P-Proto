# UI Rebuild Plan: Replace the Entire UI with the Stitch Reference Design

## Goal

Scrap the current UI and rebuild it from scratch to match the Stitch reference screens, while keeping the existing backend (in-memory store, state machines, MSW handlers, RBAC, the guided tour) intact and fully wired. Deliver a working app where the entire flow works end to end, click by click, verified per phase.

## The three decisions (locked)

1. Rebuild the UI from scratch and re-wire. Delete the current `src/app` pages and `src/components` (ui, patterns, shell; tour is kept), scaffold fresh screens that match the Stitch visuals, and re-connect each to the existing backend hooks.
2. Logic wins; Stitch is the visual reference. The backend data model, fields, transitions, and RBAC are the source of truth. Stitch defines the look (layout, spacing, status pills, tables, chrome). Where a Stitch screen shows a field or action our logic does not have (or omits one it does), we follow the logic and adapt the visual.
3. Phased, verified per phase. After each phase: typecheck, 212 tests, build, tour-lint, and dev-server route checks. Report before continuing.

## What "rebuild from scratch" means precisely

The Stitch exports are static HTML using CDN Tailwind, a Material-style purple-tinted token config, and Material Symbols icons. They are not wired to data and do not use our component library. So the rebuild does NOT copy the Stitch HTML. It rebuilds each screen as a real React screen that:
- reproduces the Stitch visual intent (layout, density, pills, tables, cards, the sidebar shell),
- uses our real design tokens (neutral palette, not the purple tint) and our shadcn/Radix components,
- binds to the existing hooks and transitions,
- keeps every `data-tour-id` anchor so the guided tour still works,
- honors RBAC and the field-visibility wall.

The Stitch `screen.png` files are the pixel target. The Stitch `code.html` files are a structural hint only.

## Safety net (already in place)

- Baseline captured: 212 tests pass, typecheck clean (2026-06-02).
- Current UI backed up to `/tmp/p2p-ui-backup-app` and `/tmp/p2p-ui-backup-components` (this is not a git repo, so this copy is the rollback). If a phase goes wrong, restore from here.
- The backend (`src/lib`, `src/queries`, `src/mocks`, `src/lib/tour` script/engine/anchors) is NOT deleted. Only the presentational layer is rebuilt.

## The binding contract the new UI must hold to (do not break these)

Data hooks (exact names): `useGetList`, `useGetOne`, `useCreate`, `useUpdate`, `useTransition` (generic), plus named: `useReorderWorklist`, `useRaiseReorder`, `useLandedCostComparison`, `useScorecard`, `useKpis`, `useCreditorLedger`, `useBudgetAvailability`, `useDiscoverSuppliers`, `useGetSupplierQualification`, `useGetHygieneAudits`, `useGetRetentionSamples`, `useGetQualityAgreement`. The new screens call these, not new ad hoc fetches.

MSW routes: GET `/api/:entity`, GET `/api/:entity/:id`, POST `/api/:entity`, PATCH `/api/:entity/:id`, POST `/api/:entity/:id/transition`, plus special routes `/api/reorder-worklist`, `/api/landed-cost/:id`, `/api/discovery`. The QA field-visibility strip reads `getCurrentUser().role` (the `.role` field, not `.roleId`). Do not change this.

Tour anchors every rebuilt screen MUST re-emit (a `data-tour-id` attribute on the right element), grouped by screen:
- Inventory: `inventory.reorder-worklist`, `inventory.reorder.raise`
- Requisition: `requisition.lines`, `requisition.banner.budget-over`, `requisition.submit`, `requisition.dup-requester`
- Approval: `approval.api.approve`, `approval.row.TKT-HERO` (and the dynamic `approval.row.<id>` prefix)
- Sourcing: `sourcing.banner.landed-flip`, `sourcing.compare.target`, `sourcing.compare.carton.award`
- PO: `po.issue`
- GRN: `grn.banner.tolerance-amend`, `grn.raise-button`
- Inspection: `inspection.coa-block`, `inspection.fail`
- Invoice: `invoice.match.exception`, `invoice.match.run-button`, `invoice.banner.duplicate-hold`
- Payment: `payment.installment.partial`, `payment.release`
- NCR: `ncr.quarantine`, `ncr.capa.open`
- Analytics: `analytics.kpi.otif`, `analytics.kpi.perfect-order`, `analytics.kpi.spend`, `analytics.kpi.dpo`, `analytics.scorecard-widget`, `analytics.budget-commitment`
- Suppliers: `supplier.qualification`, `suppliers.discover`
The self-set banner keys (BANNER.*) are emitted by the rule banners, not the screens; keep the rule-banner component.

RBAC: the RoleId union, the nav config (the sidebar derives per role), and the field-visibility config (commercial fields hidden for the `quality` role) are unchanged. The new shell derives the sidebar from nav-config and the role, exactly as today.

Session: the role switcher sets the role; ALL_PERSONAS is the role-to-name list. The new top bar keeps the role switcher.

## Route inventory (51 routes, the screens to rebuild) and their Stitch reference

Golden-path and core (Phase 2-5), each route -> Stitch reference:
- `/inventory`, `/inventory/stock` -> inventory_reorder_worklist
- `/requisitions` -> my_requisitions_list; `/requisitions/new`, `/requisitions/[id]` -> create_requisition (+ pending-master state)
- `/approvals`, `/approvals/[id]` -> approval_queue_and_decision (+ routing-logic state)
- `/sourcing` -> sourcing_pipeline_dashboard; `/sourcing/rfq/new` -> create_rfq_invite_suppliers; `/sourcing/rfq/[reference]` -> rfq_response_tracker; `/sourcing/rfq/[reference]/compare` -> sourcing_rfq_compare (+ coa-block and fx-unavailable states)
- `/purchase-orders`, `/purchase-orders/[id]` -> purchase_order_detail; `/purchase-orders/new` -> create_issue_purchase_order_multi_supplier
- `/deliveries` -> inbound_expected_deliveries; `/deliveries/[poId]/receive` -> goods_receipt_grn
- `/quality` -> qc_inspection_queue; `/quality/inspections/[id]` -> inspect_lot_quality; `/quality/ncr/[id]` -> ncr_capa_workbench
- `/invoices` -> invoice list (from invoice_three_way_match list context); `/invoices/new` -> capture_invoice; `/invoices/[id]/match` -> invoice_three_way_match; `/invoices/[id]/resolve` -> price_variance_adjudication
- `/payments` -> payments_and_installments; `/payments/release` -> payment_release_queue (+ reschedule_installment modal)
- `/analytics`, `/dashboard` -> analytics_dashboard_1; `/analytics/dashboard` -> analytics_dashboard_1; `/analytics/scorecard/[supplierId]` -> supplier_scorecard_detail; `/analytics/spend` -> spend_cuts_analytics_restored (+ savings_report_alerts)
- `/budgets` -> budget_owner_home (+ budget_stage_decision_override modal); `/cashflow` -> cash_float_management

Suppliers, items, returns, admin, portal (Phase 6-7):
- `/suppliers` -> suppliers list (supplier_qualification context); `/suppliers/new` -> supplier create; `/suppliers/[id]` -> supplier_qualification + supplier_profile_update_request; `/suppliers/discover` -> discovery panel
- `/items` -> items list; `/items/new`, `/items/[id]` -> item_onboarding (+ permit-expiry state)
- `/returns` -> returns_and_rma_1; `/returns/[id]` -> returns_and_rma_2; `/returns/new` -> return create (supplier_portal_authorize_return is the supplier side)
- `/admin` -> master_data_management_admin + roles_and_permissions_matrix + dynamic_field_configuration; `/admin/routing-rules` -> approval_chain_and_routing_rules
- `/portal` -> supplier_portal_1; `/portal/po`, `/portal/po/[id]` -> PO acknowledge; `/portal/rfq`, `/portal/rfq/[rfqId]` -> supplier_portal_submit_quote; portal invoice and return -> supplier_portal_submit_invoice, supplier_portal_authorize_return; login -> supplier_portal_login_otp
- `/unauthorized` -> no Stitch screen; keep a simple branded page.

States/variants that are conditional UI on an existing route, not new routes: approval routing-logic, budget-override modal, pending-master chip, COA hard-block, FX rate-unavailable, permit-expiry alert, the four guided-tour frames. These are built as states on their parent screen.

## Apply the known copy fixes during the rebuild

From STITCH-COPY-FIXES.md, fold these in so we do not rebuild the same defects:
- No AI/ML/intelligence wording. Routing is "Routing Engine", not "AI-Routing Engine". The sourcing intro is "Landed-Cost Comparison", not "Sourcing Intelligence". Approved terms: the system, rules-based, automated, normalized landed cost, nearest-bucket, least-loaded.
- Carton PO is a three-way match (materials are three-way; two-way is services only).
- Use the canonical seed data the screens already render (Synthex SUP-0001, Helvetia SUP-0003, BioCore SUP-0002, REQ-2026-0042, ITM-0006, ITM-0063, PO-2026-0061, INV-LV-13, target 140.75, landed 155.26 / 169.77). Since the new screens bind to real hooks, the data comes from the seed automatically; do not hard-code placeholder names.
- Reconcile tokens to the neutral palette (background #fafafa, borders #e4e4e7, accent #1e3a5f), not the purple-tinted Stitch token block.
- Roles matrix shows all roles, not five.

## Phases (each ends with the full gate and a report)

### Phase 0: Design-system foundation (no screens deleted yet)
Build the new shared layer first so every screen has consistent parts to use.
- Reconcile design tokens in `globals.css`/`tailwind.config` to the neutral palette and the Stitch typography scale (Inter, JetBrains Mono, the h1/h2/h3/body/label-caps/data scales, 8px radius, sidebar 240px, topbar 56px).
- Rebuild the shell (`src/components/shell`): the 240px left sidebar with grouped nav derived from nav-config and the role, the 56px top bar with breadcrumb, search, role switcher, and the active-nav state (navy left border, tinted background).
- Rebuild the pattern components (`src/components/patterns`) to the Stitch look: PageHeader, DataTable (label-caps header, monospace right-aligned numbers, row hover, row actions, row tour-id), StatusBadge (dot + tinted pill), KpiCard, DetailSummaryCard, the form field components (label-above, 36px inputs, focus ring navy), RuleBanner (keeps the BANNER.* keys), Loader, EmptyState, DeviceFrame (tour mini-dashboard).
- Keep the `ui/` shadcn primitives; restyle via tokens where needed.
- Do NOT touch `src/components/tour`, `src/lib`, `src/queries`, `src/mocks`.
- Gate: typecheck, 212 tests, build, tour-lint. (No route checks yet; screens come next.)

### Phase 1: Shell, home/landing routing, and the role homes
- The app shell wraps all routes; per-role home derives from the role (Requester -> my requisitions, Management -> analytics dashboard, Finance-Maker -> finance maker home, Budget Owner -> budgets, etc.).
- Build the role-home landings that are their own screens: finance_maker_home, budget_owner_home, and the dashboard.
- Gate: typecheck, 212 tests, build, tour-lint, dev-server 200 on `/`, `/dashboard`, `/budgets`.

### Phase 2: Golden-path part 1 (demand to award)
Rebuild and wire, in flow order:
- `/inventory` + `/inventory/stock` (reorder worklist, anchors `inventory.*`)
- `/requisitions`, `/requisitions/new` (+ budget-over banner, lines, submit, pending-master chip, dup-requester), `/requisitions/[id]`
- `/approvals`, `/approvals/[id]` (SoD banner, per-line routing, auto-approve vs routed, anchors `approval.*`)
- `/sourcing`, `/sourcing/rfq/new`, `/sourcing/rfq/[reference]`, `/sourcing/rfq/[reference]/compare` (the marquee landed-cost flip; COA hard-block and FX states; anchors `sourcing.*`)
- Gate: full gate + 200 on every route above + a manual click-through of the chapter steps these screens host.

### Phase 3: Golden-path part 2 (PO to receipt to quality)
- `/purchase-orders`, `/purchase-orders/new` (multi-supplier split, freight-forwarder PO, tooling waiver, three-way carton), `/purchase-orders/[id]` (linked sibling PO)
- `/deliveries`, `/deliveries/[poId]/receive` (tolerance amend, anchors `grn.*`)
- `/quality`, `/quality/inspections/[id]` (COA hard gate, field-visibility wall, anchors `inspection.*`), `/quality/ncr/[id]` (quarantine, CAPA, suspension streak, anchors `ncr.*`)
- Gate: full gate + 200 on every route + click-through.

### Phase 4: Golden-path part 3 (invoice to payment to analytics)
- `/invoices`, `/invoices/new` (duplicate hold, FX), `/invoices/[id]/match` (three-way, full resolution set, anchors `invoice.*`), `/invoices/[id]/resolve` (price variance)
- `/payments`, `/payments/release` (maker-checker, reschedule modal, anchors `payment.*`)
- `/analytics`, `/analytics/dashboard`, `/analytics/scorecard/[supplierId]`, `/analytics/spend` (OTIF/perfect-order/spend/DPO, the Synthex ripple, anchors `analytics.*`), `/cashflow`
- Gate: full gate + 200 on every route + click-through.

### Phase 5: Suppliers, items, returns
- `/suppliers`, `/suppliers/new`, `/suppliers/[id]` (qualification matrix, hygiene audit, profile-update-reverts-to-pending), `/suppliers/discover`
- `/items`, `/items/new`, `/items/[id]` (reorder settings, regulatory toggles, permit-expiry alert)
- `/returns`, `/returns/[id]`, `/returns/new`
- Gate: full gate + 200 on every route.

### Phase 6: Admin and supplier portal
- `/admin` (master data tabs, roles matrix with all roles, field config), `/admin/routing-rules` (routing engine, no AI wording)
- `/portal`, `/portal/po`, `/portal/po/[id]`, `/portal/rfq`, `/portal/rfq/[rfqId]` (submit/revise quote with target-price suppressed), portal invoice and return, login/OTP
- `/unauthorized`
- Gate: full gate + 200 on every route, including the portal under the supplier role.

### Phase 7: Full end-to-end verification (click by click)
- Clean build from scratch (`rm -rf .next && npm run build`), all gates green, report the test count (must be 212 plus any new UI tests, zero failures).
- Boot the dev server; every one of the 51 routes returns 200 with no console errors.
- Role-switch sweep: as each of the 14 personas, confirm the sidebar derives, the home renders, and no route 500s. Spot-check the QA wall (quality sees lock chips on price/PO value; buyer sees the numbers).
- Guided demo end to end (Watch mode, freshly reset store): every chapter plays start to payoff; the inventory opening beat, the landed-cost flip (Synthex 155.26 < Helvetia 169.77), the multi-supplier split, the COA gate, maker-checker, and the dashboard ripple all work; the coach-marks anchor to the rebuilt elements; the tour never hangs.
- Cross-join checks: a GRN posted increments the right item-and-warehouse stock; an award creates one PO per supplier; a quality NCR drops the Synthex grade on the dashboard. These prove the rebuilt UI is joined to the real flow, not faked.
- Determinism: reset and re-run; identical numbers.
- Update the memory checkpoint and resolve the Stitch-fixes memory.

## How the screens get built (to keep quality high across 50 screens)

- I build screen by screen against the matching `screen.png` (the pixel target) and the screen-behaviour spec (the data, actions, acceptance criteria already written in `build-spec/screens`). Each screen reuses the Phase-0 shared components, so the look stays consistent and the work is mostly composition, not novel CSS.
- Subagents (Sonnet 4.6 for substantial screens, Haiku 4.5 for small list/detail screens) may build screens in parallel within a phase, each with a detailed brief that names the route, the Stitch reference, the exact hooks to call, the anchors to emit, the RBAC rules, and the acceptance criteria. I verify every screen myself before the phase gate. This follows the established subagent discipline.

## Acceptance criteria (every phase; a phase is not done until all pass)

1. `npm run typecheck` clean.
2. `npm test` all pass; the 212 baseline never drops; new UI tests are additive.
3. `npm run build` succeeds (no RSC/client-boundary errors).
4. `npm run tour:lint` passes (no AI/ML wording; every anchor real-or-center; personas valid; narration keys resolve).
5. Every route the phase built returns 200 on the dev server with no console errors.
6. The phase's screens match their Stitch reference visually and bind to real data (not placeholders), with the tour anchors present.
7. Determinism holds (reset reproduces identical state).

## Risks and how they are handled

- Tour breakage is the top risk: every rebuilt screen must re-emit its `data-tour-id` anchors. The anchor list above is the checklist; tour-lint plus a Watch-mode pass in Phase 7 catches misses.
- RBAC/field-visibility regressions: the shell derives nav from nav-config and the strip reads `.role`; we do not change either, and Phase 7 spot-checks the QA wall.
- Scope/time: 51 routes is large. Phasing with per-phase gates means we always have a working app at a phase boundary, and the `/tmp` backup is the rollback if a phase cannot be made green.
- Visual drift from Stitch: the Phase-0 shared components encode the Stitch look once, so screens inherit it rather than each re-deriving it.

## Net effect

At the end, the app looks like the Stitch reference set, every screen binds to the real backend, RBAC and the field-visibility wall hold, the guided demo plays end to end, and all 51 routes plus the full click-by-click flow work and are verified.
