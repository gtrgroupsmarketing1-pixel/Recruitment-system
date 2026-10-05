import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    tenantId?: string;
    role?: string;
    user: DefaultSession["user"] & { id?: string };
  }
  interface User {
    tenantId?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    role?: string;
    uid?: string;
  }
}
