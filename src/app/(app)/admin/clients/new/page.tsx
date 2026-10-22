import Link from "next/link";
import { createClientCompanyAction } from "@/modules/client/client.company.actions";
import { PageHeader } from "@/components/ui/page-header";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewClientPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <main className="mx-auto grid max-w-md gap-4 p-6">
      <PageHeader
        title="New client"
        description="Create a client company. You can invite portal users next."
        actions={
          <Link href="/admin/clients" className="text-sm underline underline-offset-2">
            Back to list
          </Link>
        }
      />
      {sp.error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </p>
      ) : null}
      <form action={createClientCompanyAction} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          Company name
          <input
            name="name"
            required
            placeholder="e.g. Emirates Facilities LLC"
            className="rounded border px-2 py-1.5"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Short code
          <input
            name="code"
            required
            minLength={2}
            maxLength={12}
            placeholder="e.g. EMR"
            className="rounded border px-2 py-1.5 font-mono uppercase"
          />
          <span className="text-xs text-muted-foreground">
            2–12 characters, letters and numbers. Used in requisition codes.
          </span>
        </label>
        <label className="grid gap-1 text-sm">
          Country
          <select name="country" defaultValue="AE" className="rounded border px-2 py-1.5">
            <option value="AE">United Arab Emirates (AE)</option>
            <option value="SA">Saudi Arabia (SA)</option>
            <option value="QA">Qatar (QA)</option>
            <option value="KW">Kuwait (KW)</option>
            <option value="BH">Bahrain (BH)</option>
            <option value="OM">Oman (OM)</option>
          </select>
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Create client
        </button>
      </form>
    </main>
  );
}
