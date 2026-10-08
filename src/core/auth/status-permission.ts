import type { SessionScope } from "./scope";
import { ForbiddenError } from "@/lib/errors";
import { STATUS, type Status } from "@/modules/application/application.state-machine";
import { PIPELINE_ORDER } from "@/modules/application/application.status-order";

const EXIT_STATES: readonly Status[] = [
  STATUS.REJECTED,
  STATUS.ON_HOLD,
  STATUS.MEDICAL_UNFIT,
  STATUS.VISA_REFUSED,
  STATUS.ABSCONDED,
];

function indexOf(status: Status): number {
  return PIPELINE_ORDER.indexOf(status);
}

/**
 * Role-position gate for application:change_status.
 * Call after requirePermission. Exit states are always allowed for roles
 * that already passed the permission matrix. FINANCE never changes status.
 * PIPELINE_ORDER (Session 11) is the only ordering source.
 */
export function requireChangeStatusPermission(
  scope: SessionScope,
  from: Status,
  to: Status
): void {
  if (scope.role === "FINANCE") {
    throw new ForbiddenError(`Role ${scope.role} cannot change application status`);
  }

  if (EXIT_STATES.includes(to)) return;

  if (
    scope.role === "TENANT_ADMIN" ||
    scope.role === "BRANCH_MANAGER" ||
    scope.role === "RECRUITER"
  ) {
    return;
  }

  const fromIdx = indexOf(from);

  if (scope.role === "MOBILIZATION_OFFICER") {
    const minIdx = indexOf(STATUS.TRAVELED);
    if (fromIdx < minIdx) {
      throw new ForbiddenError(`Mobilization officer cannot transition from ${from}`);
    }
    return;
  }

  if (scope.role === "COMPLIANCE_OFFICER") {
    const minIdx = indexOf(STATUS.MEDICAL_BOOKED);
    if (fromIdx < minIdx) {
      throw new ForbiddenError(`Compliance officer cannot transition from ${from}`);
    }
    return;
  }

  throw new ForbiddenError(`Role ${scope.role} cannot change application status`);
}
