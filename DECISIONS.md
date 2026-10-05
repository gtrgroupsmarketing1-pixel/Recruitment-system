# Decisions

- next-auth and @auth/prisma-adapter were added in Session 02. They were not in the Session 00 dependency list. Auth.js v5 requires both.
- experimental.nodeMiddleware is set so middleware can run on the Node runtime for AsyncLocalStorage. If this Next minor drops it, tenant propagation falls back to the x-tenant-id header, and each RSC/action wraps itself in runWithTenant.
- Google OIDC is registered only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
- SHORTLISTED cannot skip to SELECTED. Corridor shortcuts belong in a later compliance-template config, not the state machine.
- If `npx pnpm@9` fails with E502 on the tarball, try `npm install -g pnpm@9` (different path) then `pnpm install`. Do not loop retries in a session.
- Encryption uses AES-256-GCM + HMAC-SHA256 blind indexes only. Nested-write encryption deferred (Session 04).
