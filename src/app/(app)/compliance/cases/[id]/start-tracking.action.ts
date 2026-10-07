"use server";

import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { ConnectorCheckService } from "@/modules/connector/connector.check.service";

export async function startTrackingAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return { ok: false, error: "Missing tenant" };
  const checklistId = String(formData.get("checklistId") ?? "");
  const trackingId = String(formData.get("trackingId") ?? "").trim();
  if (!checklistId || !trackingId) {
    return { ok: false, error: "checklistId and trackingId required" };
  }
  try {
    await withTenant(tenantId, () =>
      ConnectorCheckService.startTracking(
        tenantId,
        session.user.id,
        checklistId,
        trackingId
      )
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
