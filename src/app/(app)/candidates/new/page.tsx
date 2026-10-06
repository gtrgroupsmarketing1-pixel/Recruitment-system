import { CandidateForm } from "@/modules/candidate/components/CandidateForm";

type NewProps = {
  searchParams: Promise<{ requisitionId?: string }>;
};

export default async function NewCandidatePage({ searchParams }: NewProps) {
  const sp = await searchParams;
  return (
    <main className="p-8">
      <h1 className="mb-4 text-xl font-semibold">New candidate</h1>
      <CandidateForm requisitionId={sp.requisitionId} />
    </main>
  );
}
