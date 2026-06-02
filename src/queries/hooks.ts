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
