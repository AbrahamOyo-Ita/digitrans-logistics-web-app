# Supabase migration - code-preparation status

## Decision and safety boundary

The production target is Vercel for the frontend and native Node.js `/api/*` Functions, with Supabase PostgreSQL, Auth and Storage. There is no separate API host in this architecture.

The approved target is a fresh launch: run the native Node.js HTTP API as Vercel Functions; use Supabase PostgreSQL, Auth and Storage; do not import legacy SQLite rows or local upload files. This does **not** authorize deleting the old database or files. `www.digitransdelivery.com` has been attached to the existing Vercel project; its DNS is still misconfigured. Supabase Auth's site URL and redirect allow-list have been aligned to this domain, but no Supabase SQL/Storage changes have been made.

A current read-only review found Supabase Database/Auth/Storage/REST healthy, with zero public application tables, Auth users, Storage buckets/objects, Storage object policies, or migration-history rows. Supabase Auth is now configured with site URL `https://www.digitransdelivery.com` and the same-origin redirect pattern `https://www.digitransdelivery.com/**`; email signup remains enabled with confirmation required. The user's approval of the checked-in migrations and catalogue seed is conditional on a verified backup and final schema/security review; those gates remain outstanding, so the migrations and seed are unapplied. Reconfirm explicitly immediately before any production SQL. The empty project state is a useful preflight, not a substitute for verifying a backup.

**Status: substantially integrated but not verified as a production cutover.** The code now points its HTTP API at PostgreSQL, uses Supabase Auth and uses Storage helpers in upload routes. These integrations have not been smoke-tested against a real isolated Supabase deployment. Do not call the app production-ready.

## Current code architecture

- `server/db.js` is an async PostgreSQL adapter over `server/postgres.js`. It converts positional `?` parameters to PostgreSQL `$n`, maps booleans to the schema's `SMALLINT` 0/1 columns, and reports row counts. There is no SQLite runtime or file fallback.
- API route handlers are async and registered through the native Node router so rejected promises reach the centralized error handler. `db.transaction()` awaits callbacks and uses `AsyncLocalStorage` to keep queries on the same `pg` client; nested operations use savepoints.
- `server/auth.js` and `server/routes/auth.js` use Supabase Auth for account creation, email verification, password login/recovery/change, refresh and sign-out. Role/status/permission authority is `public.users` and the role/permission tables. Browser passwords are not stored in app tables. HTTP-only cookies hold Supabase access/refresh tokens; cookie/CORS settings must match the actual frontend/API domains.
- `server/storage.js` is called from the document/proof/receipt routes and public banner routes. Native multipart parsing keeps uploads in memory; files are signature-checked and uploaded to allow-listed Supabase buckets. Private file access checks the owning record and role permission before returning a short-lived signed URL.
- Paystack webhook/verification settlement uses `server/payment-rpc.js` and a Postgres `SECURITY DEFINER` RPC. Signature verification occurs before webhook settlement; provider amount/reference/currency, event identity/hash, row locks and ledger/notification writes are handled atomically.
- `server/index.js` leaves schema/data setup to the explicit CLI tools. It checks that the checked-in migration checksums and catalogue seed are present, then starts the Node API and scheduled delivery job. It does not apply migrations or seed data on startup.
- `server/seed.js` and the `sql.js`/bcrypt dependencies were removed. The app no longer creates local SQLite files or local upload directories.

## Versioned schema and seed

- `supabase/migrations/202611160001_initial_schema.sql` defines 53 application tables. Supabase Auth UUIDs back app user IDs; remaining business identifiers are text. The schema defines RLS/read scopes and the server-side service-role write path. It defines the private/public Storage buckets/policies required by the code.
- `supabase/migrations/202611160002_payment_atomicity.sql` adds `payment_provider_events` (54 app tables total) and atomic Paystack success/failure functions; function execution is restricted to `service_role`.
- `supabase/migrations/202611160003_transactional_email_outbox.sql` adds the private transactional-email outbox (55 app tables total) and database triggers for delivery, rider assignment, payment, Market Run and waybill lifecycle events. The trigger writes commit atomically with the business update; a protected Vercel Cron worker sends and retries messages through Resend.
- `supabase/seed.sql` is idempotent and seeds 11 roles, 23 permissions, 50 grants, inactive service zones, public FAQs and basic site settings. It creates no demo identities, password, delivery, investment, payment, or legacy file records.
- `scripts/apply-supabase-migrations.js` defaults to dry-run/no connection and tracks checksums in `digitrans_meta.schema_migrations`, plus Supabase CLI history. It refuses staging/production without exact configured host/user identity and explicit command-line approval. Production also requires `SUPABASE_PRODUCTION_MIGRATION_APPROVAL=I_REVIEWED_BACKUP_AND_CUTOVER_PLAN`; destructive SQL has a separate `--allow-destructive` gate.
- `scripts/seed-supabase.js` likewise defaults to dry-run/no connection, uses the target guard, and only bootstraps a production administrator when run as an explicitly approved seed operation with strong one-time credentials.
- `server/readiness.js` is read-only and blocks startup on missing/mismatched migrations or an incomplete seed. No migrations or seed were applied to the linked project.

## Fresh-launch data and identity behavior

No data/file migrator is planned for this fresh launch. No legacy SQLite rows or local files should be copied into Supabase; their separate retention/deletion is outside this code-only change. New customers/students/riders/vendors/investors are created through Supabase Auth and the API's transactional app-profile creation. Signup uses an email confirmation link; role/status remain server-managed. Students/customers can become active after verification, while rider/vendor/investor accounts still require operations review. Legacy bcrypt hashes are not used or imported.

## Configuration

See `.env.example`. The API requires server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL`. Production requires verified database TLS, an HTTPS `APP_URL`, configured origins/cookie settings, and Resend sender credentials for account and lifecycle email. The five-minute Vercel Cron worker also requires a long random `CRON_SECRET` matching the deployment environment and a plan or external scheduler that supports the five-minute cadence and 30-second function duration. Verify the Resend sending domain before expecting actual delivery. Never put the service-role key/database URL in Vite variables or browser code. The Vercel frontend calls the native Node.js handlers through the same-origin `/api` path, so `VITE_API_BASE_URL` should remain unset in production.

Typical migration commands are dry-run by default:

```sh
npm run db:migrate -- --dry-run
npm run db:seed -- --dry-run
```

For a local loopback project only:

```sh
SUPABASE_DB_TARGET=local npm run db:migrate -- --apply
SUPABASE_DB_TARGET=local npm run db:seed -- --apply
```

Staging requires `--allow-staging` and matching `SUPABASE_STAGING_DB_HOST` / `SUPABASE_STAGING_DB_USER`. Production requires `--approve-production`, matching `SUPABASE_PRODUCTION_DB_HOST` / `SUPABASE_PRODUCTION_DB_USER`, and the exact confirmation environment value. The user's approval of the two checked-in migrations and safe catalogue seed is conditional on a verified backup and final schema/security review; those prerequisites remain outstanding, and explicit confirmation is required immediately before any production SQL. This workspace still has no direct `SUPABASE_DB_URL`, so the guarded checksum-tracked runner has not connected or applied them; do not substitute an untracked SQL path.

## Verification completed in the workspace

- `npm test` passed after the integration edits (40 tests, including the repeatable PGlite route-query compatibility scan, schema/RLS/payment RPC tests, secure migration-target checks and async PostgreSQL adapter tests).
- `npm run build` passed after the Auth verification UI changes.
- Node syntax checks passed across `server/*.js`, `server/routes/*.js` and `scripts/*.js`; `git diff --check` passed at the same check point.
- The final offline PGlite route-SQL scan checked 389 query call sites / 328 unique templates against the checked-in schema with zero failures. It found and led to fixes for two settlement `GROUP BY` queries and a rider table query that incorrectly selected a nonexistent `id` column. This is a local SQL compatibility check, not route behavior or live Supabase verification.
- Earlier PGlite tests validate migration/RLS isolation, Storage helper checks and atomic payment RPC behavior. The migrations remain unapplied to the connected project.

Checks must be rerun after later edits. Passing tests/builds do not prove live Auth email, Storage bucket behavior, route authorization/parity, scheduled-job behavior across multiple Node instances, Paystack delivery, or production readiness.

## Remaining work before production readiness

1. Rerun the complete test/build/diff checks and preserve a regression suite for PostgreSQL query compatibility, Auth, route-level authorization, file upload/read/delete, and payment webhook behavior.
2. Exercise a full isolated Supabase environment (not the connected live project) with the migration runner, base seed, Auth signup/verify/login/refresh/recovery, and Storage policies/buckets. Verify Resend delivery and the actual cookie/CORS behavior for the intended API/frontend domains.
3. Run authenticated HTTP acceptance tests across all roles for customer, rider, vendor, student, investor, operations, finance and admin workflows. Review business parity and error behavior; inspect every transaction and scheduled job for concurrency/idempotency.
4. Test the Paystack provider in test mode through initialize, signed webhook, user verification, duplicate/reordered events and finance review. Confirm callback URL and event IDs in the isolated environment.
5. Complete backup/restore and release/rollback plans; confirm the production host, monitoring, secret storage, trust-proxy and public-domain setup. Only after review and explicit user approval should the guarded production migration/seed be considered.

**Connected setup so far:** Vercel has `www.digitransdelivery.com` attached, but DNS is not configured. Supabase Auth has the matching site URL/redirect allow-list. No Supabase migration, seed or Storage bucket was applied; no API deployment or traffic cutover occurred.
