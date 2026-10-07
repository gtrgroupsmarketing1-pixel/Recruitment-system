import type {
  ComplianceConnector,
  ConnectorCheckInput,
  ConnectorCheckResult,
  ConnectorStatus,
} from "./connector.types";
import { ConnectorError } from "./connector.types";
import { parseWafidHtml } from "./parsers/wafid.parser";

export const wafidConnector: ComplianceConnector = {
  id: "wafid",
  displayName: "Wafid / GAMCA Medical",
  countries: ["IN", "NP", "PH", "BD", "PK"],
  requiresTrackingId: true,

  validateTrackingId(id) {
    if (!/^\d{10,12}$/.test(id)) {
      return { valid: false, error: "Wafid ID must be 10-12 digits" };
    }
    return { valid: true };
  },

  async check(input: ConnectorCheckInput): Promise<ConnectorCheckResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
      const url = `https://www.wafid.info/wafid/VisaMedical/GetStatus?wafidId=${encodeURIComponent(input.trackingId)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": input.userAgent },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new ConnectorError(`Wafid returned ${res.status}`, "wafid", res.status >= 500);
      }
      const html = await res.text();
      const parsed = parseWafidHtml(html);
      return {
        status: wafidConnector.mapStatus(parsed.rawStatus),
        rawStatus: parsed.rawStatus,
        details: parsed.details,
        fetchedAt: new Date(),
      };
    } catch (err) {
      if (err instanceof ConnectorError) throw err;
      throw new ConnectorError(
        err instanceof Error ? err.message : String(err),
        "wafid",
        true
      );
    } finally {
      clearTimeout(timeout);
    }
  },

  mapStatus(raw: string): ConnectorStatus {
    const normalized = raw.trim().toUpperCase();
    if (normalized.includes("FIT") && !normalized.includes("UNFIT")) return "APPROVED";
    if (normalized.includes("UNFIT")) return "REJECTED";
    if (normalized.includes("EXPIRED")) return "EXPIRED";
    if (normalized.includes("PENDING") || normalized.includes("PROCESSING")) return "IN_PROGRESS";
    return "UNKNOWN";
  },
};
