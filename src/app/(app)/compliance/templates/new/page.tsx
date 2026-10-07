import { createTemplateAction } from "@/modules/compliance/template.action";

export default function NewTemplatePage() {
  return (
    <main className="mx-auto max-w-xl p-4 sm:p-8">
      <h1 className="mb-4 text-xl font-semibold">New compliance template</h1>
      <form action={createTemplateAction} className="grid gap-3 text-sm">
        <input name="name" required placeholder="Name" className="rounded border px-2 py-1" />
        <input name="originCountry" required maxLength={2} placeholder="Origin ISO" className="rounded border px-2 py-1" />
        <input name="destinationCountry" required maxLength={2} placeholder="Destination ISO" className="rounded border px-2 py-1" />
        <input name="roleCategory" required placeholder="BLUE_COLLAR" className="rounded border px-2 py-1" />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Create
        </button>
      </form>
    </main>
  );
}
