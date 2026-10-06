import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { CandidateList } from "@/modules/candidate/components/CandidateList";
import { CandidateService } from "@/modules/candidate/candidate.service";

type ListProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CandidatesPage({ searchParams }: ListProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const data = await withTenant(tenantId, () =>
    CandidateService.list(tenantId, { search: sp.q })
  );
  return (
    <main className="grid gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Candidates</h1>
        <Link href="/candidates/new" className="rounded bg-black px-3 py-2 text-sm text-white">
          New
        </Link>
      </div>
      <form method="get" className="flex gap-2">
        <input name="q" defaultValue={sp.q ?? ""} className="rounded border px-2 py-1" placeholder="Name or phone" />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">Search</button>
      </form>
      <CandidateList data={data} />
    </main>
  );
}
