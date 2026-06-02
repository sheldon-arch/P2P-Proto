/**
 * Guided tour types. A tour is an ordered list of steps; each step targets a
 * screen + an anchor element (data-tour-id), shows narration, and advances on
 * Next (or after the viewer performs a Try-it action). Steps can switch persona.
 */
import type { RoleId } from "@/lib/rbac/rbac";

export type TourStep = {
  id: string;
  chapter: string;
  /** persona to switch to before this step (re-derives shell, re-gates) */
  persona?: RoleId | "supplier";
  /** route to navigate to before anchoring */
  route: string;
  /** data-tour-id of the element to spotlight; omit/center if missing */
  anchor?: string;
  title: string;
  body: string;
  /** preferred popover side; floating-ui flips if it would overflow */
  placement?: "top" | "bottom" | "left" | "right";
  /** "watch" (default): advance on Next. "tryit": the viewer performs the
   *  highlighted action; the step auto-advances when advanceWhen fires. */
  mode?: "watch" | "tryit";
  /** for tryit steps: the domain event (eventBus type) whose firing advances */
  advanceWhen?: string;
  /** short instruction shown on a tryit step (e.g. "Click Approve") */
  hint?: string;
};

export type TourVariant = "short" | "long";

export type TourState = {
  active: boolean;
  index: number;
  variant: TourVariant;
};
