# Overlay Components

The UI the tour renders over the app: the title and cast screens, the anchored coach-mark, the spotlight, the persona indicator and hand-off transition, the picture-in-picture preview, the chapter rail, the mode toggle, and the launcher. All live in `components/tour/`, render through a portal above the app chrome, and read a tour-only dark token set layered over the neutral palette (`../patterns/01-design-tokens.md`) so the splash and coach-marks have the IBM dark aesthetic while the app underneath stays light.

## Tour-only dark tokens

A small set used only by the overlay: `--tour-surface` (near-black), `--tour-foreground` (white), `--tour-foreground-muted`, `--tour-accent` (the brand accent for the Start / Next / Let's-begin buttons), `--tour-scrim` (the dim layer). These do not touch the app's light theme; they exist so the overlay reads as a deliberate presentation layer, matching the IBM look.

## Components (mapped to shadcn + the pattern library)

| Component | Purpose | Basis |
| --- | --- | --- |
| `TourTitleScreen` | Dark full-screen splash: headline, the 2-3 sentence Meridian storyline, a product visual, a single "Start" button | full-screen `Dialog` (no anchor) + `Button` (primary) + tour-dark tokens |
| `TourCastScreen` | The personas (avatar + role + real seeded name) arranged around Meridian, a collaboration paragraph, "Let's begin", a PiP preview bottom-right | `Dialog` + shadcn `Avatar` (real names from the seed) + `TourPip` |
| `CoachMark` | The anchored dark tooltip: narration (1-3 sentences, live-interpolated numbers) + Next + progress + the active-persona avatar | custom surface placed by `@floating-ui/react`, styled like a `Popover` on tour-dark tokens; `Button` for Next; reuses `Avatar` |
| `Spotlight` | The dim scrim with a cut-out ring around the anchored element | custom: full-screen scrim div + a `box-shadow: 0 0 0 9999px var(--tour-scrim)` ring around the anchor rect (no library) |
| `PersonaIndicator` | The top-right active-avatar that switches on hand-off; mirrors the topbar `RoleSwitcher` position so the switch reads naturally | shadcn `Avatar` + name/role caption |
| `PersonaTransition` | The animated hand-off card ("Handing off to {name}, the {role}") between chapters | brief centered card + cross-fade avatars; ~1.2s; portal layer |
| `TourPip` | The picture-in-picture preview thumbnail bottom-right (cast screen + chapter intros) | small fixed `Card` holding a static screenshot (deterministic, cheap) from `public/tour/` |
| `ChapterRail` | The 8-beat progress rail with the current beat highlighted; clickable to jump (fast-forward) | the `Stepper` primitive (`../patterns/02-primitives.md`) reused, or a slim custom vertical rail |
| `ModeToggle` | The Watch vs Try-it switch, in the coach-mark footer | shadcn `Switch` / segmented `Tabs` |
| `TourLauncher` | The entry point: a "Guided demo" button in the topbar next to the `RoleSwitcher`, plus auto-open on first load | `Button` in the topbar |
| `ResetDemoControl` | "Restart demo", wired to the deterministic store reset + engine to step 0 | reuses the existing topbar "Reset demo" action |

## The coach-mark anatomy (the most-seen component)

Following the IBM coach-mark: a small dark rounded surface, anchored to the target with a pointer, containing in order:
1. the narration text (1-3 short sentences, sentence case, copy-layer terminology, live-interpolated figures);
2. a footer row: the progress indicator (e.g. "Chapter 3 of 8" or a dot row), the active-persona avatar (small), the `ModeToggle` where the step supports Try-it, and the primary `Next` button (or, in Try-it / `pause-for-user`, a muted "your turn" prompt with Next disabled);
3. a small "Exit tour" affordance.

Placement is collision-aware (floating-ui flips side to stay on screen); the `Spotlight` dims everything except the anchored element so the eye goes to it.

## The 8 chapters (the `ChapterRail` labels)

The rail maps 1:1 to the storyboard beats (`../mvp-and-storyboard.md`):
Requisition - Approval - Sourcing - Acknowledge - Receiving & QC - NCR to CAPA - Invoice & Pay - Analytics.

The current chapter is highlighted; completed chapters are checked; clicking a chapter triggers the fast-forward jump (`05-reset-resume-risks.md`). In Watch mode the rail is a progress display; in free-explore after the tour it is a navigator.

## The phases (what renders when)

- `idle`: nothing (the app runs normally; the `TourLauncher` sits in the topbar).
- `title`: `TourTitleScreen` over a dimmed app.
- `cast`: `TourCastScreen` with the `TourPip` preview.
- `running`: the app is fully interactive underneath; `Spotlight` + `CoachMark` + `PersonaIndicator` + `ChapterRail` are shown; `PersonaTransition` plays on hand-offs.
- `done`: a brief closing card (the payoff recap) + "Restart" (`ResetDemoControl`) + "Explore on your own" (drops into free navigation with the role-switcher live).

## Accessibility and polish

Inherited from shadcn/Radix (focus management, keyboard nav, ARIA on the Dialog/Button). The coach-mark is keyboard-advanceable (Enter = Next, Esc = Exit). The spotlight ring uses both dimming and a visible border so the target reads without relying on the dim alone. Animations are short (cross-fades ~300ms, persona transition ~1.2s) and can be reduced under `prefers-reduced-motion`.
