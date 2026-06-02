"use client";

import Link from "next/link";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GitBranch, SlidersHorizontal, Database } from "lucide-react";

const SECTIONS = [
  { id: "users", title: "Users & Roles", desc: "People, roles, and the permission matrix", icon: Users, href: "/admin/users" },
  { id: "routing", title: "Approval & Routing Rules", desc: "Approval chains, limits, nearest-bucket routing", icon: GitBranch, href: "/admin/routing-rules" },
  { id: "fields", title: "Field Configuration", desc: "Per-category, per-stage dynamic field config", icon: SlidersHorizontal, href: "/admin/fields" },
  { id: "masters", title: "Master Data & Bulk Import", desc: "Currencies, UoM, tax codes, warehouses, terms; all-or-nothing import", icon: Database, href: "/admin/masters" },
];

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Administration" description="Configure the platform before transactions flow" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.id} href={s.href} data-testid={`admin-${s.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <CardDescription>{s.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Configurable in the full build.
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
