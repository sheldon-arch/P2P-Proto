# Screens: 00 Shell and Per-Role Landings

The application shell (sidebar, topbar, command palette, notifications, profile) plus one home/landing screen per persona from storyboard section 6. The shell wraps every flow screen (02-12). Landings are the "first 30 seconds" surfaces: each persona lands on their own queue or dashboard, never an empty page. Source: `mvp-and-storyboard.md` section 6 (per-role landings) and section 1 (the Meridian Consumer Health tenant), `model/role-permission-matrix.md` (nav and CTA gating), `build-spec/schema/state-machines.ts` (the queues are filtered views of in-flight state-machine records), `documentation/00-system-overview.md` (the role roster and the spine), data dictionary `User.json`, `Requisition.json`, `ApprovalStageCompletion.json`, `Budget.json`.

Nav, CTAs, and queue contents are all derived from the resolved effective-permission set (the deduplicated union of role + direct user grant + designation + business-unit, plus the super-admin `all` short-circuit; `User.userPermissions`, `Role.permissions`). No item, tile, or button renders for a permission the user does not hold.

### S00.1 Application Shell (archetype: layout / chrome)
- **Route:** wraps all authenticated routes (the `/` layout; not a standalone page).
- **Roles:** all authenticated personas. The shell renders identically in structure; its contents (nav items, CTAs, queues) are filtered by the viewer's effective permissions.
- **Realizes:** the cross-cutting navigation, search, notification, and identity chrome every flow screen sits inside; the demo role-switcher that lets one presenter walk all personas.
- **Purpose:** give every screen a stable frame and make permission-scoping visible. A Requester and a Buyer signed into the same tenant see different sidebars because their permission sets differ, which proves RBAC is real, not cosmetic.
- **Data shown:** `User.name`, `User.roleId` (current persona, shown in the topbar), `User.departmentId`, `User.businessUnitId`; the tenant name (Meridian Consumer Health) and base currency (USD, `Currency.isBase`); notification count (unread); the nav tree derived from effective permissions.
- **Primary actions:**
  - Sidebar navigation: each group renders only if the viewer holds at least one permission in that domain. Requisitions group requires `requisition.view`; Approvals requires `approval.approve` or `approval.requestApproval`; Sourcing requires `rfq.view`; Purchase Orders requires `po.view`; Suppliers requires `suppliers.view`; Items requires `items.view`; Receiving/GRN requires `grn.view`; Quality requires `qc.inspect` or `ncr.view`; Invoices/Match requires `invoice.view`; Payments requires `payments.schedules.view`; Returns requires `return.view`; Budgets requires `budget.view`; Analytics requires `analytics.view` or `scorecard.view`; Administration requires `masters.manage`, `roles.manage`, `routingRules.update`, or `fieldConfig.manage`. Navigation does not change state; no transition.
  - Role-switcher (topbar, demo-only): switches the active persona for the walkthrough. Re-resolves effective permissions on the next request (no caching, per the configuration model). Gated to the demo build; in production a user holds one resolved set. No state transition.
  - Global search / Command palette (Cmd+K): jump to any record by `Requisition.identifier`, supplier `code`, item `code`, or PO number, and to any nav destination the viewer can reach. Read-only; no transition.
  - Notifications bell: opens the notification list (assignment, stage-approved, return-for-revision, over-budget, match-exception, payment-due events). Each notification deep-links to the source record; permission-checked on click. No transition.
  - Profile menu: shows `User.name`, `User.email`, `User.roleId`, `User.designationId`, sign-out. Sign-out only; no business transition.
- **Secondary actions / navigation:** collapse/expand sidebar; breadcrumb in the topbar; tenant/base-currency indicator (read-only, reflects the locked base currency).
- **States to design:** loading (nav skeleton while permissions resolve), populated (nav filtered to the persona), permission-denied (a deep-linked route the viewer lacks permission for renders a "You do not have access" panel, not the record), inactive-user (an account deactivated mid-session, `User.status==INACTIVE`, is forced to sign out on the next request).
- **Shadcn:** Sidebar (or a nav built from NavigationMenu + Collapsible groups), Command (Cmd+K palette), Popover + Badge (notifications bell with unread count), DropdownMenu + Avatar (profile), Select (demo role-switcher), Breadcrumb, Tooltip.
- **Acceptance criteria:** (1) the sidebar is generated from the resolved permission set, so switching persona via the role-switcher visibly adds/removes nav groups (a Requester has no Administration or Payments group; an Administrator sees every group); (2) deactivating the current user (`User.status==INACTIVE`) forces a sign-out on the next action, never a half-rendered screen; (3) a deep link to a record the viewer cannot see renders the permission-denied panel, proving scoping is enforced server-side, not hidden client-side; (4) the base currency indicator shows USD and is read-only (base is locked once transactions exist); (5) the role-switcher re-resolves permissions on the next request (no caching), matching the configuration model.
- **Tags:** [OE5 | RA auth-rbac + storyboard 6]

### S00.2 Requester Home: My Requisitions (archetype: list / per-role landing)
- **Route:** `/` for the Requester persona (aliases `/requisitions`).
- **Roles:** Requester (own/department, act). This is the same surface as S02.1 in `02-requisition.md`; listed here as the Requester landing per storyboard section 6.
- **Realizes:** the Requester "first 30 seconds": see own drafts and in-flight requisitions, start a new one.
- **Purpose:** answer "what do I have going and what do I do next" before any click.
- **Data shown:** `Requisition.identifier`, `date`, `category`, `priority` (Badge), `totalAmountInBase`, `stage` (Badge), `status` (Badge), `departmentId`; rows scoped to own/department (visibility invariant). A small "needs your attention" group surfaces requisitions returned for revision (a completion that moved AWAITING_APPROVAL -> IN_PROGRESS via `returnForRevision`).
- **Primary actions:** "New Requisition" (-> S02.2; perm `requisition.create`; no state transition until submit); row click -> S02.3 detail.
- **Secondary actions / navigation:** search by identifier/item; faceted filter by status/stage/category; sort; pagination.
- **States to design:** empty ("No requisitions yet. Create your first."), loading (skeleton table), populated, error.
- **Shadcn:** DataTable, Input (search), Popover + Command (faceted filter), Badge (priority/stage/status with the canonical color map), Button, Card (the "needs your attention" group).
- **Acceptance criteria:** (1) only own/department rows appear (scope enforced, not filtered); (2) status/stage Badges use the canonical color map (DRAFT grey, IN_PROGRESS amber, COMPLETED green, CANCELLED/ON_HOLD red/grey); (3) "New Requisition" gated by `requisition.create`; (4) a returned-for-revision requisition surfaces in the attention group so the requester sees the rework, not a buried status change.
- **Tags:** [S1.1 | AB+RA + storyboard 6]

### S00.3 Approver Home: Approval Queue (archetype: queue / hero landing with KPI tiles)
- **Route:** `/` for the Approver persona (aliases `/approvals`).
- **Roles:** Approver (in-chain, act); Management (final stage). Same surface as S03.1 in `03-approval.md`; listed here as the Approver landing.
- **Realizes:** the Approver "first 30 seconds": pending stages assigned to or requested of this approver, oldest and most urgent first.
- **Purpose:** show what is waiting on this approver and how late it is, before any drill-down.
- **Data shown:** KPI tiles: pending count, count overdue (remainingTime <= 0 against `priority` allowed duration), total `totalAmountInBase` awaiting this approver, auto-approved-today count (informational). Queue rows: `Requisition.identifier`, `ApprovalStageCompletion.stage`, requester `name`, `category`, `priority` (Badge), `totalAmountInBase`, `ApprovalStageCompletion.completionStatus` (AWAITING_APPROVAL for actionable rows), aging badge.
- **Primary actions:** row -> per-requisition approval action (S03.2): "Approve" (`approve`, AWAITING_APPROVAL -> APPROVED; perm `approval.approve`; SoD: actor != `requesterId`/`buyerId`), "Return for revision" (`returnForRevision`, AWAITING_APPROVAL -> IN_PROGRESS, mandatory note; perm `approval.reject`). Buttons render only on AWAITING_APPROVAL rows the viewer is eligible to act on.
- **Secondary actions / navigation:** filter by stage/department/aging; sort by amount or age; row click -> S02.3 detail.
- **States to design:** empty ("Nothing awaiting your approval."), loading, populated, permission-denied.
- **Shadcn:** Card KPI tiles, DataTable, Badge (aging: green within SLA, amber near, red overdue; SoD self-record badge), Popover + Command (filter), Button, Dialog/Sheet (the approval action opens S03.2).
- **Acceptance criteria:** (1) rows are only those where this user is `approvalRequestedToId` or a qualified assignee, and `completionStatus==AWAITING_APPROVAL`; (2) any row where the viewer is the record's requester/buyer shows a disabled action with reason "Cannot approve your own record" (SoD A6), proving SoD on the landing itself; (3) aging badge computes from `priority` allowed duration vs elapsed, so overdue rows are visibly red; (4) auto-approved stages do not appear as actionable rows (they were never AWAITING for a human); the auto-approved-today tile counts them.
- **Tags:** [OE2 | RA + storyboard 6]

### S00.4 Buyer Home: Sourcing Pipeline (archetype: queue / multi-section landing)
- **Route:** `/` for the Buyer persona (aliases `/sourcing`).
- **Roles:** Procurement/Buyer (act).
- **Realizes:** the Buyer "first 30 seconds": fully-approved requisitions awaiting sourcing, open RFQs, awards to recommend, POs to issue.
- **Purpose:** the buyer's worklist across the sourcing-to-order span in one place.
- **Data shown:** three sections. (a) Requisitions awaiting sourcing: `Requisition.identifier`, `category`, `totalAmountInBase`, `priority`, fully-approved date. These are rows where all `ApprovalStageCompletion.completionStatus==APPROVED` and no PO exists yet. (b) Open RFQs: RFQ number, supplier-invite count, quotes-in count, close date. (c) Awards/POs to issue: requisitions with a selected supplier awaiting PO draft/issue. A new-item-resolution callout lists item lines created free-text (Item `status==PENDING_ONBOARDING`) needing the buyer to onboard (flow 07).
- **Primary actions:** "Create RFQ" (-> flow 04; perm `rfq.create`); "Issue PO" (-> flow 05; perm `po.issue`; SoD: buyer != PO approver, A6; the PO `issue` transition guards budget committed + supplier ONBOARDED + buyer != approver); row click -> the relevant detail.
- **Secondary actions / navigation:** filter each section; search; link to the comparison workbench (flow 04).
- **States to design:** empty (each section shows its own empty copy), loading, populated, permission-denied.
- **Shadcn:** Card section headers + DataTable per section, Badge (priority, quote-count, PENDING_ONBOARDING), Button, Tabs (optional, to switch sections), Popover + Command (filter).
- **Acceptance criteria:** (1) "Requisitions awaiting sourcing" lists only fully-approved requisitions with no PO yet, proving the release-to-sourcing gate (a not-yet-approved requisition never appears); (2) "Issue PO" is disabled with a reason when the buyer is also the PO approver (SoD A6) or the supplier is not ONBOARDED (poLifecycle issue guard); (3) the new-item callout lists exactly the PENDING_ONBOARDING items the buyer must resolve, linking to flow 07; (4) section CTAs are each permission-gated (`rfq.create`, `po.issue`).
- **Tags:** [S1.2 | RA + AB + storyboard 6]

### S00.5 Supplier Portal Home (archetype: portal / external landing)
- **Route:** `/portal` (external; authenticated by email + OTP, sign-up disabled).
- **Roles:** Supplier/Vendor (own records only).
- **Realizes:** the Supplier "first 30 seconds": open RFQs to quote, POs to acknowledge, invoices to submit. Proves the system is two-sided.
- **Purpose:** a simplified external surface scoped strictly to the supplier's own records.
- **Data shown:** three queues, all scoped to the authenticated supplier (`Supplier.code`). (a) Open RFQs to quote: RFQ number, items, response-due date. (b) POs to acknowledge: PO number, `PurchaseOrder.status==ISSUED`, value, `PaymentTerms.label`. (c) Invoices/documents to submit: against ACKNOWLEDGED POs. The supplier's own `Supplier.status` (ONBOARDED / SUSPENDED) and `avlGrade` show in the header; a SUSPENDED supplier sees a banner that new POs are blocked.
- **Primary actions:** "Submit quote" (-> portal quote form; perm `quote.capture`, own quote); "Acknowledge PO" (`acknowledge`, poLifecycle ISSUED -> ACKNOWLEDGED, effect triggers advance payment per schedule; perm `po.acknowledge`, own PO); "Submit invoice" (-> portal invoice form; perm `invoice.capture`, submit own).
- **Secondary actions / navigation:** view own profile (perm `suppliers.update` own profile; editing sets `isErpSynced=false` and moves supplierLifecycle ONBOARDED -> PENDING_APPROVAL, A10); view own scorecard (perm `scorecard.view` own).
- **States to design:** OTP entry (pre-auth), empty (each queue empty copy), loading, populated, suspended-banner, permission-denied.
- **Shadcn:** Portal layout (simplified, no internal sidebar), email + OTP Input, Card queues, DataTable, Badge (PO status, supplier status, AVL grade), Button, Form (quote/invoice submit), Toast.
- **Acceptance criteria:** (1) every queue is scoped to the authenticated supplier's own records only (no cross-supplier leakage); (2) "Acknowledge PO" appears only on `status==ISSUED` POs and, on acknowledge, the advance-payment trigger fires per the PO's payment term (poLifecycle effect); (3) a SUSPENDED supplier (supplierLifecycle SUSPENDED) sees the new-PO-blocked banner; (4) editing the own profile flips `isErpSynced=false` and routes the profile back to PENDING_APPROVAL (A10), shown as a "changes pending re-approval" state.
- **Tags:** [S1.6/S2.1 | RA + AB + storyboard 6]

### S00.6 Receiving Home: Inbound and GRNs (archetype: queue / per-role landing)
- **Route:** `/` for the Receiving persona (aliases `/receiving`).
- **Roles:** Receiving/Warehouse (act).
- **Realizes:** the Receiving "first 30 seconds": expected/inbound deliveries and GRNs to raise.
- **Purpose:** show what is arriving and what needs a goods receipt.
- **Data shown:** two sections. (a) Expected/inbound: PO number, supplier `name`, expected date, `purchaseType` (Import rows show inbound tracking + customs-doc status). (b) GRNs to raise: ACKNOWLEDGED POs with goods arrived awaiting receipt; a COA-required badge on regulated items (`Item.regulatedItem==true`) that hard-blocks GRN until the certificate is in.
- **Primary actions:** "Record delivery" (perm `delivery.record`); "Raise GRN" (-> flow 08; perm `grn.raise`); these advance the requisition stage (requisitionStage ORDERED -> PARTIAL_DELIVERY via `moveStage`, role Receiving/Warehouse, guarded by mandatory fields per block).
- **Secondary actions / navigation:** filter by site/warehouse (`Warehouse.code`), supplier, date; track inbound shipment (perm `inbound.track`).
- **States to design:** empty, loading, populated, blocked (COA-required hard block visible), permission-denied.
- **Shadcn:** Card sections + DataTable, Badge (COA-required, Import, tolerance), Button, Popover + Command (filter).
- **Acceptance criteria:** (1) GRN action is hard-blocked on a regulated item until its COA is recorded (the quality-gate rule, shown as a disabled "Raise GRN" with reason); (2) Import rows surface inbound tracking and customs-doc status, Local rows do not (`purchaseType`-driven); (3) raising a GRN advances the requisition stage via `moveStage` only when the block's mandatory fields are filled (A2); (4) over-tolerance receipts surface a badge (the qty-tolerance rule amends the PO before GRN, shown inline).
- **Tags:** [S2.4 | AB + RA + storyboard 6]

### S00.7 Quality Home: Inspection and CAPA (archetype: queue / per-role landing)
- **Route:** `/` for the Quality persona (aliases `/quality`).
- **Roles:** Quality (act).
- **Realizes:** the Quality "first 30 seconds": lots awaiting inspection and open NCRs/CAPAs.
- **Purpose:** show what needs inspecting and which non-conformances are open.
- **Data shown:** two sections. (a) Lots awaiting inspection: GRN/lot reference, item `description`, supplier `name`, COA-on-file flag. (b) Open NCRs/CAPAs: `NCR.status` (RAISED/DISPOSITIONED/IN_CAPA), supplier `name`, age; the affected supplier's consecutive-below streak and `avlGrade` trend so the QA sees the supplier trending toward SUSPENDED.
- **Primary actions:** "Record inspection" (perm `qc.inspect`); "Pass" / "Reject" (perm `qc.approve` / `qc.reject`); "Raise NCR" (ncrLifecycle initial RAISED; perm `ncr.raise`); "Disposition" (`disposition`, RAISED -> DISPOSITIONED; perm `capa.manage`/Quality); "Close CAPA" (`closeCapa`, IN_CAPA -> CLOSED, effect feeds supplier re-evaluation and may SUSPEND the supplier, A11; perm `capa.manage`); "Suspend supplier" (supplierLifecycle ONBOARDED -> SUSPENDED on a quality stop; perm `suppliers.suspend` conditional Quality).
- **Secondary actions / navigation:** filter by supplier/status/age; link to the supplier record and scorecard.
- **States to design:** empty, loading, populated, permission-denied.
- **Shadcn:** Card sections + DataTable, Badge (NCR status, AVL grade trend, COA-on-file), Button, workbench link (flow 11), Popover + Command (filter).
- **Acceptance criteria:** (1) only legal NCR transitions render per `NCR.status` (no Close on a RAISED NCR; Disposition only on RAISED); (2) closing a CAPA feeds supplier re-evaluation and can trip the supplier to SUSPENDED (A11), shown as a confirm dialog noting the consequence; (3) Quality's `suppliers.suspend` is the quality-stop path only (the conditional cell), distinct from compliance/admin suspend; (4) the AVL grade trend and consecutive-below streak render so the suspension is a visible trajectory, not a surprise.
- **Tags:** [S4 | ISO 8.6/8.7/10.2 | build-new + storyboard 6]

### S00.8 Finance-Maker Home: Invoices and Payment Schedule (archetype: queue / per-role landing)
- **Route:** `/` for the Finance-Maker persona (aliases `/finance/maker`).
- **Roles:** Finance-Maker (act).
- **Realizes:** the Finance-Maker "first 30 seconds": invoices to match and the payment schedule due.
- **Purpose:** show captured invoices needing a match and installments due to prepare.
- **Data shown:** two sections. (a) Invoices to match: invoice number, supplier `name`, PO number, `MatchResult.matchStatus` (UNMATCHED/EXCEPTION), exception type on EXCEPTION rows (price-variance, duplicate-invoice, tax-mismatch, missing-GR); a held badge on a duplicate-invoice (supplier + invoiceNo + amount). (b) Payment schedule due: `Installment.status` (PENDING/APPROVED/PARTIAL_APPROVAL), agreed amount, due date, overdue flag.
- **Primary actions:** "Run match" (`runMatch`, UNMATCHED -> MATCHED or EXCEPTION per tolerance incl. tax, A8; perm `match.run`); "Resolve exception" (price exceptions handled by buyer, qty by receiving, tax by compliance; Finance-Maker can reject, EXCEPTION -> REJECTED; perm `match.resolveException`); "Approve installment" (`approve`, PENDING -> APPROVED if amount==agreed, or -> PARTIAL_APPROVAL if amount<agreed creating one remainder, A9; perm payments.schedules.approve as the maker step is the prepare/process role, so Finance-Maker holds `payments.schedules.process`); "Process payment" (`process`, APPROVED/PARTIAL_APPROVAL -> PROCESSED; perm `payments.schedules.process`; maker != checker, A6).
- **Secondary actions / navigation:** filter by exception type, due date, supplier; link to the match workbench (flow 09) and payment detail (flow 10).
- **States to design:** empty, loading, populated, held (duplicate-invoice hold banner), permission-denied.
- **Shadcn:** Card sections + DataTable, Badge (match status, exception type, duplicate-hold, overdue), Button, Toast, workbench link.
- **Acceptance criteria:** (1) a duplicate-invoice (supplier + invoiceNo + amount) shows a hold banner and cannot be matched until resolved (A8 duplicate path); (2) "Process" is disabled for the Finance-Checker and any user who is the checker on that payment (maker != checker, A6); (3) a partial installment approval creates exactly one remainder installment (A9), shown as a new PENDING row; (4) "Process" is hidden on PROCESSED installments (terminal); (5) match type shows three-way iff a GRN exists else two-way (A8).
- **Tags:** [S2.7 | build-new + AB + storyboard 6]

### S00.9 Finance-Checker Home: Payments Awaiting Release (archetype: queue / per-role landing)
- **Route:** `/` for the Finance-Checker persona (aliases `/finance/checker`).
- **Roles:** Finance-Checker (act).
- **Realizes:** the Finance-Checker "first 30 seconds": payments the maker prepared, awaiting release.
- **Purpose:** the checker's release queue, enforcing maker != checker.
- **Data shown:** prepared payments/installments: payment reference, supplier `name`, amount (`totalAmountInBase`), the maker who prepared it (`User.name`), `Installment.status`, due date. A reschedule section lists installments the checker may reschedule with a reason.
- **Primary actions:** "Release payment" (the checker release step; perm `payments.schedules.approve` (checker)); "Reschedule" (`reschedule`, PENDING -> RESCHEDULED, first reschedule captures originalDate; perm `payments.schedules.reschedule` (checker)). Release is the second-person control; the record must have been prepared by a different user (maker != checker, A6).
- **Secondary actions / navigation:** filter by amount/due date/maker; link to payment detail (flow 10).
- **States to design:** empty, loading, populated, blocked (a payment where the checker is also the maker is shown disabled with reason), permission-denied.
- **Shadcn:** Card + DataTable, Badge (status, maker name, overdue), Button, Dialog (release confirm), Toast.
- **Acceptance criteria:** (1) the release action is disabled with reason "Maker and checker must differ" on any payment this user prepared (A6 maker != checker); (2) the maker who prepared each payment is shown so the segregation is visible, not implicit; (3) the first reschedule captures originalDate (A9 reschedule guard); (4) only payments in a releasable state appear; PROCESSED payments do not show a release action.
- **Tags:** [S2.7 | SOX/COSO + ISO 37001 | RA + storyboard 6]

### S00.10 Management Home: KPI Dashboard (archetype: dashboard / hero landing)
- **Route:** `/` for the Management persona (aliases `/dashboard`).
- **Roles:** Management (view-all in scope, act on final-stage approvals).
- **Realizes:** the Management "first 30 seconds": the scorecard, spend, and KPI payoff; the terminal approval stage.
- **Purpose:** visibility as a byproduct (the loop closing visually), plus the terminal Management approval action.
- **Data shown:** KPI tiles and charts: spend by category, supplier scorecard summary (`SupplierScorecard.composite`, `grade`, `avlStatus`; an AVL grade dropped after an NCR is visible), OTIF (two-factor) and perfect-order (four-factor) shown distinctly, savings vs last-purchase baseline, requisition-to-PO cycle time, budget commitment vs actual (`Budget.committedAmount` vs `actualAmount` vs `availableAmount`). A "final approvals" tile lists records at the MANAGEMENT stage awaiting this manager (`ApprovalStageCompletion.stage==MANAGEMENT`, `completionStatus==AWAITING_APPROVAL`).
- **Primary actions:** "Approve" on a final-stage record (`approve`, AWAITING_APPROVAL -> APPROVED, the terminal Management vertical; perm `approval.approve` (final); SoD A6). Frequently exercised by approving the final payment installment release. No other state change from this dashboard.
- **Secondary actions / navigation:** date-range and category filters; drill into a supplier scorecard (flow 12), a budget (S-Budget below), or a record detail.
- **States to design:** loading (tile skeletons), populated, empty (a fresh tenant shows zeroed tiles, never a blank page), permission-denied.
- **Shadcn:** Card KPI tiles, Recharts (spend, OTIF, perfect-order, commitment-vs-actual), Tabs, Badge (AVL grade, trend arrows), Button (final approve), Dialog (approve confirm).
- **Acceptance criteria:** (1) OTIF (two-factor) and perfect-order (four-factor) render as distinct metrics, not conflated; (2) a supplier whose AVL grade dropped after an NCR shows the lowered grade with a trend indicator (the CAPA-to-AVL loop visible); (3) commitment vs actual reconciles against `Budget` (committed + actual + available against amount); (4) the Management approve action is terminal (MANAGEMENT never auto-approves) and SoD-gated (A6); (5) a fresh tenant shows zeroed tiles, never a blank canvas.
- **Tags:** [OE1/S2.7 | KPIs + RA + storyboard 6]

### S00.11 Budget Owner Home: Budgets and Overrides (archetype: dashboard / hero landing with KPI tiles)
- **Route:** `/` for the Budget Owner persona (aliases `/budgets`).
- **Roles:** Budget Owner (own cost-center, act on the budget stage and overrides). This is the e02 budget view as the Budget Owner landing.
- **Realizes:** the Budget Owner "first 30 seconds": budgets (available/committed/actual) for owned cost-centers and over-budget overrides to action.
- **Purpose:** show fund health per owned cost-center and surface the override decisions waiting on this owner.
- **Data shown:** KPI tiles per owned cost-center (`Project.managerId == current user`): `Budget.amount`, `availableAmount`, `committedAmount`, `actualAmount`, utilization %, period (`Budget.period`). An "overrides to action" section lists requisitions at the BUDGET stage where `totalAmountInBase > Budget.availableAmount` awaiting this owner's decision; each row shows the projected available-after-commit (`availableAmount - totalAmountInBase`). All amounts in base currency (A12).
- **Primary actions:** on an override row, "Approve budget" (`approve` the BUDGET completion, AWAITING_APPROVAL -> APPROVED; perm `budget.approve`), "Approve override" (sets `budgetOverride` = {approvedBy, reason (mandatory), at}, then APPROVED; mandatory `overrideReason` when over budget; perm `budget.approve`), "Return for revision" (`returnForRevision`, AWAITING_APPROVAL -> IN_PROGRESS, mandatory `returnNote`; perm `approval.reject`). Detailed in S03.3.
- **Secondary actions / navigation:** filter by cost-center/period; drill into a budget's commitment ledger (e02); link to the requisition under review.
- **States to design:** empty ("No budgets assigned to you."), loading, populated, permission-denied.
- **Shadcn:** Card KPI tiles (one per cost-center with available/committed/actual bars), Recharts (utilization), DataTable (overrides to action), Badge (over-budget red), Dialog/Sheet (the override decision, S03.3), Button, Textarea (override reason / return note), Toast.
- **Acceptance criteria:** (1) tiles show only cost-centers this user owns (`Project.managerId`), proving cost-center scope; (2) the soft budget check is warn-only at requisition, so an over-budget requisition still routes and appears here for the owner's decision, never silently blocked (A4); (3) "Approve override" requires a non-empty reason and writes `budgetOverride` with approver + reason + at (the logged exception, never a silent bypass, A4); (4) all figures are base-currency normalized (A12); (5) the hard commit is not here; this is the soft check (the encumbrance happens at PO issue).
- **Tags:** [OE11 | build-new + AB over-budget override + storyboard 6]

### S00.12 Administrator Home: Configuration Hub (archetype: dashboard / navigation landing)
- **Route:** `/` for the Administrator persona (aliases `/admin`).
- **Roles:** Administrator (super-admin `all`).
- **Realizes:** the Administrator "first 30 seconds": entry to masters, roles, approval chains, and field config; configuration-completeness status.
- **Purpose:** the admin's launch pad and a readiness indicator that transactions are enabled.
- **Data shown:** configuration-completeness tiles reflecting the completion gate: base currency set (`Currency.isBase`), at least one routing rule per active department/stage, at least one budget per active cost-center for the current period, field config loaded, at least one user per required approval stage. Each tile is green (satisfied) or amber (missing, with the gap named). Counts of masters (suppliers, items, UoM, currencies, tax codes, payment terms, projects, categories, warehouses), users, roles, routing rules, field configs.
- **Primary actions:** navigate to S01.1 (master data), S01.2 (RBAC/roles), S01.3 (approval chain/routing rules), S01.4 (field config). Configuration screens are in `01-configuration.md`. No state transition from the hub itself.
- **Secondary actions / navigation:** view audit log (perm `audit.view`); jump to any master.
- **States to design:** loading, populated (gate satisfied, transactions enabled), incomplete (one or more gate tiles amber, with the named gap blocks enabling transactions), permission-denied (a non-admin reaching `/admin`).
- **Shadcn:** Card tiles (completeness + counts), Badge (green satisfied / amber missing), Button (navigate to each config screen), Alert (the completion-gate blocker when incomplete).
- **Acceptance criteria:** (1) the completeness tiles mirror the configuration completion gate exactly (base currency, routing rule per active dept/stage, budget per active cost-center for the period, field config loaded, a user per required approval stage); (2) when any gate is unmet, an Alert names the specific missing item and states that transactions are not yet enabled; (3) the hub renders only for a holder of `all` (or the seeded SystemAdmin role); a non-admin gets the permission-denied panel; (4) the master counts reflect seeded data so the hub is never an empty page.
- **Tags:** [OE2/OE4/OE5/OE11 | configuration model + storyboard 6]

### Landings coverage map (storyboard section 6)
- Requester -> S00.2 (= S02.1). Approver -> S00.3 (= S03.1). Buyer -> S00.4. Supplier (portal) -> S00.5. Receiving -> S00.6. Quality -> S00.7. Finance-Maker -> S00.8. Finance-Checker -> S00.9. Management -> S00.10. Budget Owner -> S00.11 (= e02 view). Administrator -> S00.12.
- Engineering and Tax/Compliance are not separate storyboard-6 landings; they reach their work through the relevant flow queues (Engineering via the spares path in S00.6/S00.7; Tax/Compliance via the match-exception and customs paths in S00.8) per the permission matrix conditional cells.
