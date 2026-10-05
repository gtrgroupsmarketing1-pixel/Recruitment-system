import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authPrisma } from "@/core/db/client";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
};

/** Copies tenant claims onto the JWT. Never overwrites an existing claim with undefined. */
export function withTenantClaims(token: JWT, user: User | null): JWT {
  if (user) {
    if (user.tenantId !== undefined) token.tenantId = user.tenantId;
    if (user.role !== undefined) token.role = user.role;
    if (user.id) token.uid = user.id;
  }
  return token;
}

/** Projects JWT tenant claims onto the session. Refresh must not drop tenantId. */
export function toSession(session: Session, token: JWT): Session {
  session.tenantId = typeof token.tenantId === "string" ? token.tenantId : undefined;
  session.role = typeof token.role === "string" ? token.role : undefined;
  if (session.user) {
    session.user.id = typeof token.uid === "string" ? token.uid : session.user.id;
  }
  return session;
}

const providers = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = String(credentials?.email ?? "").toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      // Pre-tenant: login lookup uses authPrisma (app_auth BYPASSRLS).
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
      };
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
