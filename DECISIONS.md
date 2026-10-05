# Decisions

- next-auth and @auth/prisma-adapter were added in Session 02. They were not in the Session 00 dependency list. Auth.js v5 requires both.
- experimental.nodeMiddleware is set so middleware can run on the Node runtime for AsyncLocalStorage. If this Next minor drops it, tenant propagation falls back to the x-tenant-id header, and each RSC/action wraps itself in runWithTenant.
- Google OIDC is registered only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
- SHORTLISTED cannot skip to SELECTED. Corridor shortcuts belong in a later compliance-template config, not the state machine.
- If `npx pnpm@9` fails with E502 on the tarball, try `npm install -g pnpm@9` (different path) then `pnpm install`. Do not loop retries in a session.
- Encryption uses AES-256-GCM + HMAC-SHA256 blind indexes only. Nested-write encryption deferred (Session 04).
- RLS is enabled on all tenant-scoped tables. Account, Session, VerificationToken are excluded so Auth.js can resolve sessions before tenant context exists.
- App runtime DB role must not be a Postgres superuser / BYPASSRLS; otherwise RLS is decorative. Migrations may use a privileged role; the app connection must not.
- withTenant opens a transaction-local set_config('app.tenant_id', ..., true). tRPC opens the tenant tx in protectedProcedure middleware, not createTRPCContext (context would close the tx before the procedure ran).
- Pre-tenant paths (credentials authorize, TenantService.signup, PrismaAdapter) use basePrisma, not the db Proxy. Login email lookup vs RLS on User is an open tension — may need a security-definer function or Session 23 policy so non-bypass roles can resolve email → user.
