import { validateOrigin } from "@/core/security/origin";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { z } from "zod";

const BodySchema = z.object({
  checklistId: z.string().min(1),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateOrigin(req)) {
      return Response.json({ error: "Invalid origin" }, { status: 403 });
    }
    const { id } = await context.params;
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "checklistId required" }, { status: 400 });
    }

    const result = await withSessionScope(async (scope) => {
      requirePermission("connector:trigger_check");
      const limit = await checkRateLimit(
        {
          key: "api:connector-check",
          max: RATE_LIMITS["api:connector-check"].max,
          windowSeconds: RATE_LIMITS["api:connector-check"].windowSeconds,
        },
        scope.userId
      );
      if (!limit.allowed) {
        const err = new Error("rate limited");
        (err as Error & { status: number }).status = 429;
        throw err;
      }
      return ConnectorCheckService.checkNow(
        scope.tenantId,
        scope.userId,
        id,
        parsed.data.checklistId
      );
    });
    return Response.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("rate limited")
        ? 429
        : message.includes("not permitted") || message.includes("Forbidden")
          ? 403
          : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}
