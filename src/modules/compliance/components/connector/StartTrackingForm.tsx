"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  checklistId: string;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
};

export function StartTrackingForm({ checklistId, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2 text-xs"
      action={(fd) => {
        start(async () => {
          setError(null);
          const res = await action(fd);
          if (!res.ok) setError(res.error ?? "Failed");
          else router.refresh();
        });
      }}
    >
      <input type="hidden" name="checklistId" value={checklistId} />
      <label className="grid gap-0.5">
        Tracking ID
        <input
          name="trackingId"
          required
          className="rounded border px-2 py-1"
          placeholder="Government tracking ID"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded border bg-white px-2 py-1 disabled:opacity-50"
      >
        {pending ? "Starting…" : "Start tracking"}
      </button>
      {error ? <p className="w-full text-red-600">{error}</p> : null}
    </form>
  );
}
