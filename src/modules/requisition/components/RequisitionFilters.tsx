type Props = {
  current: { status?: string; client?: string; q?: string };
};

/** Desktop filters. URL state via GET. No client hooks. */
export function RequisitionFilters({ current }: Props) {
  return (
    <form method="get" action="/requisitions" className="flex flex-wrap gap-2">
      <select name="status" defaultValue={current.status ?? ""} className="rounded border px-2 py-1">
        <option value="">All statuses</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="FILLED">FILLED</option>
        <option value="CANCELLED">CANCELLED</option>
        <option value="ON_HOLD">ON_HOLD</option>
      </select>
      <input
        name="client"
        defaultValue={current.client ?? ""}
        placeholder="Client id"
        className="rounded border px-2 py-1"
      />
      <input
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search"
        className="rounded border px-2 py-1"
      />
      <button type="submit" className="rounded bg-black px-3 py-1 text-white">
        Filter
      </button>
    </form>
  );
}
