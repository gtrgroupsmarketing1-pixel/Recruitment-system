import { describe, it, expect } from "vitest";
import { parseEnv, parseEncryptionEnv } from "@/core/config/env";
import { ValidationError } from "@/lib/errors";

describe("parseEncryptionEnv", () => {
  const good = Buffer.alloc(32, 7).toString("base64");

  it("throws ValidationError when ENCRYPTION_KEY is missing", () => {
    expect(() =>
      parseEncryptionEnv({
        BLIND_INDEX_KEY: good,
      })
    ).toThrow(ValidationError);
  });

  it("throws when ENCRYPTION_KEY is wrong length", () => {
    expect(() =>
      parseEncryptionEnv({
        ENCRYPTION_KEY: Buffer.alloc(16, 1).toString("base64"),
        BLIND_INDEX_KEY: good,
      })
    ).toThrow(ValidationError);
  });

  it("accepts valid keys", () => {
    const env = parseEncryptionEnv({
      ENCRYPTION_KEY: good,
      BLIND_INDEX_KEY: good,
      ENCRYPTION_KEY_PREVIOUS: "",
    });
    expect(env.ENCRYPTION_KEY).toBe(good);
    expect(env.ENCRYPTION_KEY_PREVIOUS).toBeUndefined();
  });
});

describe("parseEnv", () => {
  const good = Buffer.alloc(32, 7).toString("base64");

  it("requires DATABASE_URL and AUTH_DATABASE_URL", () => {
    expect(() =>
      parseEnv({
        ENCRYPTION_KEY: good,
        BLIND_INDEX_KEY: good,
      })
    ).toThrow(ValidationError);
  });

  it("accepts full env", () => {
    const env = parseEnv({
      ENCRYPTION_KEY: good,
      BLIND_INDEX_KEY: good,
      DATABASE_URL: "postgres://app_tenant:x@localhost:5432/recruit",
      AUTH_DATABASE_URL: "postgres://app_auth:x@localhost:5432/recruit",
      DIRECT_URL: "postgres://app_auth:x@localhost:5432/recruit",
    });
    expect(env.DATABASE_URL).toContain("app_tenant");
    expect(env.AUTH_DATABASE_URL).toContain("app_auth");
  });
});
