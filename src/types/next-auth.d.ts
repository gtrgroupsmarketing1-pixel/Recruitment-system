import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    tenantId?: string;
    role?: UserRole;
    branchId?: string | null;
  }
  interface Session {
    tenantId?: string;
    role?: UserRole;
    branchId?: string | null;
    user: {
      id: string;
      tenantId: string;
      role: UserRole;
      branchId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    role?: UserRole;
    uid?: string;
    branchId?: string | null;
  }
}
