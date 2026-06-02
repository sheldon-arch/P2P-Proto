"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourProvider";

/** "Guided tour" button — starts the investor walkthrough from anywhere. */
export function TourLauncher() {
  const { start, active } = useTour();
  if (active) return null;
  return (
    <Button variant="outline" size="sm" onClick={start} data-testid="tour-launch">
      <Play className="mr-1 h-4 w-4" /> Guided tour
    </Button>
  );
}
