# Config Generators (Matrix/Copy/Anchors)

The generators that turn the human-authored model and content files into the machine-readable config the prototype consumes: the RBAC matrix and nav config (from the role-permission matrix), the typed copy export (from the copy markdown), and the tour anchor registry (from the screens/patterns).

## gen-rbac (`ia/permission-matrix.json` + `ia/nav-config.json`)

- **Input:** `model/role-permission-matrix.md` (the role x permission-group matrix, 13 roles x 42 groups, each cell Granted / Conditional / none) plus the module map (which permission groups roll up into which of the 16 nav modules).
- **Transform:**
  - `permission-matrix.json`: the matrix as data, `{ role: { group: 'G' | 'C' | '-' } }`. Conditional (`C`) cells carry the SoD condition id (never-approve-own, receiver != invoice-approver, maker != checker, designation-rank).
  - `nav-config.json`: per role, the set of nav modules the role can see. A role sees a module if it holds any non-`-` permission in that module's representative group. Derived, not curated; this is why Receiving sees 4 modules and the Buyer 15.
- **Output:** the two JSON files in `ia/`.
- **Validation:** every role in the role model has a column; every permission group has a row; every cell is one of G/C/-; every C cell names a known SoD condition; every internal role has a non-empty nav set (the supplier routes to the portal, the one exception); the module map covers all 42 groups.
- **Consumed by:** `rbac.ts` (`useCan`, `canWithCondition`, `navForRole`), which is hand-authored and stable and reads these two JSONs.

## gen-copy (`copy/enum-labels.ts` and the message/empty maps)

- **Input:** `copy/01-enum-labels.md` (the enum -> {label, helper, color} tables), `copy/03-messages.md` (the message keys + strings), `copy/04-empty-states.md` (the empty-state keys + copy).
- **Transform:** parse the markdown tables into typed maps:
  - `enumLabels: Record<Domain, Record<RawValue, {label, helper?, color}>>`
  - `messages: Record<MessageKey, string | (ctx) => string>` (templated strings become functions)
  - `emptyState: Record<QueueKey, {icon, line, cta?}>`
- **Output:** typed TS modules under `lib/copy/`.
- **Validation:** every enum value in `schema/enums.ts` has a label entry (the same coverage check the copy audit already passed: 25/25 domains, every value); every color token is one of the seven semantic tokens; no banned "AI"/"ML" substring; no raw enum/field-name leak in any string.
- **Consumed by:** StatusBadge (`enumLabels`), Toast/ConfirmDialog/RuleBanner (`messages`), EmptyState (`emptyState`), FieldRenderer (the field label resolver, which uses the dictionary label + the override map).

## gen-anchors (`lib/tour/anchors.ts`)

- **Input:** the `data-tour-id` values declared across the screen specs (`screens/*.md`) and threaded through the pattern components (`patterns/04`), following the `{screen}.{element}[.{record}]` naming scheme (`guided-demo/03`).
- **Transform:** emit a typed registry of every anchor id as a const, grouped by screen, so the tour script references symbols (`anchors.sourcing.compare.column.synthex`) not strings.
- **Output:** `lib/tour/anchors.ts`.
- **Validation:** every id follows the naming scheme; no duplicate id without a `within` scope declared; (paired with `tour-lint`) every anchor the tour script references exists here, and every id here is reachable on its screen.
- **Consumed by:** `script.p2p.ts` (the tour steps) and `tour-lint`.

## Why these are generated, not hand-kept

The matrix, the copy, and the anchors are each authored once in a human-friendly form (a markdown table, a screen spec). Re-typing them into JSON/TS by hand is where drift creeps in: a role gets a permission in the matrix but the nav JSON is not updated; an enum gets a value but the label map is not; a screen's anchor is renamed but the tour script still points at the old id. Generating the machine form from the human source closes all three gaps, and the CI drift-check keeps them closed. The hand-authored `rbac.ts`, the components, and the tour engine consume the generated config and never embed a copy of it.
