# Pre-Prototype Readiness Checklist

What must exist before building the shadcn prototype, synthesized from three independent senior reviews: a software architect, a product manager, and a procurement/supply-chain executive. The model (Phases A-E) is complete and strong at the process/data/rule/role layer. The gap all three identify is the same: the entire UX/build-definition and demo-data layer does not exist yet. None of the items below are new domain research; they are assembling and formalizing the rich model into buildable, populated, navigable product form.

Consensus headline: the model earns credibility; the DATA and the UX-definition will make or break the prototype. The three reviews agree on the dependency order and on what is must-have vs nice-to-have.

## The three lenses, in one line each
- **Architect:** consolidate the scattered field detail into one machine-readable data dictionary + formal schema + state-machine config, then everything else (types, forms, mock API, RBAC, seed) is mechanical.
- **PM:** the model is a process model, not a product; build the screen inventory, the demo golden-path storyboard, per-role homes, the MVP cut, and the copy/label layer.
- **Procurement exec:** empty tables kill it; build one coherent fictional company with a believable, internally consistent, defensibly-numbered seed dataset and live in-flight exception scenarios.

## MUST-HAVE before the prototype (in dependency order)

### 1. Consolidated data dictionary (machine-readable) [architect M1, PM, exec]
One authoritative structured file (JSON/TS), one record per field per entity: type, nullability, mandatory(+condition), default, validation, enum value set, computed-vs-entered (+formula), reference target+display field, owning role, isAuto. Source content already exists, dispersed across `model/data-model.md` and the 25 companion field tables; this is consolidation, not invention. Drives TypeScript types, Zod schemas, form fields, dropdowns, and seed-data generation. Highest-leverage single item. ~1-2 days.

### 2. Formal schema + state-machine config [architect M2]
ERD with keys/cardinality/FKs; a TypeScript type per entity; each lifecycle as a `{states, transitions:[{from,to,guard,action}]}` config so the UI renders only legal transitions (no Approve on an approved record). Guards already written in `data-model.md`. Consumes #1. ~1 day.

### 3. The seed / demo dataset [exec 1-5, architect M5, PM 6] - resource this properly
One coherent fictional company (the exec recommends a mid-market OTC/personal-care manufacturer so regulated RM, artwork/NPD, imports, and food/pharma KPIs all light up; base currency configurable). Then:
- ~40-60 suppliers with correct code format, region-appropriate names, currency mix, valid tax IDs (GST/PAN/VAT formats), a realistic AVL grade spread (not all A), at least one SUSPENDED and one OFFBOARDED, ISO attributes populated on the strategic ones.
- ~150-300 items with real part numbers, correct stock-vs-purchase UoMs, plausible HS codes, realistic prices + lastPurchasePrice (seeds savings/spike), lead times, source priority, primary supplier links.
- ~12 months of historical transactions so KPIs COMPUTE to defensible values (do not hand-type dashboard numbers). Defensible bands: OTIF 88-96%, perfect-order 5-15 pts below OTIF, DPO 35-60d, req-to-PO 7-10d, spend-under-management 60-85%, hard savings 2-8%, maverick 10-25%, 3-way-match exception 10-25%. Avoid the fakeness tells: 100% OTIF, 0% defects, every supplier exactly 95%, savings that sum hard+avoidance, perfect-order above OTIF.
- Live in-flight scenarios parked at every interesting state: a requisition awaiting approval (one just under and one just over the auto-approval threshold), a live RFQ with >=3 quotes where the cheapest unit price is NOT the lowest landed cost, a partially-delivered PO, an invoice in each exception type + a duplicate-invoice hold, an open NCR->CAPA with a supplier about to be SUSPENDED, an active RMA with a credit note, installments incl. a partial+remainder and an overdue, an expiring permit.
- Deterministic, re-runnable, pinned to a demo "today" date so need-dates/overdue/expiry alerts sit sensibly and dates respect lead times and process order. ~3-5 days; the single most important item for credibility. Consumes #1/#2.

### 4. Screen inventory (flow x role -> screen) + acceptance criteria [PM 1+8, architect]
A table mapping each must-build flow and role to specific screens: purpose, fields shown (from the field tables), actions (from the permission matrix), entry/exit, which BPMN tasks collapse onto it, and a short "believable done" checklist per screen tied to the model rule it demonstrates. ~35-50 screens for the MVP. Screen-list + component-list + actions is enough; pixel-level layout is NOT required before building (shadcn primitives impose sensible default layout) EXCEPT for the 3-4 hero screens (#6). ~2-3 days.

### 5. MVP slice + demo golden-path storyboard [PM 2+4, exec]
Cut the 25 flows into Build-real (~8-9: requisition, approval+auto-approval, sourcing/landed-cost, PO, delivery/GRN/QC, invoice/3-way-match, payments, returns/NCR/CAPA, analytics/scorecard, + supplier onboarding to "active supplier exists"), Show-light (configuration, item onboarding, supplier portal slice, budget, cash float), and Roadmap (the rest, many of which are rules visible INSIDE built flows - tolerance, currency degradation, duplicate detection - shown as inline badges not separate screens). Then a scripted golden path: one requirement followed across role switches with the wow beats foregrounded. Wow-factor ranking: (1) landed-cost comparison that reorders the ranking, (2) supplier scorecard + AVL + the CAPA-to-suspend loop, (3) nearest-bucket auto-approval + financial revert, (4) three-way-match exception routing, (5) budget commitment vs actual. ~1 day.

### 6. Navigation / IA + app shell + per-role home + RBAC switching [architect M4+M9, PM 3+7]
The global shell (sidebar+topbar+content), the route map, per-role nav visibility derived mechanically from the permission matrix, and a per-role landing ("first 30 seconds": each persona lands on their queue + KPI tiles + primary CTA, never an empty page). A demo role-switcher to hop personas live. A `useCan(permission)` resolver that actually gates nav and buttons (granted/none exact; conditional/SoD approximated for the demo). Hero homes get real layout sketches. ~1.5-2 days.

### 7. UI copy / label layer [PM 5, exec 6]
Map technical field names and enums to user-facing labels, helper text, and human-readable validation/error messages (the model says `totalAmountInBase`, `isAutoApproved`, `BadRequestException 'No eligible approver'` - none can appear on screen). Plus empty-state copy for every queue. AND the terminology audit (exec): exact domain vocabulary is non-negotiable - "Goods Receipt/GRN" not "delivery confirmation", "three-way match" not "invoice check", Incoterms with a named place ("FOB Nhava Sheva"), "landed cost", "AVL", "COA", "PPV/OTIF/DPO", "encumbrance/commitment", "GR/IR", tax terms distinct. A single wrong term signals a toy. ~1-1.5 days. (Follows the user's plain-professional, no-em-dash, no-marketing style.)

### 8. shadcn component/pattern library [architect M3]
Map the ~7 recurring archetypes to shadcn primitives and build each once: master-list (DataTable + faceted filter + row actions + status Badge), detail/transaction form (Form + react-hook-form + Zod from #1 + Card sections + Tabs + Sheet), approval queue, comparison table (the landed-cost screen), wizard (onboarding/import), dashboard (KPI Cards + charts), match/exception workbench. Plus the status-color map tied to the state enums (APPROVED=green, exception/NCR=red, AWAITING=amber, DRAFT=grey) and the empty/loading/error states. Agree before parallel screen work or screens diverge. Catalog ~0.5 day; reference components are part of the build.

### 9. Mock data/contract layer + tech spine [architect M6+M8]
A typed service interface per entity (list/get/create/update/transition) over an in-memory store seeded from #3, with the state-machine transitions (#2) as the only mutators (so the UI cannot reach illegal states), optionally behind MSW so the network looks real. Actions have effects (approve moves it out of the queue, issue PO commits budget, match clears the exception) - this interactivity is the whole demo. Tech decisions: Next.js App Router (recommended), TanStack Query over the mock client, Zustand/Context for UI/session/role-switch, react-hook-form+Zod, a simple event bus that mimics the SSE "re-query on event" design. ~2-2.5 days once #1/#2/#3 exist.

## NICE-TO-HAVE (prototype can ship without)
- Real auth (OTP/SSO) - fake login + role-switcher instead.
- Live FX / real document storage / real bulk-import parsing - mock (static rate table with a degradation toggle, filename stubs, canned import result).
- Real analytics computation engine - precompute scorecard numbers in seed data; charts read static-but-believable values.
- Full conditional-permission + SoD enforcement - hard-code a couple of SoD blocks on the hero path.
- Responsive/mobile + RTL/i18n (Arabic) + timezone - desktop-first, English/LTR; a11y inherited from shadcn/Radix.
- Notification center / activity feed - seeded queue badges suffice; the bell is high impact-to-effort but optional.
- Branded PO/RFQ PDFs, realized FX gain/loss, forecast-vs-actual, multi-plant spend split, audit-log diff viewer - polish after the data is right.
- Pixel layout mockups for non-hero screens - shadcn defaults suffice.

## Answers to the specific questions asked
- **Map each field, its definition, dropdown values?** Yes - this is must-have #1 (consolidated data dictionary). All three reviewers rank it (or the data it feeds) as the top dependency. The content already exists in the companion field tables; it needs consolidating into one machine-readable file.
- **Define all roles and everything clearly?** Largely done (role-model + role-permission-matrix + ontology). What is left is operationalizing it: per-role nav + landing + the RBAC resolver in the prototype (must-have #6).
- **Define the UX across each screen for each flow and role, and where everything is placed?** Define WHAT each screen shows + its actions + priority order (must-have #4 screen inventory) - yes. Define WHERE everything is placed pixel-by-pixel - only for the 3-4 hero/demo screens; for the rest, the shadcn component choice plus a priority-ordered content list is sufficient and faster. All three reviewers agree: screen-list + component-list + actions is the right granularity; full layout mockups everywhere is over-investment.
- **shadcn as the UI kit?** Endorsed by the architect; it gives baseline a11y (Radix), a sane default layout (so per-screen pixel specs are unnecessary for non-hero screens), and a DataTable/Form/Dialog/Select/Combobox/Tabs/Card/Badge/Sheet/Command/Toast set that maps cleanly to the ~7 archetypes. Use TanStack Table for DataTable, react-hook-form + Zod for forms.

## One correction worth carrying forward (PM)
There is no AI/ML in the model. "AI sourcing" in the analysis is a label for manual market-scanning. Do not pitch anything as "AI" without a model behind it - a technical investor will catch it. Position the genuinely impressive, system-computed capabilities honestly: automated nearest-bucket approval, normalized landed-cost decision support, the two-stage scorecard, the closed CAPA loop.

## Recommended sequence and rough effort
Foundation (consumes nothing, gates everything): #1 data dictionary (1-2d) -> #2 schema/state machines (1d). In parallel after #1/#2: #3 seed data (3-5d, resource it), #5 MVP+storyboard (1d, do early - it shapes #3 and #4). Then #4 screen inventory (2-3d), #6 IA/shell/RBAC (1.5-2d), #7 copy/labels (1-1.5d, parallelizable), #8 pattern library (0.5d catalog), #9 mock layer/tech spine (2-2.5d). Roughly 2-3 weeks of definition+scaffolding work before productive screen-building, most of it assembling the existing model rather than new design. Skipping it does not save time; it moves the work into the build where it is more expensive and less coherent.

Source: independent reviews by senior software-architect, senior-PM, and senior-procurement-executive personas (2026-05-31). Ontology: `../model/ontology.md`. Model: `../model/`, `../documentation/`.
