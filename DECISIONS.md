# Decisions

- next-auth and @auth/prisma-adapter were added in Session 02. They were not in the Session 00 dependency list. Auth.js v5 requires both.
- experimental.nodeMiddleware is set so middleware can run on the Node runtime for AsyncLocalStorage. If this Next minor drops it, tenant propagation falls back to the x-tenant-id header, and each RSC/action wraps itself in runWithTenant.
- Google OIDC is registered only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
- SHORTLISTED cannot skip to SELECTED. Corridor shortcuts belong in a later compliance-template config, not the state machine.
- If `npx pnpm@9` fails with E502 on the tarball, try `npm install -g pnpm@9` (different path) then `pnpm install`. Do not loop retries in a session.
- Encryption uses AES-256-GCM + HMAC-SHA256 blind indexes only. Nested-write encryption deferred (Session 04).
- RLS is enabled on all tenant-scoped tables. Account, Session, VerificationToken are excluded so Auth.js can resolve sessions before tenant context exists.
- **Dual DB roles (Session 05b):** `app_auth` (BYPASSRLS) via AUTH_DATABASE_URL for Auth.js + signup + migrations; `app_tenant` (RLS enforced) via DATABASE_URL for all tenant-scoped work. Disabling RLS on User is rejected.
- App runtime must not connect as a Postgres superuser. Migrations may use DIRECT_URL / app_auth.
- withTenant opens transaction-local set_config. tRPC opens the tenant tx in protectedProcedure middleware, not createTRPCContext.


## 2026-10-07 — subscriber savepoints
Outbox dispatch wraps each subscriber in SAVEPOINT / ROLLBACK TO SAVEPOINT.
Postgres 25P02 aborts the whole transaction after one failed statement; savepoints keep sibling subscribers (audit, tasks, compliance, later notifications) independent.

## Prisma create-input typing
Repo methods that inject tenantId should type their create input as `Omit<Prisma.XUncheckedCreateInput, "tenantId">`. Callers omit tenantId; the repo still passes a complete UncheckedCreateInput.

## Compliance has two sequential locks
Checklist steps lock on dependsOnStepId. Attestation steps lock on the previous authority (Notary → State/HRD → MEA → Embassy → MOFA). Both are enforced in services, not only in the UI.

## Prisma schema edits are surgical
Never rewrite a whole model block when adding a field. Edit in place. A broad replace can drop @relation backrefs.

## Document storage (Session 16)
Local filesystem driver only. AWS SDK deferred to Session 20. No bytes in Postgres.

## Document domain vocabulary
- requiredDocuments (JSON on ChecklistInstance): template-derived list of what SHOULD be uploaded.
- vaultDocuments (relation ChecklistInstance → Document[]): what HAS been uploaded.
These are different concepts. Never collapse them.

## Schema edits are line-level, not block-level
Three incidents (S00, S15, S16) dropped @relation backrefs. Never rewrite a whole model block. Before committing, run scripts/check-schema.sh and review every relation diff.
