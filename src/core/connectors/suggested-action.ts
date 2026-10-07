import type { ConnectorStatus } from "./connector.types";

export type SuggestedAction = "COMPLETE_STEP" | "REVIEW" | null;

export function suggestedActionFor(status: ConnectorStatus): SuggestedAction {
  if (status === "APPROVED") return "COMPLETE_STEP";
  if (status === "REJECTED" || status === "EXPIRED") return "REVIEW";
  return null;
}
