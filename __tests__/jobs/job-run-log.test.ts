import { describe, it, expect, vi, beforeEach } from "vitest";

const created: Array<Record<string, unknown>> = [];

vi.mock("@/core/db/client", () => ({
  authPrisma: {
    jobRunLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return data;
      },
    },
  },
}));

describe("job run log", () => {
  beforeEach(() => {
    created.length = 0;
  });

  it("successful run writes OK", async () => {
    const { runJob } = await import("@/core/jobs/run-job");
    await runJob("demo", async () => ({ processed: 2, failed: 0 }));
    expect(created[0]?.status).toBe("OK");
    expect(created[0]?.itemsProcessed).toBe(2);
  });

  it("partial run writes PARTIAL", async () => {
    const { runJob } = await import("@/core/jobs/run-job");
    await runJob("demo", async () => ({ processed: 1, failed: 1 }));
    expect(created.at(-1)?.status).toBe("PARTIAL");
  });

  it("throwing run writes FAILED then rethrows", async () => {
    const { runJob } = await import("@/core/jobs/run-job");
    await expect(
      runJob("demo", async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(created.at(-1)?.status).toBe("FAILED");
  });
});
