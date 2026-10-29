import Link from "next/link";
import { Suspense } from "react";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { CandidateList } from "@/modules/candidate/components/CandidateList";
import { CandidateFilterBar } from "@/modules/candidate/components/CandidateFilterBar";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { cn } from "cn";

type ListProps = {
  searchParams: Promise<{
    q?: string;
    nationality?: string;
    pool?: string;
    portal?: string;
    page?: string;
  }>;
};

export default async function CandidatesPage({ searchParams }: ListProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const page = Math.max(1, Number(sp.page) || 1);
  const result = await withSessionScope((_scope) =>
    CandidateService.list(tenantId, {
      search: sp.q,
      nationality: sp.nationality,
      portalStatus: sp.portal,
      pool: sp.pool,
      page,
      limit: 25,
    })
  );

  return (
    <>
      <RealtimeRefresher eventTypes={["candidate.status_changed"]} />
      <main className="space-y-6 p-6">
        <PageHeader
          title="Candidates"
          description={`Talent pool · ${result.total} matching`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/candidates/bulk"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
                )}
              >
                Import via AI / CV
              </Link>
              <Link
                href="/candidates/new"
                className={cn(buttonVariants({ variant: "default" }))}
              >
                New candidate
              </Link>
            </div>
          }
        />

        <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-muted" />}>
          <CandidateFilterBar />
        </Suspense>

        <CandidateList
          data={result.items}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          query={{
            q: sp.q,
            nationality: sp.nationality,
            pool: sp.pool,
            portal: sp.portal,
          }}
        />
      </main>
    </>
  );
}
