"use client";

import { useState, useTransition } from "react";
import { saveEmailConfigAction } from "@/app/(app)/admin/email-config/save.action";
import { sendTestEmailAction } from "@/app/(app)/admin/email-config/test.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Sender = {
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
  signatureHtml: string | null;
};

type Props = { sender: Sender };

export function EmailConfigClient({ sender }: Props) {
  const [pending, startTransition] = useTransition();
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const onTest = () => {
    startTransition(async () => {
      setTestMsg(null);
      const fd = new FormData();
      fd.set("to", testTo);
      const res = await sendTestEmailAction(fd);
      if (res.success) {
        setTestMsg({
          ok: true,
          text: res.note
            ? `Sent (${res.status}). ${res.note}`
            : `Sent successfully (${res.status}). Check the inbox.`,
        });
      } else {
        setTestMsg({ ok: false, text: res.error });
      }
    });
  };

  return (
    <div className="grid gap-6">
      <Card className="border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/30">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
              Domain / provider
            </p>
            <p className="text-xs text-sky-800 dark:text-sky-200">
              Custom from-addresses only work after DNS is verified with your
              email provider (Postmark, SES, Resend). Until then, use a verified
              sender or keep EMAIL_DRIVER=log for development.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Configure via EMAIL_DRIVER env
          </Badge>
        </CardContent>
      </Card>

      <form action={saveEmailConfigAction}>
        <Card>
          <CardHeader>
            <CardTitle>Sender identity</CardTitle>
            <CardDescription>
              How automated emails appear to candidates and clients
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label htmlFor="fromName">From name</Label>
                <Input
                  id="fromName"
                  name="fromName"
                  required
                  maxLength={100}
                  defaultValue={sender.fromName}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="fromEmail">From email</Label>
                <Input
                  id="fromEmail"
                  name="fromEmail"
                  type="email"
                  required
                  defaultValue={sender.fromEmail}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="replyToEmail">Reply-to (optional)</Label>
              <Input
                id="replyToEmail"
                name="replyToEmail"
                type="email"
                defaultValue={sender.replyToEmail ?? ""}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="signatureHtml">Signature HTML</Label>
              <textarea
                id="signatureHtml"
                name="signatureHtml"
                maxLength={2000}
                rows={5}
                defaultValue={sender.signatureHtml ?? ""}
                className="min-h-[120px] w-full rounded-lg border border-input bg-background px-2 py-1 font-mono text-xs"
                placeholder="<p>Best regards,<br/>Recruitment team</p>"
              />
              <p className="text-xs text-muted-foreground">
                Appended to automated emails. Keep it simple HTML — no scripts.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save settings</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Send test email</CardTitle>
          <CardDescription>
            Verifies sender config end-to-end (system.test_email template)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-1">
            <Label htmlFor="testTo">Recipient</Label>
            <Input
              id="testTo"
              type="email"
              placeholder="you@company.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !testTo}
            onClick={onTest}
          >
            {pending ? "Sending…" : "Send test"}
          </Button>
          {testMsg ? (
            <p
              className={
                testMsg.ok
                  ? "text-sm text-emerald-700 sm:col-span-2"
                  : "text-sm text-destructive sm:col-span-2"
              }
            >
              {testMsg.text}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
