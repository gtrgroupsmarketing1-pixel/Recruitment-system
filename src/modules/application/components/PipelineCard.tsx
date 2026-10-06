import type { ApplicationListItem } from "./ApplicationList";
import { ApplicationStatusSelect } from "./ApplicationStatusSelect";

type Props = { application: ApplicationListItem };

export function PipelineCard({ application }: Props) {
  return (
    <div className="rounded border bg-white p-2 text-sm shadow-sm">
      <p className="font-medium">{application.candidateName}</p>
      <div className="mt-2">
        <ApplicationStatusSelect
          applicationId={application.id}
          requisitionId={application.requisitionId}
          current={application.status}
          allowed={application.allowed}
        />
      </div>
    </div>
  );
}
