# RBAC Resolver and Per-Role Navigation

How the prototype gates nav, routes, and controls per role, and the demo role-switcher. All generated from the permission matrix so it cannot drift from the model.

## Generated artifacts (do not hand-edit; regenerate from the matrix)
- **`permission-matrix.json`** - the role x permission-group matrix as data (13 roles, 42 permission groups, each cell G/C/-). Generated from `model/role-permission-matrix.md`.
- **`nav-config.json`** - the 16 nav modules + which modules each role sees (a role sees a module if it holds any non-`-` permission in that module's representative group). Generated.
- **`rbac.ts`** - the resolver: `useCan(user, group)` (hard show/enable; C counts as true), `canWithCondition(user, group, ctx)` (evaluates the SoD conditions for C cells - never approve own, receiver != invoice approver, maker != checker, designation rank), `navForRole(roleId)`, `levelFor`, `isInternalRole`.

## Per-role nav visibility (from the generated config)
- requester (5): Dashboard, Requisitions, Purchase Orders, Budgets, Analytics
- approver (7): Dashboard, Requisitions, Approvals, Sourcing, Quality, Budgets, Analytics
- buyer (15): all procure + master data + analytics (the power user)
- finance_maker (7): Dashboard, Requisitions, Invoices, Payments, Cashflow, Budgets, Analytics
- finance_checker (7): same as maker (acts on the release queue)
- management (7): Dashboard, Requisitions, Approvals, Payments, Cashflow, Budgets, Analytics
- receiving (4): Requisitions, Deliveries, Invoices, Returns
- quality (7): Dashboard, Requisitions, Suppliers, Deliveries, Quality, Returns, Analytics
- engineering (6): Requisitions, Purchase Orders, Items, Deliveries, Quality, Returns
- budget_owner (4): Dashboard, Requisitions, Budgets, Analytics
- tax_compliance (5): Dashboard, Suppliers, Deliveries, Invoices, Analytics
- administrator (16): everything incl. Administration
- supplier: routed to the supplier PORTAL, not the internal sidebar (external role)

This distribution is the credibility signal: switching personas visibly changes the app (Receiving sees 4 modules, the Buyer 15, Admin all 16). It is derived, not curated, so it always matches the permission model.

## The three gates (Raphe model, [[raphe-ui-ux-reference]])
1. **Nav gate:** sidebar renders only `navForRole(user.roleId)`; a nav GROUP (Work/Procure/Master Data/Insight/Admin) is dropped if the role has no module in it.
2. **Route gate:** each route checks the relevant permission group; failure renders the Unauthorized view.
3. **Control gate:** every action button calls `useCan(user, group)` to show/enable; conditional actions call `canWithCondition(...)` with the SoD context. Buttons for illegal state transitions are also hidden (the state machines, `build-spec/schema/state-machines.ts`).

## SoD conditions enforced (axiom A6)
- Approver/Award: a user can never approve their own requisition or PO; must be the requested approver OR an assignee of sufficient designation rank.
- Invoice approve: the user who received the goods cannot approve the matching invoice.
- Payments release: the maker who prepared the payment cannot be the checker who releases it.
For the demo these are hard-coded on the hero path (the seed data stages distinct users), with the resolver enforcing them generally.

## Demo role-switcher
The top bar carries a role-switcher (a Select/Command listing the 13 internal personas + the supplier portal). Selecting a persona swaps `CurrentUser` (the prototype reads the mock user, task #9), which re-derives the sidebar, re-gates routes/controls, and re-points the home redirect. This is the device that makes the cross-role demo work: the presenter hops personas live to show the same requirement from each side. The seed (task #3) provides real named users per role so the switcher shows real names, and SoD demonstrates with distinct people.

## Regeneration
The matrix/nav JSON are generated from `model/role-permission-matrix.md` by the inline generator in the build-spec history (re-run if the matrix changes). `rbac.ts` is stable and consumes them. Verified: 13 roles, 42 groups, 16 modules, every role has a sensible non-empty nav set (except supplier -> portal).
