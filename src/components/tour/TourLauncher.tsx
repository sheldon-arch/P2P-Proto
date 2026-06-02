"use client";

import { useState } from "react";
import { Play, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useTour } from "./TourProvider";

/** "Guided tour" button — offers a Quick tour or a Full interactive walkthrough. */
export function TourLauncher() {
  const { start, active } = useTour();
  const [open, setOpen] = useState(false);
  if (active) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="tour-launch">
        <Play className="mr-1 h-4 w-4" /> Guided tour
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose your tour</DialogTitle>
            <DialogDescription>Watch the story, or take the controls at key moments.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <button
              data-testid="tour-start-short"
              onClick={() => { setOpen(false); start("short"); }}
              className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-muted"
            >
              <Zap className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">Quick tour</div>
                <div className="text-sm text-muted-foreground">The golden path in 10 steps. Just click Next.</div>
              </div>
            </button>
            <button
              data-testid="tour-start-long"
              onClick={() => { setOpen(false); start("long"); }}
              className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-muted"
            >
              <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">Full interactive walkthrough</div>
                <div className="text-sm text-muted-foreground">
                  Every flow, edge case, the supplier portal, and admin — across all roles, with a
                  few hands-on steps. ~28 steps.
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
