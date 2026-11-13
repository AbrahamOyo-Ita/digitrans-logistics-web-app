# Senior Engineering Prompt: Migrate DigiTrans from SQLite to Supabase

You are a senior staff-level backend and platform engineer. Modify the existing DigiTrans Logistics application in this repository to replace its local `sql.js`/SQLite backend with Supabase Postgres, Supabase Auth, and Supabase Storage where appropriate.

This is a production-oriented migration, not a superficial environment-variable change. The completed application must no longer depend on local SQLite files, `sql.js`, local database persistence, or local filesystem storage for production data.

## Product and repository context

DigiTrans is a logistics and delivery platform with:

- Customer registration, login, sessions, password reset, profiles, and notifications.
- Rider onboarding, approval, documents, agreements, availability, assignments, earnings, settlements, and withdrawals.
- Vendor onboarding, approval, business documents, market-run orders, and expenses.
- Student profiles and verification documents.
- Investor profiles, opportunities, applications, agreements, investments, earnings, withdrawals, and financial ledger records.
- Deliveries, delivery assignments, status history, proof of delivery, tracking, pricing, service zones, market runs, waybills, parcels, payments, refunds, ratings, support tickets, contact messages, FAQs, banners, audit logs, and system settings.
- Paystack payment initiation and verification.
- Resend email integration.
- A React/Vite frontend and an Express Node.js API.

The current backend is in `server/`. It imports `server/db.js`, which initializes `sql.js`, creates the SQLite schema, and exposes a synchronous wrapper with methods such as `prepare().get()`, `prepare().all()`, `prepare().run()`, `exec()`, and `transaction()`. Many route modules currently issue raw SQLite SQL through that wrapper.

Relevant areas include:

- `server/db.js`
- `server/index.js`
- `server/auth.js`
- `server/seed.js`
- `server/pricing.js`
- `server/payments.js`
- `server/routes/*.js`
- `server/uploads.js`
- `server/config.js`
- `server/*.test.js`
- `client/src/lib/api.js`
- `.env.example`
- `.env/api.env.example`
- `.env/frontend.env.example`

Preserve the existing HTTP API contract and frontend behavior wherever practical. Do not rewrite the product into a different framework.

## Primary objectives

1. Replace SQLite with Supabase Postgres as the authoritative database.
2. Replace custom password/session persistence with Supabase Auth where appropriate, while preserving the existing API routes and role model.
3. Replace local upload persistence with Supabase Storage.
4. Preserve existing business rules, route behavior, response shapes, role permissions, payment state transitions, audit logging, and scheduled jobs.
5. Make the application safe for a long-running production API deployment and a separately deployed Vercel frontend.
6. Remove production dependence on local files and local database paths.
7. Provide an idempotent schema migration, seed process, environment templates, tests, and deployment documentation.

## Required architecture

Use the official Supabase JavaScript client on the server with a server-only privileged credential.

Create a dedicated server-side Supabase module, for example:

```text
server/supabase.js
server/supabase-admin.js
server/storage.js
```

The server client must use:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or the current Supabase server secret equivalent

Never expose the service-role/secret key to the browser, Vite, `VITE_*` variables, Git, logs, error responses, or client bundles.

The browser may use Supabase Auth directly only if that is clearly useful and secure. Prefer keeping the existing Express API as the application boundary and using a server-side Supabase client for database and privileged operations. If Supabase Auth is used from the browser, use only the publishable/anon key and configure secure session handling correctly.

## Database migration requirements

Create a reviewed SQL migration under a conventional directory such as `supabase/migrations/`.

Translate the complete schema from `server/db.js` into PostgreSQL. Include every table, column, relationship, uniqueness rule, default, index, and business-critical constraint. The schema includes, at minimum:

`roles`, `permissions`, `role_permissions`, `users`, `profiles`, `sessions`, `password_resets`, `addresses`, `student_profiles`, `student_documents`, `riders`, `rider_documents`, `rider_guarantors`, `rider_vehicles`, `rider_agreements`, `vendors`, `vendor_documents`, `investors`, `investor_documents`, `opportunities`, `investment_applications`, `investment_agreements`, `investments`, `investment_earnings`, `investment_withdrawals`, `service_zones`, `pricing_versions`, `waybill_pricing`, `deliveries`, `delivery_assignments`, `delivery_status_history`, `delivery_proof`, `market_runs`, `market_run_items`, `market_run_expenses`, `waybills`, `waybill_parcels`, `waybill_tracking_events`, `payments`, `refunds`, `rider_earnings`, `rider_settlements`, `rider_settlement_items`, `withdrawal_requests`, `rider_withdrawal_items`, `financial_ledger`, `notifications`, `support_tickets`, `support_messages`, `contact_messages`, `banners`, `faqs`, `audit_logs`, `system_settings`, and `ratings`.

Use PostgreSQL-native types and features deliberately:

- `uuid` for identifiers where the current application generates IDs.
- `timestamptz` for timestamps.
- `numeric` for monetary amounts; never use floating-point money columns.
- `jsonb` for structured fee breakdowns and audit snapshots where appropriate.
- Foreign keys with explicit delete/update behavior.
- Check constraints for statuses, amounts, and non-negative balances where safe.
- Unique indexes for emails, phones, references, waybill numbers, and other business identifiers.
- Indexes for all frequent lookup paths, foreign keys, tracking references, statuses, timestamps, and dashboard queries.

Do not blindly convert SQLite quirks. Review every query for PostgreSQL compatibility, especially:

- `INSERT OR IGNORE`
- `INSERT OR REPLACE`
- SQLite `datetime()` and `date()` functions
- `LIKE` behavior
- `COALESCE`
- boolean values represented as `0`/`1`
- `ON CONFLICT`
- `LIMIT` and aggregation queries
- implicit type coercion
- transaction behavior

Create a safe, repeatable seed script for roles, permissions, service zones, pricing, FAQs, and non-sensitive demo data. Never seed demo credentials in production. Production bootstrap admin creation must require explicit environment configuration and must hash the password safely.

## Auth and authorization

Migrate authentication to Supabase Auth without weakening the existing role model.

Required behavior:

- Email/password registration and login.
- Email verification support.
- Password reset using Supabase Auth recovery flows or secure server-managed equivalents.
- Secure HTTP-only session handling where the Express API owns authentication.
- Correct logout and session revocation behavior.
- Rejection of disabled, rejected, or revoked accounts.
- Preservation of application roles such as customer, student, rider, vendor, investor, operations, finance, support, and super admin.
- Role and permission checks must remain server-side and must not trust editable user metadata.
- Authorization must be based on verified server-side identity and database-backed role/permission records.

If using Supabase Auth users, create a safe mapping from `auth.users.id` to the application profile/account record. Do not store passwords in the application database after migration. Do not use `user_metadata` for authorization decisions; use a protected application table or trusted claims controlled by the server.

## Row Level Security

Enable RLS on every exposed application table.

Design policies intentionally:

- Customers can read and update only their own profile and records.
- Riders can read and update only their own onboarding, availability, earnings, and assigned work within approved workflow rules.
- Vendors and investors can access only their own records.
- Operations, finance, support, and super-admin access must be role-scoped.
- Public pages may read only explicitly public content such as published FAQs, banners, service zones, and pricing data.
- Audit logs, financial ledger records, payment records, identity documents, and private support messages must not be publicly readable.
- Storage buckets must have policies matching the owner and staff access model.

Do not use broad `authenticated` policies without an ownership predicate. Do not use `SECURITY DEFINER` as a shortcut for authorization. Document any server-only service-role access and ensure it is never called directly by untrusted browser code.

## Data access layer

Do not scatter raw Supabase calls throughout every route. Create a clear data-access/service layer that:

- Centralizes Supabase client creation.
- Normalizes Supabase errors into safe application errors.
- Provides typed or consistently shaped repository functions.
- Supports transactions for multi-write workflows.
- Preserves atomicity for payment verification, delivery assignment, status transitions, rider settlement, investment funding, and manual reconciliation.
- Avoids N+1 queries in dashboards and list endpoints.
- Uses explicit column selection rather than `select('*')` for sensitive tables.

Supabase's REST client does not provide arbitrary multi-statement transactions. For workflows that must be atomic, implement Postgres RPC functions or a server-side transactional mechanism. Payment verification and financial mutations must never be split into unsafe independent requests.

Preserve response shapes expected by the existing React frontend. If a response must change, update all consumers and add regression tests.

## Storage migration

Replace local `uploads/` persistence with Supabase Storage.

Create private buckets for:

- identity documents
- rider/vendor/investor documents
- delivery proof
- market-run receipts

Use generated storage paths that include the owning account or record ID. Store only storage paths and metadata in Postgres. Do not store public URLs for private files as permanent authorization. Generate short-lived signed URLs after server-side authorization. Validate MIME type, file signature, size, extension, ownership, and access role.

Remove production reliance on `UPLOADS_DIR`. Keep local filesystem support only if clearly isolated for tests or local development, and document that it is not a production persistence mechanism.

## Payments and scheduled jobs

Preserve Paystack integration and make webhook processing idempotent.

- Verify webhook signatures.
- Store provider references with unique constraints.
- Make duplicate webhook delivery safe.
- Use atomic database transitions for payment, delivery, waybill, investment, and ledger updates.
- Preserve the existing callback URL behavior.
- Never log secret keys or full payment payloads containing sensitive data.

Keep scheduled cleanup and dispatch jobs, but make them safe for a single active worker. If the deployment may run multiple API instances, use Postgres advisory locks or a Supabase/Postgres-backed job lock so scheduled work cannot run twice concurrently.

## Environment configuration

Update the environment templates with clear separation:

```env
# Server-only
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME

# Browser-safe only, if the browser client is used
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=REPLACE_ME
```

Also retain the existing application settings for:

- `NODE_ENV`
- `APP_URL`
- `CLIENT_ORIGINS`
- `PORT`
- `TRUST_PROXY`
- `PAYSTACK_SECRET_KEY`
- `PAYMENT_CALLBACK_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_RECIPIENT_EMAIL`

Remove or deprecate SQLite-only variables such as `DATABASE_PATH` after the migration is complete. Do not place secrets in `.env` files that are committed. Update `.gitignore`, README documentation, Vercel instructions, and API-host instructions.

## Testing and verification

Add or update tests for:

- Supabase configuration validation.
- Missing or malformed credentials.
- Auth registration, login, logout, reset, and revoked-account behavior.
- Role and permission enforcement.
- RLS policy behavior for owner, staff, and unauthenticated access.
- Database constraints and duplicate prevention.
- Atomic payment webhook handling and duplicate webhooks.
- Delivery status transitions and assignment conflicts.
- Storage upload authorization and signed URL expiry.
- Seed idempotency.
- Scheduled job locking.
- Production startup with Supabase and no SQLite path.

Use a disposable Supabase project or local Supabase environment for integration tests. Never run destructive migrations against a user's production project without explicit confirmation. Never print secret values in test output.

Run and report:

```text
npm test
npm run build
supabase db lint --linked --level warning
```

Also run a production-mode smoke test covering health, authentication, CORS, a protected API request, a file authorization path, and a payment webhook signature path.

## Migration and rollout plan

Implement the migration in reviewable phases:

1. Add Supabase configuration and client modules.
2. Add the complete Postgres schema and indexes.
3. Add seed and migration utilities.
4. Implement repositories/services and migrate route modules.
5. Migrate Auth and session handling.
6. Migrate Storage.
7. Add RLS and storage policies.
8. Update tests and deployment configuration.
9. Remove SQLite runtime dependencies and dead code.
10. Run full verification and document deployment.

Provide a data migration utility if an existing SQLite database contains real data. It must:

- Require explicit source and destination configuration.
- Preserve IDs and relationships where safe.
- Hash or migrate users through a supported Supabase Auth flow; never copy plaintext passwords.
- Validate row counts and key relationships.
- Produce a reconciliation report.
- Be restartable and idempotent.
- Never delete the source database automatically.

## Non-negotiable constraints

- Do not leave the application silently falling back to SQLite.
- Do not expose service-role or secret keys to the browser.
- Do not weaken authorization to make the migration easier.
- Do not disable RLS as a workaround.
- Do not use local disk for production database data or private uploads.
- Do not rewrite unrelated frontend design or business copy.
- Do not claim the migration is complete until tests and production-mode startup pass without SQLite.
- Do not commit real Supabase, Paystack, Resend, or admin credentials.

## Definition of done

The migration is complete only when:

- The server starts successfully with Supabase environment variables and no `DATABASE_PATH`.
- `sql.js` is removed from runtime dependencies and SQLite initialization code is removed or isolated exclusively to a clearly labeled migration tool.
- All API routes work against Supabase Postgres.
- Auth, roles, permissions, audit logs, payments, uploads, and scheduled jobs retain their intended behavior.
- RLS and Storage policies are enabled and tested.
- Production data is stored in Supabase, not local files.
- The frontend builds with the documented Vercel variables.
- `npm test` and `npm run build` pass.
- The README contains exact setup, migration, deployment, backup, rollback, and secret-management instructions.
- The final report lists changed files, migration commands, environment variables, tests run, known limitations, and any manual Supabase Dashboard steps still required.

Begin by inspecting the existing schema and route contracts. Produce a short migration plan and risk list before editing. Then implement the migration incrementally, verify each phase, and finish with a concise operational handoff.
