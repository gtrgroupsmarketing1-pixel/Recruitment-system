import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ClientPortalService } from "@/modules/client/client.portal.service";
import { submitDecisionAction } from "@/modules/client/review.action";

export default async function ClientRequisitionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId!;
  const [req, shortlist] = await withSessionScope(async () => {
    const r = await ClientPortalService.getRequisition(tenantId, id);
    const s = await ClientPortalService.listShortlist(tenantId, id);
    return [r, s] as const;
  });
  return (
    <main className="grid gap-4">
      <h1 className="text-xl font-semibold">{req.reqCode}</h1>
      <p>{req.roleCategory} · {req.country} · target {req.vacancyTarget} · {req.status}</p>
      <h2 className="font-medium">Shortlist</h2>
      <ul className="grid gap-2">
        {shortlist.map((c) => (
          <li key={c.applicationId} className="rounded border bg-white p-3">
            <div>{c.displayName} · {c.currentStatus}</div>
            <form action={submitDecisionAction} className="mt-2 flex gap-2">
              <input type="hidden" name="applicationId" value={c.applicationId} />
              <input name="comment" placeholder="Comment" className="rounded border px-2" />
              <button name="decision" value="APPROVED" className="text-sm underline">Approve</button>
              <button name="decision" value="REJECTED" className="text-sm underline">Reject</button>
              <button name="decision" value="SHORTLISTED" className="text-sm underline">Shortlist</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
