# Screen Inventory Schema and Conventions

The flow x role -> screen map. One markdown file per flow in `build-spec/screens/` (e.g. `02-requisition.md`). Each screen is specified so a builder knows exactly what to build, with what data, which actions, for which roles, and what "believable done" means. Pixel layout is NOT specified here (shadcn primitives impose sensible default layout); the 3-4 hero screens get a layout sketch in `build-spec/ux/`. This says WHAT goes on the screen and its priority order; the component library resolves WHERE.

## Per-screen entry shape

### S<NN.n> <Screen Name>  (archetype: <list|detail|form|wizard|dashboard|comparison|queue|workbench|modal|portal>)
- **Route:** `/path/:param`
- **Roles:** which generic roles see/use it (from role-permission-matrix). Note view-only vs act.
- **Realizes:** which BPMN tasks/steps from the flow collapse onto this screen.
- **Purpose:** why this screen exists in the journey (intent).
- **Data shown:** the entities + key fields displayed (reference the data dictionary entity.field; do not redefine fields).
- **Primary actions:** the buttons/actions, each with: effect, the state transition it triggers (from state-machines.ts), and the permission + condition that gates it.
- **Secondary actions / navigation:** filters, search, links to related screens, row actions.
- **States to design:** empty, loading, error, populated, permission-denied (which apply).
- **Shadcn components:** the primitives used (DataTable, Form, Dialog, Select, Combobox, Tabs, Card, Badge, Sheet, Command, Toast, Stepper, etc.).
- **Acceptance criteria (believable done):** 3-6 bullets - what must render/work, tied to the specific model rule the screen demonstrates. This is the check that it is not dummy.
- **Tags:** [SCOR code | source]

## Rules
- Every action must map to a permission in `model/role-permission-matrix.md` and (where it changes state) a transition in `build-spec/schema/state-machines.ts`. No orphan buttons.
- Every field shown must exist in the data dictionary. No invented fields.
- Each Build-real flow lists its full screen set (list + detail + forms + modals). Show-light flows list one representative screen. Inline-behaviour edge rules (tolerance, duplicate, currency fallback, auto-create, permit expiry) are noted as a "shown inline on screen S<x>" line, not separate screens.
- Acceptance criteria must reference the model rule (e.g. "Select is disabled until a non-top-pick justification is entered", "Process button hidden on PROCESSED installments", "duplicate-invoice (supplier+invoiceNo+amount) shows a hold banner").
- Cover the per-role landing screens from the storyboard section 6.

## Archetype -> shadcn mapping (shared, see task #8 pattern library)
- list/queue -> DataTable (TanStack Table) + faceted filter + row DropdownMenu + status Badge + pagination
- detail -> Card sections + Tabs (header/lines/documents/audit) + Badge + action buttons
- form -> Form (react-hook-form + Zod from schema) + Select/Combobox + Sheet for line add/edit + file Input
- wizard -> Stepper + Form per step + review
- dashboard -> Card KPI tiles + charts (Recharts) + Tabs + Badge trends
- comparison -> bespoke side-by-side Table with highlighted best value
- workbench (match/CAPA) -> multi-pane + Select resolution + Badge
- modal -> Dialog (confirm) / Sheet (side editor)
- portal -> simplified supplier-facing Form/list, email+OTP entry

## Coverage (one file per flow)
01-configuration, 02-requisition, 03-approval, 04-sourcing, 05-purchase-order, 06-supplier-onboarding, 07-item-onboarding, 08-delivery-grn, 09-invoice-match, 10-payments, 11-returns-rma, 12-analytics, plus 00-shell-and-landings (the app shell + per-role home screens) and supplier-portal.
