import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { TaskService } from "@/modules/task/task.service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await withMobileScope(req, async (scope) => {
      await TaskService.update(scope.tenantId, scope.userId, id, { status: "COMPLETED" });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const msg = error instanceof Error ? error.message : "Failed to complete task";
    console.error("[mobile/tasks/complete]", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
