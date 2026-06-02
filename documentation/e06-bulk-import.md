# e06 Bulk Import All-or-Nothing

- **BPMN file:** e06-bulk-import.bpmn

## Scope, trigger, outcome
- **Scope:** The single generic bulk-import pipeline used for every master entity (suppliers, items, UoM, currency, segments, payment terms, warehouses, asset proposals, supplier groups, tax codes). It covers parse, the three structural guards (readable, sheet present, data rows), exact header validation, per-row validation with reference resolution that accumulates all errors, the all-or-nothing decision, the single-transaction natural-key upsert, commit-or-rollback, and the result contract. It does not cover the individual create forms (those are per-master flows) or the auto-create-from-free-text rule (e05).
- **Trigger:** An administrator uploads an XLSX or CSV for one selected masterType.
- **Outcome:** Either the import is fully applied (one transaction commits, returning {created, updated}) or it is fully rejected (one BadRequest, nothing written). There is never a partial import.

## Actors (lanes)
- **Administrator:** selects the masterType and uploads the file (permission *.import; Admin always holds it).
- **Platform / System:** parses, validates structurally and per row, accumulates errors, upserts in one transaction, commits or rolls back, audits, and returns the result.

## Step-by-step narrative
Each step is tagged [SCOR code | ISO clause | source].

1. **Upload XLSX / CSV for a master** (Administrator, start). masterType (dropdown, mandatory) selects the schema and natural key. [SCOR OE4 | source: RA bulk import].
2. **Parse workbook** (System). Rows parsed; numbering header = 1, first data row = 2. No write. [SCOR OE4 | source: RA].
3. **File readable?** (System, exclusive). Unreadable or unsupported format rejects. [SCOR OE4 | source: RA guard 1].
4. **Expected sheet present?** (System, exclusive). Missing sheet rejects. [SCOR OE4 | source: RA guard 2].
5. **At least one data row?** (System, exclusive). rowCount must exceed 1. [SCOR OE4 | source: RA guard 3].
6. **Headers exactly match schema?** (System, exclusive). No missing, no extra, no duplicate columns; a mismatch is a structural reject before any row work. [SCOR OE4 | source: RA exact-header validation].
7. **Validate every row + resolve refs, ACCUMULATE errors** (System). Never fail-fast; every failure is appended as {row, field, reason} and the loop runs to the last row. No write. [SCOR OE4 | ISO 7.5 | source: RA accumulate-all-errors].
8. **Any row errors accumulated?** (System, exclusive). If the error list is non-empty, reject all; else upsert. [SCOR OE4 | source: RA].
9. **Return one BadRequest listing all {row, reason}; write nothing** (System). Single 400 with the full list; zero rows written; attempt audited. [SCOR OE4 | ISO 7.5 | source: RA reject-all].
10. **Single transaction: upsert by natural key** (System). One transaction; existing key updates, new key inserts; supplier/item inserts default PENDING_ONBOARDING. [SCOR OE4 | source: RA natural-key upsert].
11. **All rows persisted without error?** (System, exclusive). Commit on full success, rollback on any failure. [SCOR OE4 | source: RA commit-or-rollback-all].
12. **Rollback all; report failure** (System). No rows persist; failure reported and audited. [SCOR OE4 | ISO 7.5 | source: RA].
13. **Commit, audit, emit SSE** (System). Audit records masterType, created and updated counts, and actor; SSE refreshes lists. [SCOR OE4 | ISO 7.5 | source: platform-services].
14. **Return {created, updated}** (System). The success contract. [SCOR OE4 | source: RA].
15. **Import committed** (System, end). Atomic update complete. [SCOR OE4 | source: RA].
16. **Import rejected; nothing written** (System, end). Terminal reject for any structural failure or accumulated row errors. [SCOR OE4 | source: RA all-or-nothing].

## Gateways and branches (exact conditions)
- **File readable?** True: `parser opened the file AND format in {XLSX, CSV} AND not corrupt`. False: BadRequest, abort.
- **Expected sheet present?** True: `workbook contains the expected sheet for masterType (XLSX)` or the CSV has a content block. False: BadRequest, abort.
- **At least one data row?** True: `rowCount > 1`. False: BadRequest, abort.
- **Headers exactly match schema?** True: `set(actualHeaders) == set(expectedHeaders) AND no duplicates` (no missing, no extra). False: BadRequest listing missing and extra headers, abort.
- **Any row errors accumulated?** True: `errorList.length > 0` -> reject all. False -> upsert.
- **All rows persisted without error?** True: `every upsert succeeded` -> COMMIT. False -> ROLLBACK.

## Fields and dropdowns (full detail)

| Field | Type | Mandatory | Default | Validation | Owner |
| --- | --- | --- | --- | --- | --- |
| masterType | dropdown {suppliers, items, UoM, currency, segments, payment terms, warehouses, asset proposals, supplier groups, tax codes} | mandatory | none | one of set | Administrator |
| file | upload (XLSX or CSV) | mandatory | none | parseable, supported format | Administrator |
| natural key (per masterType) | string | system | derived | unique within master | System |
| error entry | object {row, field, reason} | system | n/a | row uses header=1 numbering | System |
| result | object {created, updated} | system | n/a | counts | System |

## Row numbering and error format
- Header row is row 1; the first data row is row 2. Every error message carries the row number under this convention so the admin can locate the offending cell.
- The error list entries are {row, field/header, reason}. All are returned together in one BadRequest body.

## Natural keys (upsert)
- Suppliers: supplier code (S/#####). Items: item code (DEP/SG/SSG/######). UoM, currency, tax codes, payment terms, warehouses, segments, supplier groups: their respective code/name natural key. An existing key updates; a new key inserts.

## Edge cases and error handling
- **Unreadable file / unsupported format.** Rejected at the first guard; nothing written.
- **Missing sheet or no data rows.** Rejected at the structural guards; nothing written.
- **Missing or extra header column.** Rejected at header validation, with both the missing and the extra columns listed, before any row is read.
- **Multiple bad rows.** Validation never fail-fasts; every bad row is reported in one response so the admin fixes them all in one edit.
- **Late integrity error during write.** The single transaction rolls back fully; no partial commit.
- **Mixed insert and update.** A file may contain both new and existing natural keys; the upsert handles each, and the counts are split into created and updated.

## Business rules and invariants
- Validation never fail-fasts; all row errors accumulate and are returned together.
- The import is all-or-nothing: one transaction, commit all or rollback all, no partial write on any failure path.
- Structural guards (readable, sheet, data rows, exact headers) run before any row work and reject the whole file on failure.
- Inserted supplier/item rows default to PENDING_ONBOARDING and enter the onboarding queue.
- Every import attempt (success or reject) is audited; success emits SSE and returns {created, updated}.

## Cross-references
- e05 auto-create (the per-reference resolution rule reused inside row validation); 06 supplier onboarding and 07 item onboarding (PENDING_ONBOARDING destination of inserted rows); 01 configuration (master schemas and field config). Benchmarks: SCOR OE4 (manage product/master data), ISO 9001 7.5 (documented information and records).
