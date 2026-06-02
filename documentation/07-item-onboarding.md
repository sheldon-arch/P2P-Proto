# 07 Item and Catalog Onboarding - Unified Procure-to-Pay / Source-to-Pay

- **BPMN file:** 07-item-onboarding.bpmn

## Scope, trigger, outcome
- **Scope:** Bringing a catalog item to ONBOARDED through three creation paths (single form, implicit auto-create from a non-UUID requisition line, bulk import), code and description generation, source-priority assignment, request-approval, approval, and the post-onboarding lifecycle (edit revert, suspend, offboard). The item lifecycle deliberately mirrors the supplier lifecycle.
- **Trigger:** A buyer/engineer adds a catalog item, a requisition line references an item not yet in the master (implicit), or a file of items is bulk-loaded.
- **Outcome:** Item reaches ONBOARDED (orderable), SUSPENDED (blocked, reversible), or OFFBOARDED (terminal). ONBOARDED items feed requisition lines (Diagram 02), PO lines (Diagram 05), and GRN (Diagram 08).

## Actors (lanes)
- **Procurement / Buyer** (`L_buyer`): creates items, sets source priority, uploads imports, requests approval, edits, offboards. Engineering acts in this lane for engineering items (conditional permission).
- **Approver** (`L_appr`): approves the item into ONBOARDED. Admin always; Engineering conditional for engineering items.
- **Platform / System** (`L_sys`): detects implicit creation, auto-creates from lines, validates and commits imports, marks onboarded, runs the ERP-sync boundary, routes lifecycle events.

Full role definitions in `model/role-model.md`; permissions in `model/role-permission-matrix.md`.

## Step-by-step narrative
Tags: [SCOR code | ISO clause | source].

1. **New item needed** (Buyer, start). Item follows the same lifecycle as a supplier. [SCOR OE4 | source: RA item onboarding (08)]
2. **Single, implicit, or bulk?** (Buyer, exclusive). Form (`items.create`), implicit (non-UUID requisition line), or bulk (`items.import`). [source: RA two entries + bulk]
3. **Create item (form)** (Buyer/Engineering). Code auto-generated, description auto-populated, UoMs, HS code, source priority next. Status defaults PENDING_ONBOARDING. [SCOR OE4 | source: RA + AB HS code]
4. **Set source priority** (Buyer). ItemSourcePriority entries, unique per priority and per source type, replaced as a set on update. [SCOR OE4 | source: RA]
5. **Request approval** (Buyer). Guard status = PENDING_ONBOARDING; status -> PENDING_APPROVAL; ITEM_APPROVAL_REQUESTED notification fires only here; audit category ADMIN. [SCOR OE4 | source: RA]
6. **Approve item?** (Approver, exclusive). Approve iff complete; else return. [source: RA]
7. **Approve item** (Approver). Guard status = PENDING_APPROVAL; status -> ONBOARDED; no notification at approve. [SCOR OE4 | source: RA]
8. **Mark onboarded, optional ERP sync** (System). ERP-sync toggle only when ONBOARDED; later edit reverts to PENDING_APPROVAL and resets the flag. [SCOR OE4 | source: RA + platform-services 13]
9. **Post-onboarding lifecycle event** (System, exclusive). Edit, suspend/offboard, or stay onboarded. [source: RA + review SUSPENDED]
10. **Edit item** (Buyer). Reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL; isErpSynced reset; source-priority set replaced if changed. [source: RA]
11. **Offboard / suspend item** (Buyer/Admin). Offboard guard status = ONBOARDED; OFFBOARDED terminal (soft-delete, retained); SUSPENDED reversible. [SCOR OE4 | ISO 7.5 | source: RA + review]
12. **Item ONBOARDED / OFFBOARDED** (System, end).

### Implicit branch
- **Detect non-UUID requisition line itemId** (System). UUID -> lookup (404 rejects whole op); non-UUID string -> auto-create, no lookup. Supplier + item auto-create run in parallel and join before linking + postValueSync. [source: RA e05]
- **Auto-create item from line** (System). description = the string; stock/purchase UoM = line UoM; code generated DEP/SG/SSG/000001-style; status PENDING_ONBOARDING; usable immediately, flows through approval. [source: RA e05]

### Bulk branch
- **Upload item import file** (Buyer). XLSX/CSV; file/sheet/data-row guards. [source: RA + platform-services 7]
- **Validate header + rows** (System). Exact header; per-row validate + resolve refs; every standardSupplierCode must resolve (else whole import fails); accumulate all errors; natural key = code. [source: RA e06]
- **All rows valid?** (System, exclusive). Zero errors -> commit; any error -> one BadRequestException listing every `{rowNumber, reason}`, nothing written. [source: RA e06]
- **Upsert by code in one transaction** (System). All-or-nothing; new items get incremented runningNumber; duplicates last-wins; default PENDING_ONBOARDING; audit (ADMIN) only on commit. [source: RA e06]
- **New items join lifecycle** (Buyer). Each still requires source priority (if missing) + request-approval -> approve to reach ONBOARDED. [source: convergence]

## Gateways and branches (exact conditions)
- **Single, implicit, or bulk?**: single (`items.create` form), implicit (requisition line itemId is a non-UUID string), bulk (`items.import` file).
- **Approve item?**: `status = PENDING_APPROVAL AND code present AND description present AND stockUom present AND purchaseUom present AND >= 1 source priority` -> approve; else return to complete.
- **All rows valid?**: `accumulated errors = 0 AND every standardSupplierCode resolves` -> commit; else reject whole import.
- **Post-onboarding lifecycle event**: edit -> revert to PENDING_APPROVAL; suspend (quality stop / obsolescence / supersession) -> SUSPENDED (blocks new ordering, reversible); offboard -> OFFBOARDED (terminal); else stay ONBOARDED.

## Fields and dropdowns (full detail)

### Item
| Field | Type | M/O | Default | Validation / rule | Owner |
| --- | --- | --- | --- | --- | --- |
| code | string | M (auto) | `DEPARTMENT/SEGMENT_CODE/SUB_SEGMENT_CODE/RUNNING_NUMBER` e.g. `ME/SG/SSG/000001` | runningNumber 6-digit zero-padded, max+1 (0 if none), transactional/race-safe; uniqueness (runningNumber, code); dept `ME \| EL \| AD \| CP \| SR \| IT` fallback DEP; seg/sub default SG/SSG; configurable | System |
| shortDescription | text | M | - | - | Buyer |
| description | text | M (auto) | segmentDesc + subSegmentDesc + shortDescription | fallback to item code | System |
| segment | reference | O | SG | Segment master | Buyer |
| subSegment | reference | O | SSG | - | Buyer |
| stockUom | dropdown | M | - | UoM master | Buyer |
| purchaseUom | dropdown | M | - | UoM master | Buyer |
| hsCode | string | O | - | HS tariff code (import duty classification) | Buyer |
| category / finishedProductCategory | reference | O | - | spend reporting | Buyer |
| standardSupplierId | reference | O | null | nullable; need NOT be ONBOARDED (any existing id or null accepted) | Buyer |
| status | enum | M (auto) | PENDING_ONBOARDING | lifecycle | System |
| isErpSynced | boolean | O | false | toggle only when ONBOARDED; reset on every edit | System |

### Source priority (ItemSourcePriority)
| Field | Type | M/O | Value set / rule |
| --- | --- | --- | --- |
| priority | number | M | unique `(itemId, priority)` |
| sourceType | dropdown | M | `MANUFACTURED \| PURCHASED \| SUBCONTRACTED \| STOCK_TRANSFER`; unique `(itemId, sourceType)` |

The set is replaced wholesale on update (not merged).

## Edge cases and error handling
- **Wrong-status transition**: request-approval requires PENDING_ONBOARDING; approve requires PENDING_APPROVAL; offboard requires ONBOARDED. Wrong status raises BadRequestException, record unchanged.
- **Edit on approved item**: recomputes status to PENDING_APPROVAL; isErpSynced reset; source-priority set replaced if changed.
- **Implicit auto-create**: a UUID line itemId that fails lookup rejects the whole requisition op (404); a non-UUID string auto-creates with no lookup. Supplier and item auto-create paths run in parallel and join before linking + postValueSync.
- **Unapproved item usable**: an auto-created PENDING_ONBOARDING item is usable on its requisition immediately but must pass approval to become ONBOARDED for general use.
- **Import errors**: any file/header/row/persistence problem rejects the entire import; item import additionally fails the whole import if any standardSupplierCode does not resolve; even valid rows are not saved; late DB failure rolls back fully (audit not emitted); row numbering header = 1, first data = 2.
- **Offboarded reactivation**: not documented; OFFBOARDED is terminal (record retained for history + referencing requisition lines/POs).

## Business rules and invariants
- Lifecycle: PENDING_ONBOARDING -> PENDING_APPROVAL -> ONBOARDED -> OFFBOARDED (terminal), plus SUSPENDED (reversible).
- Edit reverts ONBOARDED/PENDING_APPROVAL to PENDING_APPROVAL; isErpSynced reset on every update; ERP-sync toggle only when ONBOARDED.
- Item code pattern and dept/segment codes are configurable; runningNumber is 6-digit zero-padded, generated transactionally (race-safe), uniqueness on (runningNumber, code).
- description is auto-populated (segmentDesc + subSegmentDesc + shortDescription, fallback to item code).
- ItemSourcePriority sourceType is unique per item (and priority unique per item); the set is replaced on update.
- standardSupplier need NOT be ONBOARDED (any id or null accepted), unlike the PO supplier gate.
- ITEM_APPROVAL_REQUESTED notification fires only at request-approval; item audit is under category ADMIN (no dedicated item category).
- Three creation paths converge on one lifecycle; implicit auto-create uses no lookup and takes description from the free-typed string and UoM from the line.
- Bulk import: exact header, accumulate all errors, all-or-nothing, upsert by code, every standardSupplierCode must resolve, default PENDING_ONBOARDING, audit only on commit.
- Every committed change emits audit + SSE.

## Cross-references
- Upstream: 02 requisition (implicit auto-create from a non-UUID line item).
- Downstream: 05 purchase order (PO line items), 08 delivery/GRN (received items).
- Related: 06 supplier onboarding (parallel lifecycle), e05 auto-create, e06 import all-or-nothing.
- Benchmarks: SCOR OE4 (Data, Information, and Technology / master data); ISO 7.5 (records retention). Sources: `model/data-model.md` (Item, ItemSourcePriority, master data), `model/platform-services.md` (bulk import, RBAC, notifications, ERP boundary, field normalizer), memory `raphe-supplier-item-onboarding`, `raphe-edge-cases` (e05), `raphe-bulk-import`, `albahja-masters-and-fields`.
