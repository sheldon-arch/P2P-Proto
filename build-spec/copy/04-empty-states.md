# Empty-State Copy

The copy for every queue, list, and panel when it has no rows. Follows the reference UI's `EmptyMessage` pattern: an entity icon, one short line, and an optional call-to-action button where the user can do something about it. A blank table never renders. An empty state is never an error; it says either "nothing needs you right now" (a good thing, for a work queue) or "create the first one" (for a master list).

Two kinds:
- Work queues (things assigned to you): the empty state is reassuring ("you're all caught up"), because empty means done. The reference UI's "You're all caught up!" for My Focus is the model.
- Master lists and catalogs (the data): the empty state invites creation ("No suppliers yet. Add the first one."), with a CTA gated by the same permission as the list's Add button. If the user lacks create permission, drop the CTA and show the neutral line only.

Because the seed dataset (task #3) fills every queue and list for the demo, these states are rarely seen live; they exist so the prototype is complete and so a filtered view that returns nothing reads correctly. A filtered-to-empty view uses the filter variant, not the seeded-empty variant.

Style: one line, sentence case, no exclamation beyond the single caught-up case, no marketing.

## Work queues (per role; empty = caught up)

| Queue key | Screen / role | Icon | Line | CTA |
| --- | --- | --- | --- | --- |
| `myFocus.empty` | My Focus / home queue (all roles) | inbox | "You're all caught up. Nothing needs you right now." | none |
| `approvals.empty` | Approvals (approver, management) | check-circle | "No approvals waiting." | none |
| `sourcing.empty` | RFQs to run (buyer) | file-search | "No requisitions are waiting to be sourced." | none |
| `po.toIssue.empty` | POs to issue (buyer) | file-text | "No awarded quotes waiting for a PO." | none |
| `deliveries.empty` | Deliveries / GRN queue (receiving, engineering) | truck | "No deliveries are due or in transit." | none |
| `inspections.empty` | QC inspections (quality) | clipboard-check | "No inspections pending." | none |
| `match.empty` | Match exceptions (buyer, finance) | git-compare | "No match exceptions. Invoices are clearing cleanly." | none |
| `invoices.toApprove.empty` | Invoices to approve (finance maker) | receipt | "No invoices waiting for approval." | none |
| `payments.toRelease.empty` | Payments to release (finance checker) | wallet | "No payments waiting for release." | none |
| `cashflow.empty` | Cashflow / installments (finance) | calendar | "No upcoming installments in this window." | "Change the date range" |
| `ncr.open.empty` | Open NCRs / CAPAs (quality) | alert-triangle | "No open non-conformances." | none |
| `returns.empty` | Returns / RMAs (receiving, quality) | rotate-ccw | "No active returns." | none |
| `budget.alerts.empty` | Budget alerts (budget owner) | pie-chart | "No budgets need attention." | none |
| `tax.review.empty` | Tax / compliance review (tax compliance) | shield-check | "No items waiting for tax or compliance review." | none |

## Master lists and catalogs (empty = create the first one; CTA gated by create permission)

| List key | Screen | Icon | Line | CTA (permission) |
| --- | --- | --- | --- | --- |
| `suppliers.empty` | Suppliers | building | "No suppliers yet." | "Add supplier" (suppliers.create) |
| `items.empty` | Items | package | "No items yet." | "Add item" (items.create) |
| `requisitions.empty` | Requisitions (requester) | file-plus | "You have not raised any requisitions yet." | "New requisition" (requisition.create) |
| `pos.empty` | Purchase Orders | file-text | "No purchase orders yet." | none (POs are created from awarded quotes, not directly) |
| `rfqs.empty` | RFQs | file-search | "No RFQs yet." | "Start an RFQ" (rfq.create) |
| `projects.empty` | Projects / cost centers | folder | "No projects or cost centers set up." | "Add project" (admin) |
| `budgets.empty` | Budgets | pie-chart | "No budgets defined." | "Add budget" (budget.manage) |
| `currencies.empty` | Currency | coins | "No currencies configured." | "Add currency" (currency.create) |
| `uom.empty` | Units of measure | ruler | "No units of measure configured." | "Add UoM" (uom.create) |
| `segments.empty` | Segments | tag | "No segments configured." | "Add segment" (segments.create) |
| `payterms.empty` | Payment terms | calendar | "No payment terms configured." | "Add payment terms" (payTerms.create) |
| `supplierGroups.empty` | Supplier groups | layers | "No supplier groups configured." | "Add group" (supplierGroups.create) |
| `warehouses.empty` | Warehouses | warehouse | "No warehouses configured." | "Add warehouse" (warehouses.create) |
| `taxcodes.empty` | Tax codes | percent | "No tax codes configured." | "Add tax code" (taxCodes.create) |
| `assetProposals.empty` | Assets and proposals | box | "No asset proposals yet." | "Add proposal" (assetProposals.create) |
| `users.empty` | Users and organization | users | "No users yet." | "Add user" (admin) |
| `routingRules.empty` | Routing rules | git-branch | "No routing rules configured. Requisitions cannot be routed for approval until rules exist." | "Add rule" (routingRules.create) |
| `fields.empty` | Field configuration | sliders | "No fields configured." | none (read-only inspector) |
| `scorecards.empty` | Supplier scorecards | bar-chart | "No scorecards yet. They are generated once a supplier has delivery and quality history." | none |
| `auditlog.empty` | Audit log | scroll | "No activity recorded for this filter." | none |

## Filter-to-empty variant (a search or filter matched nothing)

When a list has data but the current filter returns nothing, the empty state is different: it acknowledges the filter and offers to clear it, rather than implying the data does not exist.

| Key | Line | CTA |
| --- | --- | --- |
| `filter.noMatch` | "No {entity} match the current filters." | "Clear filters" |
| `search.noMatch` | "No {entity} match \"{searchTerm}\"." | "Clear search" |

## Detail-panel empties (sub-sections within a record)

The reference UI's per-panel empties (comments, attachments, audit). One line, no CTA unless the user can add.

| Key | Line | CTA |
| --- | --- | --- |
| `comments.empty` | "No comments yet. Be the first to comment." | (the comment box itself) |
| `attachments.empty` | "No attachments." | "Upload" (where permitted) |
| `audit.empty` | "No history recorded yet." | none |
| `lines.empty` | "No lines added yet." | "Add line" (where the form allows) |
| `quotes.empty` | "No quotes received yet." | "Record a quote" (buyer) |
| `installments.empty` | "No installments scheduled yet." | "Add installment" (finance, where the schedule is not locked) |
| `grnBlocks.empty` | "Nothing received against this PO yet." | none |
| `fieldHistory.empty` | "No changes recorded for this field." | none |

## Dashboard empties (a KPI tile or chart with no data)

A KPI tile never shows a blank or a zero that reads as broken; it shows the metric with a "no data yet" note when the seed/history is genuinely empty.

| Key | Line |
| --- | --- |
| `kpi.noData` | "Not enough history yet to compute this." |
| `chart.noData` | "No data for this period." |
| `scorecard.noHistory` | "This supplier has no delivery or quality history yet, so there is no scorecard." |
