"use client";

/**
 * Client-side half of the commercial-field wall (axiom A17). The server strips
 * hidden fields from the API payload; this hook is the defense-in-depth layer so
 * a denied role (Quality) never sees a commercial field even if a stale/cached
 * record still carries it. Reads the active persona's role and reuses the SAME
 * field-visibility.json rules as the server.
 */
import { useSession } from "@/lib/session/SessionProvider";
import { isFieldHidden } from "./field-visibility";

/** Returns a predicate hidden(entity, field) for the active role. */
export function useFieldVisibility() {
  const { user } = useSession();
  const role = user.roleId;
  return {
    role,
    hidden: (entity: string, field: string) => isFieldHidden(entity, field, role),
  };
}
