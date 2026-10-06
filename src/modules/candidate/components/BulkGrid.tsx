"use client";

import { useState } from "react";
import { batchStatusAction } from "@/modules/application/batch-status.action";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import { BulkRowCheckbox } from "./BulkRowCheckbox";

export type BulkRow = {
  id: string;
  applicationId: string;
  fullName: string;
  phone: string | null;
  status: string;
};

type Props = {
  requisitionId: string;
  rows: BulkRow[];
};

export function BulkGrid({ requisitionId, rows }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((row) => row.applicationId)));
  }

  return (
    <div className="grid gap-3">
      <form action={batchStatusAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="requisitionId" value={requisitionId} />
        {Array.from(selected).map((id) => (
          <input key={id} type="hidden" name="applicationId" value={id} />
        ))}
        <label className="text-sm">
          Set status
          <select
            name="toStatus"
            className="ml-2 rounded border px-2 py-1"
            defaultValue={PIPELINE_ORDER[0]}
          >
            {PIPELINE_ORDER.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={selected.size === 0}
          className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          Apply to {selected.size} selected
        </button>
      </form>

      <p className="text-xs text-neutral-500">
        Showing {rows.length} row{rows.length === 1 ? "" : "s"}
        {rows.length >= 200 ? " (capped at 200 — filter to narrow)" : ""}.
      </p>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">
              <input
                type="checkbox"
                checked={rows.length > 0 && selected.size === rows.length}
                onChange={(event) => toggleAll(event.target.checked)}
              />
            </th>
            <th className="p-2">Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.applicationId} className="border-b">
              <td className="p-2">
                <BulkRowCheckbox
                  value={row.applicationId}
                  checked={selected.has(row.applicationId)}
                  onChange={toggle}
                />
              </td>
              <td className="p-2">{row.fullName}</td>
              <td className="p-2">{row.phone ?? "—"}</td>
              <td className="p-2 font-mono text-xs">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
