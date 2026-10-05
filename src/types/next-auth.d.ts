import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    tenantId?: string;
    role?: UserRole;
  }
  interface Session {
    tenantId?: string;
    role?: UserRole;
    user: {
      id: string;
      tenantId: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    role?: UserRole;
    uid?: string;
  }
}
