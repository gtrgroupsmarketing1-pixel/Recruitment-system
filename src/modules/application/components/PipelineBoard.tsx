import { PIPELINE_ORDER } from "@/modules/application/application.status-order";
import type { ApplicationListItem } from "./ApplicationList";
import { PipelineColumn } from "./PipelineColumn";

type Props = { applications: ApplicationListItem[] };

export function PipelineBoard({ applications }: Props) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {PIPELINE_ORDER.map((status) => {
        const items = applications.filter((row) => row.status === status);
        return (
          <PipelineColumn key={status} status={status} items={items} />
        );
      })}
    </div>
  );
}
