import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { resolveSender } from "@/modules/notification/sender.resolver";
import { saveEmailConfigAction } from "./save.action";

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function EmailConfigPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const sender = await withTenant(tenantId, () => resolveSender(tenantId));

  return (
    <main className="mx-auto grid max-w-xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Email sender</h1>
        <Link href="/admin/notifications" className="text-sm underline">
          Delivery log
        </Link>
      </div>
      {sp.saved === "1" ? (
        <p className="text-sm text-green-700">Saved.</p>
      ) : null}
      <form action={saveEmailConfigAction} className="grid gap-3 text-sm">
        <label className="grid gap-1">
          From name
          <input
            name="fromName"
            required
            maxLength={100}
            defaultValue={sender.fromName}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="grid gap-1">
          From email
          <input
            name="fromEmail"
            type="email"
            required
            defaultValue={sender.fromEmail}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="grid gap-1">
          Reply-to
          <input
            name="replyToEmail"
            type="email"
            defaultValue={sender.replyToEmail ?? ""}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="grid gap-1">
          Signature HTML
          <textarea
            name="signatureHtml"
            maxLength={2000}
            rows={5}
            defaultValue={sender.signatureHtml ?? ""}
            className="rounded border px-2 py-1 font-mono text-xs"
          />
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Save
        </button>
      </form>
    </main>
  );
}
