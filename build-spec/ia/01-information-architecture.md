# Information Architecture and App Shell

The navigation model, route map, and application shell for the prototype. Baseline: Raphe `navbar-chrome` ([[raphe-ui-ux-reference]]) restyled in shadcn and neutralized (no Ramco/mPhibr/aerospace, our 14-role model instead of Raphe verticals). Nav visibility is derived from the permission matrix (`permission-matrix.json` / `nav-config.json`), not hand-authored. Consumes `model/role-permission-matrix.md`, `model/role-model.md`, `build-spec/screens/00-shell-and-landings.md`.

## App shell

A persistent shell wraps every authenticated internal screen (the supplier portal is a separate, simpler shell - see section 5).

- **Layout:** left sidebar (collapsible) + top bar + content area. (Raphe used a topbar nav row; for a 16-module internal app a left sidebar reads better at enterprise scale - this is the one deliberate deviation from the Raphe topbar, justified by module count. Keep Raphe's gating + dropdown-group logic.)
- **Sidebar:** the role's visible nav modules (from `nav-config.json`), grouped: Work (Dashboard, Requisitions, Approvals), Procure (Sourcing, Purchase Orders, Deliveries, Invoices, Payments, Cashflow, Returns), Master Data (Suppliers, Items), Insight (Analytics, Budgets, Quality), Admin (Administration). A group renders only if the role has >=1 visible module in it (Raphe rule: empty groups dropped, so links never dead-end at Unauthorized). Active item highlighted; collapsible to icons.
- **Top bar:** breadcrumb/title (left); global search / Command palette (Cmd+K, entity search - tickets/suppliers/items/POs); notifications bell (badge count); the demo role-switcher (section 4); profile dropdown (name, designation, department; Help; Logout). Search hidden in admin context (Raphe rule).
- **Auth bootstrap:** on load, resolve the current user (id, name, role, permissions, department) and show a GlobalLoading state until resolved; no authenticated screen renders without a user (Raphe `AuthProvider` pattern). For the prototype this reads the mock user (task #9), not a real session.
- **Home redirect (`/`):** role-aware landing (see section 3). Finance roles -> /cashflow or /payments; Management -> /analytics/dashboard; others -> their primary queue. (Raphe home-by-vertical pattern.)
- **Cross-cutting UI:** Toaster (sonner) for action feedback + simulated real-time events (the mock SSE bus, task #9); a global Unauthorized view when a route gate fails.

## Route map (internal app)

Grouped by module. `:id` is a record id. List -> detail -> form/modal per the screen inventory.

- `/` (home redirect by role)
- `/login`, `/unauthorized`
- `/dashboard` (role-aware home dashboard)
- `/requisitions`, `/requisitions/new`, `/requisitions/:id`, `/requisitions/:id/edit`
- `/approvals` (approval queue), `/approvals/:id` (acts on the underlying requisition)
- `/sourcing` (pipeline), `/sourcing/rfq/new`, `/sourcing/rfq/:id`, `/sourcing/rfq/:id/compare` (the landed-cost workbench), `/sourcing/award/:id`
- `/purchase-orders`, `/purchase-orders/new`, `/purchase-orders/:id`
- `/suppliers`, `/suppliers/new`, `/suppliers/:id/edit`
- `/items`, `/items/new`, `/items/:id/edit`
- `/deliveries` (inbound + GRN), `/deliveries/:ticketId/receive`, `/quality` (inspection queue + NCR/CAPA), `/quality/ncr/:id`
- `/invoices` (capture + match list), `/invoices/:id` (match workbench)
- `/payments` (schedule + maker), `/payments/release` (checker queue), `/cashflow` (the two-pane payments view)
- `/returns`, `/returns/:id` (RMA flow)
- `/budgets` (commitment vs actual)
- `/analytics`, `/analytics/dashboard`, `/analytics/payments`, `/analytics/deliveries`, `/analytics/scorecard/:supplierId`, `/analytics/spend`
- `/admin` (redirect), `/admin/users`, `/admin/projects`, `/admin/fields`, `/admin/routing-rules`, `/admin/masters/:entity` (currency/uom/segments/pay-terms/supplier-groups/warehouses/asset-proposals/tax-codes)
- `/help`

Master-data list/create/edit + bulk import follow the shared list/form/import pattern (Raphe). Filter/tab/pagination state lives in URL search params (Raphe: shareable, survives back/forward).

## RBAC enforcement (3 levels, Raphe model)
1. **Nav gate:** a module shows only if the role holds >=1 non-`-` permission in its group (`nav-config.json`).
2. **Route/page gate:** a `RoleWrapper`-equivalent on each route; failure renders the Unauthorized view (page guard).
3. **Control gate:** `useCan(permission)` hides/disables individual buttons; conditional (C) cells carry the SoD condition (never approve own; maker != checker; receiver != invoice approver).

See `02-rbac-and-nav.md` for the resolver and the generated config.

## The 13 internal roles vs the supplier
The sidebar/nav above serves the 13 internal roles. The Supplier is an EXTERNAL role and does not use this shell - it gets the supplier portal (section 5 + screens/supplier-portal). The generated nav-config includes a `supplier` entry for completeness, but in the app the supplier is routed to the portal, not the internal sidebar.

## 5. Supplier portal shell (separate, minimal)
A lightweight external shell: top bar (logo, the supplier's company name, logout) + a simple nav (Open RFQs, Purchase Orders, Invoices, Returns) + content. Email+OTP login (Raphe `login`). Scoped strictly to the supplier's own records. No internal sidebar, no admin, no cross-supplier data. Routes: `/portal`, `/portal/rfq/:id`, `/portal/po/:id`, `/portal/invoice/new`, `/portal/return/:id`.
