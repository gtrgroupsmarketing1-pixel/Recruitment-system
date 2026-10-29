import Link from "next/link";
import type { CandidateListItem } from "@/modules/candidate/candidate.service";
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
import { candidateShortCode } from "@/modules/candidate/candidate-code";

type Props = { data: CandidateListItem[] };


export function CandidateList({ data }: Props) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No candidates"
        description="Add a candidate or bulk-import from CVs / spreadsheets."
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
              Bulk import
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Apps</TableHead>
            <TableHead>Portal</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {candidateShortCode(c.id)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/candidates/${c.id}`}
                  className="font-medium hover:underline"
                >
                  {c.fullName}
                </Link>
                {c.nationality ? (
                  <p className="text-xs text-muted-foreground">{c.nationality}</p>
                ) : null}
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {c.phone ?? "—"}
              </TableCell>
              <TableCell className="max-w-[10rem] truncate text-sm">
                {c.email ?? "—"}
              </TableCell>
              <TableCell className="tabular-nums text-sm">
                {c.applicationCount}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-normal">
                  {c.portalStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {c.createdAt.toISOString().slice(0, 10)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/candidates/${c.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/candidates/${c.id}/documents`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Docs
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
