import { submitJobOrderAction } from "@/modules/client/joborder.action";

export default function NewJobOrderPage() {
  return (
    <form action={submitJobOrderAction} className="grid max-w-md gap-2">
      <h1 className="text-xl font-semibold">Submit job order</h1>
      <input name="roleTitle" required placeholder="Role title" className="rounded border px-2 py-1" />
      <input name="roleCategory" required placeholder="Role code (e.g. DRV)" className="rounded border px-2 py-1" />
      <input name="country" required placeholder="AE" className="rounded border px-2 py-1" />
      <input name="vacancyCount" type="number" min={1} required defaultValue={1} className="rounded border px-2 py-1" />
      <textarea name="description" placeholder="Description" className="rounded border px-2 py-1" />
      <button className="rounded bg-black px-3 py-2 text-white">Submit</button>
    </form>
  );
}
