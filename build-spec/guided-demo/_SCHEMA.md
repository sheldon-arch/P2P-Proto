# Guided Interactive Demo (IBM-Style Tour)

The 10th build-spec artifact. A self-running, click-through guided demo of the prototype that an investor or potential client runs themselves: a product tour that follows one requirement end to end across every role, the way IBM Planning Analytics does. Instead of walking each viewer through the platform, the tour walks them, narrating each step on top of the real running app.

Reference studied: the IBM Planning Analytics demo (13 screenshots in `User Flows/IBM Demo/`). Storyline + numbers reuse the existing 8-beat golden path (`../mvp-and-storyboard.md`) and the deterministic seed (`../seed/`), so the narration and the on-screen figures stay synchronized.

## The IBM pattern this replicates

1. **Title / hook screen:** dark full-screen splash; a headline, a 2-3 sentence storyline naming a protagonist + the company + a business problem, a product visual, one "Start" button.
2. **Cast screen:** dark screen; the personas (avatar + role + name) arranged around the company, a paragraph framing the cross-role collaboration, a "Let's begin" button, and a picture-in-picture preview of the upcoming UI.
3. **Guided walkthrough:** the real app runs underneath; a dark coach-mark tooltip is anchored to the relevant element (1-3 sentences of narration + a Next button + a progress indicator + the active-persona avatar). The mechanics that matter:
   - the active persona switches as the story hands off between roles;
   - each role's edit builds on the previous one (cumulative storyline);
   - real actions execute on screen (values fill in, statuses change, charts update), narrated step by step with specific numbers that match the data;
   - it ends in a combined payoff (the closed-loop analytics dashboard).

## Core principle: drive the real app, not a facade

The tour is a fourth driver of the same tech spine the screens use (session, router, query client, mutation hooks, event bus), not an overlay over a recording. Every action the tour performs goes through the same `useTransitionX` hook a user click would, so the store mutation, the audit entry, and the event emit are all real. A technical investor can open DevTools during the tour and see the MSW requests, the store mutating, and the audit trail each transition appends. That is the credibility moat over a video and the reason a generic product-tour library is insufficient (it cannot switch personas, fire state-machine transitions, or wait for events).

## Files in this artifact

- **`_SCHEMA.md`** (this file): the pattern, the core principle, the step format, conventions.
- **`01-tour-engine.md`**: the engine, the run loop, `settle()`/`anchorReady`, action firing, event-waiting, the interaction modes.
- **`02-overlay-components.md`**: the overlay UI (title, cast, coach-mark, spotlight, persona indicator, persona transition, PiP, chapter rail, mode toggle, launcher), mapped to shadcn + the pattern library + a tour-only dark token set.
- **`03-anchoring-and-authoring.md`**: the `data-tour-id` convention, the anchor registry naming, the split script/narration authoring model, the `tour-lint` check.
- **`04-tour-script.md`**: the full 8-chapter script, per step: persona, route, anchor, narration, on-enter action, advance condition, and the exact seeded numbers each step narrates.
- **`05-reset-resume-risks.md`**: reset, resume, divergence prevention, the supplier-portal seam, the honesty guardrail, the risks.
- **`README.md`**: how it consumes the other artifacts, the file/module structure, the build sequence.

## The step format (the unit of the tour)

A `TourScript` is data: ordered `Chapter[]`, each an ordered `TourStep[]`. The step is the unit. Full type in `01-tour-engine.md`; in brief, a step declares:

- `persona?` (RoleId): if set, the engine calls `setRole()` before the step (a hand-off). The supplier-portal step is a distinct type (route into the separate portal shell, not a `setRole`).
- `route?` (RouteSpec): the screen to navigate to before anchoring (static path or a template + params, e.g. `/sourcing/rfq/:reference/compare` with `reference: "RFQ-HERO"`).
- `anchor` (TourAnchor): what the coach-mark points at, by a stable `data-tour-id` (optionally scoped to a row/panel for repeated elements), or `center` for chapter-intro / payoff.
- `narration` (NarrationRef): a key into the narration file, with interpolation tokens resolved from the live query result at render time (never hard-coded numbers).
- `onEnter?` (TourAction): `none` | `pause-for-user` | `autofill` (drive a form field) | `transition` (fire a real state-machine transition) | `navigate`.
- `advanceWhen` (AdvanceCondition): `next-click` (Watch) | `wait-event` (resolve on an eventBus emit) | `wait-predicate` (poll the query cache) | `user-action` (Try-it: the viewer performs the action, the engine validates).
- `expects?`: optional precondition assertions checked against the live store on enter (divergence guard).

## Conventions

- **Numbers come from the data, not the prose.** Narration interpolates figures from the live query result; if the seed changes, the narration changes with it. A presenter cannot narrate a number the screen does not show.
- **Terminology comes from the copy layer.** Narration reuses `../copy/` (`enumLabels`, `fieldLabel`, `messages`) so the tour says "Awaiting approval", "landed cost", "non-conformance report" exactly as the app does. One terminology source, no drift.
- **No "AI"/"ML" language.** Per `../mvp-and-storyboard.md`, the honesty guardrail holds; narration uses the accurate system-capability terms. A lint rule bans the substrings.
- **Anchoring is by `data-tour-id` only**, never class/text/nth-child. The attribute is owned by the tour layer and threaded through the shared pattern-library components.
- **Deterministic.** Restart resets the store to the pinned seed (RNG 20260601, demo-today 2026-06-01); every run produces identical numbers.

## Scope and sequencing (locked with the user)

- **Interaction mode:** support both, default to Watch (auto-drive, cannot get stuck, the self-serve default), with a per-step opt-in Try-it on key moments.
- **Coverage:** the full 8-beat golden path, end to end across all role hand-offs.
- **Sequencing:** co-build the `data-tour-id` anchoring as the golden-path screens are built (avoid a retrofit), then layer the engine + overlay. This spec is written now; the implementation modules are built at prototype build-step 5 (see `README.md`).
