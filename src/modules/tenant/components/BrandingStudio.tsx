"use client";

import { useState, useTransition } from "react";
import { saveBrandingAction } from "@/modules/tenant/branding.actions";
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

const PRESETS = [
  "#0F62FE",
  "#2563eb",
  "#0d9488",
  "#7c3aed",
  "#c2410c",
  "#be123c",
  "#171717",
];

type Props = {
  initial: {
    slug: string;
    displayName: string;
    primaryColor: string;
    defaultLocale: string;
    logoUrl: string;
    customDomain: string;
    rootDomain: string;
  };
};

export function BrandingStudio({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [customDomain, setCustomDomain] = useState(initial.customDomain);
  const [locale, setLocale] = useState(initial.defaultLocale);
  const [message, setMessage] = useState<string | null>(null);

  const host =
    customDomain.trim() ||
    `${initial.slug}.${initial.rootDomain || "localhost"}`;

  const onSave = () => {
    startTransition(async () => {
      setMessage(null);
      const fd = new FormData();
      fd.set("displayName", displayName);
      fd.set("primaryColor", primaryColor);
      fd.set("defaultLocale", locale);
      fd.set("logoUrl", logoUrl);
      fd.set("customDomain", customDomain);
      const res = await saveBrandingAction(fd);
      setMessage(res.success ? "Saved." : res.error);
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Agency identity</CardTitle>
            <CardDescription>
              Client portal and email chrome use these values
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Paste a public URL (PNG/SVG). Binary upload can use storage
                signed URLs when STORAGE_DRIVER is configured.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Primary brand color</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="max-w-[8rem] font-mono uppercase"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    className="size-7 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                    onClick={() => setPrimaryColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="locale">Default locale</Label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="en">English</option>
                <option value="ar">Arabic (RTL)</option>
              </select>
            </div>

            <div className="grid gap-1 border-t pt-4">
              <Label htmlFor="customDomain">Custom domain</Label>
              <Input
                id="customDomain"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.youragency.com"
              />
              <p className="text-xs text-muted-foreground">
                Point a CNAME to your app host (e.g.{" "}
                <code className="rounded bg-muted px-1">
                  {initial.rootDomain || "your-vercel-app.vercel.app"}
                </code>
                ). Subdomain routing already uses{" "}
                <code className="rounded bg-muted px-1">{initial.slug}</code>.
              </p>
            </div>

            <Button type="button" disabled={pending} onClick={onSave}>
              {pending ? "Saving…" : "Save branding"}
            </Button>
            {message ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Live preview</h2>
          <Badge variant="secondary">Real-time</Badge>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <div className="flex gap-1">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 rounded-md border bg-background px-2 py-0.5 text-center text-xs text-muted-foreground">
              {host}/client/dashboard
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 flex items-center gap-3 border-b pb-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-8 max-w-[8rem] object-contain"
                />
              ) : (
                <div
                  className="flex size-8 items-center justify-center rounded text-xs font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {(displayName || "A").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-semibold">
                {displayName || "Your agency"}
              </span>
            </div>
            <h3 className="text-xl font-semibold">Welcome back</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Status of your open job orders and shortlists.
            </p>
            <button
              type="button"
              className="mb-4 w-full rounded-lg px-3 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Submit new job order
            </button>
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Forklift operators</span>
                <span className="text-xs text-muted-foreground">In progress</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: "42%", backgroundColor: primaryColor }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email chrome preview
          </p>
          <div className="rounded-lg border">
            <div
              className="border-b px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {displayName || "Agency"} · Interview update
            </div>
            <div className="space-y-2 p-3 text-sm">
              <p>Hello,</p>
              <p className="text-muted-foreground">
                Your candidate shortlist is ready for review in the client
                portal.
              </p>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Open portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
