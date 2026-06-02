"use client";

/**
 * Multi-step wizard archetype: a stepper header + the current step's content +
 * Back/Next/Finish controls. Used by supplier onboarding, item onboarding, and
 * the bulk-import flow. Steps are validated by an optional canProceed predicate.
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
  content: React.ReactNode;
  canProceed?: boolean;
};

export function Wizard({
  steps,
  onFinish,
  finishLabel = "Finish",
  finishing,
}: {
  steps: WizardStep[];
  onFinish: () => void;
  finishLabel?: string;
  finishing?: boolean;
}) {
  const [i, setI] = useState(0);
  const step = steps[i];
  const isLast = i === steps.length - 1;
  const canProceed = step.canProceed !== false;

  return (
    <div data-testid="wizard">
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((s, idx) => (
          <li key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                idx < i && "border-status-success bg-status-success-bg text-status-success",
                idx === i && "border-primary bg-primary text-primary-foreground",
                idx > i && "border-border text-muted-foreground",
              )}
            >
              {idx < i ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={cn("text-sm", idx === i ? "font-medium" : "text-muted-foreground")}>{s.title}</span>
            {idx < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>

      <div data-testid={`wizard-step-${step.id}`}>{step.content}</div>

      <div className="mt-6 flex gap-2">
        {i > 0 && (
          <Button variant="outline" onClick={() => setI(i - 1)} data-testid="wizard-back">
            Back
          </Button>
        )}
        {!isLast ? (
          <Button onClick={() => setI(i + 1)} disabled={!canProceed} data-testid="wizard-next">
            Next
          </Button>
        ) : (
          <Button onClick={onFinish} disabled={!canProceed || finishing} data-testid="wizard-finish">
            {finishLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
