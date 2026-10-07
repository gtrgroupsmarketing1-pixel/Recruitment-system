import type { ComplianceConnector } from "./connector.types";
import { wafidConnector } from "./wafid.connector";
import { mohreConnector } from "./mohre.connector";
import { dmwConnector } from "./dmw.connector";

const CONNECTORS: Record<string, ComplianceConnector> = {
  wafid: wafidConnector,
  mohre: mohreConnector,
  dmw: dmwConnector,
};

export function getConnector(id: string): ComplianceConnector | null {
  return CONNECTORS[id] ?? null;
}

export function listConnectors(): ComplianceConnector[] {
  return Object.values(CONNECTORS);
}
