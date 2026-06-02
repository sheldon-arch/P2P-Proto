# UI Copy / Label Layer and Terminology Audit

Task #7 of the pre-prototype readiness set (`docs/2026-05-31-pre-prototype-readiness.md`, item #7). This is the layer that sits between the model and the screen: it maps every technical field name, enum value, computed expression, and exception code to the exact words a user reads. Nothing in the model vocabulary (`totalAmountInBase`, `isAutoApproved`, `PARTIAL_DELIVERY`, `BadRequestException 'No eligible approver'`) may reach the screen. This layer is the single source of user-facing strings; screens and components import from it rather than hand-typing labels, so the words cannot drift screen to screen.

## Why this is its own layer (intent)

Three failure modes this prevents:
1. A raw enum or camelCase field name shows on screen (`PENDING_ONBOARDING`, `grIrEntry`), which reads as unfinished software.
2. The same concept is worded two ways on two screens ("Vendor" here, "Supplier" there; "Delivery" vs "GRN"), which reads as two teams who never talked.
3. A wrong or imprecise domain term is used ("invoice check" instead of "three-way match", "delivery note" instead of "Goods Receipt"), which a procurement professional in the room catches in the first minute and reads as a toy.

The terminology audit (this file plus `05-terminology-audit.md`) makes the third non-negotiable: there is one correct word per concept, it is the industry term, and it is used everywhere.

## Files in this layer

- **`_SCHEMA.md`** (this file): conventions, the label-resolution rules, the no-leak rule, and how screens/components consume the layer.
- **`01-enum-labels.md`**: every enum domain (26) with each raw value mapped to its display label, the optional short helper/tooltip, and the status-color token (ties to task #8's status-color map). This is the largest mechanical piece; it is the authority for every Badge, Select option, and filter chip.
- **`02-field-labels.md`**: the field-name → label map for the fields most likely to leak (auto/computed/system fields), grouped by entity. The dictionary already carries a `label` per field; this file is the override/confirmation list plus the rule that the dictionary label is the default. It also defines the unit/format suffixes (currency, %, days, qty + UoM).
- **`03-messages.md`**: human-readable validation messages, action confirmations, success/error toasts, and the model's internal exception strings rewritten for users. One row per message with the trigger (the model rule or guard) it corresponds to.
- **`04-empty-states.md`**: the empty-state copy for every queue/list/panel, per role where it differs, following the Raphe `EmptyMessage` pattern (icon + one line, sometimes a CTA). Never a blank table.
- **`05-terminology-audit.md`**: the controlled vocabulary. The one correct term per concept, the wrong terms it replaces (the "never say" list), Incoterm/tax/currency display rules, capitalization and abbreviation policy, and the acronym-on-first-use rule.

## Label resolution (the rule the prototype follows)

For any field rendered on a screen, the label is resolved in this order:
1. An explicit override in `02-field-labels.md` (only where the dictionary label needs context the bare label lacks, e.g. disambiguating two "Status" fields on one screen).
2. The `label` property in the data dictionary (`build-spec/data-dictionary/<Entity>.json`). This is the default and covers the overwhelming majority of fields.
3. Never the raw field `name`. If neither 1 nor 2 exists, that is a bug to fix in the dictionary, not a fallback to camelCase.

For any enum value rendered (Badge, Select, filter), the label is the display label in `01-enum-labels.md`, keyed by `<EnumDomain>.<RAW_VALUE>`. Never the raw value.

## The no-leak rule (the credibility gate)

These never appear in any user-facing string. They are model/code identifiers only:
- Raw enum values: `PENDING_ONBOARDING`, `PARTIAL_DELIVERY`, `THREE_WAY`, `price-variance`, `ADVANCE_100`, `READY_FOR_APPROVAL`, etc. Always rendered through `01-enum-labels.md`.
- camelCase / system field names: `totalAmountInBase`, `isAutoApproved`, `projectOrCostCenterId`, `grIrEntry`, `lastPurchasePrice`, `postValueSync`. Always rendered through the dictionary label or `02-field-labels.md`.
- Exception/guard strings from the model: `BadRequestException`, `'No eligible approver'`, `'Cannot advance: mandatory fields missing'`, `ForbiddenException`, HTTP status text. Always rewritten via `03-messages.md`.
- Axiom codes (A1-A15), SCOR codes (S1.1, OE4), ISO clauses (ISO 8.4): these are model-traceability metadata, never shown to a user. They may appear in admin/debug tooling only, never on a transaction screen.
- Internal role keys (`finance_maker`, `budget_owner`): shown as the role display name ("Finance (Maker)", "Budget Owner") from the role model.

A pre-ship check greps the built screens for any raw enum value, any of the leak-prone field names, and the exception strings; a hit is a defect.

## Style (inherited from the user's global rules)

- Plain professional English. No marketing words (no "seamless", "powerful", "unlock", "effortless").
- No emojis in any user-facing string.
- No em dashes. Use commas, colons, parentheses, or restructure. Plain hyphens and en-dash ranges are fine.
- Sentence case for labels and buttons ("Request approval", not "Request Approval" and not "REQUEST APPROVAL"), except proper nouns and established acronyms (GRN, RFQ, PO, OTIF, AVL, COA, GR/IR, PPV, DPO, NCR, CAPA, HS code, Incoterm names).
- Direct and short. A button is a verb phrase ("Issue PO", "Raise NCR"). A label is a noun phrase ("Landed cost", "Need-by date").
- Domain terms are exact (see `05-terminology-audit.md`). A wrong term is a defect even if the sentence is grammatical.

## Consumption

The prototype exports this layer as typed constants (task #9 scaffolds the file; this spec is the content authority):
- `enumLabels[domain][rawValue] -> { label, helper?, color }` from `01-enum-labels.md`.
- `fieldLabel(entity, field) -> string` resolving via the rules above (override map + dictionary).
- `messages.<key> -> string | (ctx) => string` from `03-messages.md`.
- `emptyState[queueKey] -> { icon, line, cta? }` from `04-empty-states.md`.

Components (Badge, Select, Form labels, EmptyMessage, Toast) never inline a string; they read from these maps. That is what keeps the words consistent and lets the terminology audit be enforced in one place.
