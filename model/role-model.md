# Generic Role Model

The company-neutral role set for the unified model, with every Al Bahja (AB) and Raphe (RA) role mapped onto it so none is dropped. Roles map to SCOR actors (OE5 Human Resources) and drive the role-by-permission matrix (Phase C). Source: `coverage-matrix.md` section A, `best-of-decisions.md`.

## The generic roles

### 1. Requester (Req Department)
Raises requisitions, supplies requirement detail, tracks own requests, reworks on rejection.
- Absorbs: AB department requesters (the 8-9: Barka Store, Barka Engineering, Oman Hygienic Stores/Engineering, Markaz Al Bahja, Oman Solar, Accommodation Maintenance, Flavor Division, Photon-01); RA REQ_DEPARTMENT vertical (assignee pinned to requester).
- Scope: sees only own / own-department requisitions and history.

### 2. Approver (configurable, multi-stage)
Acts on an approval queue for the stage(s) they own. The approval chain is configurable per department/category/value (see approval engine); a tenant can configure one approver for everything (AB style) or a multi-stage chain with auto-approval (RA style).
- Absorbs: AB Factory Manager (site-conditional first stage) + AB Purchase Head / Himanshu (final commercial approver); RA vertical approvers across PROCUREMENT/FINANCE/MANAGEMENT approval steps.
- Note: this is a role a user holds AT a stage; the same human can be approver at multiple stages subject to designation rank.

### 3. Procurement / Buyer (Handler)
Sources suppliers, runs RFQ, compares quotes, issues POs, drives the ticket through stages. Owns the buy-side.
- Absorbs: AB procurement handlers (import handler, local credit/PO handler, and the cash handler as a sub-role); RA PROCUREMENT vertical assignee.
- Sub-roles (config): Import buyer, Local buyer, Cash buyer (drives the cash-float branch).

### 4. Finance - Maker
Prepares payments, builds the payment schedule, processes installments, uploads receipts.
- Absorbs: AB Accounts (payment preparer); RA Accounts-Maker.

### 5. Finance - Checker (Chief Accountant)
Reviews and approves prepared payments before release; segregation of duties from the maker (financial control per SOX/COSO internal-control and ISO 37001 anti-bribery; NOT ISO 9001 8.4, which is supplier control). A different person from the maker.
- Absorbs: AB Chief Accountant; RA Chief Accountant (Checker).

### 6. Management (final approval)
Terminal approval vertical; frequently approves through payment-installment actions; final gate before completion.
- Absorbs: RA MANAGEMENT vertical. (AB folded final commercial approval into Purchase Head; in the generic model that is Approver-final, with Management as the terminal vertical where a separate top approval is configured.)

### 7. Supplier / Vendor
Onboards (completes profile/qualification), responds to RFQs, acknowledges POs, ships, submits invoices, handles returns. External actor accessing via authenticated forms (email + OTP).
- Absorbs: AB suppliers + freight forwarders (forwarder modeled as a supplier type with inbound-transport role); RA Supplier/Vendor.

### 8. Receiving / Warehouse / Stores
Receives goods against orders, records partial-delivery blocks/GRN, routes materials to QC.
- Absorbs: AB stores (Barka for Oman Chemical/Agro; Vadi Kabir for Oman Hygienic); RA Receiving.

### 9. Quality (QC)
Inspects incoming materials, reviews COA/MSDS, approves or rejects (the GRN gate), logs non-conformance, drives CAPA with the supplier. First-class role (Al Bahja depth; blueprint omitted it).
- Absorbs: AB QA/QC department; RA inspection-within-GRN (promoted to a role).

### 10. Engineering (spares/services receipt)
Receives spares and engineering items directly (no stores, no QC, no GRN), closes the requisition with "received as per order"; gives completion green-signal for service contracts. A receiving variant.
- Absorbs: AB Engineering department.

### 11. Administrator (System Admin)
Configures master data, roles, RBAC, the approval chain, routing rules, field config, before transactions flow.
- Absorbs: RA System Admin; AB master-data/setup function.

### 12. Platform / System (automated)
Performs automated steps: validation, reference resolution, currency conversion, routing, auto-approval, identifier generation, audit logging, notifications, real-time (SSE) broadcast, derived-status computation, scorecard/KPI computation.
- Absorbs: RA System lane; AB system-generated email/identifier behaviour.

### 13. Budget Owner (Cost-Center Owner) [added after senior-practitioner review]
Owns a cost-center or project budget; their approval is the BUDGET gate (distinct from commercial approval). Budget check at requisition; hard commit (encumbrance) at PO issue runs against this owner's budget. Can be configured as a dedicated approval stage or a configurable approval participant, but the role must exist because approval limits are not budget control.
- Absorbs: implicit in both companies (department heads). Made explicit because the model now has budget/commitment accounting.

### 14. Tax / Compliance Reviewer [added after senior-practitioner review]
Owns tax determination (GST/VAT/withholding/reverse-charge), customs/duty determination, and trade-compliance sign-off. Distinct from the customs/clearing agent (who executes clearance); this role determines tax treatment and compliance.
- Absorbs: implicit in AB customs/import handling; made explicit because the model now has tax/withholding and import scope.

### 15. Inventory Manager / Stores Planning [added for G7 gap-closure]
Owns stock visibility, reorder planning, and inventory ledger accuracy. Distinct from Receiving (which executes physical inbound/GRN); this role monitors stock balances and decides when and how much to replenish.
- Responsibilities: monitors the reorder worklist (items at or below reorderPoint); reviews stock-on-hand, lead time, primary supplier, and suggested quantity; raises replenishment requisitions from the worklist (one-click; the requisition is pre-filled with suggestedQty = maxStock - available); maintains Item reorder parameters (reorderPoint, safetyStock, minStock, maxStock); reviews and corrects stock movements via ADJUSTMENT entries; posts TRANSFER movements for inter-warehouse moves.
- Absorbs: stores planning function implicit in both companies; made explicit because the model now has an inventory ledger and reorder-point replenishment.
- Note: the Inventory Manager reviews and submits every replenishment requisition; the platform pre-fills but the human approves before the requisition enters the approval chain (axiom A21, human-in-the-loop rule).

### Deliberately folded roles (noted, not split, for prototype scope)
Category Manager and Contract Manager are consciously FOLDED into Procurement/Buyer for the prototype. This is a deliberate scoping choice, not an omission. An enterprise running formal category management or a dedicated contract-management office would split these out; the model supports doing so (they would become Procurement sub-roles or stages). Stated explicitly so the fold is visible.
Internal Audit is intentionally NOT a role: it is served by the immutable audit log + RBAC read access (the correct approach).

## Configurable approval participants (not standalone roles)

These are specialist reviewers inserted into the configurable approval chain for specific categories, not separate top-level roles:
- Marketing reviewer (artwork approval for new own-brand artwork) - AB.
- Arabic translator / language reviewer (Arabic text on artwork; generalized to a "language/regulatory text reviewer") - AB.
- Customs / clearing agent (Bayan, clearance, duty) - AB; participates in the inbound-logistics layer rather than the approval chain.

## Field Visibility (GMP separation of duties) [added for G3 gap-closure]

Field-level visibility is a structural control distinct from the action permission model. Certain fields on commercial entities are hidden from the Quality role on both the server (stripped from response payloads) and the client (omitted from form renders and table columns), regardless of which screen or action the Quality user is on. This is axiom A17.

**Fields denied to Quality (role id: `quality`):**
- RFQ: `internalTargetPrice`
- Quotation: `price`, `paymentTerms`, `dieCylinderCharges`, `documentationCharges`
- PurchaseOrder: `agreedPrice`, `poValue`, `poValueInBase`, `exchangeRate`, `paymentTerms`
- POLine: `agreedPrice`, `taxAmount`, `lineValue`
- Invoice: `invoiceAmount`, `taxAmount`, `paymentTerms`, `netPayable`
- LandedCost: all price components (freight, insurance, duty, misc; the ranked comparison figure)

**Implementation note:** the runtime user record carries `role` (the role identifier string). The field-visibility filter is a server-side serialization concern and a client-side render guard. The rule is applied based on that `role` value. No separate `roleId` field is used; the `role` field on the user object is the authoritative identifier.

**Rationale:** Quality personnel inspect and certify goods against technical specifications; they have no business need for commercial terms, pricing, or payment schedules. Exposing these would violate GMP separation-of-duties and could create inappropriate commercial influence on quality decisions.

## Segregation-of-duties (SoD) ruleset [added after senior-practitioner review]

The model has the roles to enforce these classic P2P controls; they are now stated explicitly as constraints the configurable engine must honour:
1. **Buyer != PO approver.** The user who raises/issues a PO cannot approve it.
2. **Receiver != invoice approver.** The user who records goods receipt cannot approve the matching invoice (the three-way-match SoD).
3. **Maker != checker on payment.** Finance-Maker who prepares a payment cannot be the Finance-Checker who approves its release (already in the model; restated as a binding SoD rule).
4. **Requester != sole approver of own requisition** (bounded self-approval). The note that "the same human can be approver at multiple stages subject to designation rank" is bounded so it never permits a user to approve their own request or their own PO. Auto-approval within configured thresholds is the only no-second-person path, and it is logged.
These SoD rules are configurable but ON by default; relaxing any is an admin decision recorded in the audit log.

## Verification: no source role dropped

| Source role | Generic mapping |
| --- | --- |
| AB department requesters (x8-9) | Requester |
| AB Factory Manager | Approver (site-conditional stage) |
| AB Purchase Head (Himanshu) | Approver (final) / Management |
| AB procurement handlers (import/local/cash) | Procurement/Buyer (+ Cash sub-role) |
| AB QA/QC | Quality |
| AB Engineering | Engineering (receiving variant) |
| AB stores (Barka/Vadi Kabir) | Receiving/Warehouse |
| AB Accounts / Chief Accountant | Finance-Maker / Finance-Checker |
| AB Marketing | Approval participant (artwork) |
| AB Arabic translator | Approval participant (language reviewer) |
| AB customs/clearing agent | Inbound-logistics participant |
| AB suppliers / freight forwarders | Supplier/Vendor (forwarder = supplier type) |
| RA REQ_DEPARTMENT | Requester |
| RA PROCUREMENT vertical | Procurement/Buyer |
| RA FINANCE vertical | Approver (finance stage) + Finance-Maker/Checker |
| RA MANAGEMENT vertical | Management |
| RA Accounts-Maker / Chief-Accountant | Finance-Maker / Finance-Checker |
| RA Supplier | Supplier/Vendor |
| RA Receiving | Receiving/Warehouse |
| RA System Admin | Administrator |
| RA System | Platform/System |
| (implicit dept heads, both) | Budget Owner (made explicit post-review) |
| (implicit tax/import, AB) | Tax/Compliance Reviewer (made explicit post-review) |
| (implicit stores planning, both) | Inventory Manager / Stores Planning (made explicit for G7 gap-closure) |

Every distinct source role maps to exactly one generic role (or a configurable participant). No role dropped. Two roles (Budget Owner, Tax/Compliance Reviewer) were implicit in both companies and made explicit after the senior-practitioner review; one additional role (Inventory Manager / Stores Planning) was made explicit after the G7 gap-closure because the model now carries an inventory ledger and reorder-point replenishment. Total generic roles: 15 + configurable participants.

Parent: [[scor-procurement-map]]. Drives: role-permission-matrix (Phase C). Source roles: [[albahja-overview]], [[raphe-auth-rbac]].
