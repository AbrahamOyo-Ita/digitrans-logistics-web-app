# DigiTrans Logistics

DigiTrans is a Calabar-focused logistics platform with a React/Vite web client and a long-running Express API. The target architecture keeps the API on a Node host and uses Supabase Auth, PostgreSQL, and Storage. The server-side API is asynchronous; there is no SQLite or local-file persistence fallback.

> **Release status - not cut over.** This branch contains the PostgreSQL schema, guarded migration/seed tooling, Express/PostgreSQL integration, Supabase Auth and Storage code, and atomic Paystack settlement. The migrations and seed have **not** been applied to the connected Supabase project, and the API has not been smoke-tested against deployed Supabase. The Vercel project now has `www.digitransdelivery.com` attached, but Vercel reports its DNS as misconfigured; no API origin is configured and the latest production build failed because `VITE_API_BASE_URL` is missing. Do not treat this branch as production-ready.
>
> **Fresh launch decision:** do not import legacy SQLite rows or local upload files. This does not authorize deleting the legacy database/files. The Vercel change so far is attaching the requested `www` domain. Supabase Auth's site URL and redirect allow-list now match that domain; no Supabase schema, seed, user, or Storage changes have been made.

## Requirements

- Node.js 22.12+ and npm
- A **separate local Supabase development environment** for end-to-end local testing, or an explicitly isolated test project
- A Node host for the production Express API; Vercel is for the static frontend only

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

The API refuses to start unless the expected checked-in migrations and base catalogue are already present. It never applies migrations or seeds on startup. If Resend is not configured in development, registration/recovery responses may include a local-only verification/reset link for testing; production never exposes those links.

## Useful commands

```sh
npm test                              # PGlite schema/RLS/payment tests and unit/config tests
npm run build                         # production Vite bundle
npm run db:migrate -- --dry-run       # list SQL migration checksums; opens no DB connection
npm run db:seed -- --dry-run          # show safe catalogue seed checksum; opens no DB connection
git diff --check                      # whitespace/conflict check
```

A migration/seed write is target-gated. Local apply requires a loopback database. Staging requires `--allow-staging` and an exact configured host/user identity. Production requires `--approve-production`, an exact host/user identity, and `SUPABASE_PRODUCTION_MIGRATION_APPROVAL=I_REVIEWED_BACKUP_AND_CUTOVER_PLAN`. The user's approval of the checked-in migrations and seed was conditional on a verified backup and final schema/security review; those gates and the immediate pre-write confirmation remain outstanding, so they are **unapplied**. A read-only review found no public application tables, Auth users, Storage buckets/objects or recorded migrations in the connected Supabase project. The connected-service changes so far are the Vercel custom-domain attachment and Supabase Auth site/redirect configuration; see [DNS setup](docs/production-dns-setup.md).

## Architecture

- **Frontend:** React, Vite, PWA shell. Vercel serves static assets/SPA routes only. `www.digitransdelivery.com` is attached to the existing Vercel project; add the Vercel CNAME shown in [the DNS runbook](docs/production-dns-setup.md) at TruHost. Set the Vercel build variable `VITE_API_BASE_URL` only after the Express API is deployed at its real HTTPS origin. That API host/origin is still unprovided, so production builds remain blocked.
- **API:** long-running Express process on a Node host. Scheduled delivery advancement stays in the Node service; the API is not ported to Edge Functions.
- **Database:** Supabase PostgreSQL via a server-only `pg` pool and async repository adapter. Database migrations are versioned under `supabase/migrations/`; API startup checks recorded checksums and seed readiness but does not mutate schema.
- **Authentication:** Supabase Auth owns credentials, email verification, recovery, sessions and refresh. App roles/statuses stay in `public.users` and permissions in the seeded role catalog. Session cookies are HTTP-only; configure `SESSION_COOKIE_SAME_SITE=none` and `Secure` when the frontend and API are cross-site.
- **Files:** Multer buffers uploads in memory; validated private documents/proof/receipts and public site images go to Supabase Storage. Private files are served through an authorization check and short-lived signed URLs. No local upload directories are used.
- **Payments:** Paystack checkout/verification/webhooks call a versioned Postgres RPC for atomic, idempotent settlement. A browser redirect alone never confirms payment.

## Fresh-launch schema and seed

`supabase/migrations/202611160001_initial_schema.sql` creates the application schema and scoped RLS/policies; `202611160002_payment_atomicity.sql` adds the payment event ledger and atomic settlement functions. `supabase/seed.sql` contains only idempotent role/permission grants, inactive launch zones, public FAQs and basic settings-no legacy records, uploaded files, demo identities or sample financial data. The guarded seed command can bootstrap the first production Super Administrator only during an explicitly approved production seed operation.

The checked-in migrations and seed are not yet applied to the connected Supabase project. The user's approval was conditional on a verified backup and final schema/security review; those gates are not confirmed complete here. Reconfirm explicitly immediately before any production SQL, and apply only through the guarded, checksum-tracked process. The current read-only check found no application tables, Auth users, Storage buckets/objects or migration history, but do not treat an empty migration ledger alone as proof that any project's data are empty.

## Production configuration overview

See `.env.example`, `docs/supabase-migration.md`, and [the DNS setup runbook](docs/production-dns-setup.md). The production web origin is `https://www.digitransdelivery.com`; the Node API host/origin must still be selected. The Node API needs:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and a TLS-verified `SUPABASE_DB_URL` in the host's secret store only.
- HTTPS `APP_URL`, exact `CLIENT_ORIGINS`, and appropriate secure cookie policy.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for signup verification and password recovery.
- Optional Paystack secrets/callback once payment operations are approved.
- A trusted `TRUST_PROXY` setting matching the actual Node host/reverse proxy.

Never expose the service-role key or database URL in Vite variables, browser code, logs or Git. The Vercel frontend and Node API are separate deployments. The API writes one-line JSON logs to stdout/stderr, attaches an opaque `X-Request-ID` to each response, and records method, path, status and duration without query strings or request bodies. Error details are sanitized and sensitive context fields are redacted; use the response request ID to correlate a support report with host logs.

## Verification boundary and remaining work

Offline checks cover SQL schema/RLS/payment behavior in PGlite, query-template preparation against the migration schema, unit/config tests, syntax, and the Vite build. They do **not** verify live Supabase Auth email delivery, real Storage bucket behavior, PostgREST RPC deployment, Paystack, production CORS/cookies, deployed job behavior, route-by-route business parity, operational monitoring, backups/restores, or production load/security.

Before launch, complete a reviewed test on a separate disposable Supabase environment, verify every critical workflow and role authorization, confirm email and Storage behavior, test the payment webhook through the RPC, review concurrency/scheduled jobs, and finish deployment/rollback/backup planning. Do not declare production readiness until those checks pass.
