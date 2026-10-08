import bcrypt from "bcryptjs";
import { authPrisma } from "@/core/db/client";

export async function authorizeCredentials(emailRaw: string, password: string) {
  const email = emailRaw.toLowerCase();
  if (!email || !password) return null;
  const user = await authPrisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: user.role,
    branchId: user.branchId ?? null,
    clientCompanyId: user.clientCompanyId ?? null,
  };
}
