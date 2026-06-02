"use client";

/**
 * Role-aware sidebar. Renders only the nav modules the active role can reach
 * (navForRole), so switching personas visibly changes the app — the RBAC
 * credibility signal. Active route uses the identity accent + left border.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, CheckSquare, Search, ShoppingCart, Truck,
  ClipboardCheck, Receipt, Wallet, Undo2, Building2, Package, PiggyBank,
  BarChart3, Boxes, Settings, CircleDot, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session/SessionProvider";
import { navForRole } from "@/lib/rbac/rbac";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  requisitions: FileText,
  approvals: CheckSquare,
  sourcing: Search,
  "purchase-orders": ShoppingCart,
  purchaseOrders: ShoppingCart,
  deliveries: Truck,
  quality: ClipboardCheck,
  invoices: Receipt,
  payments: Wallet,
  cashflow: Banknote,
  returns: Undo2,
  suppliers: Building2,
  items: Package,
  budgets: PiggyBank,
  analytics: BarChart3,
  inventory: Boxes,
  admin: Settings,
};

export function Sidebar() {
  const { user } = useSession();
  const pathname = usePathname();
  const nav = navForRole(user.roleId);

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
          <CircleDot className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">Harvest Foods</span>
          <span className="text-[11px] text-muted-foreground">Procure-to-Pay</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" data-testid="sidebar-nav">
        {nav.map((item) => {
          const Icon = ICONS[item.id] ?? CircleDot;
          const active = pathname === item.route || pathname.startsWith(item.route + "/");
          return (
            <Link
              key={item.id}
              href={item.route}
              data-testid={`nav-${item.id}`}
              className={cn(
                "flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "border-primary bg-muted font-medium text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3 text-[11px] text-muted-foreground">
        Prototype — seeded demo data
      </div>
    </aside>
  );
}
