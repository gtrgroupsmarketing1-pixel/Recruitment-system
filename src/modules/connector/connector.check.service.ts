import type { ConnectorKind, Prisma } from "@prisma/client";
import { db } from "@/core/db/client";
import { eventBus } from "@/core/events/event-bus";
import { getConnector } from "@/core/connectors/registry";
import { connectorKindToId } from "@/core/connectors/kind";
import { suggestedActionFor } from "@/core/connectors/suggested-action";
import type { ConnectorCheckResult, ConnectorStatus } from "@/core/connectors/connector.types";
import { ConnectorError } from "@/core/connectors/connector.types";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { ConnectorConfigService } from "./connector.config.service";

export type ConnectorCheckView = {
  id: string;
  connectorId: ConnectorKind;
  checklistId: string;
  trackingId: string;
  lastStatus: string;
  lastRawStatus: string | null;
  lastDetails: unknown;
  lastCheckedAt: Date | null;
  lastChangedAt: Date | null;
  checkCount: number;
  consecutiveErrors: number;
  lastError: string | null;
};

function toView(row: {
  id: string;
  connectorId: ConnectorKind;
  checklistId: string;
  trackingId: string;
  lastStatus: string;
  lastRawStatus: string | null;
  lastDetails: unknown;
  lastCheckedAt: Date | null;
  lastChangedAt: Date | null;
  checkCount: number;
  consecutiveErrors: number;
  lastError: string | null;
}): ConnectorCheckView {
  return {
    id: row.id,
    connectorId: row.connectorId,
    checklistId: row.checklistId,
    trackingId: row.trackingId,
    lastStatus: row.lastStatus,
    lastRawStatus: row.lastRawStatus,
    lastDetails: row.lastDetails,
    lastCheckedAt: row.lastCheckedAt,
    lastChangedAt: row.lastChangedAt,
    checkCount: row.checkCount,
    consecutiveErrors: row.consecutiveErrors,
    lastError: row.lastError,
  };
}

function asJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

export const ConnectorCheckService = {
  async startTracking(
    tenantId: string,
    _userId: string,
    checklistId: string,
    trackingId: string
  ): Promise<ConnectorCheckView> {
    const checklist = await db.checklistInstance.findFirst({
      where: { id: checklistId, tenantId, deletedAt: null },
      include: { stepTemplate: true },
    });
    if (!checklist) throw new NotFoundError("ChecklistInstance", checklistId);

    const connectorIdRaw = checklist.stepTemplate.connectorId;
    if (!connectorIdRaw) {
      throw new ValidationError("This step has no connector configured on its template");
    }
    const connector = getConnector(connectorIdRaw.toLowerCase());
    if (!connector) throw new ValidationError(`Unknown connector ${connectorIdRaw}`);

    const kind = connectorIdRaw.toUpperCase() as ConnectorKind;
    const config = await ConnectorConfigService.get(tenantId, kind);
    if (!config?.isEnabled) {
      throw new ValidationError(`Connector ${connector.id} is not enabled for this tenant`);
    }

    const validation = connector.validateTrackingId(trackingId);
    if (!validation.valid) {
      throw new ValidationError(validation.error ?? "Invalid tracking ID");
    }

    const existing = await db.connectorCheck.findFirst({
      where: { tenantId, checklistId, connectorId: kind },
    });
    if (existing) {
      throw new ValidationError("Tracking already started for this step");
    }

    const row = await db.connectorCheck.create({
      data: {
        tenantId,
        connectorId: kind,
        checklistId,
        trackingId,
        lastStatus: "PENDING",
      },
    });
    return toView(row);
  },

  async stopTracking(tenantId: string, checklistId: string): Promise<void> {
    await db.connectorCheck.deleteMany({ where: { tenantId, checklistId } });
  },

  async getByChecklist(
    tenantId: string,
    checklistId: string
  ): Promise<ConnectorCheckView | null> {
    const row = await db.connectorCheck.findFirst({
      where: { tenantId, checklistId },
    });
    return row ? toView(row) : null;
  },

  async listRecentChecks(tenantId: string, limit: number): Promise<ConnectorCheckView[]> {
    const rows = await db.connectorCheck.findMany({
      where: { tenantId },
      orderBy: { lastCheckedAt: "desc" },
      take: limit,
    });
    return rows.map(toView);
  },

  async listCheckLog(tenantId: string, checkId: string, limit: number) {
    return db.connectorCheckLog.findMany({
      where: { tenantId, connectorCheckId: checkId },
      orderBy: { checkedAt: "desc" },
      take: limit,
    });
  },

  async checkNow(
    tenantId: string,
    _userId: string,
    connectorIdParam: string,
    checklistId: string
  ): Promise<ConnectorCheckResult> {
    const connector = getConnector(connectorIdParam.toLowerCase());
    if (!connector) throw new ValidationError(`Unknown connector ${connectorIdParam}`);
    const kind = connectorIdParam.toUpperCase() as ConnectorKind;

    const check = await db.connectorCheck.findFirst({
      where: { tenantId, checklistId, connectorId: kind },
    });
    if (!check) throw new NotFoundError("ConnectorCheck", checklistId);

    const config = await ConnectorConfigService.get(tenantId, kind);
    if (!config?.isEnabled) {
      throw new ValidationError(`Connector ${connector.id} is not enabled`);
    }

    const credentials = await ConnectorConfigService.loadCredentials(tenantId, kind);
    const timeoutMs = Number(process.env.CONNECTOR_REQUEST_TIMEOUT_MS ?? 15000);
    const userAgent =
      process.env.CONNECTOR_USER_AGENT ??
      "RecruitmentSystem/1.0 (+https://app.example.com)";

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
            ? {
                lastStatus: result.status,
                lastChangedAt: result.fetchedAt,
              }
            : {}),
        },
      });

      if (changed) {
        const checklist = await db.checklistInstance.findFirst({
          where: { id: checklistId, tenantId },
          select: { caseId: true },
        });
        await eventBus.publish({
          type: "compliance.connector_status_changed",
          tenantId,
          payload: {
            caseId: checklist?.caseId ?? "",
            checklistId,
            connectorId: connectorKindToId(kind),
            trackingId: check.trackingId,
            previousStatus,
            newStatus: result.status,
            suggestedAction: suggestedActionFor(result.status as ConnectorStatus),
          },
        });
      }

      return result;
    } catch (err) {
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

      throw err;
    }
  },
};
