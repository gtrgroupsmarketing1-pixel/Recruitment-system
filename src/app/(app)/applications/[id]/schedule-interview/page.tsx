import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { db } from "@/core/db/client";
import { ScheduleInterviewForm } from "./ScheduleInterviewForm";

type Props = { params: Promise<{ id: string }> };

export default async function ScheduleInterviewPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;

  const app = await withSessionScope((_scope) =>
    db.candidateApplication.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { candidate: true },
    })
  );
  if (!app) return <main className="p-8">Application not found</main>;

  return (
    <main className="mx-auto grid max-w-lg gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Schedule interview</h1>
        <Link href="/settings/calendar" className="text-sm underline">
          Calendar settings
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Candidate: {app.candidate.fullName}
      </p>
      <ScheduleInterviewForm
        applicationId={id}
        defaultName={app.candidate.fullName}
        defaultEmail={app.candidate.email ?? ""}
      />
    </main>
  );
}
