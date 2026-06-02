# Copy / Label Layer

Task #7 of the pre-prototype readiness set. The single source of every user-facing string in the prototype: field labels, enum display values, validation and error messages, empty states, and the controlled vocabulary. It sits between the model (which speaks in `totalAmountInBase`, `PENDING_ONBOARDING`, `BadRequestException`) and the screen (which must speak plain, exact, consistent procurement English).

Baselines: the Raphe as-built reference UI ([[raphe-ui-ux-reference]], `UI-UX Reference/`) for the copy patterns (the `EmptyMessage` one-liner, sonner toast wording like "Import complete: N created, N updated", the `DataLoader` "Loading X..." form), and the data dictionary (`../data-dictionary/`) for the canonical field labels. Terms are generalized from both source companies (Al Bahja, Raphe) to vendor-neutral industry vocabulary.

## Files

| File | What it is | Authority over |
| --- | --- | --- |
| `_SCHEMA.md` | conventions, label-resolution rule, the no-leak rule, style, consumption | how the layer is structured and used |
| `01-enum-labels.md` | all 26 enum domains, each raw value to label + helper + color token | every Badge, Select option, filter chip |
| `02-field-labels.md` | label-resolution rule + context overrides + value-formatting (money, dates, qty, %, booleans, refs) | every field label and value rendering |
| `03-messages.md` | validation, confirmations, success/error toasts, rewritten exceptions, inline rule banners | every system-spoken string |
| `04-empty-states.md` | empty-state copy per queue/list/panel/dashboard, per role | every empty view |
| `05-terminology-audit.md` | the controlled vocabulary, never-say list, Incoterm/tax/currency notation, acronym policy, the grep gate | the exact word for every concept |

## How it is consumed (task #9 builds the file; this is the content authority)

The prototype exports typed maps; components read from them and never inline a string:
- `enumLabels[domain][raw] -> { label, helper?, color }` (from `01`)
- `fieldLabel(entity, field) -> string` (override map in `02`, else dictionary `label`, never raw name)
- `messages.<key>` and the inline `banner.<key>` set (from `03`)
- `emptyState[key] -> { icon, line, cta? }` (from `04`)
- the acronym/expansion map and the never-say grep list (from `05`)

## Coverage (verified)

- 26 enum domains, all values from `schema/enums.ts`, every value labelled. No raw value renders.
- 627 dictionary fields: every one already carries a clean human `label`; the 487 leak-prone fields (auto/computed/camelCase/`*Id`/`is*`/`*InBase`) and the 35 boolean fields have explicit rendering rules so none surfaces raw.
- Messages tie to real model rules: every validation/error row names the guard, transition, or invariant (axioms A1-A15, the state-machine guards) it corresponds to.
- Empty states cover all 14 work queues, 20 master lists, the filter-to-empty variant, 8 detail-panel empties, and the dashboard no-data cases, gated by the same permissions as the IA (task #6).
- The nine inline rule banners are the model's distinctive logic made visible (landed-cost flip, duplicate hold, budget over, tolerance amend, cert expiry, CAPA near-suspend, overdue, price spike, finance-revert), each an acceptance criterion on its screen.

## The credibility gate

A pre-ship grep over the built UI for: raw enum values, the leak-prone field names, code-only tokens (entity camelCase like `grIrEntry`, behaviors like `postValueSync`, internal fields like `lastPurchasePrice`), exception/guard strings, axiom/SCOR/ISO codes, internal role keys, the word "ticket", and "vendor" (outside "AVL"). Any hit is a defect. The terminology audit's wrong-term column is part of the same grep. This is what keeps the prototype from reading as a toy.

Feeds: every screen (`../screens/`) for its labels and acceptance copy; task #8 (the status-color map binds the enum color tokens); task #9 (scaffolds the typed export of this content).
