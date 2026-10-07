import type { NotificationChannel } from "@prisma/client";

export type TemplateContext = Record<
  string,
  string | number | null | undefined
>;

export type RenderResult = {
  subject: string | null;
  body: string;
};

type Template = {
  channel: NotificationChannel;
  subject?: (ctx: TemplateContext) => string;
  body: (ctx: TemplateContext) => string;
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
  },
  "task.overdue": {
    channel: "EMAIL",
    subject: (ctx) => `Overdue task: ${field(ctx, "taskTitle")}`,
    body: (ctx) =>
      `Task "${field(ctx, "taskTitle")}" was due ${field(ctx, "dueDate")} and is assigned to you. ` +
      `Reference: ${field(ctx, "refType")} / ${field(ctx, "refId")}.`,
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
  };
}

export function listTemplateKeys(): string[] {
  return Object.keys(TEMPLATES);
}
