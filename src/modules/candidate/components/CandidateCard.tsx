import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { CandidateListItem } from "@/modules/candidate/candidate.service";
import { formatCandidateName, maskPhone } from "./format";

type Props = { candidate: CandidateListItem };

export function CandidateCard({ candidate }: Props) {
  return (
    <Card>
      <Link href={`/candidates/${candidate.id}`} className="font-medium">
        {formatCandidateName({ fullName: candidate.fullName })}
      </Link>
      <p className="text-sm text-neutral-600">
        {candidate.phone ? maskPhone(candidate.phone) : "No phone"}
      </p>
    </Card>
  );
}
