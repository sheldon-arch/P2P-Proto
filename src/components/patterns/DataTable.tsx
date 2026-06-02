"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  mono?: boolean;
};

/**
 * Generic data table covering the five archetype states: loading (skeleton),
 * empty (designed message), error (designed message), populated, and row click.
 * Used by every list/queue screen.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  isLoading,
  error,
  emptyMessage = "Nothing here yet.",
  onRowClick,
  getRowId,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={cn("text-xs uppercase tracking-wide", c.className)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!isLoading && !!error && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-status-danger">
                Could not load data. {(error as Error)?.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !error && rows && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground" data-testid="empty-state">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !error && rows && rows.length > 0 && rows.map((row, i) => (
            <TableRow
              key={getRowId ? getRowId(row) : i}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              data-testid="data-row"
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={cn(c.mono && "font-mono text-xs", c.className)}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
