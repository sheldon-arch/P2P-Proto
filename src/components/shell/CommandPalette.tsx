"use client";

/**
 * Cmd+K command palette. Jumps to any nav destination the active role can reach.
 * A working control (not a dead end) — the crawler asserts opened menus have items.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useSession } from "@/lib/session/SessionProvider";
import { navForRole } from "@/lib/rbac/rbac";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const router = useRouter();
  const nav = navForRole(user.roleId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  function go(route: string) {
    setOpen(false);
    router.push(route);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="command-trigger"
        className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Go to…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {nav.map((item) => (
              <CommandItem key={item.id} value={item.label} onSelect={() => go(item.route)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
