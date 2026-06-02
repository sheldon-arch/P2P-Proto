// State-machine config for the Unified P2P prototype.
// Each lifecycle: states, transitions {from, to, on (action), guard, effect, role}.
// The UI reads this to render ONLY legal transitions (no Approve on an APPROVED record).
// The mock service layer (task #9) uses these as the ONLY mutators, so illegal states are unreachable.
// Derived from model/ontology.md sec 4-5 and model/data-model.md state machines. Axiom refs in comments.

export type Transition = {
  from: string;
  to: string;
  on: string;          // the action/event that triggers it (maps to a permission)
  guard?: string;      // condition expression that must hold (axiom-backed)
  effect?: string;     // side effect (what else changes)
  role: string;        // who can trigger it
};
export type StateMachine = {
  entity: string;
  dimension: string;   // which field holds the state
  initial: string;
  terminal: string[];
  states: string[];
  transitions: Transition[];
};

// 1. REQUISITION STAGE (linear, one step forward only) - axiom A2
export const requisitionStage: StateMachine = {
  entity: 'Requisition', dimension: 'stage', initial: 'INITIATION', terminal: ['POST_DELIVERY'],
  states: ['INITIATION', 'ORDERED', 'PARTIAL_DELIVERY', 'POST_DELIVERY'],
  transitions: [
    { from: 'INITIATION', to: 'ORDERED', on: 'moveStage', guard: 'allMandatoryFieldsFilled(INITIATION) && newIndex == currentIndex+1', effect: 'none on status/completion', role: 'Procurement/Buyer' },
    { from: 'ORDERED', to: 'PARTIAL_DELIVERY', on: 'moveStage', guard: 'allMandatoryFieldsFilled(ORDERED)', role: 'Receiving/Warehouse' },
    { from: 'PARTIAL_DELIVERY', to: 'POST_DELIVERY', on: 'moveStage', guard: 'allMandatoryFieldsFilled(PARTIAL_DELIVERY) per block', role: 'Receiving/Warehouse' },
  ],
};

// 2. REQUISITION STATUS (single) - COMPLETED guard is axiom A3
export const requisitionStatus: StateMachine = {
  entity: 'Requisition', dimension: 'status', initial: 'IN_PROGRESS', terminal: ['COMPLETED', 'CANCELLED'],
  states: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED', 'COMPLETED'],
  transitions: [
    { from: 'IN_PROGRESS', to: 'ON_HOLD', on: 'changeStatus', guard: 'remarks provided', role: 'Approver|Buyer|Management' },
    { from: 'ON_HOLD', to: 'IN_PROGRESS', on: 'changeStatus', role: 'Approver|Buyer|Management' },
    { from: 'IN_PROGRESS', to: 'CANCELLED', on: 'changeStatus', guard: 'remarks provided', role: 'Approver|Buyer|Management' },
    { from: 'ON_HOLD', to: 'CANCELLED', on: 'changeStatus', guard: 'remarks provided', role: 'Approver|Buyer|Management' },
    { from: 'IN_PROGRESS', to: 'COMPLETED', on: 'changeStatus', guard: 'stage==POST_DELIVERY && allStagesAPPROVED && allMatchesCleared && noOpenNcrCapaBlock (A3)', effect: 'relieve commitment to actual; emit ticket-completed', role: 'Platform/System' },
  ],
};

// 3. APPROVAL STAGE COMPLETION (per stage) - axioms A5, A6, A7
export const approvalCompletion: StateMachine = {
  entity: 'ApprovalStageCompletion', dimension: 'completionStatus', initial: 'NOT_STARTED', terminal: ['APPROVED'],
  states: ['NOT_STARTED', 'IN_PROGRESS', 'READY_FOR_APPROVAL', 'AWAITING_APPROVAL', 'APPROVED'],
  transitions: [
    { from: 'NOT_STARTED', to: 'IN_PROGRESS', on: 'assignUser', guard: 'assignableStage(not Finance/Mgmt approval-only) && assignerDesignation>=target (A5)', role: 'Approver|Buyer' },
    { from: 'IN_PROGRESS', to: 'AWAITING_APPROVAL', on: 'requestApproval', guard: 'approver resolved (least-loaded, urgency-weighted)', effect: 'notify approver', role: 'Approver|Buyer' },
    { from: 'AWAITING_APPROVAL', to: 'APPROVED', on: 'approve', guard: 'actor==approvalRequestedTo || qualified assignee; permission approval.approve; NOT own req/PO (A6)', effect: 'route next stage; update OTIF stats', role: 'Approver|Management' },
    { from: 'AWAITING_APPROVAL', to: 'IN_PROGRESS', on: 'returnForRevision', guard: 'mandatory note', effect: 'back to requester', role: 'Approver' },
    { from: 'IN_PROGRESS', to: 'APPROVED', on: 'autoApprove', guard: 'FINANCE && amountInBase <= approverLimit (default 200000) (A7)', effect: 'isAutoApproved=true; recurse route to next', role: 'Platform/System' },
    { from: 'APPROVED', to: 'AWAITING_APPROVAL', on: 'financialRevert', guard: 'isAutoApproved && (payTerms||paymentSchedules) changed (A7)', effect: 'revert auto-approval', role: 'Platform/System' },
  ],
};

// 4. SUPPLIER / ITEM LIFECYCLE (same shape) - axioms A10, A11
export const supplierLifecycle: StateMachine = {
  entity: 'Supplier', dimension: 'status', initial: 'PENDING_ONBOARDING', terminal: ['OFFBOARDED'],
  states: ['PENDING_ONBOARDING', 'PENDING_APPROVAL', 'ONBOARDED', 'SUSPENDED', 'OFFBOARDED'],
  transitions: [
    { from: 'PENDING_ONBOARDING', to: 'PENDING_APPROVAL', on: 'requestApproval', guard: 'status==PENDING_ONBOARDING', role: 'Procurement/Buyer' },
    { from: 'PENDING_APPROVAL', to: 'ONBOARDED', on: 'approve', guard: 'status==PENDING_APPROVAL && qualification complete (certs/COA/AVL)', role: 'Approver' },
    { from: 'ONBOARDED', to: 'PENDING_APPROVAL', on: 'edit', guard: 'any field changed', effect: 'isErpSynced=false (A10)', role: 'Procurement/Buyer' },
    { from: 'PENDING_APPROVAL', to: 'PENDING_APPROVAL', on: 'edit', effect: 'isErpSynced=false', role: 'Procurement/Buyer' },
    { from: 'ONBOARDED', to: 'SUSPENDED', on: 'suspend', guard: 'failed audit || expired cert || sanctions hit || active CAPA (A11)', effect: 'blocks new POs', role: 'Quality|Tax/Compliance|Administrator' },
    { from: 'SUSPENDED', to: 'ONBOARDED', on: 'reinstate', guard: 'issue resolved', role: 'Quality|Tax/Compliance|Administrator' },
    { from: 'ONBOARDED', to: 'OFFBOARDED', on: 'offboard', guard: 'status==ONBOARDED', role: 'Approver|Administrator' },
  ],
};
export const itemLifecycle: StateMachine = { ...supplierLifecycle, entity: 'Item' };

// 5. PURCHASE ORDER
export const poLifecycle: StateMachine = {
  entity: 'PurchaseOrder', dimension: 'status', initial: 'DRAFT', terminal: ['CLOSED', 'CANCELLED'],
  states: ['DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'CLOSED', 'CANCELLED'],
  transitions: [
    { from: 'DRAFT', to: 'ISSUED', on: 'issue', guard: 'budget committed (A4) && supplier ONBOARDED && buyer!=approver (A6)', effect: 'emit PDF to supplier; hard-commit budget', role: 'Procurement/Buyer' },
    { from: 'ISSUED', to: 'ACKNOWLEDGED', on: 'acknowledge', effect: 'trigger advance payment per schedule', role: 'Supplier/Vendor' },
    { from: 'ACKNOWLEDGED', to: 'ACKNOWLEDGED', on: 'amend', guard: 'before first GR (editableUntilReceipt); audited', effect: 'recompute commitment delta', role: 'Procurement/Buyer' },
    { from: 'ACKNOWLEDGED', to: 'CLOSED', on: 'close', guard: 'all lines received + matched + paid', role: 'Platform/System' },
    { from: 'DRAFT', to: 'CANCELLED', on: 'cancel', role: 'Procurement/Buyer' },
  ],
};

// 6. INSTALLMENT - axiom A9
export const installmentLifecycle: StateMachine = {
  entity: 'Installment', dimension: 'status', initial: 'PENDING', terminal: ['PROCESSED'],
  states: ['PENDING', 'APPROVED', 'PARTIAL_APPROVAL', 'PROCESSED', 'RESCHEDULED'],
  transitions: [
    { from: 'PENDING', to: 'APPROVED', on: 'approve', guard: 'amount>0 && amount==agreed', role: 'Finance-Maker' },
    { from: 'PENDING', to: 'PARTIAL_APPROVAL', on: 'approve', guard: 'amount>0 && amount<agreed', effect: 'create ONE remainder installment (null status, leftover) (A9)', role: 'Finance-Maker' },
    { from: 'APPROVED', to: 'PROCESSED', on: 'process', guard: 'status in {APPROVED,PARTIAL_APPROVAL}; (mgmt release if >= threshold); receipt optional', effect: 'recompute paid/upcoming/overdue', role: 'Finance-Maker' },
    { from: 'PARTIAL_APPROVAL', to: 'PROCESSED', on: 'process', guard: 'same as above', role: 'Finance-Maker' },
    { from: 'PENDING', to: 'RESCHEDULED', on: 'reschedule', guard: 'first reschedule captures originalDate', role: 'Finance-Checker' },
    { from: 'RESCHEDULED', to: 'APPROVED', on: 'approve', guard: 'amount==agreed', role: 'Finance-Maker' },
  ],
};
// NOTE: schedule LOCKED (no delete/edit) if any installment in {APPROVED, PARTIAL_APPROVAL, PROCESSED} (A9).

// 7. MATCH RESULT - axiom A8
export const matchLifecycle: StateMachine = {
  entity: 'MatchResult', dimension: 'matchStatus', initial: 'UNMATCHED', terminal: ['MATCHED', 'REJECTED'],
  states: ['UNMATCHED', 'MATCHED', 'EXCEPTION', 'REJECTED'],
  transitions: [
    { from: 'UNMATCHED', to: 'MATCHED', on: 'runMatch', guard: 'matchType=THREE_WAY iff grnId set else TWO_WAY; within tolerance (price%,qty%,absolute) incl. tax (A8)', effect: 'relieve GR/IR; move commitment to actual', role: 'Platform/System' },
    { from: 'UNMATCHED', to: 'EXCEPTION', on: 'runMatch', guard: 'outside tolerance OR duplicate-invoice OR tax-mismatch OR missing-GR', effect: 'route to resolver by type', role: 'Platform/System' },
    { from: 'EXCEPTION', to: 'MATCHED', on: 'resolveException', guard: 'resolution in {accept, adjust} (+credit/debit note)', role: 'Buyer|Receiving|Tax/Compliance' },
    { from: 'EXCEPTION', to: 'REJECTED', on: 'resolveException', guard: 'resolution==reject', role: 'Finance-Maker' },
  ],
};

// 8. NCR / RETURN / CAPA (the ISO loop) - axiom A11
export const ncrLifecycle: StateMachine = {
  entity: 'NCR', dimension: 'status', initial: 'RAISED', terminal: ['CLOSED'],
  states: ['RAISED', 'DISPOSITIONED', 'IN_CAPA', 'CLOSED'],
  transitions: [
    { from: 'RAISED', to: 'DISPOSITIONED', on: 'disposition', guard: 'disposition in {return,rework,use-as-is-concession,scrap}', role: 'Quality' },
    { from: 'DISPOSITIONED', to: 'IN_CAPA', on: 'raiseCapa', guard: 'systemic/repeated', effect: 'SCAR to supplier (10.2)', role: 'Procurement/Buyer' },
    { from: 'IN_CAPA', to: 'CLOSED', on: 'closeCapa', guard: 'effectiveness verified', effect: 'feed supplier re-evaluation (8.4.1); may SUSPEND supplier (A11)', role: 'Quality' },
    { from: 'DISPOSITIONED', to: 'CLOSED', on: 'close', guard: 'no CAPA needed (disposition resolved)', role: 'Quality' },
  ],
};
export const returnLifecycle: StateMachine = {
  entity: 'Return', dimension: 'closureStatus', initial: 'INITIATED', terminal: ['CLOSED', 'DECLINED'],
  states: ['INITIATED', 'AUTHORIZED', 'CONDITION_IDENTIFIED', 'SHIPMENT_SCHEDULED', 'CLOSED', 'DECLINED'],
  transitions: [
    { from: 'INITIATED', to: 'AUTHORIZED', on: 'authorize', guard: 'RMA number issued (S4.2)', role: 'Procurement/Buyer|Supplier/Vendor' },
    { from: 'INITIATED', to: 'DECLINED', on: 'decline', guard: 'supplier/buyer rejects the return claim; re-disposition required', effect: 'notify originator; the goods stay and a different disposition (rework/use-as-is/scrap) is chosen', role: 'Procurement/Buyer|Supplier/Vendor' },
    { from: 'AUTHORIZED', to: 'CONDITION_IDENTIFIED', on: 'identifyCondition', guard: 'reason in ReturnReason (S4.3)', role: 'Quality' },
    { from: 'CONDITION_IDENTIFIED', to: 'SHIPMENT_SCHEDULED', on: 'scheduleShipment', guard: 'carrier+label+date (S4.4)', role: 'Receiving/Warehouse' },
    { from: 'SHIPMENT_SCHEDULED', to: 'CLOSED', on: 'closeOrAdjust', guard: 'credit/debit note posted (S4.5)', effect: 'adjust creditor ledger + payable; reverse GR/IR', role: 'Finance-Maker' },
  ],
};

export const ALL_MACHINES = [
  requisitionStage, requisitionStatus, approvalCompletion, supplierLifecycle, itemLifecycle,
  poLifecycle, installmentLifecycle, matchLifecycle, ncrLifecycle, returnLifecycle,
];
