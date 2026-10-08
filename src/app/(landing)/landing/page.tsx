import { authPrisma } from "@/core/db/client";

export default async function LandingPage() {
  const listed = await authPrisma.tenant.findMany({
    where: { isPublicListing: true, deletedAt: null },
    select: { slug: true, displayName: true, name: true, logoUrl: true },
    take: 12,
  });
  const root = process.env.ROOT_DOMAIN || "localhost";
  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-8">
      <h1 className="text-3xl font-semibold">Recruitment & Mobilization OS</h1>
      <p>Recruitment & Mobilization OS for GCC agencies</p>
      <form action="/api/landing/go" method="get" className="flex gap-2">
        <input name="slug" placeholder="Enter your agency slug" className="rounded border px-2 py-1" />
        <button className="rounded bg-neutral-900 px-3 py-1 text-white">Continue</button>
      </form>
      <p className="text-sm text-neutral-500">You will be sent to your-agency.{root}/login</p>
      <ul className="grid grid-cols-3 gap-3">
        {listed.map((tenant) => (
          <li key={tenant.slug}>{tenant.displayName || tenant.name}</li>
        ))}
      </ul>
    </main>
  );
}
