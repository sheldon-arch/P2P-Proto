# e05 Auto-create Supplier or Item from Free-text Reference

- **BPMN file:** e05-auto-create.bpmn

## Scope, trigger, outcome
- **Scope:** The reference-resolution rule that lets a requisition or PO carry either an existing record's UUID or a free-text name in its supplier and item reference fields. A UUID is asserted to exist and is looked up; a free-text name is auto-created with no lookup. The supplier and the line items resolve on two parallel branches that join before the document is linked and persisted. This is the entity-normalizer behaviour applied to the create path; it does not cover supplier qualification (06) or item onboarding detail (07).
- **Trigger:** A requester submits a requisition (or a buyer submits a PO) whose references mix UUIDs and typed names.
- **Outcome:** The document is persisted in one transaction with resolved links; any auto-created supplier or item is committed in the same transaction with status PENDING_ONBOARDING and enters the onboarding queue. If any UUID fails to resolve, the whole operation is rejected with a 404 and nothing is written.

## Actors (lanes)
- **Requester:** submits the document with references.
- **Procurement / Buyer:** the alternate submitter on a PO; same resolution rules apply.
- **Platform / System:** classifies references, resolves on parallel branches, auto-creates masters, enforces the atomic reject, persists, audits, and notifies.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Submit requisition / PO with references** (Requester, start). The supplier reference is optional (a requester may not know the supplier); item references on the lines are required. [SCOR S1.1 | ISO 7.5 | source: RA normalizer e09 + auto-create].
2. **Classify each reference: UUID vs free-text** (System). UUID format goes to the lookup path; any non-empty non-UUID string goes to the auto-create path; an empty value is rejected as a missing field for items and allowed-null for the supplier. [SCOR OE2 | ISO 7.5 | source: RA field engine normalizer].
3. **Resolve supplier and items in parallel** (System, parallel split). Branch A resolves the supplier, Branch B resolves the item lines; a 404 on either branch aborts the whole operation. [SCOR OE2 | source: RA parallel resolve].
4. **Supplier ref: UUID, free-text, or null?** (System, exclusive). UUID to lookup, free-text to auto-create, null skips straight to the join. [SCOR S1.6 | source: RA optional supplier link].
5. **Look up supplier by id** (System). Found returns the existing supplierId; not found raises a 404 dangling-id reject. [SCOR S1.6 | source: RA e09].
6. **Supplier id resolves?** (System, exclusive). True carries the id to the join; false aborts. [SCOR S1.6 | source: RA atomic reject].
7. **Auto-create supplier (S/#####, PENDING_ONBOARDING)** (System). New supplier with the next code in the S/##### sequence, status PENDING_ONBOARDING, no lookup. [SCOR S1.6 | ISO 8.4.1 | source: RA auto-create].
8. **Each item ref: UUID or free-text?** (System, exclusive, per line). Required; UUID to lookup, free-text to auto-create; no null path. [SCOR OE4 | source: RA required lines].
9. **Look up item(s) by id** (System). Found returns the existing itemId and auto-populated description; not found raises a 404 reject. [SCOR OE4 | source: RA e09].
10. **All item ids resolve?** (System, exclusive). True carries the ids; false aborts. [SCOR OE4 | source: RA atomic reject].
11. **Auto-create item(s) (DEP/SG/SSG/000001, PENDING_ONBOARDING)** (System). New item with the next segmented code, status PENDING_ONBOARDING, no lookup. [SCOR OE4 | source: RA item code + auto-create].
12. **Join: both branches resolved** (System, parallel join). Proceeds only when both branches complete with no 404. [SCOR OE2 | source: RA join-before-link].
13. **Link refs and persist requisition / PO in one transaction** (System). Document plus any new master rows committed together. [SCOR S1.1/S2.1 | ISO 7.5 | source: RA transactional link].
14. **Audit auto-creates + emit SSE + notify** (System). Each auto-create logged with its code and status; SSE and onboarding notifications fired. [SCOR OE4 | ISO 7.5 | source: platform-services].
15. **Reject whole operation (404 dangling id)** (System, end). Atomic abort, no partial write. [SCOR OE2 | source: RA e09].
16. **Document persisted; new masters PENDING_ONBOARDING** (System, end). Auto-created masters await onboarding. [SCOR S1.1 | source: RA lifecycle].

## Gateways and branches (exact conditions)
- **Classify reference:** `value matches UUID regex (8-4-4-4-12 hex)` -> lookup; non-empty non-UUID string -> auto-create; empty (null/blank/[]/{}) -> missing-field for items, allowed-null for supplier.
- **Supplier ref kind:** `supplierRef == null` -> skip to join; `supplierRef matches UUID` -> lookup; else -> auto-create.
- **Supplier id resolves?** `lookup returned a record` -> carry existing id; else -> 404 abort.
- **Item ref kind:** `itemRef non-empty` required; `itemRef matches UUID` -> lookup; else -> auto-create.
- **All item ids resolve?** `every UUID line returned a record` -> carry ids; else -> 404 abort.
- **Join:** proceeds only when Branch A and Branch B both complete with no 404.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| supplierRef | UUID or text or null | optional | null | UUID format or free text | Requester / Buyer |
| itemRef (per line) | UUID or text | mandatory | none | non-empty; UUID format or free text | Requester / Buyer |
| Supplier.code | string (auto) | system | next in S/##### | unique, monotonic | System |
| Supplier.name | text | system | typed free text | non-empty | System |
| Supplier.status | enum | system | PENDING_ONBOARDING | lifecycle value | System |
| Supplier.currency | enum | system | document currency | valid currency | System |
| Item.code | string (auto) | system | next in DEP/SG/SSG/###### | unique, monotonic per sub-segment | System |
| Item.description | text | system | typed free text | non-empty | System |
| Item.status | enum | system | PENDING_ONBOARDING | lifecycle value | System |
| Item.sourcePriority | enum | system | PURCHASED | one of MANUFACTURED/PURCHASED/SUBCONTRACTED/STOCK_TRANSFER | System |

## Codes and formats
- **Supplier code:** S/##### configurable pattern; the first supplier ever created is S/00001, then S/00002, monotonically increasing.
- **Item code:** DEP/SG/SSG/000001 segmented pattern (department / segment / sub-segment / 6-digit running number); the first item in a sub-segment ends 000001.
- Both default to status PENDING_ONBOARDING and progress PENDING_ONBOARDING to PENDING_APPROVAL to ONBOARDED at onboarding (06/07).

## Edge cases and error handling
- **Dangling UUID.** A UUID supplied by the client that does not resolve raises a 404 and aborts the entire submission atomically (no partial write), on either branch.
- **Missing resolver vs dangling id.** A missing resolver for a reference type is a 500 configuration defect; a client-supplied id that does not exist is a 4xx reject. The two are not conflated.
- **Null supplier.** Allowed; the requisition is persisted with no supplier link and the buyer sources later.
- **Empty item line.** Rejected as a missing required field on that line (400) before any write.
- **Mixed references.** A document may mix UUIDs and free-text across lines; each is resolved independently, but the whole operation is atomic.

## Business rules and invariants
- A UUID is never auto-created; it must resolve or the operation rejects.
- A free-text name is never looked up; it is always auto-created.
- Supplier and items resolve on parallel branches and join before linking; a 404 on either branch prevents the join and prevents any write.
- The document and any auto-created masters commit in one transaction (all-or-nothing).
- Auto-created masters default to PENDING_ONBOARDING and cannot be ordered against until onboarded.

## Cross-references
- 02 requisition (reference fields and submission); 05 purchase order (PO submission path); 06 supplier onboarding (PENDING_ONBOARDING to ONBOARDED gate); 07 item onboarding; e06 bulk import (the same auto-create and reference-resolution rules applied to mass upload). Benchmarks: SCOR S1.6 (supplier identification), OE4 (master data), ISO 9001 7.5 (documented information).
