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
import { useSession } from "@/lib/session/SessionProvider";
import type { RoleId } from "@/lib/rbac/rbac";
import type { TourStep, TourVariant } from "@/lib/tour/types";
import { TOUR_VARIANTS } from "@/lib/tour/script";
import { eventBus } from "@/lib/events/event-bus";
import { TourOverlay } from "./TourOverlay";

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

  const start = useCallback((v: TourVariant = "long") => {
    stepsRef.current = TOUR_VARIANTS[v];
    setVariant(v);
    setIndex(0);
    setActive(true);
    applyStep(0);
  }, [applyStep]);

  const exit = useCallback(() => setActive(false), []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= stepsRef.current.length - 1) {
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
        // small delay so the user sees their action's result before moving on
        setTimeout(() => next(), 600);
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
