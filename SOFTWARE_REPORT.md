# DigiTrans Logistics — migration and readiness report

**Review date:** 16 November 2026

**Decision:** **Not production-ready / not cut over.** The repository contains a substantially integrated Supabase/PostgreSQL API path, but it has not been deployed or smoke-tested against Supabase. The user-authorized custom domain `www.digitransdelivery.com` is attached to the Vercel project but its DNS is misconfigured. Supabase Auth's site URL and redirect allow-list have been aligned to that domain; no database schema/data or Storage changes have been made.

## Executive summary

DigiTrans is a multi-role logistics and operations app for Calabar, Cross River State. The UI is React/Vite; the API remains a long-running Express service on a Node host. The target backend is Supabase Auth, PostgreSQL and Storage. The API is not being moved to Edge Functions.

The user approved a fresh launch: no legacy SQLite rows/files are imported or deleted. The two checked-in migrations and safe seed are still unapplied. A read-only review found no public app tables, Auth users, Storage buckets/objects, Storage policies, or migration history in the connected Supabase project; the services are healthy. Supabase Auth has now been configured to use `https://www.digitransdelivery.com` with a same-origin redirect allow-list. An empty migration ledger alone is not proof of an empty project.

## Current code implementation

### Product workflows

- Customer/student delivery booking, price quotes, delivery history/tracking, addresses, Market Runs, intercity waybills, notifications and support.
- Rider onboarding, agreements, documents, availability, assigned jobs, milestones, proof of delivery, earnings and withdrawal requests.
- Vendor profile and business verification workflows.
- Investor verification, opportunity applications/agreements, funding and maturity/withdrawal workflows. Returns remain projections, not guarantees.
- Operations/manager delivery assignment and status, rider/vendor/student review, Market Runs, waybills, user controls, support, zones/pricing and public content.
- Finance payment review, earnings, settlements, withdrawals, expenses, ledger and audit history.

### Backend migration

- `server/db.js` now uses the async PostgreSQL pool and transaction layer; there is no `sql.js`/SQLite dependency or local database fallback. API route query calls have been converted to async PostgreSQL usage and native PostgreSQL date/interval expressions.
- `server/postgres.js` configures the Node `pg` pool, verified TLS, safe error mapping, safe `BIGINT` reads, async transactions and nested savepoints. `server/async-router.js` forwards async Express errors.
- Supabase Auth now owns credentials, email verification, recovery, login, refresh and sign-out. App role/status data and authorization remain in the server-owned PostgreSQL user/permission catalogue. Session cookies are HTTP-only.
- Multer uses memory buffers only. Documents, proof photos and receipts use private Supabase Storage buckets; banner images use the public site-assets bucket. Private-file routes check record ownership/permissions before creating a short-lived signed URL. Local upload directories/static upload serving have been removed.
- Paystack initialization/verification remains server-side; signed webhook and verified transaction success/failure use atomic Postgres RPCs with provider event identity/hash, row locking, state/amount/reference validation, ledger, notification and audit updates.
- API startup is read-only for schema/data. It checks the current migration checksums and catalogue seed and then starts the Express service and scheduled delivery advance job. It does not auto-migrate or seed.

### Versioned database code

- `supabase/migrations/202611160001_initial_schema.sql` defines 53 app tables, Auth UUID references, RLS/read policies, scoped grants and Storage buckets/policies.
- `supabase/migrations/202611160002_payment_atomicity.sql` adds the payment event ledger and atomic success/failure RPCs, for 54 app tables total.
- `supabase/seed.sql` is idempotent and contains only roles, permissions, grants, inactive launch zones, public FAQs and basic site settings. It has no demo identities, financial sample data or legacy imports.
- `scripts/apply-supabase-migrations.js` and `scripts/seed-supabase.js` are dry-run-first and target-gated. Production additionally requires explicit flags, endpoint identity and a separate confirmation environment value. These safeguards do not replace the explicit user approval, verified backup and reviewed cutover plan required before any production operation.

## Verification performed in this workspace

Latest workspace checks:

- `npm test`: **40/40 passed**, including repeatable PostgreSQL query-compatibility and guarded migration-target checks.
- `npm run build`: passed.
- `npm run db:migrate -- --dry-run` and `npm run db:seed -- --dry-run`: passed without opening a database connection.
- `node --check` for server/routes/scripts and `git diff --check`: passed.
- The offline PGlite route-SQL scan checked **389 call sites / 328 unique query templates** against the checked-in schema with zero failures. It found and led to corrections for two settlement `GROUP BY` queries and a rider query selecting a nonexistent primary-key column.
- PGlite tests exercise schema/RLS isolation, storage-helper validation and atomic payment RPC semantics without a linked Supabase connection.

These are code-level/offline validations only. No actual Auth email, live Storage, PostgREST RPC, Paystack, Vercel deployment, browser acceptance, production smoke test, load test or restore test has been performed.

## Risks and open launch gates

1. **Real environment integration:** verify the schema and seed in an isolated/disposable Supabase environment; test server-only credentials, Auth mail callbacks, refresh behavior, Storage bucket configuration, signed URLs and PostgREST RPC function execution.
2. **Workflow parity and authorization:** exercise the complete API as every role. The SQL-template check establishes syntactic compatibility but not behavioral parity, access-control correctness or response-contract parity.
3. **Auth:** confirm signup verification, pending rider/vendor/investor status, login denial, refresh-cookie behavior, password recovery/change, session revocation and real Resend delivery with the production domain/cookie topology.
4. **Files:** test actual PDF/JPEG/PNG/WebP uploads, path ownership, authorization for staff/customer/rider/vendor/student/investor/finance views, replacement/deletion and public banner delivery against Supabase Storage.
5. **Payments:** run Paystack test-mode initialize, signed webhook, API verification, duplicate/reordered event, failure/success races, capacity review and finance reconciliation. Live credentials are not configured.
6. **Scheduled jobs and scale:** validate job concurrency/idempotency if more than one Node instance may run. Confirm API health/readiness, timeouts, logging, monitoring, backups, restore and deployment rollback.
7. **Deployment/content:** choose and configure the Node API host and public HTTPS API origin, then set Vercel's `VITE_API_BASE_URL`, API CORS/cookie policy and host secrets. `www.digitransdelivery.com` is attached in Vercel but needs the CNAME in [the DNS runbook](docs/production-dns-setup.md); TruHost DNS and Resend records have not been changed or verified. The latest Vercel production build failed because `VITE_API_BASE_URL` is missing. Replace inactive zones, unconfigured prices, support details, rider agreements, terms/privacy and investment content with the actual approved values.

## Data and project safety

No Supabase migration or seed has been applied; no Auth users or Storage buckets have been created; no SQLite records/files have been imported or deleted. The user's approval of the checked-in migrations and safe catalogue seed is conditional on a verified backup and final schema/security review; those gates and the immediate pre-write confirmation remain outstanding. The workspace has no direct `SUPABASE_DB_URL`, so the checksum-tracked runner has not connected. Supabase Auth's site URL/redirect allow-list were updated to `https://www.digitransdelivery.com`; no Supabase schema/data/Storage changes were made. The Vercel custom domain was added, but its DNS remains misconfigured. No Vercel environment variables or deployment were changed. Preserve legacy SQLite data/files; fresh launch means no import, not deletion.

**Bottom line:** the SQLite/local-file runtime has been replaced in this branch by a Supabase/PostgreSQL/Auth/Storage code path, but external integration, end-to-end parity and deployment verification remain open. Do not describe the application as migrated to the connected project or production-ready until the remaining gates pass.
