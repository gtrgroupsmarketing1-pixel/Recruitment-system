import { NextResponse } from "next/server";
import { MobileAuthError, withMobileScope } from "@/core/mobile-auth/scope";
import { parseInboundMessage } from "@/modules/intake/intake.parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    return await withMobileScope(req, async () => {
      const body = (await req.json()) as { text?: string };
      const text = String(body.text ?? "");
      if (!text.trim()) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }
      const parsed = parseInboundMessage(text);
      return NextResponse.json(parsed);
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/intake/parse]", error);
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}
