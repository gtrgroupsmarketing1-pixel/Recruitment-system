import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { CandidateService } from "@/modules/candidate/candidate.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const data = await withMobileScope(req, async (scope) => {
      return CandidateService.list(scope.tenantId, {
        search: q,
        page: 1,
        limit: 30,
      });
    });
    return NextResponse.json({
      candidates: data.items.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        nationality: c.nationality,
        portalStatus: c.portalStatus,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/candidates]", error);
    return NextResponse.json({ error: "Failed to load candidates" }, { status: 500 });
  }
}
