import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/core/auth/session";
import { subscribeToDomainEvents } from "@/core/events/pg-listener";
import { parseRealtimePayload, realtimeAccess, shouldDeliver } from "@/core/realtime/filter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const tenantId = session.user.tenantId || session.tenantId;
  if (realtimeAccess({ tenantId, role: session.user.role }) !== "ok" || !tenantId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);
      const unsubscribe = subscribeToDomainEvents((_channel, raw) => {
        const event = parseRealtimePayload(raw);
        if (!event) return;
        if (!shouldDeliver(event, { tenantId, eventTypes: new Set() })) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: event.type,
            payload: event.payload,
            at: new Date().toISOString(),
          })}\n\n`));
        } catch {
          return;
        }
      });
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          return;
        }
      });
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
