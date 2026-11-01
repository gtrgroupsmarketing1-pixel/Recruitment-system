import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { RequisitionService } from "@/modules/requisition/requisition.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const data = await withMobileScope(req, async (scope) => {
      return RequisitionService.list(scope.tenantId, { status: "OPEN" });
    });
    return NextResponse.json({
      requisitions: data.map((r) => ({
        id: r.id,
        reqCode: r.reqCode,
        roleCategory: r.roleCategory,
        country: r.country,
        status: r.status,
        clientName: r.client.name,
        vacancyTarget: r.vacancyTarget,
        mobilized: r.fulfillment.mobilized,
        targetOnboardingDate: r.targetOnboardingDate,
      })),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/requisitions]", error);
    return NextResponse.json({ error: "Failed to load requisitions" }, { status: 500 });
  }
}
