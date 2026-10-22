import { authPrisma } from "@/core/db/client";

export type ResolvedTenant = {
  id: string;
  slug: string;
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  defaultLocale: string;
  defaultDirection: "ltr" | "rtl";
};

const RESERVED = ["app", "api", "www", "admin", "assets", "cdn"];

export function parseHost(host: string, rootDomain: string): {
  kind: "ROOT" | "SUBDOMAIN" | "CUSTOM";
  slug?: string;
} {
  const cleanHost = host.split(":")[0].toLowerCase();
  const root = rootDomain.toLowerCase();
  if (cleanHost === root || cleanHost === `www.${root}`) return { kind: "ROOT" };
  // Vercel preview / deployment hosts are not tenant subdomains
  if (
    cleanHost.endsWith(".vercel.app") ||
    cleanHost.includes("localhost") ||
    cleanHost === "127.0.0.1"
  ) {
    return { kind: "ROOT" };
  }
  if (cleanHost.endsWith(`.${root}`)) {
    const sub = cleanHost.slice(0, -`.${root}`.length);
    if (!sub || RESERVED.includes(sub) || sub.includes(".")) {
      return { kind: "ROOT" };
    }
    return { kind: "SUBDOMAIN", slug: sub };
  }
  return { kind: "CUSTOM" };
}

const select = {
  id: true,
  slug: true,
  displayName: true,
  logoUrl: true,
  primaryColor: true,
  defaultLocale: true,
  defaultDirection: true,
} as const;

function normalize(tenant: {
  id: string;
  slug: string;
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  defaultLocale: string;
  defaultDirection: string;
}): ResolvedTenant {
  return {
    ...tenant,
    defaultDirection: tenant.defaultDirection === "rtl" ? "rtl" : "ltr",
  };
}

export async function resolveTenantFromHost(host: string): Promise<ResolvedTenant | null> {
  try {
    // DEV-ONLY override (Codespaces / local). Avoid in production unless intentional.
    if (process.env.DEV_TENANT_SLUG) {
      const tenant = await authPrisma.tenant.findFirst({
        where: { slug: process.env.DEV_TENANT_SLUG, deletedAt: null },
        select,
      });
      return tenant ? normalize(tenant) : null;
    }

    const root = process.env.ROOT_DOMAIN || "localhost";
    const parsed = parseHost(host, root);
    if (parsed.kind === "ROOT") return null;
    if (parsed.kind === "SUBDOMAIN" && parsed.slug) {
      const tenant = await authPrisma.tenant.findFirst({
        where: { slug: parsed.slug, deletedAt: null },
        select,
      });
      return tenant ? normalize(tenant) : null;
    }
    const tenant = await authPrisma.tenant.findFirst({
      where: { customDomain: host.split(":")[0].toLowerCase(), deletedAt: null },
      select,
    });
    return tenant ? normalize(tenant) : null;
  } catch (error) {
    console.error("[resolveTenantFromHost]", error);
    return null;
  }
}
