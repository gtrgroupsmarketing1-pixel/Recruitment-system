import { db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ScreeningRepo } from "./screening.repo";
import type { ScreeningPath } from "@prisma/client";

type StepInput = { stepOrder: number; name: string; description?: string };

const BLUE_COLLAR_STEPS: StepInput[] = [
  {
    stepOrder: 1,
    name: "Trade Test",
    description: "Role-specific trade competency test",
  },
  {
    stepOrder: 2,
    name: "Physical Clearance",
    description: "Physical fitness and medical clearance",
  },
  {
    stepOrder: 3,
    name: "Final Assessment",
    description: "Overall screening sign-off",
  },
];

const WHITE_COLLAR_STEPS: StepInput[] = [
  { stepOrder: 1, name: "Phone Screen", description: "Initial recruiter phone screen" },
  {
    stepOrder: 2,
    name: "Technical Interview",
    description: "Role-specific technical interview",
  },
  {
    stepOrder: 3,
    name: "Client Interview",
    description: "Hiring manager / client interview",
  },
  {
    stepOrder: 4,
    name: "Final Scorecard",
    description: "Consolidated interview scorecard",
  },
];

function stepsFor(path: ScreeningPath): StepInput[] {
  return path === "BLUE_COLLAR" ? BLUE_COLLAR_STEPS : WHITE_COLLAR_STEPS;
}

export const ScreeningService = {
  async startScreening(
    tenantId: string,
    _userId: string,
    applicationId: string,
    path: ScreeningPath
  ) {
    void _userId;
    const existing = await ScreeningRepo.findByApplication(tenantId, applicationId);
    if (existing.length > 0) {
      return existing[0];
    }

    // DO NOT use db.$transaction here. withSessionScope already provides the transaction.
    const screening = await ScreeningRepo.create(tenantId, {
      applicationId,
      stage: "SCREENING",
      path,
    });
    
    const template = stepsFor(path);
    for (const step of template) {
      await db.screeningStep.create({
        data: {
          screeningId: screening.id,
          tenantId,
          ...step,
          status: "PENDING",
        },
      });
    }
    return ScreeningRepo.findById(tenantId, screening.id);
  },

  async completeStep(
    tenantId: string,
    userId: string,
    screeningId: string,
    stepOrder: number,
    status: string,
    score?: number,
    notes?: string
  ) {
    const step = await db.screeningStep.findFirst({
      where: { screeningId, tenantId, stepOrder, deletedAt: null },
    });
    if (!step) {
      throw new NotFoundError("ScreeningStep");
    }
    const updated = await ScreeningRepo.updateStep(tenantId, screeningId, stepOrder, {
      status,
      score,
      notes,
      completedAt: new Date(),
      completedBy: userId,
    });
    if (status === "FAILED") {
      await ScreeningRepo.updateScreening(tenantId, screeningId, {
        outcome: "FAILED",
        completedAt: new Date(),
        completedBy: userId,
      });
    }
    return updated;
  },

  async finalizeScreening(
    tenantId: string,
    userId: string,
    screeningId: string
  ) {
    const screening = await ScreeningRepo.findById(tenantId, screeningId);
    if (!screening) {
      throw new NotFoundError("ScreeningRecord");
    }
    const steps = screening.steps ?? [];
    const pending = steps.some((s) => s.status !== "PASSED" && s.status !== "FAILED");
    if (pending) {
      throw new ValidationError("Not all screening steps are completed");
    }
    const failed = steps.some((s) => s.status === "FAILED");
    const outcome = failed ? "FAILED" : "PASSED";
    const overallScore = failed
      ? null
      : Math.round(
          steps.reduce((sum, s) => sum + (s.score ?? 0), 0) / steps.length
        );
    const result = await ScreeningRepo.updateScreening(tenantId, screeningId, {
      outcome,
      overallScore,
      completedAt: new Date(),
      completedBy: userId,
    });
    if (!result) {
      throw new NotFoundError("ScreeningRecord");
    }
    if (outcome === "PASSED") {
      await eventBus.publish({
        type: "screening.completed",
        tenantId,
        payload: {
          screeningId: screening.id,
          applicationId: screening.applicationId,
          outcome,
          overallScore,
          actorId: userId,
        },
      });
    }
    return result;
  },

  async getForApplication(tenantId: string, applicationId: string) {
    return ScreeningRepo.findByApplication(tenantId, applicationId);
  },
};