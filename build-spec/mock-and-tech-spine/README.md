# Mock Data / Contract Layer and Tech Spine

Task #9 of the pre-prototype readiness set, the final artifact. The layer that makes the prototype interactive: a typed service over an in-memory store seeded from the demo dataset (`../seed/`), where the state-machine transitions (`../schema/state-machines.ts`) are the only mutators, so the UI can never reach an illegal state, and where actions have real effects (approve routes to the next queue, issue PO commits budget, resolve match clears the exception and relieves GR/IR). No backend; the network is simulated with MSW and reactivity with a client event bus mimicking SSE. Deterministic and reproducible.

Tech spine (Raphe's proven stack, [[raphe-ui-ux-reference]]): Next.js App Router + React 19, TanStack Query, react-hook-form + Zod, shadcn/ui, MSW, a client event bus, React Context for session/role-switch.

## Files

| File | Content |
| --- | --- |
| `_SCHEMA.md` | tech-spine decisions, the architecture diagram, the layering rules, the 3 credibility rules, what is not done |
| `01-data-store.md` | the in-memory store: 33 seed files -> typed collections, indexing, referential integrity, deterministic reset/reseed |
| `02-service-contract.md` | the typed `EntityService<T>` (list/get/create/update/transition) + the cross-entity services (fx, budget, match, scorecard, audit, eventBus, analytics) + the error contract |
| `03-transitions-and-effects.md` | the transition algorithm (the only mutator), the guard map (guard -> error), the concrete effects for every key transition across the 10 state machines |
| `04-query-hooks.md` | the TanStack hook surface, the query-key scheme, the mutation+toast pattern, the MSW handler map, the event-bus -> re-query bridge |
| `05-tech-spine-and-bootstrap.md` | project structure, providers, CurrentUser + role-switcher wiring, the end-to-end path traced through all 9 layers, the build sequence |

## How it consumes the prior artifacts

- #1 data dictionary -> the entity field shapes the store holds.
- #2 schema + state machines -> the Zod types and the legal transitions (the only mutators).
- #3 seed -> the initial store (33 files, verified integrity, pinned to 2026-06-01).
- #6 IA/RBAC -> `ctx.currentUser`, `navForRole`, `useCan`; the role-switcher.
- #7 copy -> every toast/error/empty string the hooks and services surface.
- #8 patterns -> the hooks feed the archetypes and shared components; FieldRenderer is the field engine.
- #4 screens + #5 storyboard -> the build order (golden-path first).

## The point

The first eight artifacts say what exists, how it is shaped, how it looks, what it says, and what it means. This one makes it move. Every click runs a guarded transition with a real effect, audited and broadcast, so a presenter follows one requirement across roles and the system stays consistent the whole way, identically on every run. With this spec, the prototype is fully defined and ready to build.

## Verified

- Every seeded entity (33 collections) maps to a service; every transactional entity has a transition surface.
- All 10 state machines (requisition stage + status, approval completion, supplier, item, PO, installment, match, NCR, return) are covered by the transition engine; the guard map ties each guard to a user error.
- The end-to-end path is traced through all nine layers (the "Issue PO" click).
- No em dashes, no emojis, no banned marketing words.
