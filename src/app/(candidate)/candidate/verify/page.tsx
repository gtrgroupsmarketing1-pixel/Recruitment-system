export default function CandidateVerifyPage() {
  return (
    <main className="mx-auto grid max-w-md gap-3 p-6">
      <h1 className="text-xl font-semibold">Enter code</h1>
      <form action="/api/candidate-auth/verify-code" method="post" className="grid gap-2">
        <input name="candidateId" className="rounded border px-2 py-1" />
        <input name="code" className="rounded border px-2 py-1" />
        <button className="rounded bg-neutral-900 px-3 py-2 text-white">Verify</button>
      </form>
    </main>
  );
}
