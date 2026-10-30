import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientCompanyService } from "@/modules/client/client.company.service";
import { ClientTable } from "@/modules/client/components/ClientTable";
import { NewClientDialog } from "@/modules/client/components/NewClientDialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ q?: string; error?: string }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) {
    return (
      <main className="space-y-6 p-6">
        <PageHeader title="Clients" />
        <p className="text-sm text-muted-foreground">Missing tenant</p>
      </main>
    );
  }

  const clients = await withSessionScope((_scope) =>
    ClientCompanyService.list(tenantId)
  );

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="Clients"
        description="Demand, portal adoption, and company access"
        actions={<NewClientDialog />}
      />

      {sp.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {sp.error}
        </p>
      ) : null}

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Create a client company before opening requisitions or inviting portal users."
          action={<NewClientDialog />}
        />
      ) : (
        <>
          <form
            method="get"
            className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center"
          >
            <Input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search name or code…"
              className="sm:max-w-sm"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
          <ClientTable clients={clients} q={sp.q} />
        </>
      )}
    </main>
  );
}
