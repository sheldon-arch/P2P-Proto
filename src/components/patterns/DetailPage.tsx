"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "./PageHeader";
import { StatusBadge } from "./StatusBadge";
import { useOne } from "@/queries/hooks";

export type DetailField = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => React.ReactNode;
  mono?: boolean;
};

/**
 * Detail archetype: header (with back + status), a properties grid, and an
 * optional actions/extra slot. Bound to a single record via useOne. Used by
 * every record detail screen; later phases add per-entity action panels.
 */
export function DetailPage({
  entity,
  id,
  title,
  statusKey,
  fields,
  backTo,
  actions,
  children,
}: {
  entity: string;
  id: string;
  title: (row: Record<string, unknown>) => string;
  statusKey?: string;
  fields: DetailField[];
  backTo: string;
  actions?: (row: Record<string, unknown>) => React.ReactNode;
  children?: (row: Record<string, unknown>) => React.ReactNode;
}) {
  const router = useRouter();
  const { data: row, isLoading, error } = useOne(entity, id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !row) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push(backTo)} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-status-danger" data-testid="detail-error">
          Record not found.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push(backTo)} className="mb-2">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <PageHeader
        title={title(row)}
        actions={
          <div className="flex items-center gap-2">
            {statusKey && <StatusBadge status={row[statusKey] as string} />}
            {actions?.(row)}
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                <dd className={f.mono ? "font-mono text-sm" : "text-sm"}>
                  {f.render ? f.render(row) : String(row[f.key] ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      {children?.(row)}
    </div>
  );
}
