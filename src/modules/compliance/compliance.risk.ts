export type RiskInput = {
  caseCreatedAt: Date;
  targetOnboardingDate: Date | null;
  checklists: Array<{
    stepOrder: number;
    name: string;
    status: string;
    dueDate: Date | null;
  }>;
  today?: Date;
};

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  reasons: string[];
  blockingStepName: string | null;
  daysUntilTarget: number | null;
};

function daysBetween(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

function levelFor(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

export function assessRisk(input: RiskInput): RiskAssessment {
  const today = input.today ?? new Date();
  const reasons: string[] = [];
  let overduePoints = 0;
  for (const step of input.checklists) {
    if (step.status === "COMPLETE" || !step.dueDate) continue;
    const overdue = daysBetween(today, step.dueDate);
    if (overdue > 14) overduePoints = Math.max(overduePoints, 40);
    else if (overdue >= 7) overduePoints = Math.max(overduePoints, 30);
    else if (overdue >= 1) overduePoints = Math.max(overduePoints, 20);
  }
  if (overduePoints === 40) reasons.push("Overdue by more than 14 days");
  else if (overduePoints === 30) reasons.push("Overdue by 7 to 14 days");
  else if (overduePoints === 20) reasons.push("Overdue by 1 to 7 days");

  let targetPoints = 0;
  let daysUntilTarget: number | null = null;
  if (input.targetOnboardingDate) {
    daysUntilTarget = daysBetween(input.targetOnboardingDate, today);
    if (daysUntilTarget < 0) {
      targetPoints = 35;
      reasons.push("Target onboarding date missed");
    } else if (daysUntilTarget < 7) {
      targetPoints = 25;
      reasons.push("Fewer than 7 days until target onboarding");
    }
  }

  const stuck = input.checklists.filter((step) => step.status === "IN_PROGRESS").length;
  const stuckPoints = stuck > 2 ? 15 : 0;
  if (stuckPoints) reasons.push("More than 2 steps stuck in progress");

  const complete = input.checklists.filter((step) => step.status === "COMPLETE").length;
  const ratio = input.checklists.length === 0 ? 1 : complete / input.checklists.length;
  const age = daysBetween(today, input.caseCreatedAt);
  const agePoints = age > 60 && ratio < 0.5 ? 20 : 0;
  if (agePoints) reasons.push("Case older than 60 days with under half the steps complete");

  const score = Math.min(100, overduePoints + targetPoints + stuckPoints + agePoints);
  const blocking = [...input.checklists]
    .filter((step) => step.status !== "COMPLETE")
    .sort((a, b) => a.stepOrder - b.stepOrder)[0];
  return {
    level: levelFor(score),
    score,
    reasons,
    blockingStepName: blocking?.name ?? null,
    daysUntilTarget,
  };
}
