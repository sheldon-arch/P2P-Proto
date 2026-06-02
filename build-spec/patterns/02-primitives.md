# Primitives and the Raphe-to-shadcn Mapping

The base components every pattern composes, and how Raphe's `@repo/ui` inventory ([[raphe-ui-ux-reference]]) maps to shadcn. Because Raphe is already Radix-based and shadcn is Radix + Tailwind, the mapping is 1:1; this is a transcription, not a redesign. The skin comes from `01-design-tokens.md`; this file is the component set and the field-control mapping.

## Raphe @repo/ui -> shadcn primitive map

| Raphe `@repo/ui` | shadcn primitive | Notes |
| --- | --- | --- |
| Card / CardHeader / CardContent / CardFooter | `card` | flat 1px border per our tokens, not a shadow |
| Separator | `separator` | |
| Tabs / TabsList / TabsTrigger / TabsContent | `tabs` | URL-synced active tab |
| ScrollArea | `scroll-area` | |
| ResizablePanelGroup / Panel / Handle | `resizable` | the detail two-panel (ticket-detail baseline) |
| Input (text/number/date) | `input` | type via prop; number is `type=number` step any min 0 |
| Textarea | `textarea` | auto-grow |
| Checkbox | `checkbox` | |
| Switch | `switch` | config toggles on admin/edit forms |
| Combobox / SearchableSelect | `combobox` (Command in Popover) | heavy searchable select for large lists (supplier/item/UoM) |
| Select (small lists) | `select` | bounded enum lists |
| MultiSelect | `combobox` multi | routing-rule assignees, faceted filters |
| Badge / EnumBadge | `badge` -> our StatusBadge | status colors via the map in `01` |
| Dialog | `dialog` | modal create/edit/upload, confirms |
| Popover | `popover` | inline cell editors, stage-advance, date hints |
| AlertDialog / CustomAlertDialog | `alert-dialog` | destructive confirms (`../copy/03-messages.md`) |
| Tooltip | `tooltip` | acronym expansions, FX rate/as-of, helper text |
| Sonner toast | `sonner` | success/error toasts |
| Button (default/outline/ghost/destructive) | `button` | same variants |
| Skeleton (typed) | `skeleton` | per-archetype skeletons |
| CustomTable (TanStack Table wrapper) | `data-table` (TanStack Table + shadcn table) | our DataTable shared component |
| PaginationControls | part of DataTable | server or client paging |
| Searchbar | `input` + debounce | 400ms server / immediate client |
| DataLoader | our Loader | spinner + message |
| EmptyMessage | our EmptyState | icon + line + optional CTA |
| DownloadTemplateBanner / FileUploadFormFooter / *SampleFormat | our FileUpload + ImportDialog | bulk import |
| PermissionsSelector | our PermissionsSelector | inherited-vs-selectable (admin) |

Net-new shadcn primitives the model needs that Raphe did not use: `stepper` (wizard), `chart` (Recharts wrapper for dashboards, Raphe had charts but we standardize), `command` palette (global search / role-switcher), `calendar`/date-range (cashflow window). All standard shadcn or shadcn-compatible.

## Value-type to control map (the field engine, generalized)

The model's dynamic field config (`FieldConfig`, our generalization of Raphe's `FIELDS_CONFIG` + `ApprovalField`) drives forms: a field's `dataType` selects its control, its `enumDomain` populates options, its `isAuto` makes it read-only, its `mandatory(+condition)` drives validation, its owning role/stage drives editability. The FieldRenderer component (`04-shared-components.md`) is this map.

| Field dataType (data dictionary) | Control | Notes |
| --- | --- | --- |
| `text` | Input (text) | |
| `textarea` | Textarea | auto-grow; char limit from validation |
| `number` / `integer` | Input (number, step any, min 0) | paired with UoM where applicable |
| `money` | money Input + currency prefix | shows base-currency `≈` secondary line on read (`../copy/02`) |
| `date` | Input (date) / Calendar | display DD-MMM-YYYY |
| `boolean` | Switch (edit form) / StatusBadge (read) | never raw true/false (`../copy/02` boolean rules) |
| `enum` (bounded) | Select | options + labels from `../copy/01` |
| `enum` (large) / `reference` | Combobox | datasource lookup; shows display field not id; supplier/item/UoM use the heavy combobox |
| `file` | FileUpload | filename stub in the demo |
| `json` (remarks/override/attachments) | structured component | timeline / override card / file list, never raw JSON |
| `computed` (`isAuto`, formula) | read-only display | greyed, recomputed by the mock layer (`../schema/state-machines.ts` effects), never user-typed |

Rules carried from Raphe's field engine, generalized:
- A field is **read-only to non-owners**: editability = field's owning role/vertical matches the current user's stage ownership. Non-owners see the value, cannot change it.
- **Stage/scope keying**: the same record shows different fields as it advances stages; ticket-level fields render once, line-level fields render per line. The FieldRenderer reads `getFieldsForStage(stage, scope)` from the field config.
- **isAuto fields gate stage progression** (axiom A2): a stage cannot advance until its mandatory fields are filled; the FieldRenderer surfaces which are missing (`err.stage.gate` in `../copy/03`).

## Buttons and actions

- Primary action per screen uses the `--primary` solid button; secondary actions use outline; destructive (cancel, suspend, offboard, reject) use the destructive variant and an AlertDialog confirm.
- Every action button is gated by `useCan` / `canWithCondition` (`../ia/rbac.ts`) and by the legal state-machine transitions; an unavailable action is hidden. No orphan buttons (the screen-spec rule).
- Action labels are verb phrases from `../copy/` ("Issue PO", "Raise NCR", "Request approval"), sentence case.
