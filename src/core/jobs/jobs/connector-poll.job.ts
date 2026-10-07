import { authPrisma, withTenant, db } from "@/core/db/client";
import { getConnector } from "@/core/connectors/registry";
import { connectorKindToId } from "@/core/connectors/kind";
import { suggestedActionFor } from "@/core/connectors/suggested-action";
import type { ConnectorStatus } from "@/core/connectors/connector.types";
import { ConnectorError } from "@/core/connectors/connector.types";
import { eventBus } from "@/core/events/event-bus";
import { logger } from "@/lib/logger";
import { runJob, type JobResult } from "@/core/jobs/run-job";
import type { ConnectorKind, Prisma, TenantConnectorConfig } from "@prisma/client";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";

function asJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollEnabled(): boolean {
  return process.env.CONNECTOR_POLL_ENABLED === "true";
}

async function pollOneConfig(
  tenantId: string,
  config: TenantConnectorConfig
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  const connector = getConnector(connectorKindToId(config.connectorId));
  if (!connector) return { processed: 0, failed: 0 };

  const now = Date.now();
  const dayMs = 24 * 60 * 60_000;

  const checks = await db.connectorCheck.findMany({
    where: {
      tenantId,
      connectorId: config.connectorId,
    },
    orderBy: { lastCheckedAt: "asc" },
    take: 40,
  });

  const credentials = await ConnectorConfigService.loadCredentials(
    tenantId,
    config.connectorId
  );
  const timeoutMs = Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS ?? 15000);
  const userAgent =
    process.env.CONNECTOR_USER_AGENT ??
    "RecruitmentSystem/1.0 (+https://app.example.com)";

  for (const check of checks) {
    if (
      check.consecutiveErrors >= 5 &&
      check.lastCheckedAt &&
      now - check.lastCheckedAt.getTime() < dayMs
    ) {
      continue;
    }

    if (config.interRequestDelayMs > 0) {
      await sleep(config.interRequestDelayMs);
    }

    try {
      const result = await connector.check({
        trackingId: check.trackingId,
        credentials,
        timeoutMs,
        userAgent,
      });

      await db.connectorCheckLog.create({
        data: {
          tenantId,
          connectorCheckId: check.id,
          status: result.status,
          rawStatus: result.rawStatus,
          rawPayload: asJson(result.details),
        },
      });

      const previousStatus = check.lastStatus;
      const changed = previousStatus !== result.status;

      await db.connectorCheck.update({
        where: { id: check.id },
        data: {
          lastCheckedAt: result.fetchedAt,
          checkCount: { increment: 1 },
          lastError: null,
          consecutiveErrors: 0,
          lastRawStatus: result.rawStatus,
          lastDetails: asJson(result.details),
          ...(changed
            ? { lastStatus: result.status, lastChangedAt: result.fetchedAt }
            : {}),
        },
      });

      if (changed) {
        const checklist = await db.checklistInstance.findFirst({
          where: { id: check.checklistId, tenantId },
          select: { caseId: true },
        });
        await eventBus.publish({
          type: "compliance.connector_status_changed",
          tenantId,
          payload: {
            caseId: checklist?.caseId ?? "",
            checklistId: check.checklistId,
            connectorId: connectorKindToId(config.connectorId as ConnectorKind),
            trackingId: check.trackingId,
            previousStatus,
            newStatus: result.status,
            suggestedAction: suggestedActionFor(result.status as ConnectorStatus),
          },
        });
      }

      processed += 1;
    } catch (err) {
      failed += 1;
      const message =
        err instanceof ConnectorError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);

      await db.connectorCheckLog.create({
        data: {
          tenantId,
          connectorCheckId: check.id,
          status: check.lastStatus,
          errorMessage: message,
        },
      });

      await db.connectorCheck.update({
        where: { id: check.id },
        data: {
          lastCheckedAt: new Date(),
          checkCount: { increment: 1 },
          lastError: message,
          consecutiveErrors: { increment: 1 },
        },
      });
    }
  }

  return { processed, failed };
}

export async function runConnectorPollJob(): Promise<JobResult> {
  if (!pollEnabled()) {
    return { processed: 0, failed: 0 };
  }

  return runJob("connector-poll", async () => {
    const now = new Date();
    let processed = 0;
    let failed = 0;

    const configs = await authPrisma.tenantConnectorConfig.findMany({
      where: {
        isEnabled: true,
        deletedAt: null,
      },
      take: 50,
    });

    for (const config of configs) {
      const intervalMs = config.pollingIntervalMinutes * 60_000;
      if (config.lastPolledAt && now.getTime() - config.lastPolledAt.getTime() < intervalMs) {
        continue;
      }

      await withTenant(config.tenantId, async () => {
        try {
          const result = await pollOneConfig(config.tenantId, config);
          processed += result.processed;
          failed += result.failed;
          await db.tenantConnectorConfig.update({
            where: { id: config.id },
            data: { lastPolledAt: new Date(), lastError: null },
          });
        } catch (err) {
          failed += 1;
          await db.tenantConnectorConfig.update({
            where: { id: config.id },
            data: { lastPolledAt: new Date(), lastError: String(err) },
          });
          logger.error(
            { configId: config.id, err: err instanceof Error ? err.message : String(err) },
            "connector poll failed"
          );
        }
      });
    }

    return { processed, failed, metadata: { configsPolled: configs.length } };
  });
}
