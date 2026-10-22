import Link from "next/link";
import { withSessionScope } from "@/core/auth/action-scope";
import { ScreeningService } from "@/modules/screening/screening.service";
import { completeStepAction } from "@/modules/screening/complete-step.action";
import { candidateShortCode } from "@/modules/candidate/candidate-code";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScreeningStepForm } from "./ScreeningStepForm";

export async function ScreeningPanel({
  tenantId,
  applicationId,
  candidateId,
  candidateName,
  applicationStatus,
}: {
  tenantId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  applicationStatus?: string;
}) {
  const screenings = await withSessionScope((_scope) =>
    ScreeningService.getForApplication(tenantId, applicationId)
  );
  const screening = screenings[0];
  if (!screening) return null;
  const requisitionId = screening.application.requisitionId;
  const code = candidateShortCode(candidateId);
  const pendingSteps = screening.steps.filter((s) => s.status === "PENDING").length;
  const passedSteps = screening.steps.filter((s) => s.status === "PASSED").length;
  const totalSteps = screening.steps.length;

  return (
    <Card className="flex h-full min-h-[280px] flex-col p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/candidates/${candidateId}`}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {candidateName}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">{code}</p>
        </div>
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {screening.path.replace("_", " ")}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Outcome</span>
        <Badge
          variant={
            screening.outcome === "PASSED"
              ? "default"
              : screening.outcome === "FAILED"
                ? "destructive"
                : "secondary"
          }
        >
          {screening.outcome ?? "PENDING"}
        </Badge>
        {applicationStatus ? (
          <Badge variant="outline">{applicationStatus}</Badge>
        ) : null}
        <span className="text-muted-foreground">
          {passedSteps}/{totalSteps} steps
        </span>
      </div>

      {screening.outcome === "PASSED" ? (
        <p className="mb-2 text-xs text-green-700">
          Screening passed — you can move this candidate to Shortlisted.
        </p>
      ) : pendingSteps > 0 ? (
        <p className="mb-2 text-xs text-muted-foreground">
          Record each step. When all pass, outcome becomes PASSED automatically.
        </p>
      ) : null}

      <div className="flex flex-1 flex-col gap-2">
        {screening.steps.map((step) => (
          <div
            key={step.id}
            className="rounded border bg-muted/20 p-2 text-xs"
          >
            <div className="mb-1 flex items-center justify-between gap-1">
              <span className="font-medium">{step.name}</span>
              <Badge
                variant={
                  step.status === "PASSED"
                    ? "default"
                    : step.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                }
              >
                {step.status}
              </Badge>
            </div>
            {step.description ? (
              <p className="mb-1 text-[11px] text-muted-foreground">{step.description}</p>
            ) : null}
            {step.status === "PENDING" ? (
              <ScreeningStepForm
                step={step}
                screeningId={screening.id}
                requisitionId={requisitionId}
                onComplete={completeStepAction}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {step.score != null ? `Score ${step.score}` : "Recorded"}
                {step.completedBy ? " · by staff" : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 border-t pt-2 text-xs">
        <Link href={`/candidates/${candidateId}`} className="underline underline-offset-2">
          Profile
        </Link>
        <Link
          href={`/candidates/${candidateId}/documents`}
          className="underline underline-offset-2"
        >
          Documents / CV
        </Link>
      </div>
    </Card>
  );
}
