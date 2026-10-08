import { DICTS, type Locale, type TranslationKey } from "./dict";

export function t(locale: Locale, key: TranslationKey, params?: Record<string, string>): string {
  const dict = DICTS[locale];
  let value: string = dict[key] ?? DICTS.en[key] ?? key;
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replaceAll(`{${name}}`, replacement);
    }
  }
  return value;
}

export function resolveLocaleValue(cookie: string | undefined, tenantLocale: string | undefined): Locale {
  if (cookie === "en" || cookie === "ar") return cookie;
  if (tenantLocale === "en" || tenantLocale === "ar") return tenantLocale;
  return "en";
}
