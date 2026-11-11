import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const requisition = await withMobileScope(req, async (scope) => {
      return db.requisition.findUnique({
        where: { 
          id: id, 
          tenantId: scope.tenantId 
        },
        include: {
          client: { select: { name: true } },
          applications: {
            include: {
              candidate: { 
                select: { id: true, fullName: true, trade: true, phone: true } 
              }
            },
            orderBy: { updatedAt: "desc" }
          }
        }
      });
    });

    if (!requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }
    
    return NextResponse.json({ requisition });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/requisitions/[id]]", error);
    return NextResponse.json({ error: "Failed to load requisition" }, { status: 500 });
  }
}
