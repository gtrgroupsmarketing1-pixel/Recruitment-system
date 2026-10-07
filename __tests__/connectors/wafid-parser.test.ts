import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseWafidHtml } from "@/core/connectors/parsers/wafid.parser";

const fixture = (name: string) =>
  readFileSync(resolve(process.cwd(), "__tests__/fixtures", name), "utf8");

describe("wafid parser", () => {
  it("parses FIT fixture", () => {
    const parsed = parseWafidHtml(fixture("wafid-fit-response.html"));
    expect(parsed.rawStatus).toBe("FIT");
    expect(parsed.details.candidateName).toBe("Test Candidate");
  });

  it("parses UNFIT fixture", () => {
    const parsed = parseWafidHtml(fixture("wafid-unfit-response.html"));
    expect(parsed.rawStatus).toBe("UNFIT");
  });

  it("parses PENDING fixture", () => {
    const parsed = parseWafidHtml(fixture("wafid-pending-response.html"));
    expect(parsed.rawStatus).toBe("Processing");
  });

  it("throws on malformed HTML", () => {
    expect(() => parseWafidHtml("<html><body>no status</body></html>")).toThrow(
      /status row/i
    );
  });
});
