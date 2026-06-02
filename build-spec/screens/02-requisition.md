# Screens: 02 Requisition and Intake (Build-real)

Flow 02 realized as screens. Source: `documentation/02-requisition.md`, data dictionary `Requisition.json` / `RequisitionLine.json`, `model/role-permission-matrix.md`, state machine `requisitionStage` / `requisitionStatus`.

### S02.1 My Requisitions (archetype: list / per-role landing for Requester)
- **Route:** `/requisitions`
- **Roles:** Requester (own/department, act); Procurement/Buyer (view all in scope); others per matrix view.
- **Realizes:** entry point; the requester landing from storyboard section 6.
- **Purpose:** the requester's home - see own drafts and in-flight requisitions with status, and start a new one. Answers "what do I have going and what do I do next" in the first 30 seconds.
- **Data shown:** Requisition.identifier, date, category, priority (Badge), totalAmountInBase, stage (Badge), status (Badge), department; rows scoped to own/department (Requisition visibility invariant).
- **Primary actions:** "New Requisition" (-> S02.2; perm `requisition.create`); row click -> S02.3 detail.
- **Secondary:** search by identifier/item; faceted filter by status/stage/category/date; sort; pagination (default 10, max 50).
- **States to design:** empty ("No requisitions yet. Create your first."), loading (skeleton table), populated, error.
- **Shadcn:** DataTable, Input (search), Popover+Command (faceted filter), Badge (priority/stage/status with the status-color map), Button.
- **Acceptance criteria:** (1) only own/department rows appear (visibility scope enforced, not just filtered); (2) status/stage Badges use the canonical color map (DRAFT grey, IN_PROGRESS amber, COMPLETED green, CANCELLED red); (3) "New Requisition" gated by `requisition.create`; (4) empty state shows for a fresh persona, never a blank table.
- **Tags:** [S1.1 | AB+RA]

### S02.2 Create / Edit Requisition (archetype: form)
- **Route:** `/requisitions/new`, `/requisitions/:id/edit`
- **Roles:** Requester (own, act: `requisition.create`/`requisition.edit`/`requisition.submit`).
- **Realizes:** steps 2-3 (fill header, add lines), 4 (request new item sub-flow), 7-9 (save draft / submit), 14 (revise on send-back).
- **Purpose:** turn a need into a validated requisition with full header + line detail; the originating data-entry screen the whole cycle depends on.
- **Data shown / captured:** HEADER from `Requisition.json` - identifier (auto, read-only), date (auto), requester/department (auto), category (Select, RequisitionCategory), directOrIndirect (Select), purchaseType (Select; Import reveals HS/incoterm line fields), priority (Select), currency (Combobox, Currency master), projectOrCostCenter (Combobox, ACTIVE only), justification (Textarea, max 2000). LINES from `RequisitionLine.json` in a Sheet/Table - item (Combobox: search master OR free-text), itemCode (auto, "PENDING - New Item" if free-text), hsCode, itemDescription (auto/editable), productUsedFor, quantity (>0, decimals), unitOfMeasure (Select, UoM), unitPrice (may be 0), availableStock, needDate (datepicker >= today), lineNote, attachments. Service-category lines swap to serviceName/itemReferenceNumber/contractDuration.
- **Primary actions:** "Add line" (Sheet); "Save Draft" (status=Draft, no validation gate, `action==SAVE_DRAFT`); "Submit" (runs mandatory-field gate for INITIATION x category x purchaseType; `action==SUBMIT`; on pass status IN_PROGRESS + routes; on fail 400 with remainingStageFields).
- **Secondary:** remove line, duplicate line, attach file.
- **States to design:** empty (new), loading (edit fetch), validation-error (inline per field + a summary of remainingStageFields), saved-draft toast, submitted toast/redirect.
- **Shadcn:** Form (react-hook-form + Zod generated from the dictionary), Card (header section), Sheet (line add/edit), Select/Combobox, DatePicker, Input/Textarea, file Input, Button, Toast.
- **Acceptance criteria:** (1) every field renders with its dictionary label, type, and validation (quantity rejects <=0; needDate rejects past dates; justification caps at 2000); (2) free-text item shows "PENDING - New Item" and does NOT block submit (non-blocking new-item rule); (3) Import purchaseType reveals HS code + incoterm-relevant fields, Local hides them (field-config by purchaseType); (4) Save Draft skips validation; Submit enforces the mandatory gate and lists remaining fields on failure; (5) identifier is generated once and shown read-only, unchanged on edit (immutability A1); (6) isEmpty rule respected (0 and false count as present).
- **Tags:** [S1.1 | ISO 7.5 | AB fields + RA structure]

### S02.3 Requisition Detail (archetype: detail)
- **Route:** `/requisitions/:id`
- **Roles:** Requester (own), Buyer, Approver (in-chain), Budget Owner (cost-center), per matrix.
- **Realizes:** the read view through the lifecycle; entry to approval (03), sourcing (04).
- **Purpose:** the single record of truth for one requisition as it travels; shows where it is across the three dimensions and its full history.
- **Data shown:** all header + lines; the three state dimensions (stage, status, per-stage completion) as a progress strip; budget result + any logged override; the immutable activity log (remarks); attachments; linked RFQ/PO once they exist.
- **Primary actions (state-aware, per state machine):** "Submit" (if Draft), "Edit" (if own + editable), "Request Approval"/"Approve"/"Return for revision" (Approver, only when the active stage is AWAITING_APPROVAL/IN_PROGRESS), "Change Status" (ON_HOLD/CANCELLED with remarks), "Source" (Buyer, once approved). Buttons appear ONLY for legal transitions.
- **Secondary:** Tabs (Header / Lines / Budget / Approvals / Documents / Activity log); link to related RFQ/PO.
- **States to design:** loading, populated, permission-denied (not own/not in scope), terminal (COMPLETED/CANCELLED - read-only).
- **Shadcn:** Card + Tabs, Badge (the three dimensions), Stepper/progress strip for stages, Dialog (status change with remarks), Button group, Toast.
- **Acceptance criteria:** (1) only legal transition buttons render for the current state (no Approve unless a stage is AWAITING_APPROVAL; no Edit on COMPLETED); (2) the activity log is append-only and timestamped (cannot delete); (3) a logged budget override shows approver+reason+at; (4) SoD: the requester viewing their own requisition sees no self-approval action (A6); (5) terminal status renders read-only.
- **Tags:** [S1.1/OE2 | both]

### Inline edge behaviours shown on these screens (not separate screens)
- **Auto-create from free-text item (e05):** on S02.2 a non-UUID item line auto-creates an Item (PENDING_ONBOARDING) and shows "PENDING - New Item"; resolved by the Buyer in 07.
- **Soft budget check (e02):** on S02.2 Submit, if totalAmountInBase > budget.availableAmount, a non-blocking warning banner appears; routes to the Budget Owner override path (S03 / e02 view).
- **Currency fallback (e07):** if FX conversion fails, the base total shows the original amount with a small "rate unavailable" note (graceful degradation, never blocks).

### Per-role landing covered
S02.1 is the Requester landing (storyboard section 6).
