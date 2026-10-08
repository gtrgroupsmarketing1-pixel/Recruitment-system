import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/realtime/route";
import { NextRequest } from "next/server";

describe("sse endpoint", () => {
  it("rejects a request with no staff session", async () => {
    const response = await GET(new NextRequest("http://localhost/api/realtime"));
    expect(response.status).toBe(401);
  });
});
