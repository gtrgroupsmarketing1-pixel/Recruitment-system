import { withSessionScope } from "@/core/auth/action-scope";
import { requirePermission } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadTable } from "@/modules/crm/components/LeadTable";

type Lead = {
  id: string;
  phoneNumber: string;
  profileName: string | null;
  lastMessage: string | null;
  adId: string | null;
  status: string;
  candidateId: string | null;
  createdAt: Date;
};

export default async function CrmPage() {
  let leads: Lead[] = [];
  let loadError: string | null = null;

  try {
    leads = await withSessionScope(async (scope) => {
      requirePermission("candidate:view");
      return db.whatsAppLead.findMany({
        where: { tenantId: scope.tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          phoneNumber: true,
          profileName: true,
          lastMessage: true,
          adId: true,
          status: true,
          candidateId: true,
          createdAt: true,
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Common prod case: migration not applied yet (P2021 table does not exist)
    if (
      message.includes("WhatsAppLead") ||
      message.includes("does not exist") ||
      message.includes("P2021") ||
      message.includes("Unknown arg")
    ) {
      loadError =
        "WhatsApp leads table is not on this database yet. Run the migration 20261108120000_whatsapp_lead (prisma migrate deploy), then reload.";
    } else {
      loadError = message;
    }
    console.error("[crm]", err);
  }

  const newCount = leads.filter((l) => l.status === "NEW").length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="WhatsApp CRM"
        description="Inbox for ad and organic WhatsApp leads — convert to candidates when ready"
      />

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200/60 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedCount}</div>
          </CardContent>
        </Card>
      </div>

      <LeadTable
        leads={leads.map((l) => ({
          id: l.id,
          phoneNumber: l.phoneNumber,
          profileName: l.profileName,
          lastMessage: l.lastMessage,
          adId: l.adId,
          status: l.status,
          candidateId: l.candidateId,
          createdAt: l.createdAt,
        }))}
      />
    </main>
  );
}
