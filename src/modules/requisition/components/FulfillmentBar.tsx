import { formatFulfillment } from "./format";

type Props = { mobilized: number; target: number };

export function FulfillmentBar({ mobilized, target }: Props) {
  const view = formatFulfillment(mobilized, target);
  return (
    <div>
      <div className="mb-1 text-sm">{view.label}</div>
      <div className="h-2 w-full rounded bg-neutral-200">
        <div
          className="h-2 rounded bg-black"
          style={{ width: `${view.pct}%` }}
        />
      </div>
    </div>
  );
}
