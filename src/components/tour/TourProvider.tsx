"use client";

/**
 * Tour orchestrator. Holds {active, index}, exposes start/next/back/exit/goTo,
 * and on each step: switches persona (if any), navigates to the route, then the
 * TourOverlay anchors a coach-mark to the step's element (with settle()). The
 * store persists across navigation (sessionStorage) so tour-fired/visited state
 * survives route changes and persona switches.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionProvider";
import type { RoleId } from "@/lib/rbac/rbac";
import { TOUR_STEPS } from "@/lib/tour/script";
import { TourOverlay } from "./TourOverlay";

type TourCtx = {
  active: boolean;
  index: number;
  steps: typeof TOUR_STEPS;
  start: () => void;
  exit: () => void;
  next: () => void;
  back: () => void;
};

const Ctx = createContext<TourCtx | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setRole } = useSession();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);

  const applyStep = useCallback(
    (i: number) => {
      const step = TOUR_STEPS[i];
      if (!step) return;
      if (step.persona && step.persona !== "supplier") setRole(step.persona as RoleId);
      router.push(step.route);
    },
    [router, setRole],
  );

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
    applyStep(0);
  }, [applyStep]);

  const exit = useCallback(() => setActive(false), []);

  const next = useCallback(() => {
    setIndex((i) => {
      const ni = Math.min(i + 1, TOUR_STEPS.length - 1);
      if (i === TOUR_STEPS.length - 1) {
        setActive(false);
        return i;
      }
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

  const value = useMemo<TourCtx>(
    () => ({ active, index, steps: TOUR_STEPS, start, exit, next, back }),
    [active, index, start, exit, next, back],
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
