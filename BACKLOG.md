# Backlog (out of current session scope)

Ideas captured during sessions. Do not implement until a future planned session.

- [ ] Full multi-language i18n (Arabic, Hindi, Tagalog, Urdu, Nepali)
- [ ] Native mobile app (React Native / Flutter)
- [ ] Kafka instead of Postgres LISTEN/NOTIFY (only if measured need)
- [ ] OpenSearch for candidate search at 100k+ scale
- [ ] AI-assisted resume screening / skill-test scoring
- [ ] E-signature (DocuSign / Adobe Sign)
- [ ] Finance / billing / invoicing module
- [ ] Replacement / attrition loop automation (V3)
- [ ] Government portal connectors beyond stubs (Wafid, MOHRE, etc.)
- [ ] Offline-first mobile capture for field recruiters
- [ ] Candidate self-service chatbot flows on WhatsApp
- [ ] Schema-per-tenant / DB-per-tenant Enterprise tier
- [ ] Session 00: DATABASE_URL not set — `prisma migrate dev` skipped. Run when Postgres is available.
- [ ] Session 00 written, unverified. npm install stalled three times (exit -1 / signal 9, no lockfile). Registry curls returned HTTP/2 200; free showed ~1.8Gi available; no proxy. Pass B still required: pnpm install --ignore-scripts && prisma generate && typecheck && lint && test && build.
- [ ] Session 02 written, unverified. One pnpm attempt never reached `pnpm install`: `corepack enable && corepack prepare pnpm@9` produced no output for 10+ minutes. No second attempt. Green suite not run. next-auth and @auth/prisma-adapter added to package.json because Auth.js was not already a dependency.
- [ ] Session 02b JWT fix written, unverified, tests pending. `timeout 600 npx --yes pnpm@9 install --ignore-scripts` exited 124 after resolving 625 packages and adding 20/505. No retry. Green suite not run.
- [ ] Session 03 written, unverified. node_modules unavailable; DATABASE_URL unset so migrate skipped. Application service tests are pure (mocked repo) and should run once vitest is installed.
- [ ] Session 04 written, unverified. Crypto tests pure; middleware tests use in-memory query stubs. nested-write encryption deferred.
- [ ] Session 04 deferral: nested-write encryption.
- [ ] Session 05: prove passportNumber filter hits passportNumberBidx in real SQL under withTenant.
- [ ] Middleware ALS may not cross into RSC. Header `x-tenant-id` is set as the fallback. Confirm `experimental.nodeMiddleware` on this Next version when install works.
- [x] Session 05 verified at DB layer via psql (scripts/verify-isolation.sh); ORM-layer verification pending Prisma install.
- [ ] Session 06 written, unverified. Event bus unit tests need vitest + Prisma client. DomainEvent.dispatchedAt migration applied via psql.
- [ ] Session 07 written. Logger + audit subscriber. verify-outbox.sh written; not run — this sandbox has no psql and apt cannot write package cache (permission denied). Vitest unverified.

- [ ] Session 08 written, unverified. Req ID / SLA / fulfillment are pure. Migration not applied (no psql).

## HARD CHECKPOINT — Before Session 12
- [ ] node_modules working (pnpm, npm, or bun)
- [ ] pnpm typecheck passes on Sessions 00–11
- [ ] At least one DB integration test runs green (event bus rollback preferred)
- [ ] Session 05 psql gate re-run on current schema

- [ ] Sessions 09–11 written unverified; recovery session before Session 12.
- [ ] Session 09: pages import withTenant from @/core/db/client (not on allowlist) so Session 05 proxy does not throw. Audit list matches entityId to requisition id; status events store applicationId, so the panel stays empty until a join exists.
- [ ] Sessions 09–10 written unverified; recovery before Session 12. Audit join now uses application ids.

## HARD CHECKPOINT — Before Session 12 (mandatory recovery)
- [ ] node_modules working (pnpm, npm, or bun)
- [ ] pnpm typecheck / npx tsc --noEmit passes on Sessions 00–11
- [ ] At least state machine, SLA, format, and pipeline-order tests green under vitest
- [ ] Session 05 psql gate re-run on current schema
- [ ] Confirm withTenant opens $transaction on the EXTENDED client
      (the one with encryption middleware), not on basePrisma/authPrisma.
      Verify by: create a candidate with passportNumber "AB123456" via
      a service inside withTenant, then query the raw column via psql
      as app_auth. If it reads "AB123456" (plaintext), encryption is
      bypassed. If it reads base64, encryption works.
      Code review note (Session 11): client.ts withTenant → runInTenantTx →
      appExtended.$transaction — looks correct; must still prove at runtime.
- [ ] Sessions 09–11 written unverified; recovery session mandatory before Session 12

## Recovery attempt — 2026-10-06 (this sandbox)

Environment: Grok sandbox (1.2Gi RAM, no swap, no psql, registry HTTP/2 200).
Result: **NOT GREEN. Recovery incomplete.**

Attempts:
- npm install full → exit 137 (OOM) or hang mid-write
- bun install → registry proxy 502 on many tarballs; hang
- staged npm (typescript/prisma/vitest/zod) → hang at ~3–4 min, empty log, no .bin
- Partial node_modules (~397 package dirs) without package-lock or .bin — unusable

Blocked signals (all four still red):
- [ ] npx tsc --noEmit
- [ ] npx vitest run
- [ ] verify-isolation.sh
- [ ] encryption-in-transaction check

Note: listUnlinkedForRequisition remains in candidate.repo (unwired). Correct for future bulk-link; not dead code.
withTenant → appExtended.$transaction is code-correct; runtime encryption proof still required outside this sandbox.

**Action required:** run recovery on laptop / Codespaces / GitHub Actions. Do not start Session 12 until the four greens exist.


## Pre-production
- [ ] Generate baseline migration (`prisma migrate diff --from-empty`) and append RLS SQL
- [ ] Switch CI from `db push` to `migrate deploy` before any tenant goes live

## Deferred: JobRequisition → ClientCompany relation
clientCompanyId is a column but not a @relation. Works via second query.
Add the backref when a session needs Prisma-level include or cascade.

## Notification volume control
Every status change fires a notification. Real tenants will want per-tenant
opt-out or status allowlist. Add in Session 23 or 24 when admin UI exists.

## Notification body sensitivity
Notification.body is considered sensitive (may contain candidate names, IDs).
Accessible via tenant-scoped admin UI; never logged or exported bulk.
