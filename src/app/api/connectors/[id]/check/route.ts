import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return Response.json({ error: "Missing tenant" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as { checklistId?: unknown };
  if (typeof body.checklistId !== "string") {
    return Response.json({ error: "checklistId required" }, { status: 400 });
  }

  try {
    const result = await withTenant(tenantId, () =>
      ConnectorCheckService.checkNow(
        tenantId,
        session.user.id,
        id,
        body.checklistId as string
      )
    );
    return Response.json({ ok: true, result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
