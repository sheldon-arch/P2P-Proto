# 01 Configuration and Master Data Setup (Administrator-led)

- **BPMN file:** 01-configuration.bpmn

## Scope, trigger, outcome

- **Scope:** Everything an Administrator configures before any transaction can run: the base/reporting currency and FX source; all master data (currencies, units of measure, warehouses, payment terms, projects/cost-centers, categories/segments, items, suppliers, tax codes) created individually or by bulk import; users, designations, business units; roles and the RBAC permission grants; the configurable approval chain and routing rules with per-approver limits and a default limit; budgets per cost-center and period; and the dynamic field configuration by stage, scope, and purchase type. This is the precondition diagram for the whole model; intake (diagram 02) cannot start until this completes.
- **Trigger:** A new tenant/organization is provisioned and an Administrator signs in. The Administrator is any user holding the super-admin `all` permission (isAdminOnly) or the seeded SystemAdmin role. Sign-in is by email OTP (6 numeric digits, expiry 600 seconds, 3 allowed attempts) or SSO (Microsoft/SAML/OIDC). Sign-up is disabled, so only pre-seeded users authenticate.
- **Outcome:** Masters exist and are validated; suppliers and items default to PENDING_ONBOARDING until separately approved; users, roles, designations, and business units are seeded; effective permissions resolve as a deduplicated union of four sources plus the super-admin short-circuit; the approval chain, routing rules, per-approver limits, and default limit are set; budgets per cost-center and period are funded; the dynamic field config is loaded. The system marks configuration complete and enables transactional flows. Without routing rules and budgets, downstream routing and commitment fail, so the completion gate prevents a half-configured tenant from accepting requisitions.

## Actors (lanes)

- **Administrator** (`L_admin`): configures masters, users, roles, the approval chain and routing rules, budgets, and the field config. Holds `masters.manage`, `users.create`, `roles.manage`, `approval.configureChain`, `routingRules.update`, `budget.manage`, `fieldConfig.manage`, and the super-admin `all`.
- **Platform / System** (`L_sys`): automated. Validates records, generates immutable codes, resolves references, runs the all-or-nothing bulk transaction, resolves effective permissions on each request, and gates configuration completeness. Emits audit log entries (category admin/master) and SSE events on committed changes.

Full role definitions are in `model/role-model.md`; permissions in `model/role-permission-matrix.md`; cross-cutting services in `model/platform-services.md`.

## Step-by-step narrative

Each step is tagged [SCOR code | ISO clause | source].

1. **Tenant provisioned, setup begins** (Administrator, start). A provisioned tenant and an authenticated Administrator. No requisition, PO, or payment can be created until masters, RBAC, the approval chain, routing rules, budgets, and the field config exist. [SCOR OE5 | ISO 7.5 | source: blueprint + raphe-auth-rbac]
2. **Set base/reporting currency and FX source** (Administrator). The first configuration act, because every threshold, comparison, and analytic computes in base currency. The base currency is chosen explicitly (no default, not hard-coded), the FX provider and refresh frequency are set, and per-PO rate override is enabled or disabled. [SCOR OE4 | source: platform-services FX 3.5]
3. **Create masters individually or bulk import?** (Administrator, exclusive gateway). Per master, the Administrator either hand-enters records or uploads a file. The choice is per master, not global. [SCOR OE4 | source: data-model master data + raphe-bulk-import]
4a. **Create master data individually** (Administrator). Form entry for each master with full field validation on save. [SCOR OE4 | ISO 7.5 | source: data-model + albahja-masters-and-fields + raphe-masters-and-data-model]
4b. **Upload bulk import file (CSV/XLSX) for a master** (Administrator). One file per master into the generic import pipeline. [SCOR OE4 | source: raphe-bulk-import + platform-services 7]
5. **Validate masters, generate codes, resolve references** (System). Individual creates are validated per record, codes generated, descriptions auto-populated, supplier/item status set to PENDING_ONBOARDING, persisted, audited. Bulk uploads are parsed, the header is validated exactly (no missing or extra columns, order-insensitive), rows are validated and foreign references resolved by natural key, and all row errors are accumulated rather than failing fast. [SCOR OE4 | ISO 7.5 | source: platform-services 7 + 2 + raphe-bulk-import]
6. **Bulk file: all rows valid?** (System, exclusive gateway). All-or-nothing. Evaluated only on the bulk branch. [SCOR OE4 | source: raphe-bulk-import + raphe-edge-cases e06]
7. **Reject import, report all row errors** (System). On any error the entire import is rejected with a row-numbered reason list; nothing is written; no audit emitted. [SCOR OE4 | source: raphe-bulk-import]
8. **Correct file and re-upload** (Administrator). The Administrator fixes the file per the reported reasons and re-uploads; the failed import left no partial state. [SCOR OE4 | source: raphe-bulk-import]
9. **Upsert masters in one transaction (all-or-nothing)** (System). One transaction upserts each row by natural key (match updates, else create with generated code). Commit-all or roll-back-all. Imported supplier/item records default to PENDING_ONBOARDING; the ERP-sync flag resets on update. Audit and SSE on success only. [SCOR OE4 | ISO 7.5 | source: raphe-bulk-import + platform-services 7]
10. **Create users, designations, business units** (Administrator). Seeds the people graph. Only seeded users can authenticate; user status is re-checked every request and an inactive account is forced to log out. [SCOR OE5 | source: raphe-auth-rbac + platform-services 10 + role-model]
11. **Define roles and assign permissions (RBAC)** (Administrator). Defines roles, grants namespaced permissions at four possible sources, seeds SystemAdmin (all) and User, and sets the SoD ruleset (on by default). [SCOR OE5 | source: role-permission-matrix + raphe-auth-rbac + role-model SoD]
12. **Resolve effective permissions (union plus super-admin)** (System). On each guarded request, effective permissions are the deduplicated union of role, user-grant, designation, and business-unit permissions, plus the super-admin `all` short-circuit. No caching, so a change applies on the next request. [SCOR OE5 | source: raphe-auth-rbac + role-permission-matrix]
13. **Configure approval chain and routing rules** (Administrator). Defines ordered stages, per-stage type and auto-approval enablement, site-conditional stages, routing rule entries per department and stage, per-approver limits, and the default limit. [SCOR OE2 | ISO 8.4 | source: platform-services 1 + raphe-routing-approval]
14. **Set budgets per cost-center and period** (Administrator or Budget Owner). Funds budgets so the soft check at requisition and the hard commit at PO have something to test against. [SCOR OE11 | source: data-model budget/commitment + platform-services 11]
15. **Configure dynamic fields (stage x scope x purchase type)** (Administrator). Defines the field config that drives intake and detail forms and the mandatory-field gate on stage progression. [SCOR OE2 | ISO 7.5 | source: platform-services 2 + raphe-stage-progression]
16. **Mark config complete, enable transactions** (System). Verifies the minimum viable config exists and enables transactional flows. [SCOR OE2/OE4/OE11 | source: blueprint + platform-services]
17. **Tenant configured, ready for intake** (System, end). [SCOR OE2/OE4 | source: build-new]

## Gateways and branches (exact conditions)

| Gateway | Branch | Exact expression | Target |
| --- | --- | --- | --- |
| Create masters individually or bulk import? | Individual | `importMode == 'INDIVIDUAL'` (form entry) | Create master data individually |
| Create masters individually or bulk import? | Bulk | `importMode == 'BULK'` (file uploaded) | Upload bulk import file |
| Bulk file: all rows valid? | Commit | `rowErrors.length == 0` | Upsert masters in one transaction |
| Bulk file: all rows valid? | Reject | `rowErrors.length > 0` | Reject import, report all row errors (then loop to re-upload) |

Notes: the individual-create path also passes through validation and the same commit; per-record validation rejects a single bad record with a 400 and writes nothing for that record, whereas the bulk path is all-or-nothing across the whole file. The mode choice is per master, so a single setup session can mix bulk-loaded suppliers and hand-entered tax codes.

## Fields and dropdowns (full detail)

### Base currency and FX (step 2)

| Field | Type | Mandatory | Default | Validation / values | Owner |
| --- | --- | --- | --- | --- | --- |
| baseCurrencyIsoCode | reference (ISO 4217) | Yes | none | one of {USD, OMR, SAR, AED, EUR, CHF, INR, ...}; not hard-coded; locked once transactions exist | Administrator |
| fxProvider | enum | Yes | Frankfurter | {Frankfurter, ManualOnly, other} | Administrator |
| fxRefreshFrequency | enum | Yes | Daily | {OnDemand, Daily, Hourly} | Administrator |
| allowPerPoRateOverride | boolean | No | true | true/false | Administrator |

### Master data created individually (step 4a)

- **Currency:** isoCode (3-letter, primary key, mandatory), name, symbol, isBase (boolean; exactly one currency true).
- **UoM:** uom (primary key, mandatory) from the UoM master (volume ltr/ml/gal/cu.m; weight gm/kg/ton; length mtr/mm/cm/inch/ft; area sq.ft/sq.m; quantity can/jar/bottle/sachet/pouch/tray/pallet/reel/coil/sheet/drum/cyld/tube/tin/bag/bdle/boxes/cartons/ctn/pkt/roll/nos/pc/pcs/pair/set/books; commercial lot/job/service); category dropdown {Volume, Weight, Length, Area, Quantity, Commercial}.
- **Warehouse:** code (primary key), name, site/store (for example Barka, Vadi Kabir).
- **PaymentTerms:** code (primary key), description, termType dropdown {100%Advance, PartAdvance+AgainstDocs, PartAdvance+AgainstShipment, 30/70, Net30, Net60, Net90, Custom}.
- **Project/CostCenter:** code (primary key), name, status dropdown {ACTIVE, INACTIVE} default ACTIVE (only ACTIVE selectable on a requisition).
- **Category/Segment:** composite key (classType + classCode + classDesc); the requisition category set is {Items, Spares, Services, ProductDesign}.
- **Item:** code (auto-generated by configurable pattern or RM/PM Excel code, immutable), description (auto-populated), stockUom (reference UoM), purchaseUom (reference UoM), segment, HS code, sourcePriority dropdown {MANUFACTURED, PURCHASED, SUBCONTRACTED, STOCK_TRANSFER}, status (lifecycle, default PENDING_ONBOARDING).
- **Supplier:** code (auto S/##### configurable, immutable), name, currency (reference), classification, group, addresses with tax (GST/VAT/PAN), status (default PENDING_ONBOARDING).
- **TaxCode:** code (primary key), type dropdown {GST, VAT, Duty, ReverseCharge, Withholding}, rate (decimal percent, >= 0), jurisdiction, recoverable (boolean, input-credit eligible).

### Users, designations, business units (step 10)

| Field | Type | Mandatory | Default | Validation / values |
| --- | --- | --- | --- | --- |
| email | string | Yes | none | trimmed, lowercased, unique case-insensitive |
| name | string | Yes | none | |
| department | reference | Yes | none | |
| designation | reference (rank) | Yes | none | one of the 7 designation ranks |
| businessUnit/vertical | reference | No | none | |
| role | reference | Yes | none | |
| approvalLimit | decimal (base) | No | null (read as default 200000) | a configured 0 stays 0 (approves nothing) |
| status | enum | Yes | ACTIVE | {ACTIVE, INACTIVE}; INACTIVE forces logout on next request |

Designation: name, rank (integer; 7 levels; drives "same-or-higher rank" assignment eligibility). BusinessUnit/Vertical: name, code.

### Roles and permissions (step 11)

- Permission shape `{value, description, isAdminOnly}`; format `resource.action` (for example `requisition.create`, `approval.approve`, `budget.approve`, `po.issue`, `suppliers.approve`, `items.import`, `payments.schedules.approve`, `routingRules.update`, `fieldConfig.manage`, `audit.view`, `all`).
- Four grant sources: Role.permissions, UserRole.permissions (per-user override), Designation.permissions, Vertical/BusinessUnit.permissions.
- Special permission `all` (isAdminOnly) short-circuits to allow everything.
- Seeded roles: SystemAdmin (granted all) and User.
- SoD ruleset (on by default): buyer != PO approver; receiver != invoice approver; maker != checker; requester != sole approver of own requisition. Relaxing any rule is recorded in the audit log.

### Approval chain and routing rules (step 13)

- **ApprovalChain/Stage:** ordered stages (configurable: all-to-one or multi-stage, for example ReqDepartment -> Procurement -> Finance -> Management); per stage stageType dropdown {Standard, Budget, Award, SupplierApproval, Artwork, LanguageReview}, isAutoApprovalEnabled (boolean), siteConditional (boolean; for example a factory site needs a Factory Manager stage).
- **RoutingRuleEntry:** department (reference), stage/verticalId (reference) with unique composite key (department, verticalId), assigneeUserIds (array), approverUserIds (array).
- **Limits:** per-approver approvalLimit on the User (base currency); defaultApprovalLimit (tenant config, default 200000) used when an approver limit is null. The auto-approval threshold is the resolved approver's limit; nearest-bucket selection reserves high-limit approvers for large amounts.

### Budgets (step 14)

| Field | Type | Mandatory | Default | Validation |
| --- | --- | --- | --- | --- |
| costCenterId / projectId | reference | Yes | none | must be an existing project/cost-center |
| period | enum/string | Yes | none | for example FY, quarter, month |
| amount | decimal (base) | Yes | none | > 0 |
| availableAmount | decimal | auto | = amount | |
| committedAmount | decimal | auto | 0 | |
| actualAmount | decimal | auto | 0 | |

Budget is a separate gate from approval limits. Soft check at requisition (warns if over availableAmount), hard commit at PO issue (availableAmount minus amount, committedAmount plus amount; guard available >= amount or override-with-approval), relieved to actual at GR/invoice.

### Dynamic field config (step 15)

| Field | Type | Notes |
| --- | --- | --- |
| fieldKey | string | unique key |
| label | string | display label |
| dataType | enum | {string, number, decimal, date, boolean, reference, enum, attachment} |
| stage | enum | {INITIATION, ORDERED, PARTIAL_DELIVERY, POST_DELIVERY} |
| scope | enum | {TICKET_LEVEL, ITEM_LEVEL, BLOCK_LEVEL} |
| purchaseType | array | subset of {LOCAL, IMPORT} |
| mandatory | boolean | gates stage progression when true and isAuto false |
| isAuto | boolean | auto fields never gate |
| showHistory | boolean | track in field history |
| referenceEntity | enum | when dataType reference: {project, vertical, user, supplier, item, ticket-item} |

The isEmpty rule for the mandatory gate: null, undefined, blank trimmed string, empty array, empty object, and invalid date are empty; 0 and false count as present.

## Edge cases and error handling

- **No base currency chosen:** transactions cannot enable; the completion gate blocks until base is set. Base is locked once any transaction exists.
- **Bulk import, no file:** "No file uploaded". Header-only file: "No valid data found".
- **Bulk header mismatch:** any missing or extra column rejects the whole import before row processing.
- **Bulk row errors:** all errors accumulate; the import is rejected with one error listing every {rowNumber, reason}; nothing is written; no audit emitted. The Administrator corrects and re-uploads with no partial state to clean up.
- **Duplicate natural keys within one file:** resolve last-wins on upsert.
- **Late DB failure during commit:** the whole import rolls back fully; audit not emitted.
- **Missing routing rule for a (department, stage):** downstream routing throws a BadRequestException and the affected requisition stalls until the Administrator adds the rule. The completion gate requires at least one routing rule per active department/stage to reduce this.
- **Permission change:** applies on the next request (no caching). An empty permission set yields "User has no roles"; a missing required permission yields a Forbidden error.
- **Inactive user:** status is re-checked every request; an account deactivated mid-session is forced to log out on the next call.
- **Reference resolution defects:** a dangling reference id yields a 400; a missing resolver yields a 500 configuration defect.

## Business rules and invariants

- Configuration precedes all transactions; the completion gate requires base currency, at least one routing rule per active department/stage, at least one budget per active cost-center for the current period, the field config loaded, and at least one user per required approval stage.
- Codes (item, supplier S/#####) are auto-generated by configurable patterns and are immutable.
- Bulk import is all-or-nothing per file; individual create is per-record. Imported supplier/item records default to PENDING_ONBOARDING.
- Effective permissions are the deduplicated union of role, user-grant, designation, and business-unit, plus the super-admin `all`. No priority ordering. SoD rules override grants and are on by default.
- Approval limits are not budget control; budget is a separate dimension checked soft at requisition and hard at PO.
- Auto fields never gate stage progression; mandatory non-auto fields do.
- Every committed configuration change emits an audit log entry and an SSE event; rejected imports emit neither.

## Cross-references

- Downstream: 02 requisition (consumes masters, field config, budgets, routing rules, base currency), 03 approval (consumes the chain, routing rules, limits), 04 sourcing, 05 purchase order (budget hard commit), 06 supplier onboarding (PENDING_ONBOARDING records approved here), 07 item onboarding.
- Services: `model/platform-services.md` (configurable approval engine, dynamic forms/field engine, FX/currency, audit, notifications, SSE, bulk import, document storage, identity/RBAC, budget/commitment, tax).
- Benchmarks: SCOR OE2 (business rules), OE4 (data/information/technology), OE5 (human resources), OE11 (enterprise business planning); ISO 7.5 (documented information), ISO 8.4 (control of externally provided processes, the supplier-approval part).
