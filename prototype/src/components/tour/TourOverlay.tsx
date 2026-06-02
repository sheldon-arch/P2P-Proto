"use client";

/**
 * The tour overlay: a dimming layer with a spotlight cut-out around the current
 * step's anchor, plus a coach-mark popover positioned by floating-ui (so it
 * never overflows the viewport — it flips/shifts to stay on screen). If the
 * anchor element can't be found (settle timeout), the coach-mark renders
 * CENTERED rather than pointing at nothing. This is the alignment-safety design.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { computePosition, flip, shift, offset, arrow, autoUpdate } from "@floating-ui/dom";
import { Button } from "@/components/ui/button";
import { X, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "./TourProvider";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // spotlight padding around the anchor

export function TourOverlay() {
  const { index, steps, next, back, exit, awaitingAction } = useTour();
  const step = steps[index];
  const [rect, setRect] = useState<Rect | null>(null);
  const [resolved, setResolved] = useState(false); // anchor found?
  const cardRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number; placement: string } | null>(null);
  const [arrowPos, setArrowPos] = useState<{ x?: number; y?: number } | null>(null);

  // 1) settle(): find the anchor element, retrying briefly while the route paints.
  useEffect(() => {
    let cancelled = false;
    setResolved(false);
    setRect(null);
    setCardPos(null);

    // Anchor by data-tour-id, falling back to data-testid so existing tagged
    // elements (banners/panels) can be targeted without duplicating attributes.
    const selector = step.anchor
      ? `[data-tour-id="${step.anchor}"], [data-testid="${step.anchor}"]`
      : null;
    const deadline = Date.now() + 4000;

    function attempt() {
      if (cancelled) return;
      const el = selector ? (document.querySelector(selector) as HTMLElement | null) : null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setResolved(true);
        return;
      }
      if (Date.now() < deadline) {
        requestAnimationFrame(() => setTimeout(attempt, 80));
      } else {
        // anchor never appeared -> centered fallback (no spotlight)
        setRect(null);
        setResolved(true);
      }
    }
    // give the route a tick to render
    const t = setTimeout(attempt, 120);
    return () => { cancelled = true; clearTimeout(t); };
  }, [step.anchor, step.route, index]);

  // 2) position the coach-mark with floating-ui (anchored or centered).
  useLayoutEffect(() => {
    if (!resolved || !cardRef.current) return;
    const card = cardRef.current;

    if (!rect) {
      // centered fallback
      setCardPos({ x: window.innerWidth / 2 - card.offsetWidth / 2, y: window.innerHeight / 2 - card.offsetHeight / 2, placement: "center" });
      setArrowPos(null);
      return;
    }

    // a virtual reference from the anchor rect, CLAMPED to the viewport so a
    // very tall or partially-off-screen anchor still yields an on-screen
    // popover (floating-ui positions relative to this clamped rect).
    const reference = {
      getBoundingClientRect: () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const top = Math.max(8, Math.min(rect.top, vh - 8));
        const bottom = Math.min(vh - 8, Math.max(rect.top + rect.height, 8));
        const left = Math.max(8, Math.min(rect.left, vw - 8));
        const right = Math.min(vw - 8, Math.max(rect.left + rect.width, 8));
        return {
          x: left, y: top, top, left, right, bottom,
          width: Math.max(0, right - left), height: Math.max(0, bottom - top),
        };
      },
    };

    let cleanup = () => {};
    function update() {
      computePosition(reference as Element, card, {
        placement: (step.placement ?? "bottom") as never,
        middleware: [offset(14), flip({ padding: 12 }), shift({ padding: 12 }), arrow({ element: arrowRef.current!, padding: 8 })],
      }).then(({ x, y, placement, middlewareData }) => {
        setCardPos({ x, y, placement });
        setArrowPos(middlewareData.arrow ?? null);
      });
    }
    cleanup = autoUpdate(reference as Element, card, update);
    return cleanup;
  }, [resolved, rect, step.placement, index]);

  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  // arrow side = opposite of card placement
  const staticSide = cardPos
    ? ({ top: "bottom", right: "left", bottom: "top", left: "right" } as Record<string, string>)[cardPos.placement.split("-")[0]]
    : undefined;

  return (
    // On a Try-it step the overlay is click-through (pointer-events-none) so the
    // viewer can click the highlighted real control; the coach-mark re-enables
    // its own pointer events below. On a Watch step the overlay captures clicks.
    <div
      className={cn("fixed inset-0 z-50", awaitingAction && "pointer-events-none")}
      data-testid="tour-overlay"
      aria-live="polite"
    >
      {/* dim layer with a spotlight hole punched via box-shadow */}
      {rect ? (
        <div
          data-testid="tour-spotlight"
          className="pointer-events-none absolute rounded-md ring-2 ring-primary transition-all"
          style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
          }}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-slate-900/55", awaitingAction && "pointer-events-none")} />
      )}

      {/* coach-mark (always interactive, even when the overlay is click-through) */}
      <div
        ref={cardRef}
        data-testid="tour-coachmark"
        className="pointer-events-auto absolute w-[340px] max-w-[90vw] rounded-lg border bg-popover p-4 text-popover-foreground shadow-xl"
        style={cardPos ? { top: cardPos.y, left: cardPos.x } : { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
      >
        {staticSide && (
          <div
            ref={arrowRef}
            className="absolute h-2 w-2 rotate-45 border bg-popover"
            style={{
              left: arrowPos?.x != null ? arrowPos.x : undefined,
              top: arrowPos?.y != null ? arrowPos.y : undefined,
              [staticSide]: "-5px",
            } as React.CSSProperties}
          />
        )}
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary" data-testid="tour-chapter">{step.chapter}</span>
          <button onClick={exit} aria-label="Exit tour" data-testid="tour-exit" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-sm font-semibold" data-testid="tour-title">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="tour-body">{step.body}</p>
        {awaitingAction && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary" data-testid="tour-tryit-hint">
            <Hand className="h-4 w-4" /> {step.hint ?? "Perform the highlighted action to continue."}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground" data-testid="tour-progress">{index + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {!isFirst && <Button variant="outline" size="sm" onClick={back} data-testid="tour-back">Back</Button>}
            {awaitingAction ? (
              <Button variant="outline" size="sm" onClick={next} data-testid="tour-skip">Skip</Button>
            ) : (
              <Button size="sm" onClick={next} data-testid="tour-next">{isLast ? "Finish" : "Next"}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
