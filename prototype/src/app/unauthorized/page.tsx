"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a role tries to reach a route it has no permission for (RBAC route gate). */
export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldX className="h-10 w-10 text-status-danger" />
      <h1 className="text-2xl font-semibold">Not authorized</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your role does not have permission to view this page. Switch to a role with the required
        permission, or return to your dashboard.
      </p>
      <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
    </div>
  );
}
