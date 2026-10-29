import { NextResponse } from "next/server";
import { MobileAuthError, withMobileScope } from "@/core/mobile-auth/scope";
import { ClientCompanyService } from "@/modules/client/client.company.service";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { RequisitionService } from "@/modules/requisition/requisition.service";
import { CountryCode, RoleCategoryCode } from "@/modules/requisition/requisition.schema";

export const runtime = "nodejs";

function codeFromName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "CLIENT";
}

export async function POST(req: Request) {
  try {
    return await withMobileScope(req, async (scope) => {
      const body = (await req.json()) as {
        type?: string;
        data?: Record<string, unknown>;
      };
      const type = body.type;
      const data = body.data ?? {};

      if (type === "REQUISITION") {
        let clientCompanyId = String(data.existingClientId ?? "").trim();
        const clientName = String(data.clientName ?? "").trim();

        if (!clientCompanyId) {
          if (!clientName) {
            return NextResponse.json(
              { error: "clientName or existingClientId required" },
              { status: 400 }
            );
          }
          const codeBase = codeFromName(clientName);
          let code = codeBase;
          let attempt = 0;
          // resolve existing by name first
          const listed = await ClientCompanyService.list(scope.tenantId);
          const match = listed.find(
            (c) => c.name.toLowerCase() === clientName.toLowerCase()
          );
          if (match) {
            clientCompanyId = match.id;
          } else {
            while (attempt < 5) {
              try {
                const created = await ClientCompanyService.create(scope.tenantId, {
                  name: clientName,
                  code,
                  country: String(data.country ?? "AE").slice(0, 2),
                });
                clientCompanyId = created.id;
                break;
              } catch {
                attempt += 1;
                code = `${codeBase}${attempt}`.slice(0, 12);
              }
            }
            if (!clientCompanyId) {
              return NextResponse.json(
                { error: "Could not create client company" },
                { status: 400 }
              );
            }
          }
        }

        const countryParsed = CountryCode.safeParse(
          String(data.country ?? "AE").toUpperCase()
        );
        const roleParsed = RoleCategoryCode.safeParse(
          String(data.roleCategory ?? "BC").toUpperCase()
        );
        const quantity = Number(data.quantity ?? data.vacancyTarget ?? 1);
        const jobTitle = String(data.jobTitle ?? "").trim();
        const notesParts = [
          jobTitle ? `Title: ${jobTitle}` : null,
          data.notes ? String(data.notes) : null,
        ].filter(Boolean);

        const created = await RequisitionService.create(
          scope.tenantId,
          scope.userId,
          {
            clientCompanyId,
            roleCategory: roleParsed.success ? roleParsed.data : "BC",
            country: countryParsed.success ? countryParsed.data : "AE",
            vacancyTarget: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
            location: data.location ? String(data.location) : undefined,
            notes: notesParts.join("\n") || undefined,
          }
        );

        return NextResponse.json({
          success: true,
          type: "REQUISITION",
          id: created.id,
          reqCode: created.reqCode,
        });
      }

      if (type === "CANDIDATE") {
        const fullName = String(data.fullName ?? "").trim();
        if (!fullName) {
          return NextResponse.json(
            { error: "fullName is required" },
            { status: 400 }
          );
        }
        const created = await CandidateService.create(
          scope.tenantId,
          scope.userId,
          {
            fullName,
            phone: data.phone ? String(data.phone) : undefined,
            email: data.email ? String(data.email) : undefined,
            smsOptIn: false,
          }
        );
        return NextResponse.json({
          success: true,
          type: "CANDIDATE",
          id: created.id,
        });
      }

      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg = error instanceof Error ? error.message : "Save failed";
    console.error("[mobile/intake/save]", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
