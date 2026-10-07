import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { getConnector } from "@/core/connectors/registry";
import { connectorIdToKind } from "@/core/connectors/kind";
import { ConnectorConfigService } from "@/modules/connector/connector.config.service";
import { disableConnectorAction, saveConnectorConfigAction } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function ConnectorConfigPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const connector = getConnector(id);
  if (!connector) return <main className="p-8">Unknown connector</main>;
  const kind = connectorIdToKind(id);
  if (!kind) return <main className="p-8">Unknown connector</main>;

  const cfg = await withTenant(tenantId, () => ConnectorConfigService.get(tenantId, kind));

  return (
    <main className="mx-auto grid max-w-xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{connector.displayName}</h1>
        <Link href="/admin/connectors" className="text-sm underline">
          All connectors
        </Link>
      </div>
      {sp.saved === "1" ? <p className="text-sm text-green-700">Saved.</p> : null}
      {cfg?.lastError ? (
        <p className="text-sm text-red-700">Last error: {cfg.lastError}</p>
      ) : null}
      <form action={saveConnectorConfigAction} className="grid gap-3 text-sm">
        <input type="hidden" name="connectorId" value={id} />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isEnabled" defaultChecked={cfg?.isEnabled ?? false} />
          Enabled
        </label>
        <label className="grid gap-1">
          Username
          <input
            name="username"
            autoComplete="off"
            className="rounded border px-2 py-1"
            placeholder={cfg?.hasCredentials ? "(unchanged)" : ""}
          />
        </label>
        <label className="grid gap-1">
          Password
          <input
            name="password"
            type="password"
            autoComplete="off"
            className="rounded border px-2 py-1"
            placeholder={cfg?.hasCredentials ? "(unchanged)" : ""}
          />
        </label>
        <p className="text-xs text-neutral-500">
          Leave username/password blank to keep existing credentials.
          {cfg?.hasCredentials ? " Credentials are stored." : " No credentials stored yet."}
        </p>
        <label className="grid gap-1">
          Polling interval (minutes)
          <input
            name="pollingIntervalMinutes"
            type="number"
            min={15}
            defaultValue={cfg?.pollingIntervalMinutes ?? 60}
            className="rounded border px-2 py-1"
          />
        </label>
        <label className="grid gap-1">
          Inter-request delay (ms)
          <input
            name="interRequestDelayMs"
            type="number"
            min={0}
            defaultValue={cfg?.interRequestDelayMs ?? 3000}
            className="rounded border px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Save
        </button>
      </form>
      {cfg?.isEnabled ? (
        <form action={disableConnectorAction}>
          <input type="hidden" name="connectorId" value={id} />
          <button type="submit" className="rounded border px-3 py-1 text-sm">
            Disable
          </button>
        </form>
      ) : null}
    </main>
  );
}
