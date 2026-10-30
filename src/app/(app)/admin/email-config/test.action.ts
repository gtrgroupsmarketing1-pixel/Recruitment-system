"use server";

import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { NotificationService } from "@/modules/notification/notification.service";
import { checkRateLimit } from "@/core/security/rate-limit";

export async function sendTestEmailAction(formData: FormData) {
  const to = String(formData.get("to") ?? "").trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { success: false as const, error: "Enter a valid email address" };
  }

  try {
    const result = await withSessionScope(async (scope) => {
      requirePermission("admin:email_config");

      const limit = await checkRateLimit(
        { key: "email:test", max: 5, windowSeconds: 60 },
        `email-test:${scope.userId}`
      );
      if (!limit.allowed) {
        return {
          ok: false as const,
          error: "Too many test emails. Wait a minute and try again.",
        };
      }

      const tenant = await db.tenant.findFirst({
        where: { id: scope.tenantId, deletedAt: null },
        select: { name: true, displayName: true },
      });

      const sent = await NotificationService.send(
        scope.tenantId,
        "system.test_email",
        { type: "staff", id: scope.userId, addr: to },
        {
          tenantName: tenant?.displayName || tenant?.name || "Agency",
        },
        { channel: "EMAIL" }
      );

      return {
        ok: true as const,
        status: sent.status,
        errorMessage: sent.errorMessage,
      };
    });

    if (!result.ok) {
      return { success: false as const, error: result.error };
    }
    if (result.status === "FAILED" || result.status === "BOUNCED") {
      return {
        success: false as const,
        error: result.errorMessage || `Send ended with status ${result.status}`,
      };
    }
    const driver = process.env.EMAIL_DRIVER ?? "log";
    return {
      success: true as const,
      status: result.status,
      note:
        driver === "log"
          ? "EMAIL_DRIVER=log — message is written to server logs, not a real inbox."
          : undefined,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Test send failed",
    };
  }
}
