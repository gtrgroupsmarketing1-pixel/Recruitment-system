import type { NotificationChannel } from "@prisma/client";
import { escapeHtml } from "@/lib/html";

export type TemplateContext = Record<
  string,
  string | number | null | undefined
>;

export type RenderResult = {
  subject: string | null;
  body: string;
  bodyHtml: string | null;
};

type Template = {
  channel: NotificationChannel;
  subject?: (ctx: TemplateContext) => string;
  body: (ctx: TemplateContext) => string;
  bodyHtml?: (ctx: TemplateContext) => string;
};

/** Coerce context values for interpolation — never "undefined" string. */
export function field(
  ctx: TemplateContext,
  key: string,
  fallback = ""
): string {
  const v = ctx[key];
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function e(ctx: TemplateContext, key: string): string {
  return escapeHtml(field(ctx, key));
}

export const TEMPLATES: Record<string, Template> = {
  "candidate.status_changed": {
    channel: "WHATSAPP",
    body: (ctx) =>
      `Hi ${field(ctx, "candidateName")}, your application status is now: ${field(ctx, "status")}. ` +
      `Requisition: ${field(ctx, "requisitionCode")}.`,
  },
  "document.expiring": {
    channel: "EMAIL",
    subject: (ctx) => `Document expiring: ${field(ctx, "documentLabel")}`,
    body: (ctx) =>
      `The ${field(ctx, "documentLabel")} for ${field(ctx, "candidateName")} expires on ${field(ctx, "expiresOn")} ` +
      `(${field(ctx, "daysRemaining")} days). Please renew.`,
    bodyHtml: (ctx) =>
      `<p>The <strong>${e(ctx, "documentLabel")}</strong> for ` +
      `<strong>${e(ctx, "candidateName")}</strong> expires on ` +
      `<strong>${e(ctx, "expiresOn")}</strong> ` +
      `(${e(ctx, "daysRemaining")} days remaining).</p>` +
      `<p>Please renew or upload a replacement.</p>`,
  },
  "task.overdue": {
    channel: "EMAIL",
    subject: (ctx) => `Overdue task: ${field(ctx, "taskTitle")}`,
    body: (ctx) =>
      `Task "${field(ctx, "taskTitle")}" was due ${field(ctx, "dueDate")} and is assigned to you. ` +
      `Reference: ${field(ctx, "refType")} / ${field(ctx, "refId")}.`,
    bodyHtml: (ctx) =>
      `<p>Task <strong>${e(ctx, "taskTitle")}</strong> was due ` +
      `<strong>${e(ctx, "dueDate")}</strong> and is assigned to you.</p>` +
      `<p>Reference: ${e(ctx, "refType")} / ${e(ctx, "refId")}.</p>`,
  },
  "compliance.connector_status_changed": {
    channel: "EMAIL",
    subject: (ctx) =>
      `${field(ctx, "connectorName")}: ${field(ctx, "stepName")} is now ${field(ctx, "newStatus")}`,
    body: (ctx) =>
      `Hi ${field(ctx, "officerName")},\n\n` +
      `${field(ctx, "connectorName")} reports that step "${field(ctx, "stepName")}" has moved from ` +
      `${field(ctx, "previousStatus")} to ${field(ctx, "newStatus")}.\n\n` +
      `Suggested action: ${field(ctx, "suggestedAction")}.\n\n` +
      `Open the case to review.`,
    bodyHtml: (ctx) =>
      `<p>Hi ${e(ctx, "officerName")},</p>` +
      `<p>${e(ctx, "connectorName")} reports that step <strong>${e(ctx, "stepName")}</strong> ` +
      `has moved from ${e(ctx, "previousStatus")} to <strong>${e(ctx, "newStatus")}</strong>.</p>` +
      `<p>Suggested action: ${e(ctx, "suggestedAction")}.</p>` +
      `<p>Open the case to review.</p>`,
  },

  "client.candidate_decision": {
    channel: "EMAIL",
    subject: () => "Client decision on a candidate",
    body: (ctx) =>
      `Decision ${field(ctx, "decision")} on application ${field(ctx, "applicationId")}.`,
    bodyHtml: (ctx) =>
      `<p>Decision <strong>${e(ctx, "decision")}</strong> on application ` +
      `<strong>${e(ctx, "applicationId")}</strong>.</p>`,
  },
  "joborder.submitted": {
    channel: "EMAIL",
    subject: () => "New job order",
    body: (ctx) => `Job order ${field(ctx, "roleTitle")} submitted.`,
    bodyHtml: (ctx) =>
      `<p>Job order <strong>${e(ctx, "roleTitle")}</strong> submitted.</p>`,
  },
};

export function renderTemplate(
  templateKey: string,
  context: TemplateContext
): RenderResult & { channel: NotificationChannel } {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Unknown template: ${templateKey}`);
  }
  return {
    channel: tpl.channel,
    subject: tpl.subject ? tpl.subject(context) : null,
    body: tpl.body(context),
    bodyHtml: tpl.bodyHtml ? tpl.bodyHtml(context) : null,
  };
}

export function listTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}
