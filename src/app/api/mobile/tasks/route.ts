import { NextResponse } from "next/server";
import {
  MobileAuthError,
  withMobileScope,
} from "@/core/mobile-auth/with-mobile-scope";
import { TaskService } from "@/modules/task/task.service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") ?? "open";
    
    const data = await withMobileScope(req, async (scope) => {
      if (filter === "overdue") {
        const all = await TaskService.listForUser(scope.tenantId, scope.userId, {
          includeCompleted: false,
        });
        return all.filter((t) => t.isOverdue);
      }
      if (filter === "completed") {
        return TaskService.listForUser(scope.tenantId, scope.userId, {
          status: "COMPLETED",
          includeCompleted: true,
        });
      }
      return TaskService.listForUser(scope.tenantId, scope.userId, {
        includeCompleted: false,
      });
    });
    
    return NextResponse.json({ tasks: data });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[mobile/tasks]", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
