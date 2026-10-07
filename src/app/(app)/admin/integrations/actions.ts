"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant, db } from "@/core/db/client";
import { ForbiddenError } from "@/lib/errors";
import type { ExternalProvider } from "@prisma/client";

export async function disconnectDriveAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");
  if (session.user.role !== "TENANT_ADMIN") throw new ForbiddenError();
  const provider = String(formData.get("provider") ?? "") as ExternalProvider;
  if (provider !== "GOOGLE_DRIVE" && provider !== "ONEDRIVE") redirect("/admin/integrations");
  await withTenant(tenantId, () =>
    db.tenantStorageConnection.updateMany({
      where: { tenantId, provider, deletedAt: null },
      data: { deletedAt: new Date() },
    })
  );
  redirect("/admin/integrations");
}

export async function retryFailedSyncsAction() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");
  await withTenant(tenantId, () =>
    db.documentSyncState.updateMany({
      where: { tenantId, status: "FAILED" },
      data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null },
    })
  );
  redirect("/admin/integrations");
}
