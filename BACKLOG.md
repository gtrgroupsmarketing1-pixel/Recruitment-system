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
- [ ] Middleware ALS may not cross into RSC. Header `x-tenant-id` is set as the fallback. Confirm `experimental.nodeMiddleware` on this Next version when install works.


