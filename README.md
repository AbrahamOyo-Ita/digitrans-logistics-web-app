# DigiTrans Logistics

DigiTrans is a Calabar-focused logistics platform with a React/Vite web client and native Node.js Vercel Functions. The target architecture uses Vercel for the web app/API and Supabase for Auth, PostgreSQL, and Storage. The server-side API is asynchronous; there is no SQLite or local-file persistence fallback.

> **Release status - Vercel cutover.** This branch contains the PostgreSQL schema, guarded migration/seed tooling, native Node.js/Supabase integration, Supabase Auth and Storage code, atomic Paystack settlement, and Vercel Functions for `/api/*`. The browser and API share one Vercel origin; no separate API host is required. Confirm the connected Supabase project, Vercel environment variables, DNS, and production smoke tests before launch.
>
> **Fresh launch decision:** do not import legacy SQLite rows or local upload files. This does not authorize deleting the legacy database/files. The Vercel change so far is attaching the requested `www` domain. Supabase Auth's site URL and redirect allow-list now match that domain; no Supabase schema, seed, user, or Storage changes have been made.

## Requirements

- Node.js 22.12+ and npm
- A **separate local Supabase development environment** for end-to-end local testing, or an explicitly isolated test project
- A Vercel project for the frontend and `/api/*` Functions, plus a Supabase project

## Local development

The API now requires Supabase/PostgreSQL configuration and will not silently create a local SQLite database. Configure a local Supabase project and its server-only credentials in your shell/secret store:

```dotenv
NODE_ENV=development
APP_URL=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_DB_SSL=disable
```

Then prepare the local schema and safe catalogue seed. Both scripts default to a dry run and require `--apply` before writing:

```sh
SUPABASE_DB_TARGET=local npm run db:migrate -- --apply
SUPABASE_DB_TARGET=local npm run db:seed -- --apply
npm run dev
```

The API refuses to start unless the expected checked-in migrations and base catalogue are already present. It never applies migrations or seeds on startup. If Resend is not configured in development, registration/recovery responses may include a local-only verification/reset link for testing; production never exposes those links. Logistics lifecycle messages are written to a PostgreSQL outbox in the same transaction as the business event, then sent by a protected Vercel Cron job; configure and verify Resend before expecting actual delivery.

## Useful commands

```sh
npm test                              # PGlite schema/RLS/payment tests and unit/config tests
npm run build                         # production Vite bundle
npm run db:migrate -- --dry-run       # list SQL migration checksums; opens no DB connection
npm run db:seed -- --dry-run          # show safe catalogue seed checksum; opens no DB connection
git diff --check                      # whitespace/conflict check
```

A migration/seed write is target-gated. Local apply requires a loopback database. Staging requires `--allow-staging` and an exact configured host/user identity. Production requires `--approve-production`, an exact host/user identity, and `SUPABASE_PRODUCTION_MIGRATION_APPROVAL=I_REVIEWED_BACKUP_AND_CUTOVER_PLAN`. The production migration set and seed have been applied through this guarded process; future writes must retain the same backup/review and migration-ledger controls. See [DNS setup](docs/production-dns-setup.md).

## Architecture

- **Frontend/API:** React and Vite are served by Vercel. Native Node.js handlers run as Vercel Functions under `/api/*`, so production browser requests use the same origin and `VITE_API_BASE_URL` should remain unset. Supabase provides the database, Auth, and Storage services.
- **API:** native Node.js Vercel Functions. Scheduled work must be invoked through Vercel request/cron execution; there is no separate API process.
- **Database:** Supabase PostgreSQL via a server-only `pg` pool and async repository adapter. Database migrations are versioned under `supabase/migrations/`; API startup checks recorded checksums and seed readiness but does not mutate schema.
- **Authentication:** Supabase Auth owns credentials, email verification, recovery, sessions and refresh. App roles/statuses stay in `public.users` and permissions in the seeded role catalog. Session cookies are HTTP-only; configure `SESSION_COOKIE_SAME_SITE=none` and `Secure` when the frontend and API are cross-site.
- **Google sign-in:** Enable the Google provider in Supabase Auth and add these application callback URLs to Supabase's redirect allow-list: `https://digitransdelivery.com/api/auth/google/callback`, `https://www.digitransdelivery.com/api/auth/google/callback`, and the matching local callback URL for development. The Google OAuth client must use Supabase's `/auth/v1/callback` as its authorized redirect URI. Google sign-in provisions a customer account on first use and establishes the same HTTP-only session as password login.
- **Files:** Native multipart parsing buffers uploads in memory; validated private documents/proof/receipts and public site images go to Supabase Storage. Private files are served through an authorization check and short-lived signed URLs. No local upload directories are used.
- **Payments:** Paystack hosted checkout, provider verification, signed webhooks, refunds and duplicate-safe settlement call versioned Postgres RPCs for atomic financial updates. A browser redirect alone never confirms payment.
- **Transactional email:** Auth verification/recovery use responsive Resend templates. Delivery, rider assignment, payment, Market Run and waybill events are captured by database triggers in `transactional_email_outbox` and drained by a retryable, idempotent Vercel Cron worker.

## Fresh-launch schema and seed

`supabase/migrations/202611160001_initial_schema.sql` creates the application schema and scoped RLS/policies; `202611160002_payment_atomicity.sql` adds the payment event ledger and atomic settlement functions; `202611160003_transactional_email_outbox.sql` adds the private email outbox and business-event triggers; `202611210001_google_oauth_phone_nullable.sql` supports first-time Google accounts without a phone; and `202611210002_paystack_payment_hardening.sql` prevents concurrent duplicate active payment attempts. `supabase/seed.sql` contains only idempotent role/permission grants, inactive launch zones, public FAQs and basic settings-no legacy records, uploaded files, demo identities or sample financial data. The guarded seed command can bootstrap the first production Super Administrator only during an explicitly approved production seed operation.

The checked-in migration set and catalogue seed are applied to the connected production Supabase project through the guarded, checksum-tracked process. Future schema changes must use the same explicit target, backup/review, and migration-ledger gates. Do not treat a successful local build as proof that a new production migration has been applied.

## Production configuration overview

See `.env.example`, `docs/supabase-migration.md`, and [the DNS setup runbook](docs/production-dns-setup.md). The production web origin is `https://www.digitransdelivery.com`; the Node API host/origin must still be selected. The Node API needs:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and a TLS-verified `SUPABASE_DB_URL` in the host's secret store only.
- HTTPS `APP_URL`, exact `CLIENT_ORIGINS`, and appropriate secure cookie policy.
- A verified Resend sending domain, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` for account and lifecycle email. `APP_URL` must be the public HTTPS app origin so emails can load the original artwork and build safe links.
- A long random `CRON_SECRET` shared with the Vercel deployment. The transactional-email worker runs daily on the Hobby plan and allows a 30-second function duration; a higher Vercel plan or external scheduler can be used for more frequent processing and should send `Authorization: Bearer $CRON_SECRET`.
- Paystack production configuration: set `PAYSTACK_SECRET_KEY` in Vercel only and keep `PAYMENT_CALLBACK_URL=https://www.digitransdelivery.com/payment/return`. This hosted-checkout integration does not need a Paystack public key in the browser. In the Paystack dashboard, set the webhook URL to `https://www.digitransdelivery.com/api/payments/paystack/webhook`; Paystack signs requests with the same secret key, and the handler verifies the raw request body before settlement. Start with `sk_test_...`, test initialization, callback verification, signed success/failure webhooks, duplicate delivery, and refund handling, then replace only the secret with `sk_live_...` for launch.
- A trusted `TRUST_PROXY` setting matching Vercel's proxy headers.

Never expose the service-role key or database URL in Vite variables, browser code, logs or Git. The Vercel frontend and Node API are separate deployments. The API writes one-line JSON logs to stdout/stderr, attaches an opaque `X-Request-ID` to each response, and records method, path, status and duration without query strings or request bodies. Error details are sanitized and sensitive context fields are redacted; use the response request ID to correlate a support report with host logs.

## Verification boundary and remaining work

Offline checks cover SQL schema/RLS/payment/outbox behavior in PGlite, query-template preparation against the migration schema, unit/config tests, syntax, and the Vite build. They do **not** verify real Supabase Auth/Resend delivery, Resend domain verification, applied production migrations, Vercel Cron execution or plan limits, real Storage behavior, Paystack, production CORS/cookies, route-by-route business parity, operational monitoring, backups/restores, or production load/security.

Before launch, complete a reviewed test on a separate disposable Supabase environment, verify every critical workflow and role authorization, confirm email and Storage behavior, test the payment webhook through the RPC, review concurrency/scheduled jobs, and finish deployment/rollback/backup planning. Do not declare production readiness until those checks pass.
