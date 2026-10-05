import type { RequisitionView } from "@/modules/requisition/requisition.service";
import { RequisitionCard } from "./RequisitionCard";

type Props = { data: RequisitionView[] };

export function RequisitionList({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-600">No requisitions.</p>;
  }
  return (
    <div className="grid gap-3">
      {data.map((req) => (
        <RequisitionCard key={req.id} req={req} />
      ))}
    </div>
  );
}
