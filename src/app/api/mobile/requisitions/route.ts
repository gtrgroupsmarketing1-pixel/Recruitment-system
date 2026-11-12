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
      const open = await RequisitionService.list(scope.tenantId, { status: "OPEN" });
      if (open.length > 0) return open;
      return RequisitionService.list(scope.tenantId, {});
    });

    const requisitions = data.map((r: any) => ({
      id: r.id,
      reqCode: r.reqCode,
      roleCategory: r.roleCategory,
      country: r.country,
      status: r.status,
      clientName: r.client?.name ?? "Unknown",
      vacancyTarget: r.vacancyTarget ?? 0,
      quantity: r.vacancyTarget ?? 0, // Added for mobile UI compatibility
      mobilized: r.fulfillment?.mobilized ?? 0,
      
      // 👇 CRITICAL FIX: Read `filled` from the Service layer, NOT `_count`
      filled: r.filled ?? 0, 
      
      targetOnboardingDate: r.targetOnboardingDate ?? null,
    }));

    return NextResponse.json({ requisitions });
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