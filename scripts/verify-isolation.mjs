/**
 * Minimal isolation gate without vitest.
 * Requires: @prisma/client generated, DATABASE_URL + AUTH_DATABASE_URL set,
 * RLS migration applied, app_auth / app_tenant roles.
 */
import { PrismaClient } from "@prisma/client";

const authUrl = process.env.AUTH_DATABASE_URL;
const appUrl = process.env.DATABASE_URL;
if (!authUrl || !appUrl) {
  console.error("FAIL: DATABASE_URL and AUTH_DATABASE_URL required");
  process.exit(1);
}

const authDb = new PrismaClient({
  datasources: { db: { url: authUrl } },
});
const appDb = new PrismaClient({
  datasources: { db: { url: appUrl } },
});

async function withTenant(tenantId, fn) {
  return appDb.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

async function main() {
  // 1. RLS: no tenant context returns zero rows
  const noCtx = await appDb.user.findMany();
  if (noCtx.length !== 0) {
    throw new Error(`RLS FAIL: no-context saw ${noCtx.length} rows`);
  }
  console.log("PASS: RLS blocks unscoped queries");

  // 2. Cross-tenant: tenant A cannot see tenant B's data
  const tenantA = await authDb.tenant.create({
    data: { name: "A", slug: `a-${Date.now()}` },
  });
  const tenantB = await authDb.tenant.create({
    data: { name: "B", slug: `b-${Date.now()}` },
  });
  await authDb.user.create({
    data: {
      tenantId: tenantB.id,
      email: `b-${Date.now()}@x.com`,
      name: "B",
      role: "RECRUITER",
    },
  });
  const seenByA = await withTenant(tenantA.id, (tx) => tx.user.findMany());
  if (seenByA.length !== 0) {
    throw new Error(`ISOLATION FAIL: A saw ${seenByA.length} of B's users`);
  }
  console.log("PASS: cross-tenant isolation");

  // 3. Positive control: tenant B sees its own
  const seenByB = await withTenant(tenantB.id, (tx) => tx.user.findMany());
  if (seenByB.length !== 1) {
    throw new Error(`POSITIVE FAIL: B saw ${seenByB.length}, expected 1`);
  }
  console.log("PASS: tenant sees own data");

  console.log("ALL ISOLATION CHECKS PASSED");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await authDb.$disconnect();
    await appDb.$disconnect();
  });
