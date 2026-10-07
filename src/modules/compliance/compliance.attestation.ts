import { StageLockedError } from "@/lib/errors";

export function assertAttestationOrder(input: {
  order: number;
  authority: string;
  previousStatus: string | null;
  previousAuthority: string | null;
}): void {
  if (input.order <= 1) return;
  if (input.previousStatus !== "COMPLETE" && input.previousStatus !== "COMPLETE") {
    throw new StageLockedError(
      input.authority,
      input.previousAuthority ?? "previous"
    );
  }
}
