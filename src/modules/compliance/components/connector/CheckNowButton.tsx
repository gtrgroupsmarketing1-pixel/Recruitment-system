"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  connectorId: string;
  checklistId: string;
};

export function CheckNowButton({ connectorId, checklistId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
        onClick={() => {
          start(async () => {
            setError(null);
            const res = await fetch(`/api/connectors/${connectorId}/check`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ checklistId }),
            });
            const json = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !json.ok) {
              setError(json.error ?? "Check failed");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Checking…" : "Check now"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
