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

## AWS SDK v3 dependency
@aws-sdk/client-s3 + @aws-sdk/s3-request-presigner added Session 20.
Used only by the S3/R2 storage driver. Imported from s3.driver.ts (server-only).
Client is lazily constructed on first use. CI stays on STORAGE_DRIVER=local.

## Cross-tenant admin pages
/admin/jobs is a page that reads cross-tenant. It uses authPrisma deliberately
because job runs are platform-level, not tenant-scoped. JobRunLog has no RLS.
Any future cross-tenant page must document the same justification.

## Drive/OneDrive deferred
Session 20 is S3/R2 + GC + cron only. Drive/OneDrive OAuth is Session 21.

envObjectSchema is the base Zod object with primitive field definitions.
envSchema = envObjectSchema.superRefine(...) is the full validator.
Only the base schema supports .pick / .omit / .partial. When a subset
of env vars needs validating (e.g., encryption-only parse), derive from
envObjectSchema, not envSchema.

## Logger denylist is a log-leak control
Unencrypted-at-rest is not a reason to log a field. email, phone, body,
and recipientAddr are denylisted. Audit trails that must record an address
go to AuditLog, not stdout.

## Notifications (Session 18)
- Delivery is best-effort inline in the outbox subscriber. Outbox provides retry; no BullMQ yet.
- Templates are inline TypeScript pure functions (not DB). Per-tenant customization is Session 24+.
- Channel drivers default to LogChannel. Postmark/Meta selected only when env credentials exist; boot fails if a real driver is set without credentials.
- External HTTP calls use AbortController 5s timeout.
- Notification.body and recipientAddr are denylisted in the logger; not encrypted at rest (searchable delivery log).
- task.overdue dedup uses Task.notifiedOverdueAt, not a DomainEvent scan.

## Session 21 — Drive mirror
- Push-only. No two-way sync. Disconnect sets deletedAt and does not delete provider files.
- Google scope is drive.file plus userinfo.email (display only). Microsoft is Files.ReadWrite.AppFolder plus offline_access and User.Read so refresh and the connected email work. No googleapis or Graph SDK.
- Tokens use the Session 04 encryption middleware with no blind index. DRIVE_ENCRYPTION_KEY is accepted in env but not a second cipher — dual keys would make decrypt ambiguous. Tokens use ENCRYPTION_KEY.
- AWS SDK stays at the lockfile resolution 3.687.0. .npmrc sets save-exact=true so later installs do not float minors. package.json keeps the existing caret so npm ci still matches the lock.
- getStorage() is the only storage entry point. The legacy storage export is removed.


## Session 22 — Government portal connectors
- Poll-only; no government push webhooks.
- Notification on status change; never auto-complete checklist steps.
- Wafid is the only shipped parser (fixture-backed regex). MOHRE/DMW return UNKNOWN / NOT_IMPLEMENTED.
- TenantConnectorConfig.credentialsCt is encrypted bidx-less (same pattern as Drive tokens).
- COMPLIANCE_OFFICER queried by role string; Session 23 formalizes RBAC enforcement.
- Interface changes ripple to every mock (Session 21 lesson). Prefer pure fixtures over structural mocks when possible.


## Template file fragility
src/core/notifications/templates.ts has been corrupted twice by bulk
edits (S19, S22). After any edit, run notification template tests
locally before committing. The file is small enough that review-before-commit
is cheap; a broken template breaks every notification type silently.


## Session 24 — RBAC enforcement
- PERMISSIONS matrix in `src/core/auth/permissions.ts` is the single source of truth.
  `requirePermission` (session) + `can()` (UI) read from it. No dual lists.
- Scope via AsyncLocalStorage (`scopeStorage`). `withUserScope` for interactive paths;
  `withSystemScope` for jobs/webhooks. `withTenant` kept as deprecated alias to `withSystemScope`.
- `branchId` claimed on JWT/session for BRANCH_MANAGER filters. No schema migration —
  branch filters use `recruiterId IN branchUserIds` (`loadBranchUserIds` helper).
- Status-gated `change_status` (MOBILIZATION ≥ TRAVELED, COMPLIANCE ≥ MEDICAL_BOOKED)
  deferred to service-level checks in a follow-up; role gate only in Session 24.

## Scope filter integrity
Scope filters depend on columns being populated. A missing recruiterId
on create silently breaks BRANCH_MANAGER and RECRUITER visibility.
Session 24's role-enforcement tests caught this. Rule: any new column
referenced by a scope filter needs a test that asserts it's populated
after the normal create path.

## Session 24b — status-gated change_status
MOBILIZATION_OFFICER may change status only when current >= TRAVELED.
COMPLIANCE_OFFICER only when current >= MEDICAL_BOOKED.
Exit states (REJECTED, ON_HOLD, MEDICAL_UNFIT, VISA_REFUSED, ABSCONDED)
are always allowed for roles that already passed application:change_status.
Order source is PIPELINE_ORDER. Gate lives in router/action, before the
state machine.


## Session 25 — Client portal
CLIENT_USER is scoped by clientCompanyId, fail-closed if missing.
Client decisions never call changeStatus. Documents stay clientVisible false until staff opt in.
Portal lives in (portal)/client and redirects away from the staff shell.

## Session 25b — Client user admin
CLIENT_USER must have clientCompanyId and no branchId. Staff cannot carry clientCompanyId. Enforced by assertUserScope and Postgres user_scope_exclusive. Deactivated users keep rows and cannot log in.

## Session 26 — Candidate portal
Candidates are not User rows. Magic-link sessions use a separate cookie and scope. Raw tokens are stored only as SHA-256 hashes.

## Session 27 — White label
Tenant id comes from the host via middleware. Credentials login rejects a missing x-tenant-id. Locale is cookie, then tenant default, then en. dir is set on html.

## Session 28 — SSE
Staff realtime is a signal stream. pg_notify runs inside the publish transaction. Clients refresh; payloads are not the source of truth.
