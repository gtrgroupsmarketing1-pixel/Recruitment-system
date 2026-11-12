import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { ApplicationService } from "@/modules/application/application.service";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      candidateId?: string;
      requisitionId?: string;
    };
    const candidateId = String(body.candidateId ?? "").trim();
    const requisitionId = String(body.requisitionId ?? "").trim();
    if (!candidateId || !requisitionId) {
      return NextResponse.json(
        { error: "candidateId and requisitionId are required" },
        { status: 400 }
      );
    }

    const app = await withMobileScope(req, async (scope) => {
      return ApplicationService.create(scope.tenantId, scope.userId, {
        candidateId,
        requisitionId,
      });
    });

    return NextResponse.json({ success: true, applicationId: app.id });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof NotFoundError ? 404 : 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to link candidate";
    console.error("[mobile/applications]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
