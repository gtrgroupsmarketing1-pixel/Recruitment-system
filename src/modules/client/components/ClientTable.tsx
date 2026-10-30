import Link from "next/link";
import type { ClientCompanyView } from "@/modules/client/client.company.service";
import { deleteClientCompanyAction } from "@/modules/client/client.company.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

type Props = { clients: ClientCompanyView[]; q?: string };

export function ClientTable({ clients, q }: Props) {
  const filtered = q?.trim()
    ? clients.filter((c) => {
        const needle = q.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(needle) ||
          c.code.toLowerCase().includes(needle)
        );
      })
    : clients;

  if (filtered.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
        No clients match this search.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Active reqs</TableHead>
            <TableHead>Portal users</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const open = c.openRequisitions ?? 0;
            const users = c.portalUsers ?? 0;
            return (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/admin/clients/${c.id}/users`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.code}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {c.country ? (
                    <Badge variant="outline">{c.country}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={open > 0 ? "default" : "secondary"}>
                    {open} open
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm tabular-nums",
                      users === 0 && "font-medium text-orange-600"
                    )}
                  >
                    {users === 0 ? "0 users — set up portal" : `${users} users`}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2 text-sm">
                    <Link
                      href={`/admin/clients/${c.id}/users`}
                      className="text-primary hover:underline"
                    >
                      Users
                    </Link>
                    <Link
                      href={`/requisitions/new?clientCompanyId=${c.id}`}
                      className="text-muted-foreground hover:underline"
                    >
                      + Req
                    </Link>
                    <form action={deleteClientCompanyAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
