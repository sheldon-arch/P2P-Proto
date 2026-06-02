"use client";

/**
 * Admin: Users & roles (diagram 01 — Users, Roles). Lists users with their role,
 * department, and approval limit. Demonstrates RBAC user/role administration
 * (creation is mocked per scope-and-gaps; the permission model is real).
 */
import { PageHeader } from "@/components/patterns/PageHeader";
import { DataTable, type Column } from "@/components/patterns/DataTable";
import { useList } from "@/queries/hooks";

type User = Record<string, unknown>;
const columns: Column<User>[] = [
  { key: "id", header: "User ID", mono: true },
  { key: "name", header: "Name" },
  { key: "department", header: "Department" },
  { key: "role", header: "Base role" },
  { key: "approvalLimit", header: "Approval limit", mono: true, className: "text-right",
    render: (r) => (r.approvalLimit ? `$${Number(r.approvalLimit).toLocaleString()}` : "—") },
];

export default function AdminUsers() {
  const { data, isLoading, error } = useList<User>("users");
  return (
    <div>
      <PageHeader title="Users & Roles" description="People, designations, and the RBAC permission matrix" />
      <DataTable<User> columns={columns} rows={data} isLoading={isLoading} error={error} getRowId={(r) => String(r.id)} emptyMessage="No users." />
    </div>
  );
}
