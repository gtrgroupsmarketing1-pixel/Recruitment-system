import { ConnectorStatusBadge } from "./ConnectorStatusBadge";
import { CheckNowButton } from "./CheckNowButton";

type Props = {
  connectorId: string;
  connectorName: string;
  checklistId: string;
  check: {
    trackingId: string;
    lastStatus: string;
    lastRawStatus: string | null;
    lastCheckedAt: Date | null;
    checkCount: number;
    lastError: string | null;
  };
};

export function ConnectorStatusPanel({
  connectorId,
  connectorName,
  checklistId,
  check,
}: Props) {
  return (
    <div className="mt-2 rounded border bg-neutral-50 p-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {connectorName}: <ConnectorStatusBadge status={check.lastStatus} />
          </p>
          <p className="text-neutral-600">
            Tracking ID: {check.trackingId}
            {check.lastRawStatus ? ` · raw ${check.lastRawStatus}` : ""}
          </p>
          <p className="text-neutral-500">
            Last checked:{" "}
            {check.lastCheckedAt ? check.lastCheckedAt.toISOString().slice(0, 16) : "never"} ·
            checks: {check.checkCount}
          </p>
          {check.lastError ? <p className="text-red-600">Error: {check.lastError}</p> : null}
        </div>
        <CheckNowButton connectorId={connectorId} checklistId={checklistId} />
      </div>
    </div>
  );
}
