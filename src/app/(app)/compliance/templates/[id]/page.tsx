import { requireSession } from "@/core/auth/session";
import { withSessionScope } from "@/core/auth/action-scope";
import { ComplianceTemplateService } from "@/modules/compliance/compliance.template.service";

type Props = { params: Promise<{ id: string }> };

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();
  const tenantId = session.user.tenantId || session.tenantId;
  if (!tenantId) return <main className="p-8">Missing tenant</main>;
  const template = await withSessionScope((_scope) =>
    ComplianceTemplateService.getTemplate(tenantId, id)
  );
  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-xl font-semibold">{template.name}</h1>
      <p className="text-sm text-neutral-500">
        {template.originCountry} → {template.destinationCountry} · {template.roleCategory}
      </p>
      <ol className="mt-4 grid gap-2">
        {template.steps.map((step) => (
          <li key={step.id} className="rounded border p-3 text-sm">
            {step.stepOrder}. {step.name}
            <span className="ml-2 text-xs text-neutral-500">
              {step.responsibleParty} · SLA {step.slaDays}d
            </span>
          </li>
        ))}
      </ol>
    </main>
  );
}
