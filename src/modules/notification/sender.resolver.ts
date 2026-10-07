import { db } from "@/core/db/client";

export type ResolvedSender = {
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  signatureHtml: string | null;
};

export const DEFAULT_SENDER: ResolvedSender = {
  fromName: "Recruitment System",
  fromEmail: "noreply@example.com",
  replyToEmail: null,
  signatureHtml: null,
};

export async function resolveSender(tenantId: string): Promise<ResolvedSender> {
  const config = await db.tenantEmailConfig.findFirst({
    where: { tenantId },
  });
  if (!config) return DEFAULT_SENDER;
  return {
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    replyToEmail: config.replyToEmail,
    signatureHtml: config.signatureHtml,
  };
}

export function formatFrom(sender: {
  fromName: string;
  fromEmail: string;
}): string {
  return `${sender.fromName} <${sender.fromEmail}>`;
}
