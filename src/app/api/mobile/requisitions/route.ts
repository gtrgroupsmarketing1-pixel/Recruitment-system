import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";
import { RequisitionService } from "@/modules/requisition/requisition.service";

export const runtime = "nodejs";

function titleFrom(r: {
  notes?: string | null;
  roleCategory: string;
}): string {
  const notes = r.notes?.trim();
  if (notes) {
    const titleLine = notes.split("\n").find((l) => /^title\s*:/i.test(l));
    if (titleLine) return titleLine.replace(/^title\s*:\s*/i, "").trim();
    return notes.split("\n")[0]!.slice(0, 80);
  }
  return r.roleCategory;
}

export async function GET(req: Request) {
  try {
    const data = await withMobileScope(req, async (scope) => {
      const views = await RequisitionService.list(scope.tenantId, {
        status: "OPEN",
      });
      const ids = views.map((v) => v.id);
      const counts =
        ids.length === 0
          ? []
          : await db.candidateApplication.groupBy({
              by: ["requisitionId"],
              where: {
                tenantId: scope.tenantId,
                deletedAt: null,
                requisitionId: { in: ids },
              },
              _count: { _all: true },
            });
      const countMap = new Map(
        counts.map((c) => [c.requisitionId, c._count._all])
      );

      return views.map((r) => ({
        id: r.id,
        reqCode: r.reqCode,
        jobTitle: titleFrom(r),
        roleCategory: r.roleCategory,
        country: r.country,
        status: r.status,
        clientName: r.client?.name ?? "Unknown",
        vacancyTarget: r.vacancyTarget ?? 0,
        mobilized: r.fulfillment?.mobilized ?? 0,
        candidateCount: countMap.get(r.id) ?? 0,
        targetOnboardingDate: r.targetOnboardingDate ?? null,
      }));
    });

    return NextResponse.json({ requisitions: data });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Failed to load requisitions";
    console.error("[mobile/requisitions]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
