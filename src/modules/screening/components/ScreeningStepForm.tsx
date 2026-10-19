"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ScreeningStep } from "@prisma/client";

type Props = {
  step: ScreeningStep;
  screeningId: string;
  requisitionId: string;
  onComplete: (formData: FormData) => Promise<void>;
};

export function ScreeningStepForm({
  step,
  screeningId,
  requisitionId,
  onComplete,
}: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setDone(false);
    try {
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      await onComplete(formData);
      setDone(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="screeningId" value={screeningId} />
      <input type="hidden" name="requisitionId" value={requisitionId} />
      <input type="hidden" name="stepOrder" value={String(step.stepOrder)} />
      <select
        name="status"
        defaultValue="PASSED"
        className="border border-input rounded px-2 py-1 text-xs bg-background"
      >
        <option value="PASSED">Pass</option>
        <option value="FAILED">Fail</option>
      </select>
      <input
        name="score"
        type="number"
        placeholder="score"
        className="border border-input rounded px-2 py-1 text-xs bg-background w-16"
      />
      <input
        name="notes"
        placeholder="notes"
        className="border border-input rounded px-2 py-1 text-xs bg-background w-32"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record"}
      </Button>
      {done && <span className="text-xs text-green-600">Recorded.</span>}
    </form>
  );
}
