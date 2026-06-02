# Guided Interactive Demo (IBM-Style Tour)

The 10th build-spec artifact. A self-running, click-through guided demo so an investor or potential client can run the platform themselves instead of being walked through it: a product tour that follows one requirement end to end across every role, the way IBM Planning Analytics does. It drives the real app (the same session, router, query, transition, and event-bus spine the screens use), so it is credible to a technical viewer, not a recording.

Reference: the IBM Planning Analytics demo (13 screenshots in `User Flows/IBM Demo/`). Storyline and numbers reuse the 8-beat golden path (`../mvp-and-storyboard.md`) and the deterministic seed (`../seed/`).

## Files

| File | Content |
| --- | --- |
| `_SCHEMA.md` | the IBM pattern, the drive-the-real-app principle, the step format, conventions, locked scope |
| `01-tour-engine.md` | the hybrid engine, the full step type, the run loop, `settle()`, real-transition firing, field-driving, the Watch/Try-it modes |
| `02-overlay-components.md` | the overlay UI (title, cast, coach-mark, spotlight, persona indicator/transition, PiP, chapter rail, mode toggle, launcher) on shadcn + a tour-dark token set |
| `03-anchoring-and-authoring.md` | the `data-tour-id` convention + anchor registry + the split script/narration authoring model + `tour-lint` |
| `04-tour-script.md` | the full 8-chapter script with verified seed figures per step |
| `05-reset-resume-risks.md` | reset, resume, divergence prevention, the portal seam, the honesty guardrail, risks |
| `README.md` | this file: consumption, module structure, build sequence |

## How it consumes the other artifacts

- #2 schema / state machines -> the real transitions the engine fires.
- #3 seed -> the hero records and the exact figures; the deterministic reset.
- #4 screens + #5 storyboard -> the routes and the 8 beats that become the 8 chapters.
- #6 IA / RBAC -> `setRole` (the persona hand-offs), the route map, the role-switcher the launcher mirrors.
- #7 copy -> the narration terminology (one source, no drift).
- #8 patterns -> the shared components that carry `data-tour-id`; the shadcn primitives + tokens the overlay restyles; `@floating-ui/react` for placement.
- #9 mock/tech spine -> the providers the `TourProvider` mounts inside, the mutation hooks, the event bus, the store reset.

## Module structure (built at prototype build-step 5; additive, nothing existing moves)

```
lib/tour/
  types.ts            # TourScript/Step/Action/AdvanceCondition (Zod-backed)
  anchors.ts          # typed registry of every data-tour-id (symbols)
  routes.ts           # typed route templates reused from the IA route map
  engine.ts           # run loop: enterStep, settle, anchorReady, advance arming
  TourProvider.tsx    # context + overlay portal; mounts inside SessionProvider
  useTour.ts          # consumer hook (phase, step, mode, start/next/back/exit/goToChapter)
  useTourField.ts     # FieldDriver registration (no-op when no tour running)
  fastForward.ts      # headless replay of prior chapters for chapter-jump
  script.p2p.ts       # the 8-chapter script (structure)
  narration.p2p.ts    # narration copy + interpolation tokens (content)
components/tour/       # TourTitleScreen, TourCastScreen, CoachMark, Spotlight,
                       #   PersonaIndicator, PersonaTransition, TourPip, ChapterRail,
                       #   ModeToggle, TourLauncher, ResetDemoControl
components/patterns/   # MODIFIED: thread data-tour-id (PageHeader, DataTable, FieldRenderer,
                       #   LineItemEditor, RuleBanner, KpiCard, StatusBadge, ApprovalAccordion)
app/(main)/layout.tsx  # MODIFIED: mount TourProvider inside SessionProvider; render TourLauncher
public/tour/           # static PiP screenshots + title/cast visuals (deterministic)
scripts/tour-lint.ts   # check: every anchor/route/persona/narration key + token resolves; no "AI"
```

## Build sequence

1. **Anchor convention** (the only change to existing code): thread `data-tour-id` through the shared pattern-library components and populate `anchors.ts`, as the golden-path screens are built. Co-built, not retrofitted (the locked sequencing decision).
2. **Engine core, headless:** the run loop + `settle()`/`anchorReady`, driven by a 2-step test script; prove persona-switch + route nav + one real transition + wait-event end to end.
3. **Overlay UI:** coach-mark + spotlight + persona indicator + chapter rail on the tour-dark tokens; then title + cast + persona-transition + PiP.
4. **Script + narration:** the full 8 beats; wire interpolation tokens to live queries; add `tour-lint`.
5. **Modes + resilience:** Watch/Try-it toggle, `expects` assertions, chapter checkpoints via `fastForward`, resume from localStorage.
6. **Polish + payoff:** the Beat-8 dashboard moment, transition timing, PiP imagery.

## Verification (from the plan)

- `tour-lint` passes (anchors, routes, personas, narration keys, tokens all resolve; no banned "AI"/"ML").
- Headless engine test: a 2-step run switches persona, navigates, fires a real transition, advances on the emitted event, with `settle()` waiting on `isFetching`.
- End-to-end Watch run on a freshly reset store: each chapter's narrated numbers equal the rendered values (the over-budget figure; Synthex landed 155.259 vs Helvetia 169.769; BioCore +7%; OTIF 93.9% / perfect-order 88.9% / DPO 44.6d / spend ~$125M; the dropped grade).
- Try-it on the two marquee steps (award on landed cost, checker release): the viewer's real action advances; a wrong click nudges, not breaks.
- Determinism: reset and re-run produces identical numbers; chapter-jump fast-forward reaches the same state as a linear run.
- DevTools credibility: MSW requests, store mutations, and audit entries are visible during a run.

## Status

Spec complete (2026-06-01). Implementation is scheduled for prototype build-step 5 (co-build with the golden-path screens), per the approved plan at `/Users/apple/.claude/plans/quirky-tinkering-kahn.md`.
