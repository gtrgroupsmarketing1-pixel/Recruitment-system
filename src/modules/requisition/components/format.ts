export type SlaFlag = "RED" | "AMBER" | "GREEN" | null;

export function formatSlaFlag(flag: SlaFlag): {
  label: string;
  className: string;
  aria: string;
} {
  if (flag === "RED") {
    return {
      label: "RED",
      className: "bg-red-100 text-red-800",
      aria: "SLA red",
    };
  }
  if (flag === "AMBER") {
    return {
      label: "AMBER",
      className: "bg-amber-100 text-amber-900",
      aria: "SLA amber",
    };
  }
  if (flag === "GREEN") {
    return {
      label: "GREEN",
      className: "bg-green-100 text-green-800",
      aria: "SLA green",
    };
  }
  return { label: "", className: "", aria: "" };
}

export function formatFulfillment(
  mobilized: number,
  target: number
): { pct: number; label: string } {
  const pct = target <= 0 ? 0 : Math.min(100, Math.round((100 * mobilized) / target));
  return { pct, label: `${mobilized} / ${target}` };
}

export function formatOnboarding(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}
