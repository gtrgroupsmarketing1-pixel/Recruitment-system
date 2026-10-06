import type { CandidateListItem } from "@/modules/candidate/candidate.service";
import { CandidateCard } from "./CandidateCard";

type Props = { data: CandidateListItem[] };

export function CandidateList({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-600">No candidates.</p>;
  }
  return (
    <div className="grid gap-3">
      {data.map((candidate) => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
}
