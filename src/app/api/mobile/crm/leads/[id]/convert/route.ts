import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { db } from "@/core/db/client";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id: leadId } = await ctx.params;
    const body = (await req.json()) as {
      name?: string;
      phone?: string;
      trade?: string;
      nationality?: string;
    };
    const fullName = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const trade = String(body.trade ?? "").trim();
    const nationality = String(body.nationality ?? "").trim();

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const result = await withMobileScope(req, async (scope) => {
      const lead = await db.whatsAppLead.findFirst({
        where: { id: leadId, tenantId: scope.tenantId, deletedAt: null },
      });
      if (!lead) throw new NotFoundError("WhatsAppLead", leadId);
      if (lead.status === "CONVERTED" && lead.candidateId) {
        return { candidateId: lead.candidateId, alreadyConverted: true };
      }

      const candidate = await CandidateService.create(
        scope.tenantId,
        scope.userId,
        { fullName, phone }
      );

      if (nationality) {
        await db.candidate.updateMany({
          where: { id: candidate.id, tenantId: scope.tenantId },
          data: { nationality },
        });
      }

      const noteParts = [
        lead.notes,
        trade ? `Trade: ${trade}` : null,
        lead.ctwaClid ? `ctwa_clid: ${lead.ctwaClid}` : null,
        lead.adId ? `adId: ${lead.adId}` : null,
      ].filter(Boolean);

      await db.whatsAppLead.updateMany({
        where: { id: leadId, tenantId: scope.tenantId },
        data: {
          status: "CONVERTED",
          candidateId: candidate.id,
          profileName: fullName,
          notes: noteParts.join("\n") || null,
        },
      });

      return { candidateId: candidate.id, alreadyConverted: false };
    });

    return NextResponse.json({ success: true, ...result });
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
    console.error("[mobile/crm/leads/convert]", error);
    return NextResponse.json({ error: "Convert failed" }, { status: 500 });
  }
}
