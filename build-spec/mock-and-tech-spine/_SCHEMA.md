# Mock Data / Contract Layer and Tech Spine

Task #9 of the pre-prototype readiness set, the last one. The piece that makes the prototype interactive: a typed service layer over an in-memory store seeded from the demo dataset (`../seed/`), where the state-machine transitions (`../schema/state-machines.ts`) are the only mutators, so the UI can never reach an illegal state. Actions have real effects (approve moves a record out of the queue, issue PO commits budget, resolve a match clears the exception and relieves GR/IR), which is the whole demo. No real backend; the network is simulated so the prototype runs entirely client-side and is fully reproducible.

This spec consumes the data dictionary (#1, the entity shapes), the schema + state machines (#2, the types and the legal transitions), and the seed (#3, the initial store). It mirrors Raphe's TanStack Query hook shape ([[raphe-ui-ux-reference]]) so the data layer is proven, and it serves the patterns (#8) and screens (#4).

## Tech spine (decisions, from the readiness brief and the Raphe baseline)

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js App Router, React 19 | Raphe's stack; file-based routes match the IA route map (`../ia/`) |
| Server data | TanStack Query over the mock client | Raphe's pattern; caching, invalidation, optimistic updates for free |
| Network simulation | MSW (Mock Service Worker) | the network looks real (DevTools shows requests); flip to a real API later by removing the worker |
| Forms | react-hook-form + Zod | Raphe's pattern; Zod schemas generated from `../schema/types.ts` so client validation matches the model |
| UI / session / role state | React Context + a small store (Zustand or Context) | holds CurrentUser for the role-switcher, UI prefs (density) |
| Realtime | a client event bus mimicking SSE | the model's "re-query on event" design (platform service #6) without a server |
| Components | shadcn/ui | task #8 |
| Charts | Recharts | dashboards read precomputed seed values |
| Determinism | the seed is pinned (RNG 20260601, demo today 2026-06-01) | every run identical; no `Date.now()` for demo data |

Nice-to-have, mocked (not built): real auth (fake login + role-switcher), live FX (static rate table + a degradation toggle), real document storage (filename stubs), real analytics engine (precomputed seed values), real bulk-import parsing (canned result). These are the readiness brief's explicit nice-to-haves.

## Files in this layer

- **`_SCHEMA.md`** (this file): the tech-spine decisions, the architecture, and the layering rules.
- **`01-data-store.md`**: the in-memory store. How the 33 seed files load into typed collections, the indexing, referential integrity, and the reset/reseed behavior (deterministic).
- **`02-service-contract.md`**: the typed service interface per entity (list / get / create / update / transition) and the cross-entity services (FX, budget, match, analytics, audit, event bus). The transition method is the only path to a state change.
- **`03-transitions-and-effects.md`**: how a transition call is executed: guard check, state change, side effects (the `effect` strings made concrete), audit append, event emit. The mapping from each state-machine transition to its store mutation.
- **`04-query-hooks.md`**: the TanStack Query hook surface (`useGetX`, `useCreateX`, `useTransitionX`), the query-key scheme, invalidation, the MSW handler map, and the event-bus -> re-query wiring.
- **`05-tech-spine-and-bootstrap.md`**: the app bootstrap (providers, CurrentUser context, the role-switcher wiring), the project structure, and how the layers connect end to end.

## Architecture (the layering, top to bottom)

```
Screen (../screens/)  ->  composes archetypes + shared components (../patterns/)
        |
        v
Query hooks (04)      ->  TanStack Query: useGetX / useCreateX / useTransitionX
        |
        v
MSW handlers (04)     ->  intercept fetch, look real in DevTools, call the service
        |
        v
Service contract (02) ->  typed list/get/create/update/transition per entity + cross services
        |                         |
        |                         v
        |                 Transitions + effects (03)  ->  guard -> state change -> effects -> audit -> event
        v                         |
In-memory store (01)  <-----------+   the single source of truth, seeded from ../seed/
        ^
        |
Event bus  ->  emits on every mutation; hooks subscribe and re-query (mimics SSE)
```

## The three rules that make it credible (intent)

1. **Transitions are the only mutators.** A status/stage/lifecycle field is never set directly. Every change goes through `service.<entity>.transition(id, action, payload)`, which checks the guard from `../schema/state-machines.ts`. The UI cannot reach an illegal state because there is no code path to it. This is what makes the demo trustworthy: clicking Approve on an already-approved record is impossible, not just hidden.
2. **Effects are real.** Each transition runs its `effect` (issue PO -> commit budget; approve -> route to next stage + update OTIF stat; resolve match -> clear exception + relieve GR/IR; complete -> relieve commitment to actual). The numbers move. A dashboard re-queried after an action shows the change.
3. **Everything is deterministic and reproducible.** The store reseeds from the pinned seed; a "Reset demo" action restores the exact initial state. No wall-clock dependence for demo data (the demo "today" is fixed at 2026-06-01). A presenter can run the same script identically every time.

## What this layer does NOT do

- It does not enforce server-side security (there is no server). RBAC is enforced in the UI via `../ia/rbac.ts`; the service trusts CurrentUser. This is acceptable for a prototype and noted as a nice-to-have gap.
- It does not persist across reloads by default (in-memory). Optional: persist to localStorage so a demo survives a refresh; the reset action clears it.
- It does not compute analytics live; dashboards read precomputed seed values, with the few action-driven numbers (budget committed, queue counts, OTIF after an approval) updated by transition effects.
