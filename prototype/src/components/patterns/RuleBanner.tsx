import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline rule banner — surfaces a business rule firing on a screen (budget over,
 * tolerance amend, duplicate hold, price spike, COA gate, etc.). The mechanism
 * the plan uses to show edge-case rules inline rather than as separate screens.
 */
type Tone = "warning" | "info" | "success" | "danger";

const STYLES: Record<Tone, { box: string; icon: typeof Info }> = {
  warning: { box: "border-status-warning/40 bg-status-warning-bg text-status-warning", icon: AlertTriangle },
  info: { box: "border-status-info/30 bg-status-info-bg text-status-info", icon: Info },
  success: { box: "border-status-success/30 bg-status-success-bg text-status-success", icon: CheckCircle2 },
  danger: { box: "border-status-danger/30 bg-status-danger-bg text-status-danger", icon: XCircle },
};

export function RuleBanner({
  tone = "info",
  title,
  children,
  testId,
  tourId,
}: {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
  testId?: string;
  tourId?: string;
}) {
  const { box, icon: Icon } = STYLES[tone];
  return (
    <div className={cn("mt-6 flex gap-3 rounded-lg border p-4", box)} data-testid={testId} data-tour-id={tourId}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        {children && <div className="mt-1 text-sm text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
