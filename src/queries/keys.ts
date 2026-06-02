/**
 * TanStack Query keys. The event bridge invalidates by entity, so keys are
 * structured [entity], [entity, id], and [entity, "list", filters].
 */
export const qk = {
  list: (entity: string, filters?: Record<string, unknown>) =>
    filters ? ([entity, "list", filters] as const) : ([entity, "list"] as const),
  one: (entity: string, id: string) => [entity, "one", id] as const,
  computed: (name: string, arg?: string) =>
    arg ? ([`@${name}`, arg] as const) : ([`@${name}`] as const),
};

/** Entity touched by a domain event -> the query key prefix to invalidate. */
export const ENTITY_FOR_EVENT: Record<string, string[]> = {
  "po.issued": ["purchaseOrders", "budgets", "@kpis"],
  "po.acknowledged": ["purchaseOrders"],
  "approval.approved": ["tickets", "approvalCompletions"],
  "approval.stageAdvanced": ["approvalCompletions", "tickets"],
  "installment.processed": ["installments", "payments", "@kpis"],
  "installment.partialApproved": ["installments"],
  "match.cleared": ["matchResults", "invoices", "budgets"],
  "ncr.capaClosed": ["ncrs", "suppliers", "scorecards"],
  "supplier.suspended": ["suppliers", "scorecards"],
  "requisition.completed": ["tickets", "budgets", "@kpis"],
};
