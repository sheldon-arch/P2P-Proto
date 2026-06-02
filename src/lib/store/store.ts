/**
 * In-memory store — the single source of truth for the prototype.
 *
 * Every entity collection lives here as a Map keyed by its id. The transition
 * engine is the ONLY thing allowed to mutate state; screens read via the query
 * layer (which goes through MSW -> these accessors). A deterministic reset
 * reseeds from the seed module so every demo run is byte-identical.
 *
 * This is intentionally framework-free (no React) so it can be unit-tested
 * headless and shared across the MSW worker and the UI in one JS context.
 */

export type Entity = Record<string, unknown> & { id?: string };

export type Collections = Record<string, Map<string, Entity>>;

export type AuditEntry = {
  id: string;
  at: string;
  category: string;
  entity: string;
  entityId: string;
  action: string;
  actorId: string;
  from?: string;
  to?: string;
  detail?: Record<string, unknown>;
};

const PERSIST_KEY = "p2p.store";

class Store {
  private collections: Collections = {};
  private audit: AuditEntry[] = [];
  private seq: Record<string, number> = {};

  /** Serialize to sessionStorage so mutations survive full page reloads (so the
   *  demo keeps state across hard navigations / refresh, and cross-role ripples
   *  persist). Best-effort: storage errors are swallowed. */
  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      const obj: Record<string, Entity[]> = {};
      for (const [name, map] of Object.entries(this.collections)) obj[name] = [...map.values()];
      window.sessionStorage.setItem(PERSIST_KEY, JSON.stringify({ obj, audit: this.audit, seq: this.seq }));
    } catch {
      /* quota or serialization error — ignore */
    }
  }

  /** Hydrate from sessionStorage if present. Returns true if hydrated. */
  hydrate(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.sessionStorage.getItem(PERSIST_KEY);
      if (!raw) return false;
      const { obj, audit, seq } = JSON.parse(raw) as { obj: Record<string, Entity[]>; audit: AuditEntry[]; seq: Record<string, number> };
      this.collections = {};
      for (const [name, rows] of Object.entries(obj)) {
        const map = new Map<string, Entity>();
        for (const row of rows) map.set(this.idOf(name, row), row);
        this.collections[name] = map;
      }
      this.audit = audit ?? [];
      this.seq = seq ?? {};
      return true;
    } catch {
      return false;
    }
  }

  /** Replace all data. Used by reset() with a fresh seed snapshot. */
  load(snapshot: Record<string, Entity[]>): void {
    this.collections = {};
    this.audit = [];
    this.seq = {};
    for (const [name, rows] of Object.entries(snapshot)) {
      const map = new Map<string, Entity>();
      for (const row of rows) {
        const id = this.idOf(name, row);
        map.set(id, { ...row });
      }
      this.collections[name] = map;
    }
    this.persist();
  }

  /** The id field varies by entity; resolve the natural id key. */
  idOf(name: string, row: Entity): string {
    const candidates = [
      "id",
      "identifier",
      "completionId",
      "code",
      "poNumber",
      "invoiceNumber",
      "rfqId",
      "ncrId",
      "returnId",
      "movementId",
    ];
    for (const k of candidates) {
      const v = row[k];
      if (typeof v === "string" && v) return v;
    }
    // composite fallback (e.g. inventory itemId+warehouseId)
    if (row.itemId && row.warehouseId) return `${row.itemId}@${row.warehouseId}`;
    // last resort: synthesize
    return this.nextId(name);
  }

  collection(name: string): Map<string, Entity> {
    if (!this.collections[name]) this.collections[name] = new Map();
    return this.collections[name];
  }

  list(name: string): Entity[] {
    return [...this.collection(name).values()];
  }

  get(name: string, id: string): Entity | undefined {
    return this.collection(name).get(id);
  }

  put(name: string, row: Entity): Entity {
    const id = this.idOf(name, row);
    const stored = { ...row };
    this.collection(name).set(id, stored);
    this.persist();
    return stored;
  }

  patch(name: string, id: string, changes: Partial<Entity>): Entity | undefined {
    const existing = this.collection(name).get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...changes };
    this.collection(name).set(id, updated);
    this.persist();
    return updated;
  }

  remove(name: string, id: string): boolean {
    const ok = this.collection(name).delete(id);
    this.persist();
    return ok;
  }

  /** Deterministic monotonic counter per prefix (no Math.random / Date.now). */
  nextId(prefix: string): string {
    this.seq[prefix] = (this.seq[prefix] ?? 0) + 1;
    return `${prefix}-gen-${String(this.seq[prefix]).padStart(4, "0")}`;
  }

  appendAudit(entry: AuditEntry): void {
    this.audit.push(entry);
  }

  auditLog(): AuditEntry[] {
    return [...this.audit];
  }

  /** All collection names currently loaded. */
  names(): string[] {
    return Object.keys(this.collections);
  }
}

// Single shared instance.
export const store = new Store();
export type { Store };
