# The Tour Engine

The orchestrator that runs the tour over the real app. It owns the step index, reads the declarative `TourScript`, and for each step switches persona, navigates, performs the on-enter action, anchors the coach-mark, and resolves the advance condition. It consumes the same tech spine the screens use (`../mock-and-tech-spine/`): `setRole` (session), the Next.js router, the query client, the `useTransitionX` mutation hooks, and the event bus.

## Architecture decision (hybrid)

Build our own orchestrator; borrow only anchored placement from `@floating-ui/react` (already shipped transitively via shadcn's Popover/Tooltip/Combobox). A product-tour library alone (driver.js / react-joyride / shepherd) is rejected: those assume a static, single-actor DOM tour and fight React on the three mechanics that are the whole point here, the shell remount that `setRole` triggers, async waits for events, and the dark IBM-styled overlay. Given the orchestrator must be ours regardless (no library does persona-switch + real transitions + event-wait), adding a second heavyweight render owner only for coach-marks is a net loss. We borrow the genuinely commodity part (collision-aware placement) from a primitive we already have, and own the spotlight, the progress rail, and the persona overlay so they read as the same product.

## The step type (full)

```ts
// lib/tour/types.ts  (Zod-backed for load-time validation)
type RoleId =
  | 'requester' | 'approver' | 'buyer' | 'finance_maker' | 'finance_checker'
  | 'management' | 'receiving' | 'quality' | 'engineering' | 'budget_owner'
  | 'tax_compliance' | 'administrator';   // 'supplier' is handled as a portal step, not a setRole

type TourStep = {
  id: string;                  // stable, e.g. "beat3.landed-flip"
  chapter: string;             // "Sourcing"
  persona?: RoleId;            // engine calls setRole() before the step if it differs
  portal?: boolean;            // true => route into the (portal) shell with a mock supplier session
  route?: RouteSpec;           // navigate before anchoring
  anchor: TourAnchor;          // what the coach-mark points at
  narration: string;           // key into narration.p2p.ts; tokens interpolated from live queries
  onEnter?: TourAction;        // auto-fill / fire-transition / pause-for-user / navigate / none
  advanceWhen: AdvanceCondition;
  expects?: Assertion[];       // preconditions checked against the live store on enter
  placement?: Placement;       // floating-ui hint
  spotlightPadding?: number;
  pip?: { imageKey: string };  // chapter-intro / cast PiP thumbnail
};

type RouteSpec =
  | { path: string }
  | { template: string; params: Record<string, string> };

type TourAnchor =
  | { tourId: string }                 // [data-tour-id="..."]
  | { tourId: string; within: string } // scope to a row/panel (a specific seeded record)
  | { center: true };                  // no element (chapter-intro / payoff)

type TourAction =
  | { kind: 'none' }
  | { kind: 'pause-for-user'; hint: string }
  | { kind: 'autofill'; tourId: string; value: unknown; animate?: boolean }
  | { kind: 'transition'; entity: string; id: string; action: string; payload?: object }
  | { kind: 'navigate'; route: RouteSpec };

type AdvanceCondition =
  | { kind: 'next-click' }
  | { kind: 'wait-event'; type: string; match?: object }
  | { kind: 'wait-predicate'; query: QueryKeySpec; until: string } // until references a named predicate
  | { kind: 'user-action'; verifies: TourAction };                 // Try-it: viewer does it, engine validates

type Assertion = { entity: string; id: string; field: string; equals: unknown };
```

## The run loop (executing one step)

```
enterStep(step):
  0. assert step.expects against the live store      // divergence guard (see 05)
        if any fails -> surface non-blocking "data has moved on; Reset to replay?" and stop auto-advance
  1. if step.persona && session.currentUser.roleId !== step.persona:
        playPersonaTransition(currentUser, target)    // overlay animation (02)
        session.setRole(step.persona)
  1b.if step.portal && not already in portal session:
        enterMockSupplierSession()                     // the supplier seam (05); route into (portal)
  2. if step.route:
        router.push(resolveRoute(step.route))
  3. await settle(step)                                // the reliability primitive, below
  4. run onEnter:
        none           -> nothing
        navigate       -> router.push(...)
        autofill       -> fieldDriver(tourId).setValue(value, {shouldValidate:true})  (optionally typewriter)
        transition     -> useTransitionX().mutateAsync({id, action, payload})   // REAL transition
        pause-for-user -> render coach-mark in "your turn" style; Next disabled
  5. anchor + render the coach-mark (narration with live-interpolated tokens + Next + progress + persona avatar)
  6. arm advanceWhen:
        next-click     -> enable Next
        wait-event     -> eventBus.on(type); on match -> advance
        wait-predicate -> subscribe to query cache; advance when until() true
        user-action    -> watch for the verifying action's result; validate; advance or nudge
  7. on advance -> exitStep cleanup (unsubscribe, clear listeners) -> enterStep(next)
```

### `settle(step)` (the reliability primitive)

After a `setRole` (shell remount: sidebar re-derives, route re-points) or a route push, the DOM is in flux and the data may still be fetching. `settle` waits, with a bounded timeout, for all three:
1. the next paint (`requestAnimationFrame`),
2. the relevant queries to leave `isFetching` (read from `queryClient.getQueryCache()`; MSW's deterministic 150-300ms latency means we must wait on fetch state, not a fixed delay),
3. the anchor node to exist (poll via a short `MutationObserver` + rAF loop; scroll a virtualized/off-screen hero row into view first).

If the anchor never resolves within the timeout, the coach-mark degrades to a centered card rather than breaking the tour.

## Firing real transitions (`onEnter.transition`)

The engine calls the same TanStack Query mutation hook a screen uses (`useTransitionRequisition`, `useTransitionPurchaseOrder`, `useTransitionInvoice`, etc.) -> MSW -> the service layer -> the state-machine transition (`../mock-and-tech-spine/03-transitions-and-effects.md`). The transition checks its guard, mutates the store, appends audit, and emits an event. So:
- the next chapter on a different screen reads the real consequence (Beat 5's GRN over-qty actually amends the PO Beat 3 awarded; Beat 6's NCR actually drops the scorecard grade Beat 8 reads);
- there is no second copy of state to keep in sync; the tour is a store mutator of the same class as a user click;
- re-entering a step is idempotent: a transition already applied fails its own state-machine guard (`IllegalTransition`), which the engine treats as "already in target state" and skips.

## Field-driving (`onEnter.autofill`, the "values fill in" effect)

Forms are react-hook-form + Zod. To make a field populate on screen, the pattern-library form components (`FieldRenderer`, `LineItemEditor`) register their RHF `setValue` against their `data-tour-id` via a `useTourField(tourId)` hook (a no-op when no tour is running). The engine's `autofill` looks up the driver and calls `setValue(value, { shouldValidate: true })`, optionally typewriter-animated. The engine stays decoupled from any specific form; a screen opts in by tagging the field. Where a field is not tagged, the step falls back to `pause-for-user`.

## Interaction modes

- **Watch (default, auto-drive):** the engine performs the clicks/fills/transitions; the viewer hits Next, or steps auto-advance on `wait-event`. The right default for unattended self-serve: it cannot get stuck, always reaches the payoff, is reproducible, and the narration carries the story. Matches the IBM pattern (values fill, statuses change while the viewer watches).
- **Try-it (per-step opt-in, guided-interactive):** on key moments (the landed-cost "Select supplier", "Run match", "Approve"), the viewer flips to Try-it; the coach-mark switches to "your turn", Next disables, and the engine validates the viewer's real action via `advanceWhen: user-action` (it watches for the same transition result), nudging gently on a wrong click. Gives hands-on credibility without risking a stuck kiosk.

The engine arms both paths from the same step definition; the mode toggle (`02-overlay-components.md`) decides which is active per step.

## Engine API (the consumer surface)

`TourProvider` exposes a context consumed via `useTour()`:
`{ phase: 'idle'|'title'|'cast'|'running'|'done', step, chapter, mode, start(), next(), back(), exit(), goToChapter(n), setMode(m) }`. The overlay components read this; nothing else in the app depends on the tour (it is additive and removable).
