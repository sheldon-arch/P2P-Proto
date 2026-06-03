/**
 * Tiny fetch wrapper for the mock API. Injects the current role + user id as
 * headers so MSW can apply the field-visibility wall and attribute actions.
 * The role is read from a module-level holder kept in sync by the QueryProvider.
 */
let currentRole: string | undefined;
let currentUserId: string | undefined;
let tourActive = false;

export function setApiIdentity(role: string | undefined, userId: string | undefined) {
  currentRole = role;
  currentUserId = userId;
}

/** While a guided tour is running, requests carry x-tour so the mock API skips
 *  its artificial latency (the tour must feel instant). Manual browsing keeps
 *  the realistic latency. Toggled by the TourProvider on start/exit. */
export function setTourActive(active: boolean) {
  tourActive = active;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (currentRole) h["x-role"] = currentRole;
  if (currentUserId) h["x-user-id"] = currentUserId;
  if (tourActive) h["x-tour"] = "1";
  return h;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  list: <T>(entity: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetch(`/api/${entity}${qs}`, { headers: headers() }).then((r) => handle<T[]>(r));
  },
  one: <T>(entity: string, id: string) =>
    fetch(`/api/${entity}/${id}`, { headers: headers() }).then((r) => handle<T>(r)),
  create: <T>(entity: string, body: Record<string, unknown>) =>
    fetch(`/api/${entity}`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then((r) => handle<T>(r)),
  patch: <T>(entity: string, id: string, body: Record<string, unknown>) =>
    fetch(`/api/${entity}/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify(body) }).then((r) => handle<T>(r)),
  transition: <T>(entity: string, id: string, action: string, payload?: Record<string, unknown>) =>
    fetch(`/api/${entity}/${id}/transition`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ action, payload }),
    }).then((r) => handle<T>(r)),
  computed: <T>(path: string) => fetch(`/api/${path}`, { headers: headers() }).then((r) => handle<T>(r)),
};
