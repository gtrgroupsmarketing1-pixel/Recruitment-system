import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { listTemplateKeys } from "@/core/notifications/templates";
import { PreviewForm } from "./PreviewForm";

export default async function PreviewPage() {
  await requireSession();
  const keys = listTemplateKeys();
  const sample = JSON.stringify(
    {
      candidateName: "Ravi Kumar",
      status: "SELECTED",
      requisitionCode: "ACME-UAE-BLU-202610-001",
      documentLabel: "Passport",
      expiresOn: "2026-12-01",
      daysRemaining: 30,
      taskTitle: "Follow up medical",
      dueDate: "2026-10-01",
      refType: "CandidateApplication",
      refId: "app_1",
    },
    null,
    2
  );

  return (
    <main className="mx-auto grid max-w-3xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Email preview</h1>
        <Link href="/admin/notifications" className="text-sm underline">
          Delivery log
        </Link>
      </div>
      <p className="text-sm text-gray-600">
        Preview never sends and never writes a Notification row.
      </p>
      <PreviewForm keys={keys} sample={sample} />
    </main>
  );
}
