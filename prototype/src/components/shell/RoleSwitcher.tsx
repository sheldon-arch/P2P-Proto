"use client";

/**
 * Live persona switcher — the demo device that lets one presenter walk the whole
 * flow across roles, showing the same record from each lens. Switching the role
 * re-derives the sidebar, re-gates controls, and refetches queries (the API
 * identity header updates via IdentitySync, so field visibility re-applies).
 */
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/session/SessionProvider";
import type { RoleId } from "@/lib/rbac/rbac";
import { navForRole } from "@/lib/rbac/rbac";

export function RoleSwitcher() {
  const { user, setRole, personas } = useSession();
  const router = useRouter();

  function onChange(roleId: string) {
    setRole(roleId as RoleId);
    // supplier is external — route to the portal, not the internal shell.
    if (roleId === "supplier") {
      router.push("/portal");
      return;
    }
    // land the new persona on their first nav module (their "home").
    const nav = navForRole(roleId as RoleId);
    router.push(nav[0]?.route ?? "/dashboard");
  }

  return (
    <div className="flex items-center gap-2" data-testid="role-switcher">
      <UserCog className="h-4 w-4 text-muted-foreground" />
      <Select value={user.roleId} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[220px] text-sm" aria-label="Switch persona">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {personas.map((p) => (
            <SelectItem key={p.roleId} value={p.roleId}>
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
