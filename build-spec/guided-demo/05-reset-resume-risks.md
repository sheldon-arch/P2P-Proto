# Reset, Resume, Divergence, and Risks

How a viewer restarts cleanly, resumes mid-tour, and never sees the narration drift from the data; the supplier-portal seam; the honesty guardrail; and the engineering risks with their mitigations.

## Reset (clean restart, deterministic)

"Restart demo" does three things together: (1) calls the existing deterministic store reset (`../mock-and-tech-spine/01-data-store.md`: reload the seed, RNG 20260601, demo-today 2026-06-01, byte-identical), (2) resets the engine to step 0, (3) `setRole` back to the opening persona (the Requester). Because the store reset is byte-identical, every beat's numbers reproduce exactly on every run, which is essential for a self-serve demo that strangers re-run: the landed-cost figures, the KPIs, the dropped grade are the same every time.

## Resume (mid-tour)

The engine persists `{ tourId, stepId, mode }` to localStorage (the same optional persistence the store supports). On reload:
- if both the tour position and the store's mutated state are persisted, resume in place;
- if the tour position is persisted but the store was reset, the engine detects the mismatch (the per-step `expects` fail) and offers "Resume from this chapter" (which fast-forwards, below) or "Restart from the beginning".

## Divergence prevention (the core correctness concern)

The engine holds no second copy of business state; it reads the store and the query cache, so there is nothing to fall out of sync. On top of that:
- **Per-step `expects`:** each step optionally asserts preconditions against the live store on enter (e.g. "RFQ-HERO has 3 quotations and status RESPONDED", "PO-HERO status === ISSUED"). If an assertion fails, the engine surfaces a non-blocking "The demo data has moved on. Reset to replay this step?" rather than narrating a number that is not there. This catches the case where a viewer in free-explore or Try-it clicked something off-script.
- **Idempotent re-entry:** `onEnter.transition` is safe to re-enter (back/forward). A transition already applied fails its own state-machine guard (`IllegalTransition`); the engine treats "already in the target state" as success and skips, so it never double-fires.
- **Chapter-jump checkpoints:** jumping to chapter N (via the `ChapterRail`) does a reset-then-fast-forward: reset to seed, then headlessly replay chapters 1..N-1's `onEnter.transition`s, with no overlay and no waits, to reach the exact cumulative state the script for chapter N assumes, then play chapter N. The replay list is derived from the script itself (the prior chapters' transitions), so it can never fall out of sync with the narrated path. This is what makes "Back", resume, and chapter-jump all safe.

## The supplier-portal seam (Chapter 4)

Chapter 4 is the one hand-off that is not a `setRole`. The supplier portal is a separate shell with its own (email + OTP) auth (`../screens/supplier-portal.md`), not the internal sidebar. The engine treats the supplier step as a distinct `portal: true` step type: it routes into the `(portal)` shell with a mock-resolved supplier session (the OTP is faked for the demo), and the `PersonaIndicator` reflects the external supplier rather than an internal role. This is called out explicitly so the engine does not assume every hand-off is a `setRole`; treating it as one would break (there is no internal role for the supplier).

## The honesty guardrail (mechanical, not just a rule)

- **No "AI"/"ML".** Per `../mvp-and-storyboard.md`, nothing is labelled AI. Narration uses the accurate terms: "automated nearest-bucket approval", "normalized landed-cost decision support", "two-stage supplier scorecard", "closed corrective-action loop". `tour-lint` bans the substrings "AI" and "machine learning" in `narration.p2p.ts`.
- **Numbers match the seed, enforced by interpolation.** Narration figures are tokens resolved from the live query result at render time, never literals. A presenter cannot narrate a figure the screen does not show; if the seed changes, the narration changes with it. The deterministic seed fixes the figures across runs.
- **Real app, not a video.** The engine drives the real hooks, transitions, and event bus. During a run, a technical viewer can open DevTools and see the MSW requests, the store mutating, and the audit entry each transition appended. This is the credibility moat over a recorded walkthrough, and the reason a scripted facade was rejected.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Shell remount on `setRole` destroys the anchored node (the top engineering risk) | `settle()` waits for the remount + queries to leave `isFetching` + the anchor node to exist, bounded, with a centered-coach-mark fallback (`01-tour-engine.md`) |
| Coach-mark anchors before data loads (MSW 150-300ms latency) | `settle()` waits on `isFetching` state, not a fixed delay |
| Anchor selector breaks on a restyle/refactor | `data-tour-id` owned by the tour layer and threaded through shared components; script references typed symbols; `tour-lint` asserts existence (`03-anchoring-and-authoring.md`) |
| A wrong Try-it click moves the store off-script | per-step `expects` + the soft "Reset to replay?" offer; Try-it limited to the two marquee moments |
| Chapter-jump reaches the wrong cumulative state | fast-forward replays the script's own prior transitions in order; derived from the script, cannot drift |
| Portal hand-off mistaken for a `setRole` | the explicit `portal: true` step type and the mock supplier session |
| Narration drifts from the data over time | interpolation tokens + `tour-lint` token check; the seed truth in `04-tour-script.md` is the assertion source |
| Virtualized/off-screen hero row not anchorable | `anchorReady` scrolls it into view before anchoring |
