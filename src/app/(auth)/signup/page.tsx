import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { TenantService } from "@/modules/tenant/tenant.service";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { signIn } from "@/core/auth/auth.config";
import { RATE_LIMITS, checkRateLimit } from "@/core/security/rate-limit";
import { extractIp } from "@/core/security/ip";

async function signupAction(formData: FormData) {
  "use server";
  const h = await headers();
  const ip = extractIp({ headers: h });
  const limit = await checkRateLimit(
    {
      key: "auth:signup",
      max: RATE_LIMITS["auth:signup"].max,
      windowSeconds: RATE_LIMITS["auth:signup"].windowSeconds,
    },
    ip
  );
  if (!limit.allowed) {
    redirect(`/signup?error=${encodeURIComponent("Too many signup attempts")}`);
  }
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
    if (error instanceof RateLimitError) {
      redirect(`/signup?error=${encodeURIComponent("Too many signup attempts")}`);
    }
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
