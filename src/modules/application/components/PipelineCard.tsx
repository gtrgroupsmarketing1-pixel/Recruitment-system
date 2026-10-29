import Link from "next/link";
import type { ApplicationListItem } from "./ApplicationList";
import { ApplicationStatusSelect } from "./ApplicationStatusSelect";
import { Card, CardContent } from "@/components/ui/card";

type Props = { application: ApplicationListItem };

export function PipelineCard({ application }: Props) {
  return (
    <Card className="shadow-sm transition-colors hover:border-primary/40">
      <CardContent className="space-y-2 p-3">
        <Link
          href={`/candidates/${application.candidateId}`}
          className="block text-sm font-medium hover:underline"
        >
          {application.candidateName}
        </Link>
        <p className="text-[10px] text-muted-foreground">
          ID · {application.candidateId.slice(-8)}
        </p>
        <ApplicationStatusSelect
          applicationId={application.id}
          requisitionId={application.requisitionId}
          current={application.status}
          allowed={application.allowed}
        />
      </CardContent>
    </Card>
  );
}
