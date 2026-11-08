"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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
import { ConvertLeadDialog } from "@/modules/crm/components/ConvertLeadDialog";
import { markLeadContactedAction } from "@/modules/crm/crm.actions";
import { cn } from "cn";

export type LeadRow = {
  id: string;
  phoneNumber: string;
  profileName: string | null;
  lastMessage: string | null;
  adId: string | null;
  status: string;
  candidateId: string | null;
  createdAt: string | Date;
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-dashed bg-muted/30 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No WhatsApp leads yet. When candidates message your ads, they appear
          here before becoming full candidate profiles.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Last message</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">
                  {lead.profileName || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lead.phoneNumber}
                </div>
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                {lead.lastMessage || "—"}
              </TableCell>
              <TableCell>
                {lead.adId ? (
                  <Badge variant="outline">Meta ad</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Organic</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(lead.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    lead.status === "NEW"
                      ? "default"
                      : lead.status === "CONVERTED"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                {lead.status === "CONVERTED" && lead.candidateId ? (
                  <Link
                    href={`/candidates/${lead.candidateId}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" })
                    )}
                  >
                    View profile
                  </Link>
                ) : (
                  <>
                    {lead.status === "NEW" ? (
                      <form
                        action={async () => {
                          await markLeadContactedAction(lead.id);
                        }}
                        className="inline"
                      >
                        <Button type="submit" size="sm" variant="ghost">
                          Mark contacted
                        </Button>
                      </form>
                    ) : null}
                    <ConvertLeadDialog lead={lead} />
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
