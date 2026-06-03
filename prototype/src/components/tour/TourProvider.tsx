"use client";

/**
 * Tour orchestrator. Supports two variants (short/long) and two step modes:
 *  - watch: advance on Next.
 *  - tryit: the viewer performs the highlighted action; the step auto-advances
 *    when the named domain event (advanceWhen) fires on the eventBus. Next is
 *    disabled on a tryit step, but a Skip always exists so the tour never stalls.
 *
 * On each step: switch persona (if any) and navigate to the route; the
 * TourOverlay anchors the coach-mark (with settle()). The store persists across
 * navigation (sessionStorage) so tour-fired state survives route changes.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session/SessionProvider";
import type { RoleId } from "@/lib/rbac/rbac";
import type { TourStep, TourVariant } from "@/lib/tour/types";
import { TOUR_VARIANTS } from "@/lib/tour/script";
import { eventBus } from "@/lib/events/event-bus";
import { setTourActive } from "@/queries/client";
import { api } from "@/queries/client";
import { qk } from "@/queries/keys";
import { TourOverlay } from "./TourOverlay";

// Golden-path records the tour visits, warmed into the query cache on start so
// steps render from cache with no spinner. (entity, id) pairs + computed names.
const PREFETCH_ONE: [string, string][] = [
  ["tickets", "TKT-HERO"], ["tickets", "TKT-LV-002"],
  ["rfqs", "RFQ-HERO"], ["rfqs", "RFQ-MULTI"],
  ["purchaseOrders", "PO-HERO"], ["purchaseOrders", "PO-SUSP-1"], ["purchaseOrders", "PO-FOB-1-FF"],
  ["ncrs", "NCR-LV-1"],
];
const PREFETCH_LIST = ["tickets", "rfqs", "purchaseOrders", "invoices", "installments", "ncrs", "returns", "suppliers", "items", "inventory", "budgets"];
const PREFETCH_COMPUTED = ["kpis", "spend", "reorder-worklist"];

type TourCtx = {
  active: boolean;
  index: number;
  steps: TourStep[];
  variant: TourVariant;
  start: (variant?: TourVariant) => void;
  exit: () => void;
  next: () => void;
  back: () => void;
  /** true while a tryit step is waiting for the user's action */
  awaitingAction: boolean;
};

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setRole } = useSession();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [variant, setVariant] = useState<TourVariant>("short");
  const stepsRef = useRef<TourStep[]>(TOUR_VARIANTS.short);
  const steps = stepsRef.current;

  const applyStep = useCallback(
    (i: number) => {
      const step = stepsRef.current[i];
      if (!step) return;
      if (step.persona && step.persona !== "supplier") setRole(step.persona as RoleId);
      router.push(step.route);
    },
    [router, setRole],
  );

  // Warm the cache so revisited steps render instantly (runs with x-tour active,
  // so each prefetch is sub-millisecond). staleTime keeps them fresh for the run.
  const warmCache = useCallback(() => {
    for (const [entity, id] of PREFETCH_ONE) {
      queryClient.prefetchQuery({ queryKey: qk.one(entity, id), queryFn: () => api.one(entity, id) });
    }
    for (const entity of PREFETCH_LIST) {
      queryClient.prefetchQuery({ queryKey: qk.list(entity), queryFn: () => api.list(entity) });
    }
    for (const name of PREFETCH_COMPUTED) {
      queryClient.prefetchQuery({ queryKey: qk.computed(name), queryFn: () => api.computed(name) });
    }
  }, [queryClient]);

  const start = useCallback((v: TourVariant = "long") => {
    stepsRef.current = TOUR_VARIANTS[v];
    setVariant(v);
    setIndex(0);
    setTourActive(true); // skip mock API latency for the duration of the tour
    setActive(true);
    warmCache();
    applyStep(0);
  }, [applyStep, warmCache]);

  const exit = useCallback(() => {
    setTourActive(false);
    setActive(false);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= stepsRef.current.length - 1) {
        setTourActive(false);
        setActive(false);
        return i;
      }
      const ni = i + 1;
      applyStep(ni);
      return ni;
    });
  }, [applyStep]);

  const back = useCallback(() => {
    setIndex((i) => {
      const ni = Math.max(i - 1, 0);
      applyStep(ni);
      return ni;
    });
  }, [applyStep]);

  // Try-it: while on a tryit step, listen for its advanceWhen event and advance.
  const current = active ? steps[index] : undefined;
  const awaitingAction = !!current && current.mode === "tryit";
  useEffect(() => {
    if (!awaitingAction || !current?.advanceWhen) return;
    const want = current.advanceWhen;
    const unsub = eventBus.subscribe((e) => {
      if (e.type === want) {
        // brief beat so the viewer registers their action succeeded, then advance
        setTimeout(() => next(), 250);
      }
    });
    return unsub;
  }, [awaitingAction, current?.advanceWhen, next, index]);

  const value = useMemo<TourCtx>(
    () => ({ active, index, steps, variant, start, exit, next, back, awaitingAction }),
    [active, index, steps, variant, start, exit, next, back, awaitingAction],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {active && <TourOverlay />}
    </Ctx.Provider>
  );
}

export function useTour(): TourCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
