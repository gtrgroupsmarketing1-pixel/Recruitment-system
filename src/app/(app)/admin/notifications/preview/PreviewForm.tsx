"use client";

import { useActionState } from "react";
import {
  previewAction,
  type PreviewResult,
} from "./preview.action";

type Props = {
  keys: string[];
  sample: string;
};

const initial: PreviewResult = { subject: null, body: "", htmlBody: null };

export function PreviewForm({ keys, sample }: Props) {
  const [state, formAction, pending] = useActionState<PreviewResult, FormData>(
    async (_prev, formData) => previewAction(formData),
    initial
  );

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-3 text-sm">
        <label className="grid gap-1">
          Template
          <select name="templateKey" className="rounded border px-2 py-1">
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Context JSON
          <textarea
            name="context"
            rows={10}
            defaultValue={sample}
            className="rounded border px-2 py-1 font-mono text-xs"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Render
        </button>
      </form>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.body ? (
        <div className="grid gap-3 text-sm">
          <section>
            <h2 className="font-medium">Subject</h2>
            <p>{state.subject ?? "—"}</p>
          </section>
          <section>
            <h2 className="font-medium">Plaintext</h2>
            <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3">{state.body}</pre>
          </section>
          <section>
            <h2 className="font-medium">HTML</h2>
            <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs">
              {state.htmlBody ?? "—"}
            </pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
