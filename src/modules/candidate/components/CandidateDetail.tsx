import type { CandidateDetailView } from "@/modules/candidate/candidate.service";
import { formatCandidateName, maskPhone } from "./format";

type Props = { data: CandidateDetailView };

export function CandidateDetail({ data }: Props) {
  return (
    <div className="grid gap-2">
      <h1 className="text-xl font-semibold">
        {formatCandidateName({ fullName: data.fullName })}
      </h1>
      <p className="text-sm">Phone: {data.phone ? maskPhone(data.phone) : "—"}</p>
      <p className="text-sm">Email: {data.email ?? "—"}</p>
      <p className="text-sm">Passport: {data.passportNumber ?? "—"}</p>
      <p className="text-sm">National ID: {data.nationalId ?? "—"}</p>
      <p className="text-sm">Medical: {data.medicalResult ?? "—"}</p>
    </div>
  );
}
