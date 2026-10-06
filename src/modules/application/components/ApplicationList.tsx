import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicationStatusSelect } from "./ApplicationStatusSelect";
import type { ApplicationStatus } from "@prisma/client";

export type ApplicationListItem = {
  id: string;
  candidateId: string;
  requisitionId: string;
  status: ApplicationStatus;
  candidateName: string;
  allowed: ApplicationStatus[];
};

type Props = { data: ApplicationListItem[] };

export function ApplicationList({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-600">No candidates linked yet.</p>;
  }
  return (
    <ul className="grid gap-2">
      {data.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2 rounded border p-2">
          <span className="text-sm">{row.candidateName}</span>
          <ApplicationStatusBadge status={row.status} />
          <ApplicationStatusSelect
            applicationId={row.id}
            requisitionId={row.requisitionId}
            current={row.status}
            allowed={row.allowed}
          />
        </li>
      ))}
    </ul>
  );
}
