// Health check — no external body input.
import { NextResponse } from "next/server";
import { getStorage } from "@/core/storage/storage.client";

export async function GET() {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  const start = Date.now();
  try {
    const head = await getStorage().headBucket();
    return NextResponse.json({
      status: "ok",
      driver,
      latencyMs: head.latencyMs || Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        driver,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 503 }
    );
  }
}
