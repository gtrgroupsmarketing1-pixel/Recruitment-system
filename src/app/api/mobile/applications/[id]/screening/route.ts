import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";
import { ScreeningService } from "@/modules/screening/screening.service";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { ScreeningPath } from "@prisma/client";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id: applicationId } = await ctx.params;
    const data = await withMobileScope(req, async (scope) => {
      const app = await db.candidateApplication.findFirst({
        where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
        select: { id: true, status: true, requisitionId: true },
      });
      if (!app) throw new NotFoundError("Application", applicationId);

      let records = await ScreeningService.getForApplication(scope.tenantId, applicationId);
      if (!records.length) {
        const reqRow = await db.jobRequisition.findFirst({
          where: { id: app.requisitionId, tenantId: scope.tenantId, deletedAt: null },
          select: { roleCategory: true },
        });
        const path: ScreeningPath =
          reqRow?.roleCategory === "WC" || reqRow?.roleCategory === "WHITE_COLLAR"
            ? "WHITE_COLLAR"
            : "BLUE_COLLAR";
        await ScreeningService.startScreening(scope.tenantId, scope.userId, applicationId, path);
        records = await ScreeningService.getForApplication(scope.tenantId, applicationId);
      }

      const screening = records[0];
      return {
        applicationId,
        applicationStatus: app.status,
        screening: screening
          ? {
              id: screening.id,
              path: screening.path,
              outcome: screening.outcome,
              steps: (screening.steps ?? []).map((s) => ({
                stepOrder: s.stepOrder,
                name: s.name,
                description: s.description,
                status: s.status,
                notes: s.notes,
                score: s.score,
              })),
            }
          : null,
      };
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof NotFoundError ? 404 : 400 }
      );
    }
    console.error("[mobile/applications/screening GET]", error);
    return NextResponse.json({ error: "Failed to load screening" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: applicationId } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      passAll?: boolean;
      shortlist?: boolean;
      notes?: string;
      steps?: Array<{ stepOrder: number; status: "PASSED" | "FAILED"; notes?: string; score?: number }>;
    };

    const result = await withMobileScope(req, async (scope) => {
      const app = await db.candidateApplication.findFirst({
        where: { id: applicationId, tenantId: scope.tenantId, deletedAt: null },
        select: { id: true, status: true, requisitionId: true },
      });
      if (!app) throw new NotFoundError("Application", applicationId);

      let records = await ScreeningService.getForApplication(scope.tenantId, applicationId);
      if (!records.length) {
        const reqRow = await db.jobRequisition.findFirst({
          where: { id: app.requisitionId, tenantId: scope.tenantId, deletedAt: null },
          select: { roleCategory: true },
        });
        const path: ScreeningPath =
          reqRow?.roleCategory === "WC" || reqRow?.roleCategory === "WHITE_COLLAR"
            ? "WHITE_COLLAR"
            : "BLUE_COLLAR";
        await ScreeningService.startScreening(scope.tenantId, scope.userId, applicationId, path);
        records = await ScreeningService.getForApplication(scope.tenantId, applicationId);
      }

      const screening = records[0];
      if (!screening) throw new ValidationError("No screening record");
      const globalNotes = body.notes?.trim();
      const steps = screening.steps ?? [];

      if (body.passAll) {
        for (const step of steps) {
          if (step.status === "PASSED" || step.status === "FAILED") continue;
          await ScreeningService.completeStep(
            scope.tenantId, scope.userId, screening.id, step.stepOrder, "PASSED", undefined, globalNotes || undefined
          );
        }
      } else if (body.steps?.length) {
        for (const s of body.steps) {
          await ScreeningService.completeStep(
            scope.tenantId, scope.userId, screening.id, s.stepOrder, s.status, s.score, s.notes ?? globalNotes
          );
        }
      } else {
        throw new ValidationError("Provide passAll or steps[]");
      }

      const refreshed = await ScreeningService.getForApplication(scope.tenantId, applicationId);
      const outcome = refreshed[0]?.outcome ?? null;
      let shortlisted = false;
      if (body.shortlist !== false && outcome === "PASSED" && app.status !== "SHORTLISTED") {
        const { ApplicationService } = await import("@/modules/application/application.service");
        if (app.status === "SOURCED") {
          await ApplicationService.changeStatus(scope.tenantId, scope.userId, applicationId, "SCREENED");
        }
        await ApplicationService.changeStatus(scope.tenantId, scope.userId, applicationId, "SHORTLISTED");
        shortlisted = true;
      }
      return { success: true, outcome, shortlisted, screeningId: screening.id };
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof NotFoundError ? 404 : 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to complete screening";
    console.error("[mobile/applications/screening POST]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
