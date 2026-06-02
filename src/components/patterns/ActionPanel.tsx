"use client";

/**
 * Generic action panel. Asks the engine which transitions are legal for a record
 * (useLegalActions) and renders a button per action. Clicking fires the
 * transition through useTransition -> the engine (guards + effects run). After a
 * transition, both the record and its legal actions refetch, so the available
 * actions update live. Role-gated: an action only shows if the active role is
 * allowed to perform it.
 */
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLegalActions, useTransition } from "@/queries/hooks";
import { useSession } from "@/lib/session/SessionProvider";
import type { RoleId } from "@/lib/rbac/rbac";

type ActionSpec = {
  label: string;
  roles: RoleId[]; // which personas may perform it (demo gating)
  variant?: "default" | "outline" | "destructive";
  payload?: Record<string, unknown>;
  confirmNote?: boolean; // require a note (e.g. return, suspend)
};

// Per-action presentation + role gating for the demo.
const ACTIONS: Record<string, ActionSpec> = {
  issue: { label: "Issue PO", roles: ["buyer", "administrator"] },
  acknowledge: { label: "Acknowledge PO (supplier)", roles: ["buyer", "administrator"] },
  amend: { label: "Amend", roles: ["buyer", "administrator"], variant: "outline" },
  close: { label: "Close", roles: ["buyer", "administrator"], variant: "outline" },
  cancel: { label: "Cancel", roles: ["buyer", "administrator"], variant: "destructive" },
  // GRN / inspection
  disposition: { label: "Disposition", roles: ["quality", "administrator"] },
  raiseCapa: { label: "Raise CAPA", roles: ["buyer", "quality", "administrator"] },
  closeCapa: { label: "Close CAPA", roles: ["quality", "administrator"] },
  // supplier / item lifecycle
  suspend: { label: "Suspend", roles: ["quality", "tax_compliance", "administrator"], variant: "destructive", confirmNote: true },
  reinstate: { label: "Reinstate", roles: ["quality", "tax_compliance", "administrator"], variant: "outline" },
  requestApproval: { label: "Request approval", roles: ["buyer", "approver", "administrator"], variant: "outline" },
  approve: { label: "Approve", roles: ["approver", "management", "administrator"] },
  edit: { label: "Edit (reverts to pending)", roles: ["buyer", "administrator"], variant: "outline" },
  offboard: { label: "Offboard", roles: ["buyer", "approver", "administrator"], variant: "destructive" },
  // installments (maker/checker)
  process: { label: "Process payment (maker)", roles: ["finance_maker", "administrator"] },
  reschedule: { label: "Hold / reschedule (checker)", roles: ["finance_checker", "administrator"], variant: "outline" },
  // returns
  authorize: { label: "Authorize return", roles: ["buyer", "administrator"] },
  identifyCondition: { label: "Identify condition", roles: ["quality", "administrator"] },
  scheduleShipment: { label: "Schedule shipment", roles: ["receiving", "administrator"] },
  closeOrAdjust: { label: "Close + credit/debit note", roles: ["finance_maker", "administrator"] },
};

export function ActionPanel({
  entity,
  id,
  extraPayload,
}: {
  entity: string;
  id: string;
  extraPayload?: Record<string, unknown>;
}) {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data } = useLegalActions(entity, id);
  const transition = useTransition(entity);

  const actions = (data?.actions ?? []).filter((a) => {
    const spec = ACTIONS[a];
    return spec && spec.roles.includes(user.roleId);
  });

  if (actions.length === 0) return null;

  async function run(action: string) {
    const spec = ACTIONS[action];
    try {
      await transition.mutateAsync({ id, action, payload: { ...spec?.payload, ...extraPayload } });
      await qc.invalidateQueries({ queryKey: [entity, "actions", id] });
      toast.success(`${spec?.label ?? action} done`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card className="mt-6" data-testid="action-panel">
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a}
            variant={ACTIONS[a]?.variant ?? "default"}
            disabled={transition.isPending}
            onClick={() => run(a)}
            data-testid={`action-${a}`}
          >
            {ACTIONS[a]?.label ?? a}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
