import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // The requisition ID
    const body = await req.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    await withMobileScope(req, async (scope) => {
      // 1. Check if the candidate is already in this pipeline
      const existing = await db.candidateApplication.findFirst({
        where: { 
          tenantId: scope.tenantId,
          requisitionId: id, 
          candidateId: candidateId 
        }
      });

      if (existing) {
        throw new Error("Candidate is already in this requisition pipeline");
      }

      // 2. Create the application (starts at SOURCED)
      await db.candidateApplication.create({
        data: {
          tenantId: scope.tenantId,
          requisitionId: id,
          candidateId: candidateId,
          status: "SOURCED",
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || "Failed to add candidate" }, { status: 500 });
  }
}
