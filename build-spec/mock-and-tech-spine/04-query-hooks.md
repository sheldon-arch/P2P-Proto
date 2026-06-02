# Query Hooks, Query Keys, and MSW

The TanStack Query surface the screens use, mirroring Raphe's hook shape ([[raphe-ui-ux-reference]]: `useGet*` reads, `useCreate*`/`useUpdate*` writes, invalidate + sonner toast). Screens never touch the service or the store directly; they use hooks. MSW sits between the hooks and the service so the network looks real.

## Hook surface (uniform per entity)

For each entity service (`02-service-contract.md`), a generated hook set:

```
useGetList(entity, params)        // -> useQuery, key ['entity', 'list', params]
useGetOne(entity, id)             // -> useQuery, key ['entity', 'detail', id]
useCreate(entity)                 // -> useMutation, invalidates ['entity','list']
useUpdate(entity)                 // -> useMutation, invalidates detail + list
useTransition(entity)            // -> useMutation(id, action, payload), invalidates affected keys + emits handled by bus
```

Named wrappers per entity for ergonomics (`useGetRequisitions`, `useGetRequisition`, `useTransitionRequisition`, `useGetSuppliers`, ...), thin over the generic set, so a screen reads `const { data } = useGetRequisitions(params)` exactly like Raphe.

Cross-entity read hooks for the dashboards and the comparison: `useKpis(scope)`, `useBudgetAvailability(projectId, period)`, `useLandedCostComparison(rfqId)`, `useCreditorLedger(supplierId)`, `useScorecard(supplierId, period)`, each over the analytics/budget/match selectors.

## Query-key scheme

`[entity, kind, paramsOrId]`:
- `['requisition', 'list', { filters, page }]`
- `['requisition', 'detail', id]`
- `['supplier', 'list', ...]`, `['kpi', scope]`, `['budget', projectId, period]`, `['landedCost', rfqId]`.

Keys are structured so a mutation/event invalidates precisely: approving a requisition invalidates `['requisition','detail',id]`, `['requisition','list']`, the affected approver's queue key, and `['kpi', ...]`; issuing a PO additionally invalidates `['budget', projectId, period]`.

## Mutation + toast pattern (Raphe)

Every mutation:
1. calls the service via MSW,
2. on success invalidates its keys and fires the success toast (`../copy/03`, e.g. `toast.po.issued`),
3. on error catches the typed service error, maps it to the user message (`../copy/03`), and fires an error toast,
4. supports optimistic update where it sharpens the demo (e.g. an approved row leaving the queue immediately), rolled back on error.

## MSW handler map

MSW intercepts a REST-shaped surface so DevTools shows real requests (the network looks real, then can be swapped for a real API by removing the worker). One handler family per entity:

| Method + path | Service call |
| --- | --- |
| `GET /api/:entity` | `service[entity].list(query)` |
| `GET /api/:entity/:id` | `service[entity].get(id)` |
| `POST /api/:entity` | `service[entity].create(body, ctx)` |
| `PATCH /api/:entity/:id` | `service[entity].update(id, body, ctx)` |
| `POST /api/:entity/:id/transition` | `service[entity].transition(id, body.action, body.payload, ctx)` |
| `GET /api/kpis`, `/api/landed-cost/:rfqId`, `/api/budget/:projectId`, `/api/ledger/:supplierId` | the cross-entity selectors |

`ctx.currentUser` is read from the session store (the role-switcher) on each request. A small artificial latency (e.g. 150-300ms) makes loading states visible and the demo feel like a real app; deterministic, not random, so timing is reproducible.

## Event bus -> re-query (the SSE mimic)

The model's realtime design is "re-query on event" (platform service #6). Implemented client-side:
- The service's `eventBus.emit` (step 9 of every transition, `03`) publishes `{type, entityId}`.
- A `QueryEventBridge` subscribes to the bus and calls `queryClient.invalidateQueries` for the keys mapped to that event type. So an approval done on one screen updates the approver's queue, the dashboard counts, and any open detail of that record, without a manual refresh, exactly as an SSE push would.
- This is what makes the cross-role demo feel live: the presenter approves as the Approver, switches to the Buyer via the role-switcher, and the Buyer's queue already reflects it.

Event -> invalidated keys (the bridge map):

| Event | Invalidates |
| --- | --- |
| `approval.approved` | requisition detail+list, approver queues, kpis |
| `po.issued` | po list/detail, requisition detail, budget(project), kpis |
| `grn.posted` | grn/deliveries, requisition detail, supplier (scorecard if QC), kpis |
| `match.cleared` | invoice/match queue, payments-eligible, kpis |
| `installment.processed` | cashflow, ledger(supplier), kpis(DPO) |
| `supplier.suspended` | supplier list/detail, AVL, sourcing eligibility |
| `ticket.completed` | requisition list/detail, budget(actual), kpis |

## Why hooks + MSW + bus (intent)

Hooks mean a screen declares what data it needs and gets caching, loading, and error handling for free, the same way Raphe's screens do. MSW means the prototype behaves like a networked app (visible requests, real latency, swappable for a real backend) without a backend. The event bus means actions propagate across the app the way the real system's SSE would, so the live, cross-role demo holds together.
