"use server";

import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
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
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return { subject: null, body: "", htmlBody: null, error: "Missing tenant" };

  const templateKey = String(formData.get("templateKey") ?? "");
  const contextJson = String(formData.get("context") ?? "{}");
  let context: TemplateContext = {};
  try {
    const parsed = JSON.parse(contextJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      context = parsed as TemplateContext;
    }
  } catch {
    return { subject: null, body: "", htmlBody: null, error: "Invalid JSON" };
  }

  const template = TEMPLATES[templateKey];
  if (!template) {
    return { subject: null, body: "", htmlBody: null, error: "Unknown template" };
  }

  const sender = await withTenant(tenantId, () => resolveSender(tenantId));
  return {
    subject: template.subject?.(context) ?? null,
    body: template.body(context),
    htmlBody: template.bodyHtml
      ? renderEmailHtml(template.bodyHtml(context), sender.signatureHtml)
      : null,
  };
}
