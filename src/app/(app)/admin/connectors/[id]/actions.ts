"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import {
  ConnectorConfigService,
  parseConnectorKindParam,
} from "@/modules/connector/connector.config.service";

export async function saveConnectorConfigAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");
  const connectorId = String(formData.get("connectorId") ?? "");
  const kind = parseConnectorKindParam(connectorId);
  const isEnabled = formData.get("isEnabled") === "on";
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const pollingIntervalMinutes = Number(formData.get("pollingIntervalMinutes") ?? 60);
  const interRequestDelayMs = Number(formData.get("interRequestDelayMs") ?? 3000);

  await withTenant(tenantId, async () => {
    const credentials =
      username || password ? { username, password } : undefined;
    await ConnectorConfigService.upsert(tenantId, session.user.id, kind, {
      isEnabled,
      credentials,
      pollingIntervalMinutes: Number.isFinite(pollingIntervalMinutes)
        ? pollingIntervalMinutes
        : 60,
      interRequestDelayMs: Number.isFinite(interRequestDelayMs)
        ? interRequestDelayMs
        : 3000,
    });
  });

  redirect(`/admin/connectors/${connectorId}?saved=1`);
}

export async function disableConnectorAction(formData: FormData) {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) redirect("/login");
  const connectorId = String(formData.get("connectorId") ?? "");
  const kind = parseConnectorKindParam(connectorId);
  await withTenant(tenantId, () =>
    ConnectorConfigService.disable(tenantId, session.user.id, kind)
  );
  redirect(`/admin/connectors/${connectorId}`);
}
