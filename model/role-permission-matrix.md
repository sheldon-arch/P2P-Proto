# Role-by-Permission Matrix

The permission namespace for the unified model and which generic role holds each. Generalized from Raphe's namespaced RBAC plus the actions Al Bahja and the build-new flows imply. Resolution = union of role + direct user grant + designation + business-unit permissions, plus a super-admin `all` grant (Raphe model, [[raphe-auth-rbac]]). Roles from `role-model.md`; actions from `data-model.md`. Conditional cells carry the condition; SoD rules (role-model SoD ruleset) override grants.

## Permission namespace

Format `resource.action`. Grouped by domain.

**Requisition:** requisition.create, requisition.view, requisition.edit, requisition.submit, requisition.cancel, requisition.viewAll
**Approval:** approval.requestApproval, approval.approve, approval.reject (return-for-revision), approval.reassign, approval.delegate, approval.configureChain, routingRules.update
**Budget:** budget.view, budget.manage, budget.approve (budget gate), commitment.view
**Sourcing/RFQ:** rfq.create, rfq.invite, rfq.view, quote.capture, quote.compare, supplier.select, award.approve, contract.manage
**Purchase order:** po.create, po.issue, po.edit, po.acknowledge (supplier), po.view, po.amend, framework.manage, calloff.release
**Supplier:** suppliers.create, suppliers.update, suppliers.view, suppliers.approve, suppliers.suspend, suppliers.offboard, suppliers.import, supplier.qualify, supplier.riskAssess
**Item:** items.create, items.update, items.view, item.approve, item.offboard, items.import
**Delivery/GRN:** delivery.record, grn.raise, grn.view, inbound.track
**Quality:** qc.inspect, qc.approve, qc.reject, ncr.raise, ncr.view, capa.manage
**Invoice/match:** invoice.capture, invoice.view, invoice.approve, match.run, match.resolveException, creditNote.manage, debitNote.manage
**Payments:** payments.schedules.view, payments.schedules.approve, payments.schedules.process, payments.schedules.reschedule, payments.advance.manage, payments.retention.manage, payments.cashFloat.manage, creditorLedger.view, payments.analytics.view
**Returns/RMA:** return.initiate, return.authorize, return.schedule, return.close, return.view
**Tax/compliance:** tax.determine, tax.view, compliance.review, customs.manage
**Inventory:** inventory.view, inventory.manage, reorder.raise (raise a requisition from the reorder worklist)
**Analytics:** analytics.view, scorecard.view, scorecard.configure, spend.view, forecast.manage, forecast.view
**Admin/platform:** users.create, users.view, roles.manage, masters.manage, fieldConfig.manage, audit.view, all (super-admin, isAdminOnly)

## The matrix

Cells: G = granted, C = conditional (condition noted), `-` = none. (Administrator implicitly holds masters/config/users; Platform/System is automated, not a user-permission holder.)

| Permission group | Requester | Approver | Buyer | Fin-Maker | Fin-Checker | Mgmt | Supplier | Receiving | Quality | Engineering | BudgetOwner | Tax/Compliance | InvManager | Admin |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Requisition create/edit/submit | G (own) | - | G | - | - | - | - | - | - | G (own) | - | - | G (reorder-origin) | G |
| Requisition view | G (own/dept) | G (in-chain) | G | G | G | G | - | G (own) | G (req only) | G (own) | G (cost-ctr) | - | G (own-raised) | G |
| Approval request/approve | - | C (requested approver or assignee >= designation; not own req/PO) | C (request only) | - | - | C (final) | - | - | - | - | - | - | - | G |
| Approval reject/reassign/delegate | - | G | C (reassign) | - | - | G | - | - | - | - | - | - | - | G |
| Approval configure chain / routingRules | - | - | - | - | - | - | - | - | - | - | - | - | - | G |
| Budget view | C (own req) | C | G | G | G | G | - | - | - | - | G (own ctr) | - | - | G |
| Budget manage/approve (gate) | - | C (if config'd as budget stage) | - | - | - | - | - | - | - | - | G | - | - | G |
| RFQ create/invite/view | - | - | G | - | - | - | C (respond only) | - | - | - | - | - | - | G |
| Quote capture | - | - | C (manual fallback) | - | - | - | G (own quote) | - | - | - | - | - | - | - |
| Quote compare / supplier select | - | C (review) | G | - | - | - | - | - | - | - | - | - | - | G |
| Award approve | - | C (if award stage) | C (recommend) | - | - | C | - | - | - | - | - | - | - | G |
| Contract / framework manage | - | - | G | - | - | - | - | - | - | - | - | - | - | G |
| PO create/issue/edit/amend | - | - | G (not approve own) | - | - | - | - | - | - | - | - | - | - | G |
| PO acknowledge | - | - | - | - | - | - | G (own PO) | - | - | - | - | - | - | - |
| Call-off release | G (against framework) | - | G | - | - | - | - | - | - | G | - | - | - | G |
| Suppliers create/update/import | - | - | G | - | - | - | C (own profile) | - | - | - | - | - | - | G |
| Suppliers approve/suspend/offboard | - | C (if supplier-approval stage) | C (recommend) | - | - | - | - | - | C (quality suspend) | - | - | C (compliance suspend) | - | G |
| Supplier qualify / riskAssess | - | - | G | - | - | - | - | - | C (quality criteria) | - | - | C (risk/compliance) | - | G |
| Items create/update/approve/import | - | - | G | - | - | - | - | - | - | C (eng items) | - | - | C (reorder params only) | G |
| Delivery record / GRN raise | - | - | - | - | - | - | - | G | C (after QC) | C (spares, no GRN) | - | - | - | G |
| Inbound track | - | - | G | - | - | - | C (update) | G | - | - | - | C (customs) | - | G |
| QC inspect/approve/reject | - | - | - | - | - | - | - | - | G | - | - | - | - | G |
| NCR raise/view | - | C (FM raise) | G (resolve) | - | - | - | - | - | G | C (eng raise) | - | - | - | G |
| CAPA manage | - | - | G (with supplier) | - | - | - | C (respond) | - | G | - | - | - | - | G |
| Invoice capture/view | - | - | C (assemble pkg) | G | G | - | C (submit) | - | - | - | - | - | - | G |
| Invoice approve | - | C (PO-head approve) | C (not if receiver) | - | - | - | - | - | - | - | - | - | - | G |
| Match run / resolve exception | - | - | C (price exceptions) | G | G | - | - | C (qty exceptions) | - | - | - | C (tax exceptions) | - | G |
| Credit/debit note manage | - | - | C | G | G | - | C (issue credit) | - | - | - | - | - | - | G |
| Payments schedule view | - | - | G | G | G | G | C (own) | - | - | - | - | - | - | G |
| Payments approve (release) | - | - | - | - | G (checker) | C (mgmt approve) | - | - | - | - | - | - | - | G |
| Payments prepare/process | - | - | - | G (maker; not checker) | - | - | - | - | - | - | - | - | - | G |
| Payments reschedule | - | - | - | C (with reason) | G | - | - | - | - | - | - | - | - | G |
| Advance / retention manage | - | - | C | G | G | - | - | - | - | - | - | - | - | G |
| Cash float manage | - | - | C (cash buyer) | C (reimburse) | C (approve) | - | - | - | - | - | - | - | - | G |
| Creditor ledger view | - | - | G | G | G | G | - | - | - | - | - | - | - | G |
| Return initiate/authorize/schedule/close | - | - | G (handle) | - | - | - | C (return goods) | C (receive return) | C (initiate on NCR) | C (initiate) | - | - | - | G |
| Tax determine / customs manage | - | - | C (enter) | C (enter) | - | - | - | - | - | - | - | G | - | G |
| Inventory view | - | - | - | - | - | - | - | G (own warehouse) | - | - | - | - | G | G |
| Inventory manage (balances, adjustments) | - | - | - | - | - | - | - | - | - | - | - | - | G | G |
| Reorder raise (raise requisition from worklist) | - | - | - | - | - | - | - | - | - | - | - | - | G | G |
| Analytics / scorecard / spend view | C (own) | G (in-scope) | G | G | G | G | C (own scorecard) | - | C (quality KPIs) | - | G (cost-ctr) | C (compliance) | C (inventory KPIs) | G |
| Scorecard configure / forecast manage | - | - | G (forecast) | - | - | - | - | - | - | - | - | - | - | G |
| Users / roles / masters / fieldConfig manage | - | - | - | - | - | - | - | - | - | - | - | - | - | G |
| Audit view | C (own) | C (in-scope) | G | G | G | G | - | - | G | - | - | G | G (own moves) | G |
| all (super-admin) | - | - | - | - | - | - | - | - | - | - | - | - | - | G |

## Notes
- Conditional approve/reject (Approver) carries the SoD condition: requested approver OR an assignee of sufficient designation rank, AND never the user's own requisition/PO (bounded self-approval). Auto-approval within configured thresholds is the only no-second-person path and is logged.
- Supplier-facing permissions (po.acknowledge, quote.capture, suppliers.update own profile, invoice.capture submit, return goods) are scoped to the supplier's own records, accessed via authenticated external forms (email + OTP).
- Suspend is split: Quality can suspend on a quality stop; Tax/Compliance on a sanctions/compliance hit; Admin always.
- **Quality field-level visibility (axiom A17):** the action matrix above governs what screens and actions Quality can access, but Quality is additionally denied commercial-field visibility at the field level (price, PO value, landed cost, payment terms, internalTargetPrice on RFQ/Quotation/PO/POLine/Invoice). This is enforced server-side (fields stripped from response payloads) and client-side (fields omitted from form renders and table columns). This is a structural access control separate from the action permission grants in the matrix above. See `model/role-model.md` Field Visibility section for the exact field list.
- **Inventory Manager permissions:** inventory.view, inventory.manage, and reorder.raise are the three inventory-specific permissions added for G7. The Inventory Manager also holds restricted items.update access scoped to reorder parameters only (reorderPoint, safetyStock, minStock, maxStock).
- Completeness: every action in the permission namespace appears as a matrix row; every generic role has a defined cell (G/C/-) for every row. No blank cells, no action without a permission.

Parent: [[role-model]]. Resolution model: [[raphe-auth-rbac]]. Drives the lane/permission detail in the Phase D diagrams.
