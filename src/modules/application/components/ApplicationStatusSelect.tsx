"use client";

import { changeStatusAction } from "@/modules/application/change-status.action";

type Props = {
  applicationId: string;
  requisitionId: string;
  current: string;
  allowed: string[];
};

export function ApplicationStatusSelect({
  applicationId,
  requisitionId,
  current,
  allowed,
}: Props) {
  return (
    <form action={changeStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="requisitionId" value={requisitionId} />
      <select name="toStatus" defaultValue={current} className="rounded border px-2 py-1 text-sm">
        <option value={current}>{current}</option>
        {allowed
          .filter((status) => status !== current)
          .map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
      </select>
      <button type="submit" className="rounded bg-black px-2 py-1 text-xs text-white">
        Update
      </button>
    </form>
  );
}
