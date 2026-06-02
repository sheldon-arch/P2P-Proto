# Generator Specs

Several build-spec artifacts are not hand-authored end products: they are generated from a single source of truth so they cannot drift from each other or from the model. This folder specifies each generator: its input (the source of truth), the transform, the output, the regeneration command, and the validation that proves the output is correct. If you hand-edit a generated file, the next regeneration overwrites it; edit the source instead.

The principle (from the architect review): consolidate the authority into one place per concept, then derive the rest mechanically. This is what keeps 627 fields, 57 types, 10 state machines, 211 relationships, a 13-role permission matrix, and a 16-module nav config all consistent.

## The generated artifacts and their sources

| Generated artifact | Source of truth | Generator | Why generated |
| --- | --- | --- | --- |
| `schema/enums.ts` | the data dictionary `enumDomain` + the ontology controlled vocabularies | `gen-enums` | every enum union must match the values the dictionary references |
| `schema/types.ts` | the 57 data-dictionary entity JSON files | `gen-types` | one TS interface per entity, fields/types/optionality from the dictionary |
| `schema/erd.md` | the data-dictionary `relationships[]` across all entities | `gen-erd` | the 211-relationship Mermaid ERD derived, never hand-drawn |
| `schema/zod/*.ts` | the data-dictionary fields + validation | `gen-zod` | the runtime validators the forms and the store use, matching the types |
| `ia/permission-matrix.json` | `model/role-permission-matrix.md` | `gen-rbac` | the role x permission-group matrix as data |
| `ia/nav-config.json` | the permission matrix + the module map | `gen-rbac` | per-role nav derived from permissions (not curated) |
| `copy/enum-labels.ts` (the typed export) | `copy/01-enum-labels.md` | `gen-copy` | the label/helper/color map the StatusBadge reads |
| `lib/tour/anchors.ts` (the registry) | the `data-tour-id`s in the screens + patterns | `gen-anchors` | the typed anchor registry the tour script references |

All generators are small, deterministic scripts (Python stdlib or a Node script, matching the seed generator's style). They run in CI and locally; the output is committed so the prototype builds without a generation step, but a drift check in CI re-runs them and fails if the committed output differs from a fresh generation.

## Files in this folder

- `README.md` (this file): the principle, the table, the regeneration + drift-check workflow.
- `01-schema-generators.md`: `gen-enums`, `gen-types`, `gen-erd`, `gen-zod` (the dictionary -> schema chain).
- `02-config-generators.md`: `gen-rbac` (matrix -> permission-matrix.json + nav-config.json), `gen-copy`, `gen-anchors`.

## Regeneration and drift-check workflow

- **Regenerate locally:** `make gen` (or `python3 build-spec/generators/run_all.py`) runs every generator in dependency order (dictionary-derived first, then config). Output written to the canonical locations.
- **Drift check (CI gate):** `make gen-check` regenerates into a temp dir and diffs against the committed output; a non-empty diff fails the build. This is what guarantees the committed `types.ts` / `enums.ts` / `permission-matrix.json` are always what the sources produce.
- **Dependency order:** enums -> types -> zod -> erd (all from the dictionary); rbac (from the matrix); copy (from the copy md); anchors (from the screens/patterns). A generator never reads another generator's output except along this order.

## Validation (every generator self-checks)

Each generator asserts its output is well-formed before writing: enums are non-empty unions; every dictionary `enumDomain` resolves to a generated union; every entity yields exactly one interface with all its fields; every relationship endpoint exists; the matrix has every role x group cell; nav is non-empty for every internal role. A failed assertion aborts the generation with a message naming the offending source record, so a bad source is caught at generation, not at runtime.

## What is NOT generated (authored by hand)

To be clear about the boundary: the data dictionary itself (the source), the state-machine definitions (`schema/state-machines.ts` is authored, not generated, because guards/effects are design, not derivation), the screen specs, the copy content, the patterns, the tour script, and all prose docs are hand-authored. Generation applies only to the mechanical projections of those sources into a second format (types from fields, matrix-as-json from matrix-as-md, etc.).
