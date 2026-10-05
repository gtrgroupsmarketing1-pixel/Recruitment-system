import { Badge } from "@/components/ui/badge";
import { formatSlaFlag, type SlaFlag } from "./format";

type Props = { flag: SlaFlag };

export function SlaBadge({ flag }: Props) {
  const view = formatSlaFlag(flag);
  if (!view.label) return null;
  return (
    <Badge className={view.className}>
      <span aria-label={view.aria}>{view.label}</span>
    </Badge>
  );
}
