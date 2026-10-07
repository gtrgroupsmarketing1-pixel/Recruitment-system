import type { ConnectorKind, Prisma } from "@prisma/client";
import { db } from "@/core/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { connectorIdToKind } from "@/core/connectors/kind";
import { getConnector } from "@/core/connectors/registry";

export type ConnectorConfigView = {
  connectorId: ConnectorKind;
  isEnabled: boolean;
  hasCredentials: boolean;
  pollingIntervalMinutes: number;
  interRequestDelayMs: number;
  lastPolledAt: Date | null;
  lastError: string | null;
};

function toView(row: {
  connectorId: ConnectorKind;
  isEnabled: boolean;
  credentialsCt: string | null;
  pollingIntervalMinutes: number;
  interRequestDelayMs: number;
  lastPolledAt: Date | null;
  lastError: string | null;
}): ConnectorConfigView {
  return {
    connectorId: row.connectorId,
    isEnabled: row.isEnabled,
    hasCredentials: Boolean(row.credentialsCt),
    pollingIntervalMinutes: row.pollingIntervalMinutes,
    interRequestDelayMs: row.interRequestDelayMs,
    lastPolledAt: row.lastPolledAt,
    lastError: row.lastError,
  };
}

export const ConnectorConfigService = {
  async list(tenantId: string): Promise<ConnectorConfigView[]> {
    const rows = await db.tenantConnectorConfig.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { connectorId: "asc" },
    });
    return rows.map(toView);
  },

  async get(tenantId: string, connectorId: ConnectorKind): Promise<ConnectorConfigView | null> {
    const row = await db.tenantConnectorConfig.findFirst({
      where: { tenantId, connectorId, deletedAt: null },
    });
    return row ? toView(row) : null;
  },

  async upsert(
    tenantId: string,
    _userId: string,
    connectorId: ConnectorKind,
    input: {
      isEnabled: boolean;
      credentials?: Record<string, string>;
      pollingIntervalMinutes?: number;
      interRequestDelayMs?: number;
    }
  ): Promise<ConnectorConfigView> {
    const id = connectorKindId(connectorId);
    if (!getConnector(id)) {
      throw new ValidationError(`Unknown connector ${connectorId}`);
    }
    const existing = await db.tenantConnectorConfig.findFirst({
      where: { tenantId, connectorId, deletedAt: null },
    });

    const data: Prisma.TenantConnectorConfigUpdateInput = {
      isEnabled: input.isEnabled,
      pollingIntervalMinutes: input.pollingIntervalMinutes ?? existing?.pollingIntervalMinutes ?? 60,
      interRequestDelayMs: input.interRequestDelayMs ?? existing?.interRequestDelayMs ?? 3000,
    };
    if (input.credentials !== undefined) {
      data.credentialsCt = JSON.stringify(input.credentials);
    }

    if (existing) {
      const updated = await db.tenantConnectorConfig.update({
        where: { id: existing.id },
        data,
      });
      return toView(updated);
    }

    const created = await db.tenantConnectorConfig.create({
      data: {
        tenantId,
        connectorId,
        isEnabled: input.isEnabled,
        credentialsCt:
          input.credentials !== undefined ? JSON.stringify(input.credentials) : null,
        pollingIntervalMinutes: input.pollingIntervalMinutes ?? 60,
        interRequestDelayMs: input.interRequestDelayMs ?? 3000,
      },
    });
    return toView(created);
  },

  async disable(tenantId: string, _userId: string, connectorId: ConnectorKind): Promise<void> {
    const row = await db.tenantConnectorConfig.findFirst({
      where: { tenantId, connectorId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("TenantConnectorConfig", connectorId);
    await db.tenantConnectorConfig.update({
      where: { id: row.id },
      data: { isEnabled: false },
    });
  },

  async deleteCredentials(
    tenantId: string,
    _userId: string,
    connectorId: ConnectorKind
  ): Promise<void> {
    const row = await db.tenantConnectorConfig.findFirst({
      where: { tenantId, connectorId, deletedAt: null },
    });
    if (!row) throw new NotFoundError("TenantConnectorConfig", connectorId);
    await db.tenantConnectorConfig.update({
      where: { id: row.id },
      data: { credentialsCt: null },
    });
  },

  /** Internal: decrypted credentials for polling (never expose to UI). */
  async loadCredentials(
    tenantId: string,
    connectorId: ConnectorKind
  ): Promise<Record<string, string>> {
    const row = await db.tenantConnectorConfig.findFirst({
      where: { tenantId, connectorId, deletedAt: null },
    });
    if (!row?.credentialsCt) return {};
    try {
      return JSON.parse(row.credentialsCt) as Record<string, string>;
    } catch {
      return {};
    }
  },
};

function connectorKindId(kind: ConnectorKind): string {
  return kind.toLowerCase();
}

export function parseConnectorKindParam(id: string): ConnectorKind {
  const kind = connectorIdToKind(id);
  if (!kind) throw new ValidationError(`Unknown connector ${id}`);
  return kind;
}
