import { describe, expect, it } from "vitest";
import { resolveLocaleValue } from "@/core/i18n/translate";

describe("resolve locale", () => {
  it("prefers cookie, then tenant, then en", () => {
    expect(resolveLocaleValue("ar", "en")).toBe("ar");
    expect(resolveLocaleValue(undefined, "ar")).toBe("ar");
    expect(resolveLocaleValue(undefined, undefined)).toBe("en");
  });
});
