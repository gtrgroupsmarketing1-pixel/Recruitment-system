"use server";

import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";

export async function startTrackingAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    return await withSessionScope(async (scope) => {
      requirePermission("connector:trigger_check");
      const checklistId = String(formData.get("checklistId") ?? "");
      const trackingId = String(formData.get("trackingId") ?? "").trim();
      if (!checklistId || !trackingId) {
        return { ok: false, error: "checklistId and trackingId required" };
      }
      await ConnectorCheckService.startTracking(
        scope.tenantId,
        scope.userId,
        checklistId,
        trackingId
      );
      return { ok: true };
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
