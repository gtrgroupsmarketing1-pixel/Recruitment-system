"use client";

import { useState, useTransition } from "react";
import { scheduleInterviewAction } from "./actions";

type Props = {
  applicationId: string;
  defaultName: string;
  defaultEmail: string;
};

export function ScheduleInterviewForm({
  applicationId,
  defaultName,
  defaultEmail,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3 text-sm"
      action={(fd) => {
        start(async () => {
          setError(null);
          setOk(false);
          const res = await scheduleInterviewAction(fd);
          if (!res.ok) setError(res.error);
          else setOk(true);
        });
      }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <label className="grid gap-1">
        Start (ISO local)
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="grid gap-1">
        Duration (minutes)
        <select name="durationMinutes" defaultValue="30" className="rounded border px-2 py-1">
          <option value="15">15</option>
          <option value="30">30</option>
          <option value="45">45</option>
          <option value="60">60</option>
        </select>
      </label>
      <label className="grid gap-1">
        Timezone
        <input
          name="timezone"
          defaultValue="Asia/Dubai"
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="grid gap-1">
        Attendee name
        <input
          name="attendeeName"
          defaultValue={defaultName}
          className="rounded border px-2 py-1"
        />
      </label>
      <label className="grid gap-1">
        Attendee email
        <input
          name="attendeeEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          className="rounded border px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Scheduling…" : "Schedule"}
      </button>
      {error ? <p className="text-red-600">{error}</p> : null}
      {ok ? <p className="text-green-700">Scheduled.</p> : null}
    </form>
  );
}
