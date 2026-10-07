import { eventBus } from "@/core/events/event-bus";
import { db } from "@/core/db/client";
import { logger } from "@/lib/logger";
import { ConflictError } from "@/lib/errors";
import { ComplianceTemplateService } from "./compliance.template.service";
import { ComplianceCaseService } from "./compliance.case.service";

export function registerComplianceSubscriber(): () => void {
  return eventBus.subscribe("candidate.status_changed", async (event) => {
    if (event.payload.to !== "SELECTED") return;
    const application = await db.candidateApplication.findFirst({
      where: {
        id: event.payload.applicationId,
        tenantId: event.tenantId,
        deletedAt: null,
      },
      include: {
        candidate: true,
        requisition: true,
      },
    });
    if (!application) {
      logger.warn(
        { applicationId: event.payload.applicationId },
        "compliance attach skipped: application missing"
      );
      return;
    }
    const origin = application.candidate.nationality;
    if (!origin) {
      logger.warn(
        { applicationId: application.id },
        "compliance attach skipped: candidate nationality missing"
      );
      return;
    }
    try {
      const template = await ComplianceTemplateService.requireMatchingTemplate(
        event.tenantId,
        origin,
        application.requisition.country,
        application.requisition.roleCategory
      );
      if (!template) {
        logger.warn(
          {
            origin,
            destination: application.requisition.country,
            roleCategory: application.requisition.roleCategory,
          },
          "compliance attach skipped: no matching template"
        );
        return;
      }
      await ComplianceCaseService.attachCase(
        event.tenantId,
        application.id,
        template.id,
        application.candidateId,
        application.requisitionId
      );
    } catch (err) {
      if (err instanceof ConflictError) {
        logger.error(
          { code: err.code },
          "compliance attach skipped: ambiguous templates"
        );
        return;
      }
      throw err;
    }
  });
}
