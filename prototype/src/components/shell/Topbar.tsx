"use client";

/**
 * Top bar: page context on the left, the live RoleSwitcher and the current-user
 * avatar on the right. Every control here is functional (no dead ends).
 */
import { useSession } from "@/lib/session/SessionProvider";
import { RoleSwitcher } from "./RoleSwitcher";
import { CommandPalette } from "./CommandPalette";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function Topbar() {
  const { user } = useSession();
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-3">
        <CommandPalette />
      </div>
      <div className="flex items-center gap-4">
        <TourLauncher />
        <RoleSwitcher />
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-[11px] text-muted-foreground">{user.title}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
