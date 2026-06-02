"use client";

/**
 * Session context: holds the current persona and exposes setRole for the live
 * role switcher. Switching personas re-derives the sidebar, re-gates controls,
 * and (via the consumer) refetches queries under the new role context.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RoleId } from "@/lib/rbac/rbac";
import { PERSONAS, PERSONA_BY_ROLE, DEFAULT_PERSONA, type Persona } from "./personas";

type SessionContextValue = {
  user: Persona;
  setRole: (roleId: RoleId) => void;
  personas: Persona[];
};

const SessionContext = createContext<SessionContextValue | null>(null);
const STORAGE_KEY = "p2p.activeRole";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Persist the active persona so it survives full-page reloads (and so the
  // guided tour / direct deep-links keep the chosen role). Read synchronously
  // on first render to avoid a flash of the default persona.
  const [user, setUser] = useState<Persona>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY) as RoleId | null;
      if (saved && PERSONA_BY_ROLE[saved]) return PERSONA_BY_ROLE[saved];
    }
    return DEFAULT_PERSONA;
  });

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, user.roleId);
  }, [user]);

  const setRole = useCallback((roleId: RoleId) => {
    const persona = PERSONA_BY_ROLE[roleId];
    if (persona) setUser(persona);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, setRole, personas: PERSONAS }),
    [user, setRole],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
