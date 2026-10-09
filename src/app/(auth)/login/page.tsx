import { signIn } from "@/core/auth/auth.config";
import { headers } from "next/headers";

async function loginAction(formData: FormData) {
  "use server";
  const h = await headers();
  const tenantId = h.get("x-tenant-id") || "tnt_demo";
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    tenantId,
    redirectTo: "/",
  });
}

async function googleAction() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Sign in</h1>
      {params.error ? <p className="mt-2 text-red-600">Invalid credentials</p> : null}
      <form action={loginAction} className="mt-4 flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required className="border p-2" />
        <input name="password" type="password" placeholder="Password" required className="border p-2" />
        <button type="submit" className="border p-2">Sign in</button>
      </form>
      {googleEnabled ? (
        <form action={googleAction} className="mt-3">
          <button type="submit" className="border p-2">Continue with Google</button>
        </form>
      ) : null}
    </main>
  );
}