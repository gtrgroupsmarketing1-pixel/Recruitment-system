type Props = { status: string };

const COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  PENDING: "bg-neutral-100 text-neutral-700",
  UNKNOWN: "bg-neutral-100 text-neutral-500",
};

export function ConnectorStatusBadge({ status }: Props) {
  const cls = COLORS[status] ?? COLORS.UNKNOWN;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>
  );
}
