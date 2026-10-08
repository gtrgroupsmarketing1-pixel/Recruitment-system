import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as { checklistId?: unknown };
    if (typeof body.checklistId !== "string") {
      return Response.json({ error: "checklistId required" }, { status: 400 });
    }

    const result = await withSessionScope(async (scope) => {
      requirePermission("connector:trigger_check");
      return ConnectorCheckService.checkNow(
        scope.tenantId,
        scope.userId,
        id,
        body.checklistId as string
      );
    });
    return Response.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("not permitted") || message.includes("Forbidden") ? 403 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}
