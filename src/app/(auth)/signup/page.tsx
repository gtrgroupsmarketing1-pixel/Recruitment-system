import { redirect } from "next/navigation";
import { TenantService } from "@/modules/tenant/tenant.service";
import { ValidationError } from "@/lib/errors";
import { signIn } from "@/core/auth/auth.config";

async function signupAction(formData: FormData) {
  "use server";
  const input = {
    tenantName: String(formData.get("tenantName") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    adminEmail: String(formData.get("adminEmail") ?? ""),
    adminName: String(formData.get("adminName") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  try {
    await TenantService.signup(input);
  } catch (error) {
    const message = error instanceof ValidationError ? error.message : "Signup failed";
    redirect(`/signup?error=${encodeURIComponent(message)}`);
  }
  await signIn("credentials", {
    email: input.adminEmail,
    password: input.password,
    redirectTo: "/",
  });
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Create agency</h1>
      {params.error ? <p className="mt-2 text-red-600">{params.error}</p> : null}
      <form action={signupAction} className="mt-4 flex flex-col gap-3">
        <input name="tenantName" placeholder="Agency name" required className="border p-2" />
        <input name="slug" placeholder="slug" required className="border p-2" />
        <input name="adminName" placeholder="Your name" required className="border p-2" />
        <input name="adminEmail" type="email" placeholder="Email" required className="border p-2" />
        <input name="password" type="password" placeholder="Password" required className="border p-2" />
        <button type="submit" className="border p-2">Sign up</button>
      </form>
    </main>
  );
}
