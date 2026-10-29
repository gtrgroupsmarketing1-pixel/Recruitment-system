import { NextResponse } from "next/server";
import { authorizeCredentials } from "@/core/auth/credentials";
import { authPrisma } from "@/core/db/client";
import { signMobileToken } from "@/core/mobile-auth/jwt";
import { checkRateLimit, RATE_LIMITS } from "@/core/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      tenantSlug?: string;
    };
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || req.headers.get("x-real-ip") || "unknown";

    try {
      const limit = await checkRateLimit(
        {
          key: "auth:login",
          max: RATE_LIMITS["auth:login"].max,
          windowSeconds: RATE_LIMITS["auth:login"].windowSeconds,
        },
        `${ip}:mobile:${email}`
      );
      if (!limit.allowed) {
        return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
      }
    } catch {
      // fail open
    }

    let tenantId = "";
    const slug =
      body.tenantSlug?.trim() ||
      process.env.DEV_TENANT_SLUG ||
      "demo";
    const tenant = await authPrisma.tenant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    tenantId = tenant?.id ?? "";
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const user = await authorizeCredentials(email, password, tenantId, ip);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signMobileToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role as never,
      branchId: user.branchId,
      clientCompanyId: user.clientCompanyId,
      email: user.email,
      name: user.name ?? undefined,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[mobile-auth]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
