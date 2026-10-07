import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("info emits single-line JSON with level/time/msg", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info({ tenantId: "t1" }, "hello");
    expect(spy).toHaveBeenCalledTimes(1);
    const raw = String(spy.mock.calls[0][0]);
    expect(raw.split("\n")).toHaveLength(1);
    const parsed = JSON.parse(raw);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("hello");
    expect(parsed.tenantId).toBe("t1");
    expect(typeof parsed.time).toBe("string");
  });

  it("child merges bindings", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const child = logger.child({ tenantId: "t1", userId: "u1" });
    child.info({ action: "change" }, "status");
    const parsed = JSON.parse(String(spy.mock.calls[0][0]));
    expect(parsed.tenantId).toBe("t1");
    expect(parsed.userId).toBe("u1");
    expect(parsed.action).toBe("change");
  });

  it("redacts *Bidx keys", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info({ passportNumberBidx: "abc", ok: 1 }, "idx");
    const parsed = JSON.parse(String(spy.mock.calls[0][0]));
    expect(parsed.passportNumberBidx).toBe("[redacted]");
    expect(parsed.ok).toBe(1);
  });

  it("redacts denylisted keys", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.error(
      {
        password: "secret",
        passwordHash: "hash",
        access_token: "tok",
        sessionToken: "sess",
      },
      "bad"
    );
    const parsed = JSON.parse(String(spy.mock.calls[0][0]));
    expect(parsed.password).toBe("[redacted]");
    expect(parsed.passwordHash).toBe("[redacted]");
    expect(parsed.access_token).toBe("[redacted]");
    expect(parsed.sessionToken).toBe("[redacted]");
  });

  it("redacts nested plain objects", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info({ user: { email: "a@b.c", passwordHash: "x", name: "Alice" } }, "nested");
    const parsed = JSON.parse(String(spy.mock.calls[0][0]));
    expect(parsed.user.email).toBe("[redacted]");
    expect(parsed.user.passwordHash).toBe("[redacted]");
    expect(parsed.user.name).toBe("Alice");
  });

  it("redacts email and phone at any nesting level", () => {
    const out = logger.format({
      user: { email: "x@y.com", phone: "+911234567890", name: "X" },
      meta: { nested: { email: "deep@z.com" } },
    });
    const user = out.user as { email: string; phone: string; name: string };
    const meta = out.meta as { nested: { email: string } };
    expect(user.email).toBe("[redacted]");
    expect(user.phone).toBe("[redacted]");
    expect(user.name).toBe("X");
    expect(meta.nested.email).toBe("[redacted]");
  });
});
