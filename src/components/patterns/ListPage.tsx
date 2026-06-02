"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "./PageHeader";
import { DataTable, type Column } from "./DataTable";
import { useList } from "@/queries/hooks";

/**
 * List/Queue archetype: header + a data table bound to a store collection via
 * useList. Thin wrapper so each list screen is a few lines. Row click navigates
 * to `${detailBase}/${id}` when provided.
 */
export function ListPage<T extends Record<string, unknown>>({
  title,
  description,
  entity,
  columns,
  actions,
  emptyMessage,
  detailBase,
  getRowId,
  params,
}: {
  title: string;
  description?: string;
  entity: string;
  columns: Column<T>[];
  actions?: React.ReactNode;
  emptyMessage?: string;
  detailBase?: string;
  getRowId?: (row: T) => string;
  params?: Record<string, string>;
}) {
  const router = useRouter();
  const { data, isLoading, error } = useList<T>(entity, params);

  return (
    <div>
      <PageHeader title={title} description={description} actions={actions} />
      <DataTable<T>
        columns={columns}
        rows={data}
        isLoading={isLoading}
        error={error}
        emptyMessage={emptyMessage}
        getRowId={getRowId}
        onRowClick={
          detailBase && getRowId ? (row) => router.push(`${detailBase}/${getRowId(row)}`) : undefined
        }
      />
    </div>
  );
}
