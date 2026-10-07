import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { listConnectors } from "@/core/connectors/registry";
import { connectorIdToKind } from "@/core/connectors/kind";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";

export default async function ConnectorsAdminPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const configs = await withTenant(tenantId, () => ConnectorConfigService.list(tenantId));
  const byKind = new Map(configs.map((c) => [c.connectorId, c]));

  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Government connectors</h1>
        <Link href="/admin/integrations" className="text-sm underline">
          Integrations
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Poll-only status checks. Approvals never auto-complete checklist steps.
      </p>
      <ul className="divide-y rounded border text-sm">
        {listConnectors().map((c) => {
          const kind = connectorIdToKind(c.id);
          const cfg = kind ? byKind.get(kind) : undefined;
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{c.displayName}</p>
                <p className="text-neutral-500">
                  {cfg?.isEnabled
                    ? `Enabled · poll ${cfg.pollingIntervalMinutes}m`
                    : "Not configured"}
                  {cfg?.lastPolledAt
                    ? ` · last ${cfg.lastPolledAt.toISOString().slice(0, 16)}`
                    : ""}
                </p>
              </div>
              <Link className="underline" href={`/admin/connectors/${c.id}`}>
                Configure
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
