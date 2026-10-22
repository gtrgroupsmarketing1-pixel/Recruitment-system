import Link from "next/link";
import type { CandidateDetailView } from "@/modules/candidate/candidate.service";
import { candidateShortCode } from "@/modules/candidate/candidate-code";
import { formatCandidateName, maskPhone } from "./format";

type Props = { data: CandidateDetailView };

export function CandidateDetail({ data }: Props) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-semibold">
          {formatCandidateName({ fullName: data.fullName })}
        </h1>
        <span className="font-mono text-sm text-muted-foreground">
          {candidateShortCode(data.id)}
        </span>
      </div>
      <p className="text-sm">Phone: {data.phone ? maskPhone(data.phone) : "—"}</p>
      <p className="text-sm">Email: {data.email ?? "—"}</p>
      <p className="text-sm">Passport: {data.passportNumber ?? "—"}</p>
      <p className="text-sm">National ID: {data.nationalId ?? "—"}</p>
      <p className="text-sm">Medical: {data.medicalResult ?? "—"}</p>
      <p className="pt-2 text-sm">
        <Link
          href={`/candidates/${data.id}/documents`}
          className="underline underline-offset-2"
        >
          Upload / manage CV and documents
        </Link>
      </p>
    </div>
  );
}
