import { describe, it, expect, vi } from "vitest";
import { authorizeCron, GET } from "@/app/api/cron/[job]/route";

vi.mock("@/core/jobs/jobs/document-expiry.job", () => ({
  runDocumentExpiryJob: vi.fn(async () => ({ processed: 1, failed: 0 })),
}));
vi.mock("@/core/jobs/jobs/task-overdue.job", () => ({
  runTaskOverdueJob: vi.fn(async () => ({ processed: 2 })),
}));
vi.mock("@/core/jobs/jobs/document-gc.job", () => ({
  runDocumentGcJob: vi.fn(async () => ({ processed: 3, failed: 0 })),
}));
vi.mock("@/core/jobs/run-job", () => ({
  runJob: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
}));

describe("cron auth", () => {
  it("wrong bearer → 401", async () => {
    process.env.CRON_SECRET = "secret";
    expect(authorizeCron("Bearer nope")).toBe(false);
    const res = await GET(new Request("http://localhost/api/cron/task-overdue"), {
      params: Promise.resolve({ job: "task-overdue" }),
    });
    expect(res.status).toBe(401);
  });

  it("unknown job → 404", async () => {
    process.env.CRON_SECRET = "secret";
    const res = await GET(
      new Request("http://localhost/api/cron/nope", {
        headers: { authorization: "Bearer secret" },
      }),
      { params: Promise.resolve({ job: "nope" }) }
    );
    expect(res.status).toBe(404);
  });

  it("correct bearer + known job calls the job", async () => {
    process.env.CRON_SECRET = "secret";
    const res = await GET(
      new Request("http://localhost/api/cron/document-gc", {
        headers: { authorization: "Bearer secret" },
      }),
      { params: Promise.resolve({ job: "document-gc" }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; job: string };
    expect(body.ok).toBe(true);
    expect(body.job).toBe("document-gc");
  });
});
