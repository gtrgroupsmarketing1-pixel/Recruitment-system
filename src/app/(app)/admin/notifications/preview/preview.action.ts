"use server";

import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { TEMPLATES, type TemplateContext } from "@/core/notifications/templates";
import { renderEmailHtml } from "@/core/notifications/email.layout";
import { resolveSender } from "@/modules/notification/sender.resolver";

export type PreviewResult = {
  subject: string | null;
  body: string;
  htmlBody: string | null;
  error?: string;
};

export async function previewAction(formData: FormData): Promise<PreviewResult> {
  try {
    return await withSessionScope(async (scope) => {
      requirePermission("admin:notifications");
      const templateKey = String(formData.get("templateKey") ?? "");
      const contextJson = String(formData.get("context") ?? "{}");
      let context: TemplateContext = {};
      try {
        const parsed = JSON.parse(contextJson) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          context = parsed as TemplateContext;
        }
      } catch {
        return {
          subject: null,
          body: "",
          htmlBody: null,
          error: "Invalid JSON",
        };
      }

      const template = TEMPLATES[templateKey];
      if (!template) {
        return {
          subject: null,
          body: "",
          htmlBody: null,
          error: "Unknown template",
        };
      }

      const sender = await resolveSender(scope.tenantId);
      return {
        subject: template.subject?.(context) ?? null,
        body: template.body(context),
        htmlBody: template.bodyHtml
          ? renderEmailHtml(template.bodyHtml(context), sender.signatureHtml)
          : null,
      };
    });
  } catch (err) {
    return {
      subject: null,
      body: "",
      htmlBody: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
