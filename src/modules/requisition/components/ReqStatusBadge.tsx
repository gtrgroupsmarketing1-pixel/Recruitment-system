import { Badge } from "@/components/ui/badge";

type Props = {
  status: "OPEN" | "IN_PROGRESS" | "FILLED" | "CANCELLED" | "ON_HOLD";
};

export function ReqStatusBadge({ status }: Props) {
  return <Badge>{status}</Badge>;
}
