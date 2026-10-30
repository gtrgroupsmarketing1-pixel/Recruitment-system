"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { convertJobOrderAction, rejectJobOrderAction } from "@/modules/client/joborder.convert.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export type JobOrderRow = {
  id: string;
  roleTitle: string;
  roleCategory: string;
  country: string;
  vacancyCount: number;
  status: string;
  description: string | null;
  createdAt: string;
  requisitionId: string | null;
  clientName: string;
  clientCode: string;
};

type Props = { orders: JobOrderRow[]; tab: "PENDING" | "CONVERTED" | "REJECTED" };

export function JobOrderInbox({ orders, tab }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleConvert = (id: string) => {
    startTransition(async () => {
      const res = await convertJobOrderAction(id);
      if (res.success && res.requisitionId) {
        router.push(`/requisitions/${res.requisitionId}`);
        return;
      }
      alert(res.error ?? "Convert failed");
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const res = await rejectJobOrderAction(id);
      if (!res.success) {
        alert(res.error ?? "Reject failed");
        return;
      }
      router.refresh();
    });
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center">
        <p className="font-medium">
          {tab === "PENDING"
            ? "No pending job orders"
            : tab === "CONVERTED"
              ? "No converted orders yet"
              : "No rejected orders"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Client portal submissions appear here for triage.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", pending && "opacity-80")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Request</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <div className="font-medium">{o.clientName}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {o.clientCode}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{o.roleTitle}</div>
                <div className="text-xs text-muted-foreground">
                  Qty {o.vacancyCount} · {o.roleCategory}
                </div>
                {o.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {o.description}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{o.country}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    o.status === "PENDING"
                      ? "secondary"
                      : o.status === "CONVERTED"
                        ? "default"
                        : "destructive"
                  }
                >
                  {o.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {o.status === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => handleConvert(o.id)}
                      >
                        Convert to requisition
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleReject(o.id)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {o.status === "CONVERTED" && o.requisitionId ? (
                    <Link
                      href={`/requisitions/${o.requisitionId}`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    >
                      Open requisition
                    </Link>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
