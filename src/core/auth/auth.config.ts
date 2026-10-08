import type { JWT } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";
import type { Session, User } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authorizeCredentials } from "@/core/auth/credentials";
import { authPrisma } from "@/core/db/client";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
  branchId?: string | null;
  clientCompanyId?: string | null;
};

/** Copies tenant claims onto the JWT. Never overwrites an existing claim with undefined. */
export function withTenantClaims(token: JWT, user: User | null): JWT {
  if (user) {
    if (user.tenantId !== undefined) token.tenantId = user.tenantId;
    if (user.role !== undefined) token.role = user.role;
    if (user.id) token.uid = user.id;
    if (user.branchId !== undefined) token.branchId = user.branchId;
    if (user.clientCompanyId !== undefined) token.clientCompanyId = user.clientCompanyId;
  }
  return token;
}

/** Projects JWT tenant claims onto the session. Refresh must not drop tenantId. */
export function toSession(session: Session, token: JWT): Session {
  session.tenantId = typeof token.tenantId === "string" ? token.tenantId : undefined;
  session.role = typeof token.role === "string" ? (token.role as UserRole) : undefined;
  session.branchId =
    typeof token.branchId === "string" ? token.branchId : token.branchId === null ? null : undefined;
  session.clientCompanyId =
    typeof token.clientCompanyId === "string"
      ? token.clientCompanyId
      : token.clientCompanyId === null
        ? null
        : undefined;
  if (session.user) {
    session.user.id = typeof token.uid === "string" ? token.uid : session.user.id;
    session.user.tenantId =
      typeof token.tenantId === "string" ? token.tenantId : session.user.tenantId;
    session.user.role =
      typeof token.role === "string" ? (token.role as UserRole) : session.user.role;
    session.user.branchId =
      typeof token.branchId === "string"
        ? token.branchId
        : token.branchId === null
          ? null
          : session.user.branchId;
    session.user.clientCompanyId =
      typeof token.clientCompanyId === "string"
        ? token.clientCompanyId
        : token.clientCompanyId === null
          ? null
          : session.user.clientCompanyId;
  }
  return session;
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      // Pre-tenant: login lookup uses authPrisma (app_auth BYPASSRLS) and deletedAt: null.
      return authorizeCredentials(
        String(credentials?.email ?? ""),
        String(credentials?.password ?? "")
      );
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(authPrisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt({ token, user }) {
      return withTenantClaims(token, user ?? null);
    },
    session({ session, token }) {
      return toSession(session, token);
    },
  },
});
