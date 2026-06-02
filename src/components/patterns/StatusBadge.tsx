import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Status badge with meaning-carrying colors (the semantic `status` palette).
 * Maps common domain statuses to a tone; unknown statuses fall back to neutral.
 */
type Tone = "success" | "progress" | "info" | "warning" | "danger" | "neutral";

const TONE_BY_STATUS: Record<string, Tone> = {
  // generic
  APPROVED: "success", COMPLETED: "success", ONBOARDED: "success", MATCHED: "success",
  PROCESSED: "success", CLOSED: "success", delivered: "success", ACTIVE: "success",
  IN_PROGRESS: "progress", AWAITING_APPROVAL: "progress", ISSUED: "progress",
  ACKNOWLEDGED: "progress", PARTIAL_APPROVAL: "progress", partial: "progress",
  PENDING: "info", PENDING_APPROVAL: "info", PENDING_ONBOARDING: "info", DRAFT: "info",
  NOT_STARTED: "neutral", upcoming: "info",
  ON_HOLD: "warning", EXCEPTION: "warning", RAISED: "warning", overdue: "warning",
  RESCHEDULED: "warning", IN_CAPA: "warning",
  CANCELLED: "danger", REJECTED: "danger", SUSPENDED: "danger", OFFBOARDED: "danger",
};

const TONE_CLASS: Record<Tone, string> = {
  success: "border-status-success/30 bg-status-success-bg text-status-success",
  progress: "border-status-progress/30 bg-status-progress-bg text-status-progress",
  info: "border-status-info/30 bg-status-info-bg text-status-info",
  warning: "border-status-warning/40 bg-status-warning-bg text-status-warning",
  danger: "border-status-danger/30 bg-status-danger-bg text-status-danger",
  neutral: "border-status-neutral/30 bg-status-neutral-bg text-status-neutral",
};

export function StatusBadge({ status, className }: { status?: string; className?: string }) {
  if (!status) return null;
  const tone = TONE_BY_STATUS[status] ?? "neutral";
  const label = status.replace(/_/g, " ").toLowerCase();
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", TONE_CLASS[tone], className)}
    >
      {label}
    </Badge>
  );
}

/** Grade pill A/B/C for supplier scorecards. */
export function GradeBadge({ grade }: { grade?: string }) {
  if (!grade) return null;
  const tone: Tone = grade === "A" ? "success" : grade === "B" ? "warning" : "danger";
  return (
    <Badge variant="outline" className={cn("font-semibold", TONE_CLASS[tone])}>
      Grade {grade}
    </Badge>
  );
}
