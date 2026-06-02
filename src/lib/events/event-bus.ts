/**
 * Typed domain-event bus. The transition engine emits an event after every
 * successful transition; the query bridge (Phase 1) subscribes and invalidates
 * the affected TanStack Query keys so any open screen refetches. This is the
 * backbone that makes cross-flow state coherent across role switches.
 */

export type DomainEvent = {
  type: string; // e.g. "po.issued", "ncr.raised", "installment.processed"
  entity: string; // collection name
  entityId: string;
  payload?: Record<string, unknown>;
};

type Handler = (e: DomainEvent) => void;

class EventBus {
  private handlers = new Set<Handler>();

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(event: DomainEvent): void {
    for (const h of [...this.handlers]) {
      try {
        h(event);
      } catch {
        // a subscriber error must never break a transition
      }
    }
  }
}

export const eventBus = new EventBus();
