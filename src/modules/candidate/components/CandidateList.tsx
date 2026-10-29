import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { CandidateListItem } from "@/modules/candidate/candidate.service";
import { candidateShortCode } from "@/modules/candidate/candidate-code";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Props = {
  data: CandidateListItem[];
  page: number;
  totalPages: number;
  total: number;
  query: Record<string, string | undefined>;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function poolBadge(status: CandidateListItem["poolStatus"]) {
  if (status === "AVAILABLE") {
    return (
      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
        Available
      </Badge>
    );
  }
  if (status === "DEPLOYED") {
    return <Badge variant="secondary">Deployed</Badge>;
  }
  return <Badge variant="outline">In process</Badge>;
}

function pageHref(query: Props["query"], page: number): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v) p.set(k, v);
  }
  p.set("page", String(page));
  return `/candidates?${p.toString()}`;
}

export function CandidateList({ data, page, totalPages, total, query }: Props) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No candidates found"
        description="Try adjusting filters or add a new candidate."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/candidates/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Add candidate
            </Link>
            <Link
              href="/candidates/bulk"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              AI / bulk import
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {data.length} of {total}
      </p>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Apps</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                      aria-hidden
                    >
                      {initials(c.fullName)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/candidates/${c.id}`}
                        className="font-medium hover:underline"
                      >
                        {c.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {candidateShortCode(c.id)}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {c.nationality?.toUpperCase() || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {poolBadge(c.poolStatus)}
                    {c.latestAppStatus ? (
                      <p className="text-[10px] text-muted-foreground">
                        {c.latestAppStatus}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {c.applicationCount}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {c.portalStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(c.updatedAt, { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 text-sm">
                    <Link
                      href={`/candidates/${c.id}`}
                      className="text-primary hover:underline"
                    >
                      Profile
                    </Link>
                    <Link
                      href={`/candidates/${c.id}/documents`}
                      className="text-muted-foreground hover:underline"
                    >
                      Docs
                    </Link>
                    <Link
                      href={`/requisitions?q=`}
                      className="text-muted-foreground hover:underline"
                      title="Open requisitions to attach"
                    >
                      + Req
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(query, page - 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(query, page + 1)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
