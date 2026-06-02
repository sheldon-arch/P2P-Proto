# Schema and State Machines

The buildable schema layer, derived from the data dictionary (`../data-dictionary/`) and the ontology (`../../model/ontology.md`). This is what the prototype's types, forms, and mock service layer consume.

## Files
- **`enums.ts`** - 25 TypeScript union types, one per controlled vocabulary (ontology section 4). Auto-generated; the single source of every dropdown's value set.
- **`types.ts`** - 57 TypeScript interfaces, one per entity, 627 fields, with the label as a trailing comment per field. Auto-generated from the dictionary. Optional vs required follows each field's `mandatory` flag; enums reference `enums.ts`; arrays follow `cardinality: many`.
- **`state-machines.ts`** - 11 lifecycle state machines (requisition stage + status, approval completion, supplier + item lifecycle, PO, installment, match, NCR, return) as `{states, transitions:[{from,to,on,guard,effect,role}]}`. The UI reads these to render ONLY legal transitions; the mock service layer (task #9) uses them as the only mutators, so illegal states are unreachable. Every guard is axiom-backed (A1-A15).
- **`erd.md`** - entity-relationship diagram (Mermaid erDiagram), 211 relationships across 57 entities, auto-derived from each entity's declared `relationships[]`.

## Why this matters
- Types + enums give the build compile-time safety and stop dropdown drift.
- The state machines are what make the prototype feel real: an Approve button only appears on an AWAITING_APPROVAL stage; a PROCESSED installment shows no Process button; an APPROVED vertical cannot be reassigned. The legal-transition rendering is driven by config, not hand-coded per screen.
- The ERD gives the mock-data layer referential integrity (the seed, task #3, must respect these FKs).

## Regeneration
`enums.ts`, `types.ts`, `erd.md` are generated from the dictionary; re-run the generator if the dictionary changes. `state-machines.ts` is hand-authored from the ontology axioms and data-model state machines (verified consistent with the dictionary lifecycle enums).

## Verification (2026-05-31)
57 interfaces, 25 enums, 11 state machines, 211 relationships; all files brace-balanced; enum unions match ontology section 4; lifecycle state names match the dictionary `lifecycleEnum` fields.
