import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientCompanyService } from "@/modules/client-company/client-company.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ClientsPage() {
  const session = await requireSession();
  const clients = await withSessionScope(async (scope) => {
    return ClientCompanyService.list(scope.tenantId);
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button nativeButton={false} render={<Link href="/admin/clients/new" />}>
          New client
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {clients.map((c) => (
          <Card key={c.id} className="p-4 space-y-2">
            <h2 className="font-semibold">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{c.code}</p>
            {c.country && <p className="text-sm">{c.country}</p>}
          </Card>
        ))}
        {clients.length === 0 && (
          <p className="text-sm text-muted-foreground">No clients found.</p>
        )}
      </div>
    </div>
  );
}