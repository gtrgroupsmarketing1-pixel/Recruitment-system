import { describe, it, expect } from "vitest";
import { parseEnv } from "@/core/config/env";
import { ValidationError } from "@/lib/errors";

describe("parseEnv", () => {
  const good = Buffer.alloc(32, 7).toString("base64");

  it("throws ValidationError when ENCRYPTION_KEY is missing", () => {
    expect(() =>
      parseEnv({
        BLIND_INDEX_KEY: good,
      } as NodeJS.ProcessEnv)
    ).toThrow(ValidationError);
  });

  it("throws when ENCRYPTION_KEY is wrong length", () => {
    expect(() =>
      parseEnv({
        ENCRYPTION_KEY: Buffer.alloc(16, 1).toString("base64"),
        BLIND_INDEX_KEY: good,
      } as NodeJS.ProcessEnv)
    ).toThrow(ValidationError);
  });

  it("accepts valid keys", () => {
    const env = parseEnv({
      ENCRYPTION_KEY: good,
      BLIND_INDEX_KEY: good,
      ENCRYPTION_KEY_PREVIOUS: "",
    } as NodeJS.ProcessEnv);
    expect(env.ENCRYPTION_KEY).toBe(good);
    expect(env.ENCRYPTION_KEY_PREVIOUS).toBeUndefined();
  });
});
