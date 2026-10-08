"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import type { ExternalProvider } from "@prisma/client";

export async function disconnectDriveAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("integration:connect_drive");
    const provider = String(formData.get("provider") ?? "") as ExternalProvider;
    if (provider !== "GOOGLE_DRIVE" && provider !== "ONEDRIVE") {
      redirect("/admin/integrations");
    }
    await db.tenantStorageConnection.updateMany({
      where: { tenantId: scope.tenantId, provider, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    redirect("/admin/integrations");
  });
}

export async function retryFailedSyncsAction() {
  await withSessionScope(async (scope) => {
    requirePermission("integration:view_sync");
    await db.documentSyncState.updateMany({
      where: { tenantId: scope.tenantId, status: "FAILED" },
      data: {
        status: "PENDING",
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      },
    });
    redirect("/admin/integrations");
  });
}
