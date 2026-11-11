import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { ApplicationService } from "@/modules/application/application.service";
import type { ApplicationStatus } from "@prisma/client";
import { ValidationError, NotFoundError } from "@/lib/errors";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED = new Set<string>([
  "SOURCED",
  "SCREENED",
  "SHORTLISTED",
  "CLIENT_INTERVIEWED",
  "SELECTED",
  "MEDICAL_BOOKED",
  "MEDICAL_CLEARED",
  "DOCUMENTS_IN_ATTESTATION",
  "ATTESTATION_CLEARED",
  "VISA_APPLIED",
  "VISA_STAMPED",
  "TICKET_BOOKED",
  "TRAVELED",
  "MOBILIZED",
  "PROBATION",
  "CONFIRMED",
  "REJECTED",
  "ON_HOLD",
  "MEDICAL_UNFIT",
  "VISA_REFUSED",
  "ABSCONDED",
]);

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { status?: string; reason?: string };
    const status = String(body.status ?? "").trim().toUpperCase();

    if (!status || !ALLOWED.has(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }

    await withMobileScope(req, async (scope) => {
      await ApplicationService.changeStatus(
        scope.tenantId,
        scope.userId,
        id,
        status as ApplicationStatus,
        body.reason
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof NotFoundError ? 404 : 400 }
      );
    }
    const msg = error instanceof Error ? error.message : "Failed to update status";
    console.error("[mobile/applications/status]", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
