import { CandidateForm } from "@/modules/candidate/components/CandidateForm";

export default async function NewCandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New candidate</h1>
      
      {params.error && (
        <div className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
          <strong>Error:</strong> {params.error}
        </div>
      )}

      <CandidateForm />
    </div>
  );
}