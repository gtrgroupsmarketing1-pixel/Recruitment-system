import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { CandidateList } from "@/modules/candidate/components/CandidateList";
import { CandidateService } from "@/modules/candidate/candidate.service";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { RealtimeRefresher } from "@/components/realtime/RealtimeRefresher";
import { cn } from "cn";

type ListProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CandidatesPage({ searchParams }: ListProps) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const data = await withSessionScope((_scope) =>
    CandidateService.list(tenantId, { search: sp.q })
  );

  return (
    <>
      <RealtimeRefresher eventTypes={["candidate.status_changed"]} />
      <main className="space-y-6 p-6">
        <PageHeader
          title="Candidates"
          description={`${data.length} in this view · search by name or phone`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/candidates/bulk"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Bulk import
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

        <form
          method="get"
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
        >
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search name or phone…"
            className="sm:max-w-sm"
            aria-label="Search candidates"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
          {sp.q ? (
            <Link
              href="/candidates"
              className="text-sm text-muted-foreground hover:underline"
            >
              Clear
            </Link>
          ) : null}
        </form>

        <CandidateList data={data} />
      </main>
    </>
  );
}
