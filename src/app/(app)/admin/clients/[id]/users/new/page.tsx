import { requireSession } from "@/core/auth/session";
import { authPrisma } from "@/core/db/client";
import { notFound } from "next/navigation";
import { createClientUserAction } from "@/modules/client/client.user.actions";

type Props = { params: Promise<{ id: string }> };

export default async function NewClientUserPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) throw new Error("Missing tenant");
  const company = await authPrisma.clientCompany.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!company) notFound();
  return (
    <main className="mx-auto grid max-w-md gap-4 p-6">
      <h1 className="text-xl font-semibold">Add user for {company.name}</h1>
      <p className="text-sm text-neutral-600">
        Provide the password to the client user out-of-band. Invite emails are Session 27+.
      </p>
      <form action={createClientUserAction} className="grid gap-3">
        <input type="hidden" name="clientCompanyId" value={id} />
        <label className="grid gap-1 text-sm">
          Name
          <input name="name" required className="rounded border px-2 py-1" />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input name="email" type="email" required className="rounded border px-2 py-1" />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input name="password" type="password" required minLength={12} className="rounded border px-2 py-1" />
        </label>
        <label className="grid gap-1 text-sm">
          Confirm password
          <input name="confirmPassword" type="password" required minLength={12} className="rounded border px-2 py-1" />
        </label>
        <button className="rounded bg-neutral-900 px-3 py-2 text-white">Create user</button>
      </form>
    </main>
  );
}
