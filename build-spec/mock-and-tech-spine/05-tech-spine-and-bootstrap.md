# Tech Spine and Bootstrap

How the app starts and how the nine build-spec layers connect end to end. This is the wiring that turns the specs into a running prototype.

## Project structure (Next.js App Router)

```
app/
  (main)/                     # authenticated internal app (the shell, task #6)
    layout.tsx                # AppShell: sidebar (navForRole) + topbar (RoleSwitcher) + providers
    dashboard/                # per-role home (task #6 landings)
    requisitions/  approvals/  sourcing/  purchase-orders/
    deliveries/  inspections/  invoices/  payments/  cashflow/
    returns/  quality/  suppliers/  items/  budgets/  analytics/
    admin/                    # configuration (routing rules, fields, users, masters)
  (portal)/                   # supplier portal shell (separate, lighter)
  login/                      # fake login + role pick
lib/
  store/                      # in-memory store (01)
  services/                   # service contract + transitions (02, 03)
  state-machines/             # imported from build-spec/schema/state-machines.ts (02)
  mocks/                      # MSW handlers (04)
  events/                     # event bus + QueryEventBridge (04)
  copy/                       # the copy layer exports (task #7): enumLabels, fieldLabel, messages, emptyState
  rbac/                       # rbac.ts + permission-matrix.json + nav-config.json (task #6)
queries/                      # the TanStack hooks (04)
components/
  ui/                         # shadcn primitives (task #8 02-primitives)
  patterns/                   # archetypes + shared components (task #8 03, 04)
  fields/                     # FieldRenderer + the value-type controls (task #8 02)
schemas/                      # Zod schemas generated from build-spec/schema/types.ts (02)
seed/                         # the seed JSON imported into the store (task #3)
```

## Providers (the app shell wraps these, outermost to innermost)

1. `QueryClientProvider` (TanStack Query) with the QueryEventBridge mounted (subscribes the bus to invalidation).
2. `MSWProvider` / worker start (in the prototype build, the worker is always on; production-real swap removes it).
3. `StoreProvider` that loads the seed into the in-memory store on first mount (and from localStorage if persistence is on).
4. `SessionProvider` holding `CurrentUser` (the role-switcher's selection; defaults to a sensible persona) and UI prefs (density).
5. `Toaster` (sonner) for the toast layer.

No authenticated screen renders before the store + session resolve (a GlobalLoading splash, the Raphe auth-bootstrap pattern generalized: no real auth, but the same "user known before render" guarantee).

## CurrentUser and the role-switcher (the demo device)

- `SessionProvider` exposes `currentUser` and `setRole(roleId)`.
- The topbar `RoleSwitcher` (task #8) lists the 13 internal personas + the supplier portal, each backed by a real seeded user. Selecting one:
  - swaps `currentUser` to that seeded user,
  - the sidebar re-derives via `navForRole(user.roleId)` (task #6),
  - controls re-gate via `useCan`/`canWithCondition`,
  - the home route re-points to that role's landing,
  - in-flight queries refetch under the new ctx (the service reads the new currentUser).
- SoD demonstrates with distinct people because the seed stages different users per role (maker != checker, receiver != invoice approver).

## The end-to-end path (one click, traced through all layers)

A Buyer clicks "Issue PO" on the PO detail screen:
1. Screen (`../screens/05-purchase-order.md`) renders the button via `RbacGate` (task #6) + the legal-transition check (task #8); label "Issue PO" from `../copy/03`.
2. Click opens `ConfirmDialog` (task #8) with the confirmation body from `../copy/03` (`confirm.po.issue`).
3. Confirm calls `useTransitionPurchaseOrder().mutate({ id, action: 'issue', payload })` (04).
4. MSW intercepts `POST /api/purchaseOrder/:id/transition` (04) -> `service.purchaseOrder.transition` (02).
5. The transition engine (03): finds the `issue` transition, checks the guard (budget committed, supplier ONBOARDED, buyer != approver), sets status, runs the effect (`budgetService.commit`), appends audit, emits `po.issued`.
6. Store updated (01); the budget number moved.
7. Mutation success: invalidate keys + `toast.po.issued` (04, `../copy/03`).
8. QueryEventBridge sees `po.issued` -> invalidates the budget, requisition, and KPI keys (04); the budget dashboard, if open, recomputes.
9. Screen reflects the new PO status (StatusBadge, task #8, label from `../copy/01`).

Every layer is exercised by one click. That is the integration the nine artifacts were built for.

## What ships vs what is faked (recap of the nice-to-haves)

- Real: the store, the transitions + guards + effects, the RBAC gating, the copy layer, the seeded data, the deterministic reset, the event-driven re-query.
- Faked: auth (role-switcher instead), FX (static table + degradation toggle), document storage (filename stubs), analytics engine (precomputed seed values + action-driven recompute for the few live numbers), bulk-import parsing (canned result), real-time transport (client bus instead of a server SSE).

## Build sequence (the order to implement)

1. Tokens + primitives + the four state components + DataTable + FieldRenderer (task #8 build order step 1).
2. Store + service contract + transition engine + state machines (this layer 01-03): the data spine, testable headless.
3. MSW handlers + hooks + event bridge (04): the network + reactivity.
4. Shell + RBAC + role-switcher (task #6) and the shared components (task #8 step 2).
5. Screens (task #4) in golden-path order (the storyboard, task #5): requisition -> approval -> sourcing/landed-cost -> PO -> GRN/QC -> invoice/match -> payment -> scorecard/CAPA, then the rest.
6. Dashboards + the supplier portal + polish.

## Why this completes the readiness set (intent)

The first eight artifacts define what exists, how it is shaped, how it looks, what it says, and what it means. This ninth makes it move: a typed, seeded, guarded, reactive client that turns the model into a thing a presenter clicks through, where every action has a consequence the next screen shows, and where the same demo runs identically every time. With this, the prototype can be built without further definition work; the remaining effort is implementation against these specs.
