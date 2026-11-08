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

export default async function CrmPage() {
  const leads = await withSessionScope(async (scope) => {
    requirePermission("candidate:view");
    return db.whatsAppLead.findMany({
      where: { tenantId: scope.tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  });

  const newCount = leads.filter((l) => l.status === "NEW").length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;

  return (
    <main className="space-y-6 p-6">
      <PageHeader
        title="WhatsApp CRM"
        description="Inbox for ad and organic WhatsApp leads — convert to candidates when ready"
      />

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
