# context.md

Paste this file at the start of every session. The architecture contract is at
`docs/architecture.md`. If anything here conflicts with the original PRD,
THIS FILE WINS.

## Product
Multi-tenant, real-time Recruitment & Mobilization Operating System for GCC
recruitment agencies. Requisition-to-deployment for blue-collar and white-collar
placements. Replaces "Excel + WhatsApp + email" with one live source of truth.
MVP corridor: India → UAE blue-collar.

## Stack (locked)
Next.js 15 (App Router), TypeScript strict, Prisma + PostgreSQL, tRPC,
Zod, Auth.js v5, Tailwind + shadcn/ui, Vitest, BullMQ + Redis,
S3/R2, Postmark, Meta WhatsApp Cloud API.

## State machine (frozen — 21 values)
SOURCED, SCREENED, SHORTLISTED, CLIENT_INTERVIEWED, SELECTED,
MEDICAL_BOOKED, MEDICAL_CLEARED, DOCUMENTS_IN_ATTESTATION,
ATTESTATION_CLEARED, VISA_APPLIED, VISA_STAMPED,
TICKET_BOOKED, TRAVELED, MOBILIZED, PROBATION, CONFIRMED,
REJECTED, ON_HOLD, MEDICAL_UNFIT, VISA_REFUSED, ABSCONDED

Only ApplicationService.changeStatus may write CandidateApplication.status.

## Sensitive fields (encrypted at rest — Session 04)
SENSITIVE_FIELDS = [passport_number, national_id, medical_result,
                    visa_number, bank_account, iban]
BLIND_INDEXED_FIELDS = [passport_number, national_id, visa_number]
Storage: <field> TEXT + <field>_bidx TEXT. Middleware is Session 04.

## Multi-tenancy (three layers)
1. Every repo method takes tenantId first and filters by it.
2. Every table has tenant_id. Never findUnique({where:{id}}) — always
   findFirst({where:{id, tenantId, deletedAt:null}}).
3. Postgres RLS via current_setting('app.tenant_id') — Session 05.

## Green definition
pnpm typecheck && pnpm lint && pnpm test && pnpm build — all four pass.
Cross-tenant isolation test joins green permanently from Session 05.

## Folder rules
Domain code → src/modules/<domain>/
Cross-cutting → src/core/
Routes in src/app/ are thin — auth check + delegate + render only.
Layer order: Route → Router → Service → Repo → DB.

## Ten rules
1. No status update outside ApplicationService.changeStatus.
2. No await sendWhatsApp() inline in a service — publish event, subscriber handles.
3. No Prisma query without tenantId filter in the repo.
4. No findUnique on id alone.
5. No console.log of SENSITIVE_FIELDS values.
6. No try{}catch{} — throw typed errors from lib/errors.ts.
7. No "use client" unless hooks/state genuinely required.
8. No new dependencies without explicit approval.
9. No business logic in routes, routers, or components.
10. No bypassing state machine, encryption middleware, or RLS.

## SLA computation (frozen)
- targetOnboardingDate null → null
- daysRemaining < 0 → RED
- 0 ≤ daysRemaining < 30 → RED
- 30 ≤ daysRemaining < 45 → AMBER
- daysRemaining ≥ 45 → GREEN

Boundary: RED is strictly fewer than 30 days remaining.
Matches PRD §4 Phase 1 ("flag this requisition RED if fewer than 30 days remain").
Source of truth for requisition.metrics.ts.

## Session pointer
Session 08 — requisition module. Written. Vitest unavailable.
SLA boundary locked above. HARD CHECKPOINT before Session 12.
