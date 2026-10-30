"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { differenceInDays, format } from "date-fns";
import { confirmDocumentAction } from "@/modules/document/confirm.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export type ActionDoc = {
  id: string;
  type: string;
  label: string;
  fileName: string;
  expiryDate: Date | string | null;
  confirmed: boolean;
  candidateId: string | null;
  candidate: { id: string; fullName: string } | null;
};

type Props = { initialRows: ActionDoc[] };

export function ActionRequiredTable({ initialRows }: Props) {
  const [pending, startTransition] = useTransition();
  const [rows, removeOptimistic] = useOptimistic(
    initialRows,
    (state, docId: string) => state.filter((d) => d.id !== docId)
  );

  const onVerify = (documentId: string) => {
    startTransition(async () => {
      removeOptimistic(documentId);
      const fd = new FormData();
      fd.set("documentId", documentId);
      await confirmDocumentAction(fd);
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Label / file</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                All documents are valid and verified. Great job!
              </TableCell>
            </TableRow>
          ) : (
            rows.map((doc) => {
              const expiry =
                doc.expiryDate != null ? new Date(doc.expiryDate) : null;
              const daysLeft =
                expiry != null ? differenceInDays(expiry, new Date()) : null;
              const isExpired = daysLeft != null && daysLeft < 0;
              const isExpiring =
                daysLeft != null && daysLeft >= 0 && daysLeft <= 30;

              return (
                <TableRow
                  key={doc.id}
                  className={cn(pending && "opacity-80")}
                >
                  <TableCell className="font-medium">
                    {doc.candidate ? (
                      <Link
                        href={`/candidates/${doc.candidate.id}`}
                        className="text-primary hover:underline"
                      >
                        {doc.candidate.fullName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[14rem]">
                    <p className="truncate text-sm">{doc.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.fileName}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          isExpired && "font-bold text-destructive"
                        )}
                      >
                        {expiry ? format(expiry, "MMM d, yyyy") : "N/A"}
                      </span>
                      {daysLeft != null ? (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isExpired
                              ? "text-destructive"
                              : isExpiring
                                ? "text-orange-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {isExpired
                            ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} ago`
                            : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!doc.confirmed ? (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                        Needs verification
                      </Badge>
                    ) : isExpired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : isExpiring ? (
                      <Badge variant="outline">Expiring soon</Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        Valid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.candidateId ? (
                        <Link
                          href={`/candidates/${doc.candidateId}/documents`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          View
                        </Link>
                      ) : null}
                      {!doc.confirmed ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onVerify(doc.id)}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "bg-emerald-600 text-white hover:bg-emerald-700"
                          )}
                        >
                          Verify
                        </button>
                      ) : isExpired || isExpiring ? (
                        <Link
                          href={
                            doc.candidateId
                              ? `/candidates/${doc.candidateId}/documents`
                              : "/candidates"
                          }
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          Request renewal
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
