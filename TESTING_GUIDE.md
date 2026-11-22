# DigiTrans Logistics — End-to-End Testing & Role Walkthrough Guide

This guide covers automated verification and manual end-to-end testing across **Public Visitors** and all **11 authenticated application roles** (`customer`, `student`, `rider`, `vendor`, `investor`, `ops_officer`, `rider_manager`, `vendor_manager`, `finance_officer`, `investment_manager`, and `super_admin`).

---

## 1. Automated Verification Commands

Run these before manual QA or deployment:

```sh
npm test            # Runs server/*.test.js against PGlite migrations, seed, route SQL, payments, RBAC, filters, CSV, and notification links
npm run build       # Builds production Vite bundle into dist/
git diff --check    # Verifies clean whitespace and no conflict markers
```

---

## 2. Environment & Test Account Provisioning

DigiTrans ships **zero pre-seeded user accounts or passwords** in `supabase/seed.sql`. Provision test accounts safely against a local or isolated staging environment:

1. **Public sign-up roles** (`customer`, `student`, `rider`, `vendor`, `investor`):
   - Register through `/register` (or `POST /api/auth/register`) and complete email verification.
2. **First `super_admin` account**:
   - Provisioned during guarded seeding using `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_ADMIN_NAME` (`npm run db:seed -- --apply`).
3. **Other administrative roles** (`ops_officer`, `rider_manager`, `vendor_manager`, `finance_officer`, `investment_manager`):
   - Signed in as `super_admin`, open **`Admin users`** (`/ops/admin-users` / workspace key `team`), create an invitation for the target position, and accept the one-time link at `/admin/invite`.

---

## 3. Public Visitor Flows (Unauthenticated)

| Flow | Steps | Expected Result |
| --- | --- | --- |
| Public site & banners | Visit `/`, `/services`, `/market-runs`, `/intercity-waybills`, `/tracking`, `/investment`, `/contact` | Active zones, pricing notice, FAQs, and CMS banners render cleanly without authentication errors. |
| Public waybill lookup | Enter a waybill number (e.g. `DWB-...` / `WB-...`) on `/tracking` | Shows parcel milestone timeline only; never leaks private customer PII or internal ops notes. |
| Public contact enquiry | Submit form on `/contact` | Returns confirmation; enquiry appears under **`Public enquiries`** (`/ops/contact`) for staff with `support.manage`. |
| Route protection | Navigate directly to `/customer`, `/rider`, `/vendor`, `/investor`, or `/ops` while signed out | Redirects to `/login?next=<encoded_path>`; returns to the requested page after sign-in. |
| Phone or email sign-in | Sign in with `080...`, `+23480...`, or email | Both Nigerian phone formatting and email resolve to the same account without revealing account existence on unknown inputs. |

---

## 4. Non-Admin Workspace Walkthroughs

### 4.1 Customer (`customer`) — `/customer/*`
- **Overview (`/customer`)**: Shows active/completed delivery counts, Market Runs, saved addresses, and clickable recent deliveries opening `/customer/history?focus=<id>`.
- **Book a delivery (`/customer/booking`)**:
  - Test immediate (`now`) and scheduled (`scheduled`, 2 hrs – 7 days window) estimates and bookings.
  - Confirm server-computed fare and prohibited-items confirmation enforcement.
- **Delivery history (`/customer/history`)**:
  - Filter by status, timing (`now` / `scheduled`), date range (`from` / `to`), and search text (reference, recipient, pickup, or dropoff address).
  - Verify invalid date ranges (`from > to` or invalid calendar date) are blocked cleanly.
  - Click **Rebook** → opens `/customer/booking?rebook=<id>` with pickup/dropoff/package details pre-filled.
  - Click **Pay now** → redirects to Paystack hosted checkout (`/payment/return` verifies server-side).
  - Click **Download CSV** → exports `digitrans-deliveries.csv` with UTF-8 BOM and formula neutralization.
  - Click **Get help** → navigates to `/customer/support?relatedId=<ref>&category=delivery` and opens the pre-filled modal.
- **Market Runs (`/customer/market`)**:
  - Submit shopping list, review staff estimate, approve/decline, pay when awaiting payment, filter list, and download `digitrans-market-runs.csv`.
- **Intercity waybills (`/customer/waybills`)**:
  - Create waybill request, filter by status/payment/date/search, click **Get help**, and download `digitrans-waybills.csv`.
- **Payments (`/customer/payments`)**:
  - Filter across all statuses including **`Cancelled`** and **`Reversed`**, search by reference/provider ref, export `digitrans-payments.csv`, and click **Get help**.
- **Notifications & Help (`/customer/notifications`, `/customer/support`)**:
  - Click a notification in the bell popover or `/customer/notifications` → jumps directly to `/customer/history?focus=...`, `/customer/waybills?focus=...`, `/customer/market?focus=...`, `/customer/payments?focus=...`, or `/customer/support?ticket=...` and highlights the target card.
  - Open a support ticket with `related_context` → click **Open record** to jump straight back to that delivery/waybill/payment.

### 4.2 Student (`student`) — `/customer/*`
- Shares the `/customer` workspace prefix (`ROLE_PREFIX.student === '/customer'`) plus student-specific eligibility controls:
- **Student ID (`/customer/documents`)**:
  - Reachable via both the sidebar **`Student ID`** link and the **`Student ID`** CTA on the Student banner in `/customer`.
  - Upload valid JPG/PNG/PDF student ID; verify status starts `pending` until reviewed by an admin with `students.review`.
- **Student pricing verification**:
  - Before approval, quote calculates standard rate; after admin approval (`students.review` on `/ops/students`) with valid expiry, quote and booking apply `student_flat`.
- **Account notification deep-link**:
  - Clicking a student verification notification routes to `/customer/documents`.

### 4.3 Rider (`rider`) — `/rider/*`
- **Profile & Documents (`/rider/profile`, `/rider/documents`)**:
  - Save personal details, vehicle type, guarantor, and bank details; upload documents; accept current rider agreement version on `/rider`.
  - Confirm rider cannot toggle availability (`available`) until both `approval_status === 'approved'` and current agreement is accepted.
- **Assignments (`/rider/jobs`, `/rider`)**:
  - Accept an assigned job, advance milestones sequentially (`rider_accepted` → ... → `arrived_at_destination`), upload optional delivery photo proof, and complete delivery (or report an issue to mark `delivery_failed`).
  - Verify clicking **Get help** pre-fills `/rider/support?relatedId=<ref>&category=delivery`.
- **Earnings & Settlements (`/rider/earnings`)**:
  - Verify completed eligible deliveries appear with backend-calculated `rider_earnings`.
  - Download `digitrans-rider-earnings.csv`.
  - Request a withdrawal (`>= ₦1,000`), verify balance reservation, and verify `?focus=<id>` highlights earnings/withdrawals/settlements from notifications.

### 4.4 Business / Vendor (`vendor`) — `/vendor/*`
- **Pending vs. Approved Gate**:
  - Before approval, `/vendor` displays verification banner with **`Business documents`** shortcut to `/vendor/documents`; `/vendor/booking` shows approval notice and `POST /api/deliveries` rejects with `403`.
  - Once approved by `vendor_manager` / `super_admin`, `/vendor/booking` accepts deliveries and `/vendor/deliveries`, `/vendor/history`, `/vendor/payments`, and `/vendor/support` track only deliveries tied to `vendor_id`.
- **Recent activity focus**:
  - Clicking a recent delivery card on `/vendor` jumps to `/vendor/deliveries?focus=<id>` and highlights the card.

### 4.5 Investor (`investor`) — `/investor/*`
- **Verification & Profile (`/investor/profile`, `/investor/documents`)**:
  - Save residential address and masked ID number; upload identity document; confirm unverified investors receive `403` if applying before approval.
- **Opportunities & Applications (`/investor/opportunities`, `/investor/applications`)**:
  - Apply after accepting both terms and risk disclosure; verify projected figures stay clearly labeled as non-guaranteed.
  - Fund approved applications via Paystack (`serviceType: 'investment'`); verify capacity-overflow scenarios route to `under_review` rather than double-allocating capacity.
  - Export `digitrans-investment-applications.csv` and click **Get help** (`category=investment`).
- **Withdrawals & Maturity (`/investor/withdrawals`)**:
  - View investment maturity cards and submitted **`Withdrawal requests`** (focusable via `?focus=<withdrawal_id>` from notifications).
  - Submit withdrawal only on eligible matured investments.

---

## 5. Administrative Role Walkthroughs (`/ops/*`)

Each admin position receives a sidebar and `/ops/attention` queue filtered dynamically by its `role_permissions`:

| Role | Primary Workspace Scope | Key Checks |
| --- | --- | --- |
| **`ops_officer`** | Deliveries, Manual Booking, Students, Riders, Waybills, Market Runs, Support, Contact | Sees delivery/verification/waybill/market-run/support queues in `/ops/attention`; **cannot** access `/ops/finance`, `/ops/payments`, `/ops/investments`, `/ops/pricing`, `/ops/website`, `/ops/audit`, or `/ops/admin-users`. |
| **`rider_manager`** | Riders (`/ops/riders`), Deliveries (`/ops/deliveries`), Users (`/ops/customers`), Support (`/ops/support`) | Can review rider apps + documents (`?focus=<rider_id>` from `account` notifications), assign/update deliveries, and answer support. Blocked from finance, vendors, students, investments. |
| **`vendor_manager`** | Vendors (`/ops/vendors`), Deliveries read-only (`/ops/deliveries`), Users (`/ops/customers`), Support (`/ops/support`) | Can approve/reject/suspend vendor accounts; cannot assign riders or approve finance payouts. |
| **`finance_officer`** | Finance & Settlements (`/ops/finance`), Payments (`/ops/payments`), Rider Payout Requests (`/ops/withdrawals`), Deliveries & Investments read-only | Sees only financial/withdrawal/payment-review queues in `/ops/attention`. Can approve settlements, verify/record payouts (`withdrawal_requests`, `investment_withdrawals`), export `digitrans-rider-earnings-ledger.csv`, `digitrans-settlements.csv`, `digitrans-rider-withdrawals.csv`, and `digitrans-payments.csv`. |
| **`investment_manager`** | Investment Overview (`/ops`), Investments (`/ops/investments`), Finance read-only | Default `/ops` overview renders `InvestorManagerOverview` + compact **`NeedsAttentionSection`**. Can draft/review opportunities, approve/reject investor applications, export `digitrans-investor-applications.csv` and `digitrans-investor-withdrawals.csv`; **cannot** publish opportunities (Super Admin only). |
| **`super_admin`** | Full access including Pricing (`/ops/pricing`), Public Website (`/ops/website`), Audit (`/ops/audit`), Admin Users (`/ops/admin-users`) | Can publish approved opportunities, run cryptographic audit verification (`GET /api/ops/audit/integrity`), export up to 10,000 filtered audit rows (`digitrans-audit-logs.csv`), invite admins, change admin positions (revoking sessions), and edit the live RBAC permission matrix with dependency enforcement. |

### Key Ops Workflow Checks
1. **Needs Attention Queue (`/ops` & `/ops/attention`)**:
   - Filter by category (`deliveries`, `market_runs`, `waybills`, `verifications`, `finance`, `investments`, `support`) and search text.
   - Click any item's action button → navigates directly to the target workspace page with `?focus=<id>` (or `?ticket=<id>` / `?tab=applications&focus=<id>`) and scrolls/highlights the exact card.
2. **Support Desk (`/ops/support`)**:
   - Verify linked `related_context` badge and **`Open record`** button only appear when the viewing admin holds permission for that underlying resource type.
   - Add an **internal note** (`is_internal = true`), then check the ticket as the customer/rider/investor to confirm internal notes remain strictly hidden from non-staff.
3. **CSV Exports Across Ops**:
   - Verify CSV files open cleanly in Excel/LibreOffice (UTF-8 BOM preserves `₦` currency/symbols) and neutralize spreadsheet formula prefixes (`=`, `+`, `-`, `@`).

---

## 6. Cross-Role Security & Negative Test Matrix

| Security / Isolation Check | How to Test | Expected Result |
| --- | --- | --- |
| Cross-role URL switching | While signed in as `rider`, visit `/customer/history` or `/ops/finance` | Redirects immediately back to `/rider` (`ROLE_HOME.rider`); API returns `403`. |
| Cross-user `?focus=` leakage | As Customer B, open `/customer/payments?focus=<Customer A payment ID>` | Returns empty list; `GET /api/payments?focus=...` enforces `user_id = req.user.id`. |
| Cross-user `POST /api/support` `relatedId` | As Customer B, submit `{ category: 'delivery', relatedId: '<Customer A DEL-ref>' }` | API returns `404 Related record not found.`; never reveals or links Customer A's record. |
| Unauthorized `/ops/attention` | Call `GET /api/ops/attention` as `customer`, `rider`, `vendor`, or `investor` | Returns `403`. |
| Unverified Paystack callback / webhook | Send unsigned `POST /api/payments/paystack/webhook` or wrong HMAC signature | Returns `401`/`400`; payment status and financial ledgers remain unchanged. |
| Invalid date filter parameters | Pass `?from=2026-02-30` or `?from=2026-11-20&to=2026-11-01` to `/api/payments`, `/api/deliveries`, `/api/ops/waybills`, etc. | Returns `400` validation error cleanly instead of SQL `500`. |
| Permission revocation enforcement | As `super_admin`, remove `finance.manage` from `finance_officer`, then try approving a settlement as `finance_officer` | API denies action immediately (`403`) on the next request. |
