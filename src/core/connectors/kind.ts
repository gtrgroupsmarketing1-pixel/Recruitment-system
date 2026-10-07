import type { ConnectorKind } from "@prisma/client";

export function connectorKindToId(kind: ConnectorKind): string {
  return kind.toLowerCase();
}

export function connectorIdToKind(id: string): ConnectorKind | null {
  const upper = id.trim().toUpperCase();
  if (
    upper === "WAFID" ||
    upper === "MOHRE" ||
    upper === "DMW" ||
    upper === "MEA" ||
    upper === "EMBASSY"
  ) {
    return upper;
  }
  return null;
}
