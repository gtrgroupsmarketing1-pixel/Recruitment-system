import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { withTenant } from "@/core/db/client";
import { SmsQuotaService } from "@/modules/notification/sms-quota.service";

export default async function SmsAdminPage() {
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const usage = await withTenant(tenantId, () => SmsQuotaService.getUsage(tenantId));

  return (
    <main className="mx-auto grid max-w-xl gap-4 p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">SMS usage</h1>
        <Link href="/settings/calendar" className="text-sm underline">
          Calendar
        </Link>
      </div>
      <p className="text-sm">
        Today ({usage.day}): <strong>{usage.used}</strong> / {usage.limit}
      </p>
      <p className="text-xs text-neutral-500">
        Daily limit is env-configured (SMS_DAILY_LIMIT_PER_TENANT). Per-tenant
        override is Session 27+.
      </p>
    </main>
  );
}
