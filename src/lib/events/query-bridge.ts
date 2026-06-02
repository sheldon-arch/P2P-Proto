/**
 * Bridges domain events (from the transition engine) to TanStack Query
 * invalidations. This is what makes one click ripple across roles: a Buyer
 * issuing a PO emits "po.issued", which invalidates budgets + kpis so the Budget
 * Owner's and Management's screens refetch the new numbers.
 */
import type { QueryClient } from "@tanstack/react-query";
import { eventBus, type DomainEvent } from "./event-bus";
import { ENTITY_FOR_EVENT } from "@/queries/keys";

export function attachQueryBridge(queryClient: QueryClient): () => void {
  return eventBus.subscribe((event: DomainEvent) => {
    // invalidate the entity the event is about
    queryClient.invalidateQueries({ queryKey: [event.entity] });
    // plus any cross-entity targets mapped for this event type
    const targets = ENTITY_FOR_EVENT[event.type] ?? [];
    for (const t of targets) {
      queryClient.invalidateQueries({ queryKey: [t] });
    }
  });
}
