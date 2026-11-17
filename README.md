# DigiTrans Logistics

DigiTrans is a Calabar-focused logistics platform built with React 18, Vite, Express and an embedded SQLite database (`sql.js`). It includes a public marketing and tracking site, cookie-based accounts, role-specific workspaces, private document uploads, dispatch and finance workflows, payment-provider integration, transactional-email hooks, and an installable offline-capable PWA shell.

> **Deployment status:** this repository is not yet a 100% production-ready Supabase/Vercel deployment. The running backend is currently SQLite plus local-file storage; it does not use Supabase. Vercel can host the static frontend, but the current Express API, SQLite database, sessions and uploads require a separate long-running Node host with persistent storage. Production provider credentials, a verified custom domain, and approved operational/legal content have not been supplied or verified.

## Requirements

- Node.js 22.12+ (required by the current Vite toolchain)
- npm

## Local development

```sh
npm install
npm run dev
```

The development command starts the Vite client on port `5173` and the Express API on port `3001`. Vite proxies `/api` and `/uploads` to the API. Both bind for container/preview use.

The development API seeds a Calabar demo workspace. The default shared demo password is `Calabar2026!` (or set `DEMO_PASSWORD` before the first seed). Use this only in an isolated local/staging database and never in production. Seeded accounts:

| Role | Email |
| --- | --- |
| Super Administrator | `admin@digitrans.test` |
| Operations Officer | `ops@digitrans.test` |
| Customer | `customer@digitrans.test` |
| Student | `student@digitrans.test` |
| Rider | `rider@digitrans.test` |
| Vendor | `vendor@digitrans.test` |
| Investor | `investor@digitrans.test` |
| Finance Officer | `finance@digitrans.test` |
| Rider Manager | `rider.manager@digitrans.test` |
| Vendor Manager | `vendor.manager@digitrans.test` |
| Investment Manager | `investment.manager@digitrans.test` |

The demo seed includes Calabar zones, sample rates, role permissions and demonstration records. Demo rider agreements and investment opportunities are not legal or commercial offers.

## Useful commands

```sh
npm test       # domain, configuration, email-helper and upload-validation tests
npm run build  # production client bundle
npm run seed   # initialize/migrate and seed the local staging database
npm audit      # dependency advisory check
```

The API health check is `GET /api/health`.

## Product areas

- **Customers and students:** local delivery booking and server-priced quotes, delivery history and tracking, saved addresses, Market Runs, intercity waybills, notifications and support. Student pricing depends on an approved, in-date student profile.
- **Riders:** application and identity documents, rider agreement, availability, delivery milestones, proof of delivery, earnings, settlements and withdrawal requests.
- **Vendors:** business verification, document/profile management and delivery requests.
- **Investors:** identity verification, reviewed opportunities, application agreements, provider-verified funding and maturity/withdrawal tracking. Projected earnings are not guaranteed returns.
- **Operations and managers:** dispatch assignment/status, rider/vendor/student review, Market Runs, waybills, customer accounts, support and public-site content.
- **Finance:** rider earnings, settlement approval and payout reconciliation, withdrawal review, payment review and the financial ledger.
- **Super Administrator:** roles and permissions, admin accounts, pricing, public content, audit history, sensitive account controls and publishing reviewed investment terms.

Public tracking reveals status timelines only; it does not return recipient contact details or private delivery documents.

## Deployment architecture

### Vercel frontend

`vercel.json` configures the Vite client as a static Vercel project with SPA route fallback. Set the Vercel **Build Environment Variable** `VITE_API_BASE_URL` to the HTTPS origin of the API (for example `https://api.example.com`). Vercel builds fail fast if this value is missing or malformed. The browser API client uses that origin for `/api` calls, uploads and media.

Use a custom app domain and an API hostname under the **same registrable domain** (for example `app.yourdomain.ng` and `api.yourdomain.ng`). This avoids relying on third-party cookies. Configure the API's `APP_URL` and `CLIENT_ORIGINS` with the real app origin. The API allows credentialed CORS only for configured origins. Set Vercel DNS records and complete domain verification in the Vercel dashboard; this repository cannot verify domain ownership.

### API and data service

The current API is **not a Vercel serverless function**. It keeps the `sql.js` database in memory, writes the SQLite file to disk, uses local directories for uploaded files, and runs scheduled jobs in the process. Run it as one long-lived Node service on a host with durable, writable volumes. Configure `DATABASE_PATH` and `UPLOADS_DIR` to absolute paths on those volumes. Persist and back up both, restrict filesystem permissions, and test restore procedures. Set `TRUST_PROXY` to the actual trusted reverse-proxy hop count/CIDRs for the chosen host; do not blindly trust arbitrary forwarded headers. The SQLite wrapper writes the exported database file on each mutation; this is a single-instance/small-deployment architecture, not a horizontally scalable database service.

Supabase is **not currently integrated**. Adding Supabase is a backend migration, not just setting `SUPABASE_URL` and a key: the existing route layer issues SQLite SQL and depends on a local SQL schema, so data access, migrations, auth/session design and file storage must be ported and tested before the app can run on Supabase/Vercel without a persistent Node database host. Never expose a Supabase service-role key to browser code or commit it to Git.

## Production configuration

Copy `.env.example` into the API host's protected secret/configuration store and replace every placeholder. Do not commit `.env`, live credentials, private uploads or database files. In production, startup requires:

- `NODE_ENV=production`, `DISABLE_DEMO_SEED=true`, an HTTPS `APP_URL`, and absolute persistent `DATABASE_PATH` and `UPLOADS_DIR` paths.
- An active Super Administrator in the database. On first initialization, bootstrap one with a unique email/phone and a strong password in the host's secret store. Startup fails closed if there is no active admin.
- `CLIENT_ORIGINS` containing every browser origin allowed to call the API. Set `SESSION_COOKIE_SAME_SITE=lax` for app/API subdomains under the same site; cookies are HTTP-only and Secure in production.
- Live Paystack configuration (`PAYSTACK_SECRET_KEY`, `PAYMENT_CALLBACK_URL`) before accepting payments. Payment amounts and currency are checked server-side; a browser redirect alone never marks a payment successful. Without keys, checkout is disabled.
- Resend values (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `APP_URL`) and a verified sender domain before production password-reset/contact emails can be delivered. `CONTACT_RECIPIENT_EMAIL` is optional. No provider credentials or domain verification are included here.

Production configuration is validated at startup to reject missing durable storage, insecure origins and demo-seed settings. Never reuse the local demo password.

## Operational launch checklist

1. Connect and migrate the requested Supabase project, or explicitly approve retaining the single-instance SQLite backend. The current repository does not connect to Supabase.
2. Connect Vercel, set `VITE_API_BASE_URL`, configure and verify the actual custom domain and DNS, and deploy the static frontend.
3. Select and configure the durable Node API host and persistent database/upload volumes. Set allowlisted app origins, HTTPS and backup/restore monitoring.
4. Configure and test Resend with a verified sender; test password recovery and contact-enquiry delivery end to end.
5. Configure Paystack test/live keys, webhook URL/signature verification, and reconcile test payments in the finance workflow.
6. Replace demo pricing/zones, rider agreements, public contacts, terms/privacy language, policies and investment materials with approved production content. Seeded sample prices and investment terms are not operational approval.
7. Complete security/privacy, payments, consumer-protection, investment and operational reviews; verify delivery/rider/vendor workflows with real staff and devices; conduct load and restore tests.

The PWA service worker is registered only in production builds. It caches the shell and static assets, shows a generic offline page, and deliberately does not cache API responses or private uploads. Offline behavior has not been field-verified. Route-distance pricing is an estimate until a production routing provider is configured. The waybill checkout API is present, but a customer-facing waybill payment action still needs UX completion.
