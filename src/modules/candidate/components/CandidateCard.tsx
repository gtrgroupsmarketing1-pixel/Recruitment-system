import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { CandidateListItem } from "@/modules/candidate/candidate.service";
import { candidateShortCode } from "@/modules/candidate/candidate-code";
import { formatCandidateName, maskPhone } from "./format";

type Props = { candidate: CandidateListItem };

export function CandidateCard({ candidate }: Props) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/candidates/${candidate.id}`} className="font-medium hover:underline">
          {formatCandidateName({ fullName: candidate.fullName })}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          {candidateShortCode(candidate.id)}
        </span>
      </div>
      <p className="text-sm text-neutral-600">
        {candidate.phone ? maskPhone(candidate.phone) : "No phone"}
      </p>
    </Card>
  );
}
