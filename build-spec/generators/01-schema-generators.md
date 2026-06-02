# Schema Generators (Dictionary -> Schema)

The chain that turns the data dictionary (the 57 entity JSON files, the source of truth for every field) into the TypeScript schema the prototype compiles against: the enum unions, the entity interfaces, the runtime Zod validators, and the ERD. All four read the dictionary; none is hand-edited.

## gen-enums (`schema/enums.ts`)

- **Input:** every `enumDomain` referenced across the dictionary fields, cross-checked against the ontology controlled vocabularies (`model/ontology.md` section 4). The canonical value set per domain is the ontology's; the dictionary references it by name.
- **Transform:** for each distinct enum domain, emit `export type <Domain> = "v1" | "v2" | ...;` with the values in the ontology's declared order (lifecycle enums in lifecycle order, not alphabetical, matching `copy/01-enum-labels.md`).
- **Output:** `schema/enums.ts`, the 25 union types.
- **Validation:** every `enumDomain` named by any dictionary field must produce a union (no dangling reference); every union must be non-empty; the value set must equal the ontology's for that domain (a dictionary field cannot introduce a value the ontology does not list).
- **Note:** `Currency` is a reference master (a data table), not a union; it is excluded from the enum file by design (the dictionary references it as `referenceTarget`, not `enumDomain`).

## gen-types (`schema/types.ts`)

- **Input:** the 57 entity JSON files (`data-dictionary/*.json`), each with its `fields[]` (name, dataType, cardinality, mandatory, enumDomain, referenceTarget).
- **Transform:** one `export interface <Entity>` per file. Each field maps by `dataType`:
  - `text`/`textarea` -> `string`; `number`/`integer` -> `number`; `money` -> `number` (a branded `Money` type optional); `date` -> `string` (ISO) ; `boolean` -> `boolean`; `enum` -> the generated union (`enumDomain`); `reference` -> the referenced entity's id type (`string`); `json` -> a declared shape or `unknown`; `file` -> a file-stub type.
  - cardinality `many` -> `T[]`; `optional`/mandatory `no` -> `field?:`.
  - the field's `purpose` becomes a doc comment so the type is self-documenting.
- **Output:** `schema/types.ts`, the 57 interfaces / 627 fields.
- **Validation:** exactly one interface per dictionary file; every field present; every `enumDomain` resolves to a generated union; every `referenceTarget` names a real entity; no field left as bare `any`.

## gen-zod (`schema/zod/*.ts`)

- **Input:** the same dictionary fields plus their `validation` (regex, range, cross-field) and `mandatory(+condition)`.
- **Transform:** one Zod schema per entity, field-by-field: the base type from `dataType`, `.optional()` for non-mandatory, the `validation` translated (regex -> `.regex()`, range -> `.min()/.max()`, enum -> `z.enum([...])` from the union, cross-field/conditional -> a `.refine()` with the condition). The mandatory-condition fields become `.refine()`s referencing the sibling field.
- **Output:** `schema/zod/<Entity>.ts`, the runtime validators the forms (react-hook-form resolver) and the store (on create/update) use, so client validation equals the model.
- **Validation:** every Zod schema's inferred type structurally matches the generated TS interface (a compile-time `satisfies` check), so the validator and the type cannot diverge.

## gen-erd (`schema/erd.md`)

- **Input:** the `relationships[]` arrays across all 57 entity files (each `{name, type (1:N/N:1/etc.), target, fk}`).
- **Transform:** collect all relationships, dedupe reciprocals, emit a Mermaid `erDiagram` with each entity and each relationship edge labelled with its cardinality and FK.
- **Output:** `schema/erd.md`, the 211-relationship diagram.
- **Validation:** every relationship endpoint is a real entity; every `fk` is a real field on the owning entity; no orphan entity (every entity appears in at least one relationship, except deliberately standalone masters which are listed as an exception).

## How the chain runs

`gen-enums` first (types depend on the unions), then `gen-types`, then `gen-zod` (depends on both), then `gen-erd` (independent of the others, reads only relationships). All four read only the dictionary (+ ontology for enum order); none reads another's output except types/zod consuming enums. Re-running with an unchanged dictionary produces byte-identical output (deterministic), which is what the CI drift-check asserts.

## Worked example (one field, end to end)

Dictionary `Requisition.json` field:
```json
{"name":"totalAmountInBase","label":"Total (Base Currency)","dataType":"money",
 "cardinality":"one","mandatory":"yes","computedVsEntered":"computed",
 "computedFormula":"convertToBase(totalAmount, currency)","enumDomain":null,
 "referenceTarget":null,"validation":"FX-converted; degrade to original on FX failure"}
```
- `gen-types` -> `/** Total (Base Currency) ... */ totalAmountInBase: number;`
- `gen-zod` -> `totalAmountInBase: z.number()` (computed, so not user-validated on input; the store sets it via the FX service).
- the label "Total (Base Currency)" stays in the copy layer, not the type; the type carries the `purpose` as a comment.

This is the traceability the generators preserve: one field definition, projected into the type, the validator, and (via the copy layer) the label, all from one source.
