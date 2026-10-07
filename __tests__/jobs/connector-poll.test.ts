import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runConnectorPollJob } from "@/core/jobs/jobs/connector-poll.job";

describe("connector-poll job", () => {
  const prev = process.env.CONNECTOR_POLL_ENABLED;

  afterEach(() => {
    if (prev === undefined) delete process.env.CONNECTOR_POLL_ENABLED;
    else process.env.CONNECTOR_POLL_ENABLED = prev;
  });

  it("returns zero when CONNECTOR_POLL_ENABLED is false", async () => {
    process.env.CONNECTOR_POLL_ENABLED = "false";
    const result = await runConnectorPollJob();
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(0);
  });
});
