# Consolidated Test Plan

How the prototype is verified end to end. The per-artifact specs each carry acceptance criteria; this consolidates them into one layered strategy so that when the build runs, every layer has a defined way to prove it works. The bar (from the project mandate): every field, flow, screen, role, and rule has explicit intent and behaves as the model says.

Stack under test: Next.js + TanStack Query + shadcn + MSW + the in-memory store, with the state-machine transitions as the only mutators. Test tooling: Vitest (unit/integration), React Testing Library (component), Playwright (end-to-end), plus the bespoke `tour-lint` and a seed-integrity check.

## The test pyramid (what is tested where)

| Layer | Tool | What it proves | Volume |
| --- | --- | --- | --- |
| Seed integrity | a check script | the demo data is internally consistent and deterministic | 1 suite |
| Unit: transitions + guards | Vitest | every state-machine transition is legal-only and runs its effect | per transition (10 machines) |
| Unit: services + selectors | Vitest | list/get/create/update/transition + fx/budget/match/scorecard compute correctly | per service |
| Component | RTL | each shared component + each screen renders its five states and gates controls | per pattern + per hero screen |
| Integration | Vitest + MSW | a mutation flows hook -> MSW -> service -> store -> event -> re-query | per flow seam |
| End-to-end | Playwright | the golden path runs across roles and the numbers match | the 8-beat path |
| Guided demo | tour-lint + Playwright | the tour drives the real app and narration matches data | the tour |
| Static / lint | tsc + eslint + grep gates | no leaked enums/field names, no banned terms, types align | CI gate |

## 1. Seed integrity (the data the whole demo rests on)

Re-run `seed/generate.py` and assert (already verified once; this keeps it true):
- Deterministic: two runs produce an identical hash.
- Referential: every FK resolves (supplier/item/project/user/currency).
- Date order: PO after requisition approval, GRN after PO, invoice after GRN, payment after invoice; no payment before its invoice.
- KPI bands: OTIF 88-96% (seed ~93.9%), perfect-order strictly below OTIF (seed ~88.9%, 0 violations), DPO 35-60d (seed ~44.6), spend ~$125M, grades not all A (25/18/3).
- Hero records present with their exact figures (REQ-HERO, RFQ-HERO quotes Synthex/Helvetia/BioCore landed 155.26/169.77/179.93, the 4 invoice exceptions, the partial + overdue installments).

## 2. Unit: state-machine transitions and guards (the core correctness)

For each of the 10 state machines (`schema/state-machines.ts`), per transition:
- the transition fires from a legal `from` state and is rejected from any illegal state (IllegalTransition);
- the guard passes when its condition holds and throws the mapped user error when it does not (the guard map in `mock-and-tech-spine/03`);
- the effect runs (budget commits on PO issue, scorecard recomputes on NCR, GR/IR relieves on match clear, commitment relieves to actual on complete);
- an audit entry is appended and an event is emitted;
- re-entry is idempotent (an already-applied transition is a no-op, not a double-fire).

Specific high-value guard tests: no self-approval (A6), maker != checker, receiver != invoice approver, over-limit routes up (A7), supplier must be ONBOARDED to award, budget over needs an override (A4), COMPLETED only when A3 holds, THREE_WAY iff a GRN exists (A8).

## 3. Unit: services and selectors

- Each `EntityService` list/get/create/update: filters/sorts/paginates; create assigns the immutable identifier (A1) and the initial state; update rejects state-field edits.
- `fxService.toBase`: converts via the rate table; the degradation path returns "rate unavailable" and money display drops the base line (A12).
- `budgetService`: availableFor = budget - committed - actual; commit reduces available; over-commit requires an override.
- `matchService`: TWO_WAY vs THREE_WAY by GRN existence; tax-inclusive tolerance; duplicate detection by supplier+invoiceNo+amount; the right typed exception and routing target per case.
- `scorecardService`: OTIF two-factor and perfect-order four-factor computed distinctly, perfect-order < OTIF, compliance as a gate not a weighted input (A14, A15).
- `analytics` selectors: hard savings and cost avoidance kept separate (never summed).

## 4. Component (RTL): the five states and the gates

For each shared component (`patterns/04`) and each hero screen, render and assert:
- the five states: loading (skeleton), empty (the right copy from `copy/04`), error (toast), populated, permission-denied (control hidden / Unauthorized).
- no inline strings: labels come from the copy layer; StatusBadge renders the display label + the right color token (never a raw enum); FieldRenderer renders the dictionary label (never a camelCase name).
- gating: an action the role lacks permission for is hidden (useCan); an action for an illegal transition is hidden; SoD-conditional actions are hidden for the disallowed actor.

Hero-screen component tests (from the sketches `ux/01`):
- S04.4: ranking sorts on landed total, not unit price; toggling reorders columns; the cheapest-unit and lowest-landed cells are in different columns and highlighted distinctly; damage shown outside the total; Select disabled until a non-top-pick justification; regulated Select hard-blocked until QC approve.
- S09.3: GRN pane present only on three-way; the failing leg highlighted; the duplicate-hold banner; "Run match" yields auto-clear or a typed routed exception.
- S12.1: OTIF and perfect-order are distinct tiles with the "below by construction" note; savings hard vs avoidance separate; formula on hover; no AI/ML label anywhere.

## 5. Integration (MSW): the seams

For one representative flow per seam, drive the real hook and assert the propagation:
- mutation -> MSW handler -> service.transition -> store mutated -> event emitted -> QueryEventBridge invalidates -> dependent query refetches. The canonical case: "Issue PO" updates the PO status, commits the budget, and the budget query (if mounted) recomputes; "Approve" moves the row out of the approver's queue; "Run match" (clear) makes the invoice eligible for payment.
- the event-to-invalidation map (`mock-and-tech-spine/04`) is honored for each event.

## 6. End-to-end (Playwright): the golden path

Run the 8-beat path across role switches on a freshly reset store, asserting the narrated numbers equal the rendered values at each beat:
1. Requester raises REQ-HERO; the over-budget banner shows.
2. Approver: carton auto-approves, API routes to manual; self-approval blocked.
3. Buyer: the comparison ranks Synthex lowest landed (155.26) above Helvetia (169.77) despite Helvetia's cheaper unit; +7% spike on BioCore; non-top-pick justification enforced.
4. Supplier portal: acknowledges PO-HERO (the portal seam, mock supplier session).
5. Receiving/Quality: carton +7% tolerance amends PO; API lot fails QC; COA hard-block; NCR raised.
6. Quality: CAPA opened; Synthex grade drops; near-suspend banner.
7. Finance: price-variance routed to Buyer; duplicate held; maker prepares, checker releases (distinct users).
8. Management: OTIF 93.9% vs perfect-order 88.9%, DPO 44.6d, spend $125M, Synthex dropped grade visible, budget commit-vs-actual.

Determinism check: reset and re-run produces identical numbers; chapter-jump fast-forward reaches the same state as a linear run.

## 7. Guided demo

- `tour-lint`: every step's anchor exists in the registry, every route in the route map, every persona in the seed, every narration key + interpolation token resolves; no banned "AI"/"ML" substring.
- Playwright (Watch mode): the tour runs start to payoff with only Next, switching personas, firing real transitions, advancing on events; each chapter's narrated figures equal the rendered values.
- Playwright (Try-it on the two marquee steps): the viewer's real action advances; a wrong click nudges, not breaks.
- DevTools credibility (manual or trace): MSW requests, store mutations, and audit entries are visible during a run (it drives the real app, not a recording).

## 8. Static gates (CI)

- `tsc` clean; types generated from the dictionary match the schema.
- eslint clean.
- The copy-layer grep gate (`copy/05`): no raw enum value, leak-prone field name, exception/guard string, axiom/SCOR/ISO code, internal role key, the word "ticket", or "vendor" (outside "AVL") in the built UI.
- The honesty gate: no "AI"/"ML"/"smart"/"predictive" in user-facing copy or narration.

## CI sequence and gating

On each change: tsc + eslint + the grep gates (fast, always) -> unit (transitions, services) -> component -> integration -> seed integrity -> tour-lint. The full Playwright e2e + tour runs on the golden-path branch and before a demo build. A red unit/guard test or a grep-gate hit blocks; these are the cheapest defenses of the two things that make or break the prototype: correct state transitions and no leaked/wrong terminology.

## Mapping back to the artifacts

Each test traces to the artifact whose criteria it enforces: seed integrity -> #3; transitions/guards -> #2; services -> #9; component states + gates -> #7 (copy) + #8 (patterns) + #6 (RBAC); hero screens -> #4 + `ux/01`; e2e -> #5 (storyboard); tour -> #10. A failing test names the model rule (axiom / guard / SCOR-ISO) it defends, so a failure points at the spec, not just the code.
