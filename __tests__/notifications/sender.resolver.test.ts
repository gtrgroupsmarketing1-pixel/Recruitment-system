import { describe, it, expect } from "vitest";
import { DEFAULT_SENDER } from "@/modules/notification/sender.resolver";

describe("sender resolver defaults", () => {
  it("default sender is non-null", () => {
    expect(DEFAULT_SENDER.fromName.length).toBeGreaterThan(0);
    expect(DEFAULT_SENDER.fromEmail).toContain("@");
    expect(DEFAULT_SENDER.replyToEmail).toBeNull();
    expect(DEFAULT_SENDER.signatureHtml).toBeNull();
  });
});
