import type { RiskLevel } from "@/modules/compliance/compliance.risk";

type Props = { level: RiskLevel; score: number };

const tone: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-700 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-amber-400",
  LOW: "bg-emerald-600 text-white",
};

export function RiskBadge({ level, score }: Props) {
  return <span className={`rounded px-2 py-0.5 text-xs ${tone[level]}`}>{level} {score}</span>;
}
