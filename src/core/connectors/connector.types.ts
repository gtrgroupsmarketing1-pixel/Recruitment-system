export type ConnectorStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "UNKNOWN";

export type ConnectorCheckInput = {
  trackingId: string;
  credentials: Record<string, string>;
  timeoutMs: number;
  userAgent: string;
};

export type ConnectorCheckResult = {
  status: ConnectorStatus;
  rawStatus: string;
  details: Record<string, unknown>;
  fetchedAt: Date;
};

export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly connectorId: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

export interface ComplianceConnector {
  readonly id: string;
  readonly displayName: string;
  readonly countries: readonly string[];
  readonly requiresTrackingId: boolean;

  validateTrackingId(trackingId: string): { valid: boolean; error?: string };
  check(input: ConnectorCheckInput): Promise<ConnectorCheckResult>;
  mapStatus(rawStatus: string): ConnectorStatus;
}
