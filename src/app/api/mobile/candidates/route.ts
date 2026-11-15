import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { db } from "@/core/db/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const data = await withMobileScope(req, async (scope) => {
      const list = await CandidateService.list(scope.tenantId, {
        search: q,
        page: 1,
        limit: 50,
      });
      const ids = list.items.map((c) => c.id);
      const apps =
        ids.length === 0
          ? []
          : await db.candidateApplication.findMany({
              where: {
                tenantId: scope.tenantId,
                deletedAt: null,
                candidateId: { in: ids },
              },
              select: {
                candidateId: true,
                status: true,
                requisition: {
                  select: { id: true, reqCode: true, notes: true, roleCategory: true },
                },
              },
              orderBy: { updatedAt: "desc" },
            });
      const byCand = new Map<string, typeof apps>();
      for (const a of apps) {
        const arr = byCand.get(a.candidateId) ?? [];
        arr.push(a);
        byCand.set(a.candidateId, arr);
      }

      // trade from raw rows
      const trades =
        ids.length === 0
          ? []
          : await db.candidate.findMany({
              where: { tenantId: scope.tenantId, id: { in: ids }, deletedAt: null },
              select: { id: true, trade: true, nationality: true },
            });
      const tradeMap = new Map(trades.map((t) => [t.id, t]));

      return list.items.map((c) => {
        const candApps = byCand.get(c.id) ?? [];
        const latest = candApps[0];
        const meta = tradeMap.get(c.id);
        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          nationality: meta?.nationality ?? c.nationality,
          trade: meta?.trade ?? null,
          portalStatus: c.portalStatus,
          applicationCount: c.applicationCount,
          poolStatus: c.poolStatus,
          latestAppStatus: c.latestAppStatus,
          activeRequisition: latest
            ? {
                id: latest.requisition.id,
                reqCode: latest.requisition.reqCode,
                status: latest.status,
                title:
                  latest.requisition.notes?.split("\n")[0]?.slice(0, 60) ||
                  latest.requisition.roleCategory,
              }
            : null,
          updatedAt: c.updatedAt,
        };
      });
    });
    return NextResponse.json({ candidates: data });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/candidates]", error);
    return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
  }
}
