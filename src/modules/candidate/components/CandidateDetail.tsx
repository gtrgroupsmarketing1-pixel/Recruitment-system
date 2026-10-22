import Link from "next/link";
import type { CandidateDetailView } from "@/modules/candidate/candidate.service";
import { candidateShortCode } from "@/modules/candidate/candidate-code";
import { updateCandidateAction, softDeleteCandidateAction } from "@/modules/candidate/update.action";
import { formatCandidateName } from "./format";

type Props = {
  data: CandidateDetailView;
  requisitions?: { id: string; reqCode: string }[];
};

export function CandidateDetail({ data, requisitions = [] }: Props) {
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {formatCandidateName({ fullName: data.fullName })}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {candidateShortCode(data.id)}
          </p>
        </div>
        <Link
          href={`/candidates/${data.id}/documents`}
          className="text-sm underline underline-offset-2"
        >
          Documents / CV
        </Link>
      </div>

      <form action={updateCandidateAction} className="grid gap-3 rounded-lg border p-4">
        <input type="hidden" name="id" value={data.id} />
        <p className="text-sm font-medium">Edit candidate</p>
        <label className="grid gap-1 text-sm">
          Full name
          <input
            name="fullName"
            defaultValue={data.fullName}
            required
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Phone
          <input
            name="phone"
            defaultValue={data.phone ?? ""}
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            defaultValue={data.email ?? ""}
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Passport
          <input
            name="passportNumber"
            defaultValue={data.passportNumber ?? ""}
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          National ID
          <input
            name="nationalId"
            defaultValue={data.nationalId ?? ""}
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Medical result
          <input
            name="medicalResult"
            defaultValue={data.medicalResult ?? ""}
            className="rounded border px-2 py-1.5"
          />
        </label>

        {requisitions.length > 0 ? (
          <label className="grid gap-1 text-sm">
            Link to open requisition
            <select name="requisitionId" defaultValue="" className="rounded border px-2 py-1.5">
              <option value="">— none —</option>
              {requisitions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.reqCode}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Save changes
        </button>
      </form>

      <form action={softDeleteCandidateAction} className="rounded-lg border border-red-200 p-4">
        <input type="hidden" name="id" value={data.id} />
        <p className="mb-2 text-sm text-muted-foreground">
          Soft-delete removes the candidate from lists (recoverable in DB).
        </p>
        <button type="submit" className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">
          Delete candidate
        </button>
      </form>
    </div>
  );
}
