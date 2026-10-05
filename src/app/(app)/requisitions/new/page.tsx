import { CreateRequisitionForm } from "@/modules/requisition/components/CreateRequisitionForm";

type NewProps = {
  searchParams: Promise<{ client?: string }>;
};

export default async function NewRequisitionPage({ searchParams }: NewProps) {
  const sp = await searchParams;
  return (
    <main className="p-8">
      <h1 className="mb-4 text-xl font-semibold">New requisition</h1>
      <CreateRequisitionForm clientCompanyId={sp.client} />
    </main>
  );
}
