"use client";

import { completeStepAction } from "@/modules/compliance/complete.action";

type Props = {
  caseId: string;
  checklistId: string;
  locked: boolean;
  waitingOn: string | null;
};

export function CompleteStepButton({ caseId, checklistId, locked, waitingOn }: Props) {
  return (
    <form action={completeStepAction}>
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="checklistId" value={checklistId} />
      <button
        type="submit"
        disabled={locked}
        title={locked ? `Waiting on: ${waitingOn ?? "prior step"}` : "Complete step"}
        className="rounded border px-2 py-1 text-xs disabled:opacity-40"
      >
        {locked ? "Locked" : "Complete"}
      </button>
    </form>
  );
}
