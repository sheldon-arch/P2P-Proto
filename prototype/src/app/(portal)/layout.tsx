import Link from "next/link";
import { Building2 } from "lucide-react";

/**
 * Supplier portal shell — a separate, lighter chrome from the internal app. The
 * supplier is an external actor (email+OTP authenticated, mocked), not a role in
 * the internal RBAC, so the portal has its own minimal nav.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold">Synthex Supplier Portal</span>
            <span className="text-[11px] text-muted-foreground">Harvest Foods · vendor access</span>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/portal" className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link href="/portal/invoice/new" className="text-muted-foreground hover:text-foreground">Submit invoice</Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground">Exit to internal</Link>
        </nav>
      </header>
      <main className="flex-1 bg-background p-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
