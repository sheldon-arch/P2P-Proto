"use client";

/**
 * Generic + computed query/mutation hooks. Screens use these; they never touch
 * the store directly. Mutations go through the transition route, so the engine's
 * guards/effects run and the event bridge invalidates affected queries.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { qk } from "./keys";

type Row = Record<string, unknown>;

export function useList<T = Row>(entity: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: qk.list(entity, params),
    queryFn: () => api.list<T>(entity, params),
  });
}

export function useOne<T = Row>(entity: string, id: string | undefined) {
  return useQuery({
    queryKey: qk.one(entity, id ?? "none"),
    queryFn: () => api.one<T>(entity, id as string),
    enabled: !!id,
  });
}

export function useComputed<T = unknown>(name: string, arg?: string) {
  const path = arg ? `${name}/${arg}` : name;
  return useQuery({
    queryKey: qk.computed(name, arg),
    queryFn: () => api.computed<T>(path),
  });
}

/** Legal transition actions for a record (drives action-button gating). */
export function useLegalActions(entity: string, id: string | undefined) {
  return useQuery({
    queryKey: [entity, "actions", id ?? "none"],
    queryFn: () => api.computed<{ actions: string[] }>(`${entity}/${id}/actions`),
    enabled: !!id,
  });
}

export function useCreate<T = Row>(entity: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Row) => api.create<T>(entity, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
  });
}

export function useUpdate<T = Row>(entity: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Row }) => api.patch<T>(entity, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
  });
}

/** Fire a guarded transition. The event bridge handles cross-entity invalidation;
 *  we additionally invalidate this entity for immediate local refresh. */
export function useTransition<T = Row>(entity: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: string; payload?: Row }) =>
      api.transition<T>(entity, id, action, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
  });
}

/** Reorder worklist (computed). */
export function useReorderWorklist<T = Row>() {
  return useQuery({
    queryKey: ["@reorder-worklist"],
    queryFn: () => api.computed<T[]>("reorder-worklist"),
  });
}

/** Raise a replenishment requisition from a worklist row. */
export function useRaiseReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: Row) =>
      fetch("/api/reorder/raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row }),
      }).then((r) => r.json() as Promise<{ ticketId: string }>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["@reorder-worklist"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

/** Award an RFQ per-line; splits into one PO per supplier. */
export function useAwardRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rfqId, awards, justification }: { rfqId: string; awards: Row[]; justification?: string }) =>
      fetch(`/api/rfq/${rfqId}/award`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awards, justification }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "award failed");
        return r.json() as Promise<{ poIds: string[]; supplierCount: number }>;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rfqs"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });
}

/** Post a stock movement (ADJUSTMENT / TRANSFER); re-evaluates the worklist. */
export function usePostStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (movement: Row) =>
      fetch("/api/stock-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movement),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "movement failed");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stockMovements"] });
      qc.invalidateQueries({ queryKey: ["@reorder-worklist"] });
    },
  });
}
