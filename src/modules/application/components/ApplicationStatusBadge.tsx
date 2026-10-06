import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@prisma/client";

type Props = { status: ApplicationStatus };

export function ApplicationStatusBadge({ status }: Props) {
  return <Badge>{status}</Badge>;
}
