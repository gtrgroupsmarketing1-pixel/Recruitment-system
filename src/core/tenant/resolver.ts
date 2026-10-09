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
  if (cleanHost.endsWith(`.${root}`)) {
    const sub = cleanHost.slice(0, -`.${root}`.length);
    if (RESERVED.includes(sub)) return { kind: "ROOT" };
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

export async function resolveTenantFromHost(host: string): Promise<ResolvedTenant | null> {
  // DEV-ONLY override: Codespaces / preview environments have no subdomain
  // control, so allow forcing the tenant via DEV_TENANT_SLUG env var.
  // Never set this in production.
  if (process.env.DEV_TENANT_SLUG) {
    const tenant = await authPrisma.tenant.findFirst({
      where: { slug: process.env.DEV_TENANT_SLUG, deletedAt: null },
      select,
    });
    return tenant
      ? { ...tenant, defaultDirection: tenant.defaultDirection === "rtl" ? "rtl" : "ltr" }
      : null;
  }

  const root = process.env.ROOT_DOMAIN || "localhost";
  const parsed = parseHost(host, root);
  if (parsed.kind === "ROOT") return null;
  if (parsed.kind === "SUBDOMAIN") {
    const tenant = await authPrisma.tenant.findFirst({
      where: { slug: parsed.slug, deletedAt: null },
      select,
    });
    return tenant ? { ...tenant, defaultDirection: tenant.defaultDirection === "rtl" ? "rtl" : "ltr" } : null;
  }
  const tenant = await authPrisma.tenant.findFirst({
    where: { customDomain: host.split(":")[0].toLowerCase(), deletedAt: null },
    select,
  });
  return tenant ? { ...tenant, defaultDirection: tenant.defaultDirection === "rtl" ? "rtl" : "ltr" } : null;
}