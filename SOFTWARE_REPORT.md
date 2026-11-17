# DigiTrans Logistics — software and production-readiness report

**Review date:** 16 November 2026

**Readiness decision:** **Not production-ready for the requested Supabase/Vercel launch.** The app has meaningful security and reliability improvements and passes the current code/build checks, but the requested production services are not connected or verified. This report distinguishes code that exists from external setup that has not happened.

## Executive summary

DigiTrans is a multi-role logistics and operations web application for Calabar, Cross River State. The repository contains a React/Vite frontend and an Express API with customer, rider, vendor, investor, operations, finance and super-admin workspaces. The current data layer is a custom wrapper around `sql.js`/SQLite, and uploaded documents are held on the API host's filesystem.

The requested Supabase backend is **not present** in the code. A Supabase project cannot be connected merely by adding an API URL and key: most API routes currently execute SQLite-specific SQL, and the schema, session model and file paths all need a tested migration. The requested Vercel domain cannot be verified from this repository; the Vercel connection is not available in the current session and no real domain was supplied. Vercel configuration has been added for a **static frontend only**; the current API must run on a durable Node host. Resend helper code is integrated into password recovery and public contact enquiries, but no sender domain or live Resend credentials were available to test.

The accurate status is therefore **staging-ready / integration-in-progress, not 100% production-ready**. Do not accept live customer, payment or investment activity on this build until the launch gates in this report are completed.

## What is built

### Public website and customer experience

- Public marketing, service information, FAQs, banners, contact enquiries and tracking pages.
- Account registration and sign-in for customers, students, riders, vendors and investors.
- Customer/student delivery booking, server-side fee quotation, delivery history and status timeline, saved-address management, Market Runs and intercity waybills.
- Payment-return page that checks payment status against the API rather than trusting a browser redirect.
- Public tracking responses intentionally omit private delivery and recipient contact information.

### Role-based workspaces

- **Rider:** onboarding, documents, agreement acceptance, availability, assigned jobs, delivery milestones, proof-of-delivery upload, earnings and withdrawal requests.
- **Vendor:** business profile and verification documents, delivery workflow.
- **Investor:** identity verification, opportunity applications, agreements, provider-verified funding and maturity/withdrawal workflow. Projected returns are estimates, not guarantees.
- **Operations/managers:** delivery assignment/status, rider/vendor/student review, Market Runs, waybills, customer account controls, support tickets and public-site content.
- **Finance:** payment review, rider earnings and settlements, withdrawal review/reconciliation, expenses and financial ledger.
- **Super admin:** roles/permissions, admin management, pricing/zones, public content, audit history and investment terms.

### Backend and security features

- Express JSON API with role/permission middleware and audit logging.
- Hashed session tokens in the database; HTTP-only session cookies; sign-out, account rejection/suspension handling, session revocation after password reset/change, and hashed one-time reset tokens.
- Server-side price calculation, ownership checks and permission checks on sensitive file, support, customer-address and operations endpoints.
- Paystack initialize/verify/webhook flow with signature verification, amount/currency checks, payment attempt persistence, duplicate handling and provider request timeouts. Live checkout remains disabled until a Paystack key is supplied.
- Local private/public upload separation, file size/type limits, private-file authorization, `nosniff`, and content-signature checks for PDF/JPEG/PNG/WebP.
- Production CORS allowlist and credential support, secure cookie settings, rate limits for authentication/contact/tracking, production clickjacking headers, and fail-fast production configuration checks.
- Resend API helper now backs password-reset delivery and optional contact-enquiry email. Provider failures are not misrepresented as confirmed delivery; password-reset responses remain generic to avoid account enumeration.
- PWA manifest, icons, service worker and offline fallback. API responses/private uploads are excluded from service-worker caching.

## Recent hardening completed

- Added explicit production configuration validation: HTTPS app origin, disabled demo seed, absolute database/upload paths, valid callback origin, and an active super-admin bootstrap requirement.
- Configured exact-origin credentialed CORS, environment-based cookie same-site policy, configurable trusted proxy behavior, production clickjacking protection and no-store API responses.
- Added public contact and tracking rate limits.
- Added upload signature verification in addition to browser MIME-type checks.
- Added bounded network timeouts to Paystack/Resend requests and tests for the Resend helper.
- Wired Resend password-reset links and optional contact enquiry delivery.
- Added a Vercel static-site configuration, basic response security headers and a build-time requirement for `VITE_API_BASE_URL`.
- Marked API responses `no-store` to avoid caching private user data.
- Updated `.env.example`, `.gitignore`, setup/deployment guidance and this report. No real secrets or private data should be committed.

## Architecture and scale limits

| Layer | Current implementation | Production implication |
| --- | --- | --- |
| Frontend | React 18 + Vite; Vercel static build configured | Set `VITE_API_BASE_URL` to an HTTPS API origin and use a real, verified custom domain. |
| API | Long-lived Express process | Not implemented as Vercel serverless functions. Run on a persistent Node service. |
| Database | `sql.js` embedded SQLite; database is loaded in memory and exported to disk on writes | Requires a writable persistent disk and one API instance. It is not a horizontally scalable or managed Supabase database. |
| Uploads | Local `uploads/private` and `uploads/public` directories, configurable through `UPLOADS_DIR` | Needs durable storage, backups, permissions and restore testing. It is not Supabase Storage. |
| Sessions | Database-backed opaque cookie sessions | Browser/API domains must be same-site or use a deliberate proxy; configure CORS and cookies for the real domain. |
| Email | Resend HTTP API helper | Needs a verified sender domain and secret values in the API host's secret store. Delivery has not been verified. |
| Payments | Paystack API/webhooks | Needs live/test credentials, webhook configuration and end-to-end reconciliation tests. |

The current backend is a single-instance/small-deployment design. SQLite writes export the complete database file synchronously after mutations; concurrent API instances, ephemeral serverless filesystems, large datasets and provider failover are not supported. A Vercel frontend deployment does not make the current API/database serverless or durable.

## Verification performed

The final local checks for this changeset are:

- `npm test`: **15 tests passed** (domain/security, production configuration, email helper, upload signatures).
- `npm run build`: production Vite bundle completed successfully.
- `npm audit`: **0 known vulnerabilities** at the time checked.
- JavaScript syntax checks passed for server files and Vite configuration; `vercel.json` parsed as valid JSON. The Vercel build guard rejected a missing API origin and the static build succeeded with an HTTPS API origin.
- Production-mode smoke test with temporary throwaway storage: health/home returned 200 with API `no-store`; CORS preflight returned 204; bootstrap-admin login and session restoration succeeded; secure/HTTP-only/Lax cookie attributes were present; an unlisted origin was rejected with 403; production CSP/X-Frame-Options were present.
- Earlier staging smoke tests exercised all 11 seeded roles, selected permission denials, public routes, PWA assets, payment failure handling without credentials and saved-address ownership/default behavior. These were not live-provider or full-browser acceptance tests.

These are local/code-level checks, not a penetration test, independent security audit, live payment test, real email delivery test, domain verification, disaster-recovery test or production load test.

## Integrations and outstanding launch gates

### Supabase — blocked / not integrated

The Supabase connector is disabled in this session and no project credentials were provided. More importantly, the app still issues SQLite-specific SQL throughout its API routes. A proper migration must include PostgreSQL schema/migrations, data-access conversion, transaction semantics, auth/session decisions, access policies and private object storage, then rerun the domain and authorization tests against Supabase. Do not put a Supabase service-role key in frontend variables or source control.

### Vercel and custom domain — not connected / not verified

The Vercel connection is disconnected and the actual domain was not supplied. `vercel.json` is only a static frontend deployment setup. In Vercel project settings, configure `VITE_API_BASE_URL` to the API's HTTPS origin. Use `app.example.ng` and `api.example.ng` (same registrable domain) or an equivalent same-site design; configure the API `APP_URL` and `CLIENT_ORIGINS` accordingly. Add DNS records and verify ownership through the Vercel dashboard. No Vercel project, deployment, DNS record or domain verification is claimed by this report.

### Resend — code integrated, provider unverified

The Resend connector is unsupported here. The code sends password-reset messages and can send contact enquiries when configured. Supply `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL` and optionally `CONTACT_RECIPIENT_EMAIL` through the backend secret store. Verify the sender domain and test delivery/recovery end to end before relying on this feature. Service notifications currently remain in-app; there is no full email/SMS notification system.

### Paystack — integration present, live setup unverified

Supply the correct environment-specific `PAYSTACK_SECRET_KEY`; configure the Paystack webhook to `/api/payments/paystack/webhook` and test signature verification, retries, duplicate events, refunds/reversals and finance reconciliation with provider test credentials before production. No live key or successful real charge was tested. A customer-facing waybill payment action still needs UI completion even though the API helper/checkout flow exists.

## Other production gaps

1. Replace staging prices, service zones, contact details, rider agreements, terms/privacy text, investment terms and all demo material with owner-approved production data. Production startup does not seed demo pricing or accounts.
2. Confirm whether to complete the requested Supabase migration or formally retain SQLite on a single persistent Node host. The current hybrid is not Supabase-backed.
3. Select the API host and persistent volumes; configure backups, restore drills, monitoring/alerting, log retention, health checks, deployment rollback and incident ownership.
4. Review legal, consumer-protection, privacy/data-retention, payment, investment/securities, rider safety and insurance obligations with qualified professionals before enabling those workflows.
5. Verify real-world fulfilment, customer support, rider/vendor onboarding, payout operations, fraud handling and staff procedures.
6. Run browser/device accessibility and offline tests; the service worker has only code-level validation. Distance pricing remains an estimate without a production routing provider.
7. Add operational load tests, dependency/update policy and an independent security review before a public launch.

## Deployment checklist

1. Enable/connect the Supabase integration and provide access through the secure provider connection if the requested migration is still required; do not send secrets in chat. Confirm a custom domain and Vercel project.
2. Decide and implement the production data/storage architecture; migrate and verify existing records if applicable.
3. Configure API-host secrets and durable storage from `.env.example`; use a unique bootstrap admin secret, then remove bootstrap credentials after first initialization.
4. Deploy the static frontend to Vercel with `VITE_API_BASE_URL`; configure the custom domain and DNS in Vercel; set exact allowed origins on the API.
5. Verify Resend sender/domain and exercise password recovery/contact email. Configure Paystack and complete provider test-mode payment/webhook reconciliation.
6. Replace demo/legal/operational data; complete privacy/security review, backups/restores, monitoring, staff acceptance, accessibility and load tests.
7. Only after the above, approve production traffic and live payments.

**Bottom line:** the repository is in a stronger, tested state and is ready for the next integration/deployment phase, but it is not 100% production-ready. Supabase, Vercel domain verification, real provider delivery, durable production operations and owner-approved content remain open gates.
