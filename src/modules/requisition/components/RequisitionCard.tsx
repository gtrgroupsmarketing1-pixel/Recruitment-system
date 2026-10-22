import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { RequisitionView } from "@/modules/requisition/requisition.service";
import { FulfillmentBar } from "./FulfillmentBar";
import { ReqStatusBadge } from "./ReqStatusBadge";
import { SlaBadge } from "./SlaBadge";
import { formatOnboarding } from "./format";

type Props = { req: RequisitionView };

export function RequisitionCard({ req }: Props) {
  const onboard = req.targetOnboardingDate
    ? formatOnboarding(req.targetOnboardingDate.toISOString())
    : "—";
  const title = req.notes?.trim() || req.roleCategory;
  return (
    <Link
      href={`/requisitions/${req.id}`}
      className="block rounded-xl outline-none transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="cursor-pointer p-3 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium underline-offset-2 group-hover:underline">
            {title}
          </span>
          <ReqStatusBadge status={req.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{req.reqCode}</p>
        <p className="mt-2 text-sm">
          {req.client.name} · {req.country} · {req.roleCategory}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <SlaBadge flag={req.slaFlag} />
          <span className="text-xs text-neutral-600">Onboard {onboard}</span>
        </div>
        <div className="mt-3">
          <FulfillmentBar
            mobilized={req.fulfillment.mobilized}
            target={req.fulfillment.target}
          />
        </div>
      </Card>
    </Link>
  );
}
