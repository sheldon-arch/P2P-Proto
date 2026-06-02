"use client";

/**
 * Root client providers:
 *   1. Start the MSW worker and seed the in-memory store (once), gating render
 *      until ready so no screen fires a request before the mock API is live.
 *   2. QueryClientProvider + the event->invalidation bridge.
 *   3. SessionProvider (current persona) + sync the API identity header to the
 *      active role so the field-visibility wall applies.
 *   4. Toaster for action feedback.
 */
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider, useSession } from "@/lib/session/SessionProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { attachQueryBridge } from "@/lib/events/query-bridge";
import { setApiIdentity } from "@/queries/client";

let queryClient: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 5_000, retry: false, refetchOnWindowFocus: false },
      },
    });
    attachQueryBridge(queryClient);
  }
  return queryClient;
}

let bootstrapped = false;
async function bootstrap(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  // hydrate the store from sessionStorage (so mutations survive reloads); only
  // seed fresh if there is nothing persisted yet.
  const { store } = await import("@/lib/store/store");
  if (!store.hydrate()) {
    const { buildSeedSnapshot } = await import("@/lib/seed");
    store.load(buildSeedSnapshot());
  }
  // start the mock API
  const { worker } = await import("@/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}

/** Keeps the API identity header in sync with the active persona/role. */
function IdentitySync({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  useEffect(() => {
    setApiIdentity(user.roleId, user.id);
  }, [user]);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={getQueryClient()}>
      <SessionProvider>
        <TourProvider>
          <IdentitySync>{children}</IdentitySync>
        </TourProvider>
        <Toaster richColors position="top-right" />
      </SessionProvider>
    </QueryClientProvider>
  );
}
