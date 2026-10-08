import { describe, expect, it } from "vitest";
import { t } from "@/core/i18n/translate";

describe("translate", () => {
  it("returns locale strings, falls back, and interpolates", () => {
    expect(t("en", "common.save")).toBe("Save");
    expect(t("ar", "common.save")).toBe("حفظ");
    expect(t("ar", "common.save")).not.toBe("missing");
    expect(t("en", "common.cancel")).toBe("Cancel");
    expect(t("en", "login.subtitle", { tenant: "Acme" })).toBe("Sign in to Acme");
    expect(t("en", "login.subtitle", {})).toContain("{tenant}");
  });
});
