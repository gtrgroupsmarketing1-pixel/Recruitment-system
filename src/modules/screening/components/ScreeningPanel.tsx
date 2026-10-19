import { withSessionScope } from "@/core/auth/action-scope";
import { ScreeningService } from "@/modules/screening/screening.service";
import { completeStepAction } from "@/modules/screening/complete-step.action";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreeningStepForm } from "./ScreeningStepForm";

export async function ScreeningPanel({
  tenantId,
  applicationId,
}: {
  tenantId: string;
  applicationId: string;
}) {
  const screenings = await withSessionScope((_scope) =>
    ScreeningService.getForApplication(tenantId, applicationId)
  );
  const screening = screenings[0];
  if (!screening) return null;
  const requisitionId = screening.application.requisitionId;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Screening</h3>
        <span className="text-xs font-mono">{screening.path}</span>
      </div>
      <p className="text-sm mb-3">
        Outcome:{" "}
        <Badge variant={screening.outcome === "PASSED" ? "default" : "destructive"}>
          {screening.outcome}
        </Badge>{" "}
        {screening.overallScore != null ? `· Score: ${screening.overallScore}` : ""}
      </p>
      <div className="space-y-2">
        {screening.steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between gap-2 text-sm border rounded p-2">
            <div>
              <div className="font-medium">{step.name}</div>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
            <Badge variant={step.status === "PASSED" ? "default" : "secondary"}>
              {step.status}
            </Badge>
            {step.score != null && <span>{step.score}</span>}
            {step.status === "PENDING" && (
              <ScreeningStepForm
                step={step}
                screeningId={screening.id}
                requisitionId={requisitionId}
                onComplete={completeStepAction}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
