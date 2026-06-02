"use client";

/**
 * Role-aware entry. Redirects the active persona to their first nav destination
 * (their "home"), so no one ever lands on an empty page. Supplier would route to
 * the portal (added in Phase 6).
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionProvider";
import { navForRole } from "@/lib/rbac/rbac";

export default function Home() {
  const router = useRouter();
  const { user } = useSession();

  useEffect(() => {
    const nav = navForRole(user.roleId);
    router.replace(nav[0]?.route ?? "/dashboard");
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading your workspace…</div>
    </div>
  );
}
