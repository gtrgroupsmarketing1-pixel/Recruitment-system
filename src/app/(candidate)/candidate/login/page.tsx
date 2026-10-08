export default function CandidateLoginPage() {
  return (
    <main className="mx-auto grid max-w-md gap-3 p-6">
      <h1 className="text-xl font-semibold">Candidate portal</h1>
      <form action="/api/candidate-auth/request" method="post" className="grid gap-2">
        <input name="tenantId" placeholder="Tenant" className="rounded border px-2 py-1" />
        <input name="identifier" placeholder="Email or phone" required className="rounded border px-2 py-1" />
        <button className="rounded bg-neutral-900 px-3 py-2 text-white">Send link</button>
      </form>
    </main>
  );
}
