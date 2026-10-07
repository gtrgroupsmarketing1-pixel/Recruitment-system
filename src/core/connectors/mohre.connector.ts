import type { ComplianceConnector, ConnectorCheckInput, ConnectorCheckResult } from "./connector.types";

export const mohreConnector: ComplianceConnector = {
  id: "mohre",
  displayName: "MOHRE Work Permit (UAE)",
  countries: ["AE"],
  requiresTrackingId: true,

  validateTrackingId(id) {
    if (!id || id.length < 6) return { valid: false, error: "MOHRE permit ID too short" };
    return { valid: true };
  },

  async check(_input: ConnectorCheckInput): Promise<ConnectorCheckResult> {
    return {
      status: "UNKNOWN",
      rawStatus: "NOT_IMPLEMENTED",
      details: {},
      fetchedAt: new Date(),
    };
  },

  mapStatus(raw) {
    if (raw === "NOT_IMPLEMENTED") return "UNKNOWN";
    return "UNKNOWN";
  },
};
