import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const leads = await withMobileScope(req, async (scope) => {
      return db.whatsAppLead.findMany({
        where: { tenantId: scope.tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          phoneNumber: true,
          profileName: true,
          lastMessage: true,
          adId: true,
          ctwaClid: true,
          status: true,
          notes: true,
          candidateId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
    return NextResponse.json({ leads });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/crm/leads]", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
