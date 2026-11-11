import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const requisition = await withMobileScope(req, async (scope) => {
      return db.jobRequisition.findFirst({
        where: {
          id,
          tenantId: scope.tenantId,
          deletedAt: null,
        },
        include: {
          applications: {
            where: { deletedAt: null },
            include: {
              candidate: {
                select: {
                  id: true,
                  fullName: true,
                  trade: true,
                  phone: true,
                  nationality: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      });
    });

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }

    // Resolve client name without assuming a Prisma relation name "client"
    const client = await withMobileScope(req, async (scope) => {
      return db.clientCompany.findFirst({
        where: {
          id: requisition.clientCompanyId,
          tenantId: scope.tenantId,
          deletedAt: null,
        },
        select: { id: true, name: true, code: true },
      });
    });

    return NextResponse.json({
      requisition: {
        id: requisition.id,
        reqCode: requisition.reqCode,
        roleCategory: requisition.roleCategory,
        country: requisition.country,
        status: requisition.status,
        vacancyTarget: requisition.vacancyTarget,
        location: requisition.location,
        targetOnboardingDate: requisition.targetOnboardingDate,
        notes: requisition.notes,
        clientName: client?.name ?? "—",
        clientCode: client?.code ?? null,
        applications: requisition.applications.map((a) => ({
          id: a.id,
          status: a.status,
          updatedAt: a.updatedAt,
          candidate: a.candidate,
        })),
      },
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/requisitions/[id]]", error);
    return NextResponse.json({ error: "Failed to load requisition" }, { status: 500 });
  }
}
