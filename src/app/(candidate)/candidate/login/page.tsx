import { headers } from "next/headers";

export default async function CandidateLoginPage() {
  const h = await headers();
  const tenantId = h.get("x-tenant-id") ?? "";

  return (
    <main className="mx-auto grid max-w-md gap-3 p-6">
      <h1 className="text-xl font-semibold">Candidate portal</h1>
      <p className="text-sm text-muted-foreground">
        Enter the email or phone on your application. We&apos;ll send a one-time sign-in link.
      </p>
      {!tenantId ? (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Open this page on your agency subdomain (e.g. your-agency.example.com) so we can
          identify the correct workspace.
        </p>
      ) : null}
      <form action="/api/candidate-auth/request" method="post" className="grid gap-2">
        {tenantId ? <input type="hidden" name="tenantId" value={tenantId} /> : null}
        <label className="grid gap-1 text-sm">
          Email or phone
          <input
            name="identifier"
            placeholder="you@email.com or +971…"
            required
            className="rounded border px-2 py-1.5"
          />
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Send link
        </button>
      </form>
    </main>
  );
}
