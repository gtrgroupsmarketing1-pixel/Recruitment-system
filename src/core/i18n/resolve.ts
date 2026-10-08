import { cookies, headers } from "next/headers";
import { resolveLocaleValue, type Locale } from "./translate";

export async function resolveLocale(): Promise<Locale> {
  const jar = await cookies();
  const headerStore = await headers();
  let tenantLocale: string | undefined;
  const branding = headerStore.get("x-tenant-branding");
  if (branding) {
    try {
      tenantLocale = (JSON.parse(branding) as { defaultLocale?: string }).defaultLocale;
    } catch {
      tenantLocale = undefined;
    }
  }
  return resolveLocaleValue(jar.get("locale")?.value, tenantLocale);
}
