import { ValidationError } from "@/lib/errors";
import type { UserRole } from "@prisma/client";

export function assertUserScope(input: {
  role: UserRole;
  branchId: string | null | undefined;
  clientCompanyId: string | null | undefined;
}): void {
  const { role, branchId, clientCompanyId } = input;

  if (role === "CLIENT_USER") {
    if (!clientCompanyId) {
      throw new ValidationError("CLIENT_USER requires clientCompanyId");
    }
    if (branchId) {
      throw new ValidationError("CLIENT_USER cannot have branchId");
    }
    return;
  }

  if (clientCompanyId) {
    throw new ValidationError(`Role ${role} cannot have clientCompanyId`);
  }
}
