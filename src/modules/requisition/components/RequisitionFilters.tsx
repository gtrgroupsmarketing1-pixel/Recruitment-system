import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientOption = { id: string; name: string };

type Props = {
  current: { status?: string; client?: string; q?: string };
  clients: ClientOption[];
};

export function RequisitionFilters({ current, clients }: Props) {
  return (
    <form
      method="get"
      action="/requisitions"
      className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <select
        name="status"
        defaultValue={current.status ?? ""}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="FILLED">FILLED</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="ON_HOLD">ON_HOLD</option>
      </select>
      <select
        name="client"
        defaultValue={current.client ?? ""}
        className="h-8 min-w-[12rem] rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Input
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search code, notes…"
        className="sm:max-w-xs"
      />
      <Button type="submit" size="sm">
        Apply filters
      </Button>
      {(current.status || current.q || current.client) && (
        <a href="/requisitions" className="text-sm text-muted-foreground hover:underline">
          Clear
        </a>
      )}
    </form>
  );
}
