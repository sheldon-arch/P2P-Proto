# 02 Requisition and Intake (Requester-led)

- **BPMN file:** 02-requisition.bpmn

## Scope, trigger, outcome

- **Scope:** A requester turns an identified need into a validated requisition. Covers the full header and line field set, search-master-or-free-text item entry with a non-blocking new-item sub-flow, draft save and reopen, submit with the mandatory-field gate, total computation and conversion to base currency, the soft budget check with a logged Budget Owner override, and routing into the configurable approval chain with per-stage completions. Ends at the hand-off to the approval domain (diagram 03).
- **Trigger:** A requester in any department identifies a purchase need (material, spare, service, or product-design item). Precondition: the tenant is configured (diagram 01), so masters, routing rules, budgets, the base currency, and the field config exist.
- **Outcome:** A requisition with status IN_PROGRESS and stage INITIATION, an immutable identifier, full header and line detail, base-currency totals, a soft budget result (or a logged override), and per-stage approval completions created, the first stage assigned least-loaded. Visibility stays scoped to the requester's own and own-department records. A new-item sub-flow may still be finishing in parallel without holding this outcome.

## Actors (lanes)

- **Requester** (`L_req`): creates and submits the requisition, adds lines, saves drafts, revises on send-back. Holds `requisition.create`, `requisition.edit`, `requisition.submit` (own), and `requisition.view` (own/department).
- **Procurement / Buyer** (`L_buyer`): approves and creates a free-text item in the master (`items.create` / `item.approve`). This is the Procurement Handler, not the Purchase Head.
- **Budget Owner** (`L_budget`): acts on the over-budget warning, approving a logged override or sending the requisition back. Holds `budget.approve` scoped to the owned cost-center.
- **Platform / System** (`L_sys`): automated. Resolves references, computes totals, converts to base currency, runs the soft budget check, and routes into the approval chain. Emits audit (category ticket) and SSE events.

Full role definitions are in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative

Each step is tagged [SCOR code | ISO clause | source].

1. **Need identified** (Requester, start). The requester holds `requisition.create` scoped to own/department and sees only own/department requisitions and history. [SCOR S1.1 / O2 | ISO 7.5 | source: AB + RA + role-model]
2. **Open requisition, fill header** (Requester). The header is captured with auto identifier, date, requester, and department, plus the category, direct/indirect, purchase type, priority, currency, cost-center, and justification fields. [SCOR S1.1/O2 | ISO 7.5 | source: AB fields + RA CreateTicketDto]
3. **Add line items (search master or free-text)** (Requester). One or more lines, each with item, code, HS code, description, product-used-for, quantity, UoM, unit price, available stock, need date, line note, and attachments. Service lines use service name, item reference number, and contract duration. [SCOR S1.1 | ISO 7.5 | source: AB line fields + RA items]
4. **Request new item (free-text entered)** (Requester, sub-flow). If the item is not in the master, the requisition still proceeds; the line shows "PENDING - New Item". [SCOR OE4 | source: AB new-item sub-flow + RA auto-create]
5. **Approve / create new item in master** (Procurement/Buyer). The Procurement Handler, not the Purchase Head, adds the item to the master and the item lifecycle advances to ONBOARDED. [SCOR OE4 | ISO 7.5 | source: AB BPMN supersedes Word doc]
6. **Link new item, resolve references** (System). Links the approved or auto-created item, resolves all reference fields via the entity normalizer, and recomputes totals. Non-blocking. [SCOR OE4 | source: platform-services 2 + raphe-edge-cases e09]
7. **Save draft or submit?** (Requester, exclusive gateway). The requester either saves a draft or submits. [source: AB draft save + albahja-requisition-approval]
8. **Save as draft** (Requester). Status Draft, no validation gate, no routing; reopened and edited later; identifier already assigned and immutable. [source: AB draft]
9. **Submit requisition** (Requester). Triggers the mandatory-field gate for INITIATION at ticket and item level, filtered by category and purchase type. [SCOR S1.1/O2 | source: AB submit + raphe-stage-progression]
10. **Validate, compute total, convert to base** (System). Computes total as the sum of quantity times unit price, then converts to base currency with graceful degradation on FX failure. [SCOR OE4 | source: platform-services FX 3 + raphe-edge-cases e08]
11. **Soft budget check against cost-center** (System). Reads the budget for the cost-center and period; this warns only and never blocks submission by itself. [SCOR OE11 | source: platform-services 11 + data-model]
12. **Within available budget?** (Budget Owner, exclusive gateway). Compares the base total to the available budget. [SCOR OE11 | source: data-model + role-permission-matrix]
13. **Approve budget override (logged) or send back** (Budget Owner). On over-budget, the owner either approves a logged override or sends the requisition back with a mandatory note. [SCOR OE11 | source: data-model + role-model Budget Owner]
14. **Revise requisition (same identifier)** (Requester). Edits the same requisition per the send-back note and resubmits; the identifier is unchanged. [source: AB return-for-revision]
15. **Route into configurable approval chain** (System). Creates one per-stage completion (NOT_STARTED) for each configured stage and assigns the first stage least-loaded; the requester stage is pinned to the requester. [SCOR OE2 | ISO 8.4 | source: platform-services 1 + raphe-routing-approval]
16. **Requisition submitted, in approval** (System, end). Continues in diagram 03. [SCOR OE2 | source: build-new]

## Gateways and branches (exact conditions)

| Gateway | Branch | Exact expression | Target |
| --- | --- | --- | --- |
| Add line items | New item | item is free-text (non-UUID, not in master) | Request new item (sub-flow) |
| Add line items | Existing item | item found in master (UUID resolves) | Save draft or submit? |
| Save draft or submit? | Draft | `action == 'SAVE_DRAFT'` | Save as draft |
| Save draft or submit? | Submit | `action == 'SUBMIT'` | Submit requisition |
| Within available budget? | Within | `totalAmountInBase <= budget.availableAmount` | Route into approval chain |
| Within available budget? | Over | `totalAmountInBase > budget.availableAmount` | Approve budget override or send back |
| (Override) | Override approved | override recorded with mandatory reason | Route into approval chain |
| (Override) | Sent back | returned with mandatory note | Revise requisition |

## Fields and dropdowns (full detail)

### Header fields (step 2)

| Field | Type | Mandatory | Default | Validation / values | Owner |
| --- | --- | --- | --- | --- | --- |
| identifier | string | auto | generated | configurable pattern `{YYYY}{MM_SHORT}{DEPT_PREFIX}07{RUNNING5}`; immutable across the whole cycle including delays; isAuto, read-only, never gates | System |
| date | date | auto | now | tenant timezone (for example Oman GST+4), format DD-MMM-YYYY; isAuto, read-only | System |
| requester | reference (user) | auto | profile | from authenticated profile; read-only | System |
| department | reference | auto | profile | from authenticated profile; read-only | System |
| category | enum | Yes | none | {Items, Spares, Services, ProductDesign}; drives field config and receipt routing | Requester |
| directOrIndirect | enum | Yes | none | {Direct, Indirect} | Requester |
| purchaseType | enum | Yes | Local | {Local, Import} | Requester |
| priority | enum | Yes | Within1Week | {ASAP, SameDay, Within2Days, Within1Week}; urgency weights ASAP=4, SameDay=2, Within2Days=1, Within1Week=0 for least-loaded assignment | Requester |
| currency | reference (Currency) | Yes | tenant base | a configured currency master | Requester |
| projectOrCostCenter | reference | Yes | none | ACTIVE projects/cost-centers only; INACTIVE not selectable | Requester |
| justification/notes | text | No | none | max 2000 chars | Requester |

The mandatory set is the field-config INITIATION/TICKET_LEVEL entries for this category and purchase type.

### Line fields (step 3)

| Field | Type | Mandatory | Default | Validation / values | Owner |
| --- | --- | --- | --- | --- | --- |
| item | reference or free-text | Yes | none | search master first; UUID resolves to existing; non-UUID triggers the new-item sub-flow | Requester |
| itemCode | string | auto | from master | "PENDING - New Item" while awaiting handler approval; isAuto, read-only | System |
| hsCode | string | No | none | import-relevant | Requester |
| itemDescription | text | auto/editable | from master | auto-populated on select; editable for free-text | Requester |
| productUsedFor | string | No | none | which finished product it feeds, for spend reporting | Requester |
| quantity | decimal | Yes | none | > 0; decimals allowed for weight/volume | Requester |
| unitOfMeasure | reference (UoM) | Yes | none | from UoM master | Requester |
| unitPrice | decimal | No | none | may be 0 at creation (flagged, not blocked) | Requester |
| availableStock | decimal | No | none | read from inventory if known | System |
| needDate | date | Yes (per line) | none | datepicker; >= today | Requester |
| lineNote | text | No | none | | Requester |
| attachments | file list | No | none | drawings/specs | Requester |

Service category lines instead use serviceName, itemReferenceNumber, and contractDuration dropdown {3m, 6m, 1y, 2y, Custom}. The item-level mandatory set comes from the field config (ITEM_LEVEL, category, purchase type) and blocks on any line that is missing a required field.

### Submit action (step 9)

- Effect: runs the mandatory-field gate for INITIATION at ticket level and item level, filtered by category and purchase type, on mandatory non-auto fields only.
- isEmpty rule: null, undefined, blank trimmed string, empty array, empty object, and invalid date are empty; 0 and false are present.
- On failure: 400 with `remainingStageFields[]`, status stays Draft, nothing routes.
- On pass: status IN_PROGRESS, stage INITIATION, totals computed.

## Edge cases and error handling

- **Free-text item:** non-blocking. The requisition proceeds with "PENDING - New Item"; the Procurement Handler approves and the code back-fills. A non-UUID reference auto-creates an item (description = the string, stock/purchase UoM = the line UoM, 6-digit running-number code) following the item lifecycle.
- **Zero unit price:** allowed at creation; flagged, not blocked.
- **INACTIVE project/cost-center:** not selectable on the requisition.
- **Missing mandatory field on submit:** 400 with the remaining-field list; status stays Draft; nothing routes; the requester fills the fields and retries.
- **FX fetch failure or invalid rate (0/NaN/Inf/negative):** logged; the original amount is returned unconverted (graceful degradation, never throws).
- **Over budget:** non-blocking warning; the Budget Owner approves a logged override (mandatory reason) or sends the requisition back for revision. The soft check never blocks submission by itself; the hard commit is later at PO.
- **Send-back loop:** the requester edits the same requisition (identifier unchanged) and resubmits, which re-runs validation and the budget check. Remarks are an appended, timestamped log that cannot be deleted.
- **Missing routing rule for the (department, stage):** routing throws a BadRequestException, the whole transaction rolls back, and the requisition stalls until the Administrator fixes the rule.
- **Draft visibility:** a draft is visible only to the requester and own department per the view scope.

## Business rules and invariants

- The identifier is generated on first save and is immutable across the whole cycle including delays.
- The new-item sub-flow is non-blocking; the requisition can submit and route while the item is still being approved in parallel.
- The mandatory-field gate uses the field config (stage x scope x purchase type); auto fields never gate.
- totalAmountInBase drives the budget check, approval thresholds, and analytics; it is computed by converting the requisition currency total to base.
- The soft budget check at intake warns only and does not encumber funds; approval limits are not budget control; the hard commit (encumbrance) happens at PO issue.
- A budget override is a logged exception (mandatory reason, by, at), not a silent bypass.
- Routing pins the requester stage to the requester and resolves the approver from the routing rule least-loaded (urgency-weighted).
- Visibility is scoped to the requester's own and own-department records throughout.
- Every committed change emits an audit log entry (category ticket) and an SSE `ticket.updated` event.
- **One designated requester per department (axiom A20):** each department has exactly one designated requester registered in the user master. The routing rule for a department resolves the requisition to that designated requester's queue. A department with no designated requester cannot raise requisitions; the Administrator must assign one before the department can transact. The designation is a master-data record (User with requesterForDepartment flag); changing it is an audited admin action.
- **Reorder-origin requisitions (axiom A21):** a requisition raised from the inventory reorder worklist carries `reorderOrigin = true` and is pre-filled by the platform (item, quantity = suggestedQty, warehouse context). The Inventory Manager reviews and submits it; it then joins this flow at step 9 (submit). The reorderOrigin flag is carried through to analytics to distinguish inventory-driven demand from ad-hoc demand. No other behavior differs from a standard requisition.

## Cross-references

- Upstream: 01 configuration (masters, field config, budgets, routing rules, base currency must exist first).
- Downstream: 03 approval (consumes the per-stage completions and the first assignment), 04 sourcing, 05 purchase order (budget hard commit), 07 item onboarding (the new-item sub-flow completes here).
- Edge cases: e01 (no eligible approver / routing gap), e02 (budget over/override), e08 (FX fetch failure), e09 (reference resolution).
- Services: `model/platform-services.md` (configurable approval engine, dynamic forms/field engine, FX/currency, budget/commitment, audit, SSE).
- Benchmarks: SCOR S1.1 Define Business Need, O2 Order B2B, OE2 business rules, OE4 data, OE11 enterprise business planning; ISO 7.5 documented information, ISO 8.4 control of externally provided processes.
