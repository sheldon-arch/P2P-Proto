import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A single KPI tile: label, value, optional sub-text/formula and trend hint. */
export function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "success" ? "text-status-success"
      : tone === "warning" ? "text-status-warning"
        : tone === "danger" ? "text-status-danger"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("mt-1 font-mono text-2xl font-semibold", toneClass)}>{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
