"use server";

import { redirect } from "next/navigation";
import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import {
  ConnectorConfigService,
  parseConnectorKindParam,
} from "@/modules/connector/connector.config.service";

export async function saveConnectorConfigAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("connector:configure");
    const connectorId = String(formData.get("connectorId") ?? "");
    const kind = parseConnectorKindParam(connectorId);
    const isEnabled = formData.get("isEnabled") === "on";
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const pollingIntervalMinutes = Number(
      formData.get("pollingIntervalMinutes") ?? 60
    );
    const interRequestDelayMs = Number(
      formData.get("interRequestDelayMs") ?? 3000
    );

    const credentials =
      username || password ? { username, password } : undefined;
    await ConnectorConfigService.upsert(scope.tenantId, scope.userId, kind, {
      isEnabled,
      credentials,
      pollingIntervalMinutes: Number.isFinite(pollingIntervalMinutes)
        ? pollingIntervalMinutes
        : 60,
      interRequestDelayMs: Number.isFinite(interRequestDelayMs)
        ? interRequestDelayMs
        : 3000,
    });
    redirect(`/admin/connectors/${connectorId}?saved=1`);
  });
}

export async function disableConnectorAction(formData: FormData) {
  await withSessionScope(async (scope) => {
    requirePermission("connector:configure");
    const connectorId = String(formData.get("connectorId") ?? "");
    const kind = parseConnectorKindParam(connectorId);
    await ConnectorConfigService.disable(scope.tenantId, scope.userId, kind);
    redirect(`/admin/connectors/${connectorId}`);
  });
}
