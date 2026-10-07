# Architecture contract

If anything here conflicts with the original PRD, `context.md` wins for product scope; this file wins for technical patterns already decided.

## §4.1 Tenant DB access (`withTenant` + Proxy)

- Services and repos import `db` and call `db.model.findFirst(...)` with **no** tx parameter.
- `db` is a Proxy: if AsyncLocalStorage holds an active transaction client, calls route there; otherwise the extended root client.
- **Transactions open only via `withTenant(tenantId, fn)`**, never via `db.$transaction` in app code.
- `withTenant` runs `SELECT set_config('app.tenant_id', tenantId, true)` (transaction-local) then `txStorage.run(tx, fn)`.
- **tRPC:** tenant transaction is opened in `protectedProcedure` middleware, **not** in `createTRPCContext`. Opening the tx in the context factory closes it before the procedure runs.
- Pre-tenant paths (Auth.js adapter, credentials authorize, signup) use `authPrisma` (BYPASSRLS role), never `db`.

## §4.2 Database roles

| Role        | RLS        | Connection env        | Used by                          |
|-------------|------------|-----------------------|----------------------------------|
| `app_auth`  | BYPASSRLS  | `AUTH_DATABASE_URL`   | Auth.js, signup, migrations      |
| `app_tenant`| enforced   | `DATABASE_URL`        | All services/repos via `db`      |

`DIRECT_URL` (optional) points at `app_auth` for Prisma migrations.

See `scripts/setup-roles.sql`.

## §4.3 Encryption

Field-level AES-256-GCM + HMAC blind indexes via Prisma `$extends` on the **app** client. Nested-write encryption deferred. Registry: `src/core/db/encryption.registry.ts`.


### §6.5 Multi-subscriber dispatch
The outbox dispatcher wraps each subscriber in SAVEPOINT/ROLLBACK TO SAVEPOINT.
A failing subscriber rolls back its own writes but does not abort the
enclosing transaction. Every future subscriber gets this safety for free.
