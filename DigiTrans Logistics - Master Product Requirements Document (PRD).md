# **DIGITRANS LOGISTICS**

# **MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD)**

**Product:** DigiTrans Logistics  
**Document Type:** Master Product Requirements and Functional Specification  
**Product Category:** Multi-Service Logistics and Delivery Management Platform  
Initial Operating Market: Calabar, Cross River State, Nigeria  
Expansion Market: Other Nigerian cities and intercity delivery routes  
Primary Delivery Methods: Bicycles, electric bicycles, motorcycles and approved logistics partners  
Document Status: Master Development Specification (Phase One Operational Baseline)  
Priority: Production-Ready Implementation

| Specification Attribute | Baseline Requirement Detail |
| :---- | :---- |
| **Target Tech Stack** | Decoupled Client-Server (Next.js 14 / TypeScript \+ Supabase Backend) |
| **Database & Financial Standard** | PostgreSQL Integer Standard (Stored in Kobo: ₦1,000 \= 100,000 Kobo) |
| **Rider Interface Type** | Mobile-First Progressive Web Application (PWA) |
| **Development Budget & Status** | Total ₦450,000 (₦100,000 Deposit Paid) |
| **Primary Project Contact** | Abraham Oyo-Ita (Lead Architect & Product Lead) |

# **1\. PRODUCT OVERVIEW**

# **1.1 Product Description**

DigiTrans is a multi-service logistics and delivery platform designed to coordinate local deliveries, intercity parcel transportation, market procurement, business deliveries, student delivery services, and logistics investment operations.

The platform connects customers, riders, vendors, investors, and internal operations teams through a unified system.

Customers can request deliveries, track orders, book Market Runs, submit waybills, and manage their accounts.

Riders can register, submit verification documents, receive delivery assignments, update delivery progress, submit proof of delivery, and monitor their earnings.

Vendors can register their businesses, manage delivery requests, monitor fulfilment, and access their delivery records.

Investors can view approved investment opportunities, submit applications, accept agreements, and monitor investment performance.

Operations personnel manage daily business activities, including account approvals, manual bookings, rider assignments, delivery pricing, waybills, Market Runs, financial settlements, investment records, and overall platform administration.

The platform must operate through connected interfaces backed by a central database, secure authentication, controlled permissions, and consistent business logic.

# **1.2 Product Objectives**

The platform must:

1. Allow customers to book and track local deliveries.  
2. Support immediate and scheduled delivery requests.  
3. Support student delivery pricing and eligibility verification.  
4. Allow customers to request shopping and procurement services through Market Runs.  
5. Support intercity parcel and waybill processing.  
6. Allow riders to register, complete verification, and manage assigned jobs.  
7. Calculate rider earnings accurately.  
8. Allow vendors to request and monitor deliveries.  
9. Provide investors with controlled access to approved investment opportunities.  
10. Give operations personnel complete control over logistics activities.  
11. Support manual bookings created by internal staff.  
12. Provide reliable delivery pricing and assignment workflows.  
13. Maintain accurate financial records and settlement histories.  
14. Protect private customer, rider, vendor, and investor information.  
15. Provide a complete audit trail for sensitive administrative actions.  
16. Support mobile devices and unreliable network conditions.  
17. Provide a foundation for expansion into additional Nigerian cities.

# **1.3 Product Principles**

Every implementation must follow these principles:

* **One central source of truth** for platform data.  
* **Role-based access control** across all interfaces.  
* **Server-side validation** for all critical operations.  
* **No financial calculation based solely on frontend values**.  
* **No unauthorized access** to another user's private records.  
* **Every transaction must have a unique reference**.  
* **Every sensitive action must be traceable**.  
* **Every status transition must follow an approved workflow**.  
* **Financial records must remain strictly auditable**.  
* **Users must receive clear feedback** when actions succeed or fail.  
* **All critical workflows must function seamlessly on mobile devices**.  
* **Administrative actions must never bypass core business validation rules**.

# **2\. PLATFORM ARCHITECTURE AND INTERFACES**

DigiTrans contains five connected workspaces and a public-facing web application.

# **2.1 Public Website**

The public website introduces DigiTrans, presents key service offerings, and provides entry points into platform account workspaces.

Required public pages:

1. Home  
2. About DigiTrans  
3. Local Delivery  
4. Intercity Delivery  
5. Market Runs  
6. Student Delivery  
7. Business and Vendor Services  
8. Rider Registration  
9. Investment Information  
10. Contact  
11. Frequently Asked Questions  
12. Terms and Conditions  
13. Privacy Policy  
14. Prohibited Items Policy  
15. Delivery and Refund Policy  
16. Investment Risk Disclosure

## **Homepage requirements**

dynamics include:

* Brand identity and main application navigation.  
* Hero section with service value proposition and hero promotional slider.  
* Primary customer booking call-to-action (CTA).  
* Secondary registration triggers for riders and business vendors.  
* Explanatory sections for Local Deliveries, Intercity Waybills, Market Runs, Student Rates, and Merchant Logistics.  
* Service coverage area information (baseline focusing on Calabar).  
* Dynamic promotional banner integration managed via the Admin Console.  
* Comprehensive FAQ, contact points, and legal policy footers.

## **Website administration**

Operations administrators must be able to:

* Upload promotional hero banners.  
* Edit campaign titles, subheadings, and destination CTA links.  
* Set active display date ranges.  
* Activate, deactivate, or reorder public banners.  
* Update public service contact information, service area bounds, and FAQs.

The system must strictly validate file format (PNG, JPG, WebP) and maximum image size (2MB). Inactive or expired promotional items must be hidden automatically from public view.

# **2.2 Customer Application**

A responsive web application allowing registered customers to book local deliveries, schedule future drop-offs, request Market Runs procurement, book waybill dispatches, track orders real-time, and manage profiles.

# **2.3 Rider Progressive Web Application**

A mobile-first PWA providing riders with job management, dispatch acceptance, turn-by-turn order progression, proof of delivery (PoD) capture, and earnings balance monitoring. Supports offline state queueing for status transitions under poor network conditions.

# **2.4 Vendor Portal**

A business dashboard for verified commercial merchants to submit single/bulk delivery requests, monitor active fulfillments, manage corporate addresses, and access monthly billing activity.

# **2.5 Investor Portal**

A restricted investment workspace allowing accredited investors to browse approved asset opportunities (bicycles, electric bikes), accept investment risk disclosures, sign agreements, and monitor returns.

# **2.6 Operations and Administration Console**

The central control tower for operations, dispatchers, finance managers, and system administrators. Enforces Role-Based Access Control (RBAC) to govern user approvals, manual dispatch bookings, waybill processing, fee configuration, ledger payouts, and security auditing.

# **3\. USER ROLES AND PERMISSIONS**

| User Role | Primary Function & Access Boundary | Core Permitted Actions |
| :---- | :---- | :---- |
| **Customer** | Service Ordering & Tracking | Manage profile, save addresses, book local/scheduled deliveries, request Market Runs, book waybills, track active jobs, submit ratings & complaints. |
| **Verified Student** | Discounted Logistics | All Customer permissions \+ auto-apply verified student tariff on eligible campus routes upon document validation. |
| **Approved Rider** | Fulfillment & Job Execution | PWA access, toggle availability (Online/Offline), accept assignments, update delivery lifecycle, upload PoD, view earnings & withdrawal logs. |
| **Vendor** | Commercial Delivery Operations | Bulk/Single delivery requests, view business order history, download billing statements, access dedicated support channels. |
| **Investor** | Asset Capital Allocation | View approved asset portfolios (e-bikes/bikes), submit investment capital, execute legal agreements, track projected vs. actual yields, request payouts. |
| **Operations Staff** | Dispatch & Customer Service | Manual phone/WhatsApp booking creation, rider dispatch assignment, Market Runs expense reconciliation, waybill desk processing. |
| **Rider Manager** | Fleet Compliance & Review | Onboarding verification queue, document auditing, guarantor checks, rider approvals, account suspensions, performance logs. |
| **Vendor Manager** | Merchant Onboarding | Review business registrations, approve vendor contracts, setup merchant pricing tiers, handle vendor inquiries. |
| **Finance Officer** | Financial Reconciliation | Ledger audits, rider payout approvals, daily settlement generation, expense verification, financial reporting. |
| **Investment Manager** | Portfolio Creation | Draft investment opportunities, setup asset returns, upload legal agreements, monitor investment maturity cycles. |
| **Super Administrator** | System Governance & System Config | Full system access, staff RBAC role assignment, global pricing engine adjustments, database maintenance, full security audit review. |

# **4\. AUTHENTICATION AND ACCOUNT MANAGEMENT**

# **4.1 Registration**

The platform supports user registration via secure input channels capturing:

* Full legal name.  
* Primary email address (unique identifier).  
* Phone number (formatted for Nigerian telephony, e.g., `+234...`).  
* Password & confirmation (validated client and server-side).  
* Account classification (`CUSTOMER`, `RIDER`, `VENDOR`, `INVESTOR`).  
* Mandatory consent checkboxes for Terms of Service and Privacy Policy.

## **Validation Rules**

* Reject missing required fields.  
* Validate RFC-compliant email formatting.  
* Enforce minimum password strength (8+ characters, at least one uppercase letter, one digit, and one special character).  
* Block duplicate email registration.  
* Prevent direct registration for administrative roles (`OPERATIONS`, `ADMIN`, `SUPER_ADMIN`).

# **4.2 Sign-in**

Credential authentication occurs strictly on the server (e.g., Supabase Auth). Upon successful validation:

* Generate secure JWT session tokens with embedded role claims.  
* Set HTTP-only, Secure, SameSite cookies.  
* Direct the user to their role-specific workspace dashboard.  
* Rate limit failed authentication attempts (maximum 5 failed attempts per 15-minute window per IP/email).

# **4.3 Session Management**

* Enforce absolute session expiry (default 7 days) and inactivity timeout (2 hours for administrative sessions).  
* Support manual sign-out with complete server token revocation.  
* Automatically invalidate sessions on password updates or account suspension.  
* Strictly disallow frontend-only simulated authentication states.

# **4.4 Password Recovery**

1. User submits email/phone identifier.  
2. System verifies existence silently (without leaking user presence).  
3. Generate a single-use, time-limited (15 minutes) cryptographically secure reset token.  
4. Deliver token via configured email/SMS gateway.  
5. User enters token and new password.  
6. Server validates token, updates password hash, and revokes all active account sessions.

# **4.5 Account Status Lifecycle**

Accounts transition through controlled states: `PENDING_VERIFICATION` → `ACTIVE` → `SUSPENDED` / `DEACTIVATED` / `ARCHIVED`. Operational access is blocked server-side whenever status is non-`ACTIVE`.

# **5\. CUSTOMER APPLICATION**

# **5.1 Customer Dashboard**

Displays live operational data: active job progress timelines, historical delivery counts, quick action shortcuts (New Booking, Market Run, Waybill), account verification badges (e.g., Verified Student status), and notifications.

# **5.2 Local Delivery Booking**

## **Input Requirements**

* Pickup location (address text \+ optional map pin coordinates).  
* Drop-off location (address text \+ optional map pin coordinates).  
* Recipient contact details (Full Name, Phone Number).  
* Parcel category (Documents, Electronics, Food/Groceries, Clothing, Fragile Items, Others).  
* Parcel description & estimated item value.  
* Delivery timing (Immediate `SEND_NOW` or `SCHEDULED`).  
* Delivery instructions for rider.  
* Policy agreement toggle (Prohibited goods compliance).

## **Location & Routing Validation**

Address entry invokes spatial geocoding or zone map resolution. System verifies both pickup and drop-off points reside within active DigiTrans operating boundaries (e.g., Calabar Municipal & Odukpani coverage zones). Unsupported locations are flagged with clear boundary error messages.

## **Delivery Timing Logic**

* **Send Now:** Immediately queues job into `AWAITING_CONFIRMATION` operational state.  
* **Scheduled:** User selects future dispatch date/time slot (must be at least 2 hours in future and within 7 calendar days). Stored in `deliveries` table; dispatch queue holds order until designated window opens.

## **Fare Calculation**

Fares are calculated strictly by backend server logic:

\$\$\\text{Delivery Fee} \= \\max\\left(\\text{Base Fee} \+ (\\text{Distance KM} \\times \\text{Rate Per KM}), \\text{Minimum Fee}\\right) \+ \\text{Surcharges} \- \\text{Discounts}\$\$

The customer views an itemized price breakdown (Base fare, Distance fee, Surcharge/Student Discount, Total) before confirming. Frontend price overrides are strictly ignored by the API.

## **Booking Confirmation**

On submission, the system generates a unique tracking reference (e.g., `DT-CAL-20261118-X9A2`), records database entities, fires customer confirmation notifications, and pushes the booking to the Operations Console dispatch map.

# **5.3 Delivery Status and Tracking Lifecycle**

```
[ Pending Confirmation ] ──► [ Awaiting Assignment ] ──► [ Assigned to Rider ]
                                                                │
[ Delivered ] ◄── [ Arrived at Destination ] ◄── [ In Transit ] ◄── [ Package Collected ] ◄── [ Rider Accepted ]
```

*Status changes record actor UUID, transition timestamp, GPS coordinates (if available), and status notes into `delivery_status_history`.*

# **5.4 Delivery History**

Customers can search and filter past bookings by tracking reference, status, or date range, viewing detailed breakdowns of charges, route maps, rider profiles, and downloadable electronic receipts.

# **6\. MARKET RUNS**

# **6.1 Description**

Market Runs allow customers to request shopping, grocery procurement, and errands executed by dedicated DigiTrans procurement agents. Prohibited items (illegal substances, unauthorized fuel transport) are strictly blocked.

# **6.2 Customer Shopping Request**

Form inputs capture recipient location, delivery timing, budget cap, and a structured itemized shopping list:

```
[
  {"item_name": "Fresh Tomatoes (Bucket)", "quantity": 1, "est_price_kobo": 300000},
  {"item_name": "Vegetable Oil (2L)", "quantity": 1, "est_price_kobo": 450000}
]
```

# **6.3 Fee Calculation Structure**

\$\$\\text{Total Estimate} \= \\text{Estimated Shopping Budget} \+ \\text{Configured Service Fee} \+ \\text{Delivery Fee}\$\$

*Example Breakdown:* Shopping Budget (₦5,000) \+ Market Run Service Fee (₦1,500) \= ₦6,500 Estimated Total.

# **6.4 Market Runs Workflow Lifecycle**

1. Customer submits itemized request & spending threshold.  
2. Operations reviews item list and assigns a Procurement Agent.  
3. Agent arrives at market, verifies price points, updates final estimate.  
4. If actual costs exceed spending threshold by \>5%, customer approval prompt is fired.  
5. Agent purchases items, uploads digital receipt photos to private storage bucket.  
6. Operations reviews receipts, locks actual expense total (`actual_shopping_total_kobo`).  
7. Delivery rider dispatched for pickup from procurement agent to final customer.

# **7\. INTERCITY WAYBILL AND PARCEL MANAGEMENT**

# **7.1 Overview**

Manages regional parcel dispatches between office hubs and regional nodes, supporting both online customer creation and walk-in office intake processing.

# **7.2 Waybill Order Submission**

Collects Sender Details (Name, Phone, Origin Hub), Recipient Details (Name, Phone, Destination Address/Hub), Parcel Attributes (Weight Category, Dimensions, Contents Description, Declared Insurance Value), and Delivery Mode (Hub Pickup vs. Doorstep Final Delivery).

# **7.3 Weight-Based Pricing Matrix**

Fares calculate using server-side tier tables configured by Super Admins:

| Weight Bracket | Baseline Example Price | Handling / Insurance Rule |
| :---- | :---- | :---- |
| **Tier 1 (\< 5kg)** | ₦1,500 | Standard Handling Included |
| **Tier 2 (5kg \- 10kg)** | ₦3,000 | Standard Handling Included |
| **Tier 3 (\> 10kg)** | ₦3,000 \+ ₦250/kg excess | Heavy Package Surcharge Applied |

# **7.4 Waybill Processing & Dispatch Workflow**

Walk-in customers present packages at DigiTrans hubs. Operations staff verify weight on physical scales, input confirmed attributes, collect payment, generate a unique Waybill Number (e.g., `WB-CAL-88391`), print barcoded physical bills, and assign the parcel to an outbound batch vehicle.

# **8\. RIDER REGISTRATION AND VERIFICATION**

# **8.1 Onboarding Data Collection**

Riders must complete a comprehensive onboarding registration flow:

* Personal Details: Full Legal Name, DOB, Phone Number, Residential Address, Profile Photo.  
* Identity Document: NIN, Voter Card, Driver's License, or International Passport photo upload.  
* Vehicle Record: Vehicle Type (Bicycle, Electric Bike, Motorcycle), Make/Model, Plate/Serial Number.  
* Bank Details: Bank Name, Account Number, Account Name (validated via payout gateway API).  
* Guarantor Information: Full Name, Relationship, Phone, Address, Occupation, Identification doc.

# **8.2 Rider Agreement Acceptance**

Riders must view and digitally execute the official DigiTrans Rider Agreement covering code of conduct, liability rules, safety guidelines, and commission terms. The system logs `agreement_version`, `accepted_at` timestamp, rider UUID, and audit IP address.

# **8.3 Operational Verification Queue**

Applications sit in `PENDING_APPROVAL` status. Rider Managers inspect documents, run guarantor verification calls, ensure agreement signature integrity, and switch account status to `APPROVED`. Unverified riders cannot access job dispatch queues.

# **9\. RIDER APPLICATION (PWA)**

# **9.1 Mobile Interface & Availability**

The mobile-first PWA presents an intuitive dashboard: Active Availability Toggle (`ONLINE` / `OFFLINE`), Assigned Jobs, Daily Earnings Balance, Active Delivery Navigation, and Performance Rating.

```
┌─────────────────────────────────────────────────────────┐
│ DIGITRANS RIDER PWA                  [ ONLINE  (•) ]    │
├─────────────────────────────────────────────────────────┤
│ Active Assignment: #DT-CAL-20261118-X9A2                │
│ Pickup: 14 Marian Road, Calabar                         │
│ Drop-off: Unical Malabor Republic                       │
│ Status: [ EN ROUTE TO PICKUP ]                          │
├─────────────────────────────────────────────────────────┤
│ Action: [ CONFIRM ITEM PICKUP (UPLOAD SNAPSHOT) ]       │
└─────────────────────────────────────────────────────────┘
```

# **9.2 Job Acceptance & Execution**

1. Admin/System assigns job to Rider. PWA triggers audio/visual prompt.  
2. Rider reviews pickup location and package category; clicks **Accept** (or Reject with reason code within 120 seconds).  
3. Rider clicks **En Route to Pickup** → **Arrived at Pickup** → **Package Collected** (Requires uploading pickup proof photo).  
4. Rider clicks **Out for Delivery** → **Arrived at Destination** → **Complete Delivery**.  
5. **Proof of Delivery (PoD):** Requires entering customer verification OTP or capturing recipient photo/digital signature.

# **10\. RIDER EARNINGS AND SETTLEMENTS**

# **10.1 Financial Ledger Architecture**

All monetary values are stored as 64-bit BigInt Integers representing Kobo (₦1.00 \= 100 Kobo) to eliminate double/floating-point rounding inaccuracies. The financial system utilizes double-entry ledger logging (`financial_ledger` table).

# **10.2 Rider Commission Split Logic**

The default baseline platform revenue allocation is configured as follows:

\$\$\\text{Rider Share Kobo} \= \\text{Eligible Delivery Fee Kobo} \\times 0.25\$\$

\$\$\\text{DigiTrans Share Kobo} \= \\text{Eligible Delivery Fee Kobo} \\times 0.75\$\$

*Example Calculation:* Net Delivery Fee \= ₦4,000 (400,000 Kobo). Rider Credit \= ₦1,000 (100,000 Kobo); DigiTrans Share \= ₦3,000 (300,000 Kobo).

# **10.3 Daily Reconciliation & Payouts**

Upon job state transitioning to DELIVERED, the server automatically creates immutable credit entries in `financial_ledger`. Finance personnel review accrued earnings daily, run automated settlement checks, and process automated bank transfers to approved rider bank accounts.

# **10.4 Rider Withdrawal Workflow**

Where enabled, riders click **Request Withdrawal** in PWA:

1. Server checks `available_balance_kobo` against withdrawal request amount.  
2. If valid, locks funds in `pending_withdrawals`.  
3. Creates a withdrawal review entry for Finance Officers.  
4. Upon Finance approval, payment provider API (e.g., Paystack Transfers) initiates bank credit.  
5. System records payout transaction reference and updates balance.

# **11\. VENDOR PORTAL**

Commercial accounts allow local businesses (restaurants, eateries, bakeries, pharmacies, retailers) to scale delivery dispatches.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ VENDOR DASHBOARD — "Calabar Fresh Bakes"              [ Create Order ]   │
├──────────────────────────────────────────────────────────────────────────┤
│ Active Deliveries: 4  │ Completed Today: 18  │ Monthly Spend: ₦142,500   │
├──────────────────────────────────────────────────────────────────────────┤
│ Recent Orders                                                            │
│ • #DT-VEN-0092 | Recipient: Edem E.   | Status: Out for Delivery (Rider) │
│ • #DT-VEN-0091 | Recipient: Blessing | Status: Delivered (10:14 AM)     │
└──────────────────────────────────────────────────────────────────────────┘
```

Vendors can submit multi-drop orders, track rider delivery progress in real time, view custom contract rates, download tax invoices, and restrict staff logins using sub-account RBAC controls. Row-Level Security policies strictly segregate merchant data between vendor accounts.

# **12\. INVESTOR PORTAL**

# **12.1 Overview & Compliance**

Provides accredited individual and corporate investors structured visibility into green mobility logistics capital projects (Bicycles and Electric Bikes). All features include legal disclaimers stating that records represent system tracking operations and rely on formal execute legal contracts.

# **12.2 Investment Asset Opportunities**

Investment managers create asset pools detailing asset category, unit principal amount, contract duration (6 or 12 months), projected monthly yields, risk terms, and digital contract templates:

| Asset Opportunity Title | Principal (Kobo) | Term | Projected Monthly Yield | Asset Allocation |
| :---- | :---- | :---- | :---- | :---- |
| **Calabar E-Bike Fleet Tier A** | ₦250,000 (25,000,000) | 12 Months | 8.5% / month | Urban Delivery Expansion |
| **Cargo Bicycle Pool Phase 1** | ₦80,000 (8,000,000) | 6 Months | 6.0% / month | Campus & Short-Distance |

# **12.3 Subscription & Yield Tracking**

Investors browse active pools, select allocation sizes, digitally accept risk disclosures, and sign agreements. The investor dashboard tracks Principal Capital, Active Term, Projected Returns vs. Verified Actual Returns, Maturity Dates, and Withdrawal Eligibility.

# **13\. OPERATIONS AND ADMINISTRATION CONSOLE**

The central administrative workspace is organized into key operational domains:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DIGITRANS ADMIN CONSOLE                                      [ Admin: Abraham ] │
├───────────────┬─────────────────────────────────────────────────────────────────┤
│ • Overview    │ System Metrics Overview                                         │
│ • Deliveries  │ Active Deliveries: 42 | Available Riders: 18 | Waybills: 12     │
│ • Manual Order│ ─────────────────────────────────────────────────────────────── │
│ • Riders      │ Quick Actions:                                                  │
│ • Waybills    │ [ + Create Manual Booking ]  [ Approve Riders (3 Pending) ]     │
│ • Market Runs │ [ Manage Pricing Matrix ]    [ Review Withdrawal Requests ]     │
│ • Settings    │                                                                 │
└───────────────┴─────────────────────────────────────────────────────────────────┘
```

# **13.1 Manual Delivery Booking Engine**

Operations staff create manual bookings for orders arriving via offline channels (phone calls, WhatsApp messages, walk-ins):

* Staff inputs Customer Name, Phone, Pickup/Destination, Package details, and Fee.  
* System records `created_by_staff_id` audit reference to differentiate manual bookings from self-service customer orders.  
* Booking immediately enters operational dispatch queue for rider assignment.

# **13.2 System Configuration & Audit Logs**

Super Administrators utilize the console to adjust delivery base fees, distance multipliers, student flat rates, service zone boundaries, and system settings. Every administrative change (user approval, price edit, manual override) generates an immutable, non-deletable audit log entry detailing actor UUID, IP address, timestamp, pre-change value, and post-change value.

# **14\. PRICING AND ROUTING ENGINE**

# **14.1 Hybrid Pricing Engine Architecture**

The system uses a hybrid pricing evaluation workflow: calculating distance via mapping APIs while seamlessly falling back to geofenced Zone-to-Zone matrices if external mapping services fail or inputs lack street precision.

```
                ┌───────────────────────────────────┐
                │ INITIATE PRICING EVALUATION       │
                └─────────────────┬─────────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
     [ Customer = STUDENT? ]              [ Account = VENDOR? ]
        │ YES                                │ YES
        ▼                                    ▼
  Apply Verified Student Flat Rate    Apply Custom Contract Rate
        │                                    │
        └─────────────────┬──────────────────┘
                          │ NO / STANDARD
                          ▼
             ┌───────────────────────────┐
             │ Test Routing API Distance │
             └────────────┬──────────────┘
                          │
            ┌─────────────┴─────────────┐
    SUCCESS │                           │ FAIL / FALLBACK
            ▼                           ▼
  Formula: Base Fee +         Lookup Geofenced Zone
  (Distance KM × Rate/KM)     Matrix (Zone A -> Zone B)
            │                           │
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │ Apply Approved Surcharges │
            └────────────┬──────────────┘
                         │
                         ▼
          Return Authoritative Total Fee
```

# **14.2 Pricing Configuration Versioning**

When administrators adjust global pricing rules, the platform saves a new `pricing_versions` record. Existing active or historic bookings lock and maintain their creation pricing snapshot to prevent unexpected price alterations during invoice auditing.

# **15\. PAYMENTS AND FINANCIAL MANAGEMENT**

# **15.1 Integration Workflow**

Online transactions execute via payment gateway integrations (e.g., Paystack / Flutterwave):

1. Client initializes checkout; server generates a payment transaction intent with unique reference (`pay_ref_...`).  
2. Client completes payment step on secure gateway modal.  
3. Provider dispatches server-to-server cryptographically signed Webhook (`x-paystack-signature`).  
4. DigiTrans backend verifies signature HMAC, confirms authorization status, and atomically updates payment state from `PENDING` to `SUCCESSFUL`.  
5. Direct frontend callback state changes without verified backend webhook confirmation are treated as unverified.

# **15.2 Cash and Offline Payment Reconciliation**

For manual bookings or cash-on-delivery (COD) orders, riders/dispatchers flag payment as `CASH_COLLECTED_BY_RIDER`. The finance module automatically debits the collected cash amount against the rider's pending daily earnings balance to maintain accurate accounting.

# **16\. NOTIFICATION SYSTEM**

Events trigger real-time multi-channel alerts:

* Customer: Order confirmation, rider assigned, package picked up, delivery complete, receipt ready.  
* Rider: New job assignment alert, dispatch cancellation, weekly settlement credited.  
* Vendor: Bulk batch completion summary, monthly statement available.  
* Investor: Quarterly dividend posting, investment maturity alert.

Delivery channels support In-App Push notifications, transactional Email, and SMS/WhatsApp integration services.

# **17\. CUSTOMER SUPPORT AND COMPLAINT MANAGEMENT**

Customers, riders, vendors, and investors can open support tickets regarding order delays, damaged goods, or billing discrepancies. Support staff manage tickets via the Admin Console, communicating through threaded updates, escalating unresolved disputes, and applying administrative account credits or order refunds where justified.

# **18\. DATABASE AND DATA MANAGEMENT**

The PostgreSQL database relies on strict data integrity, foreign key references, cascading rules, and binary spatial indexes (PostGIS).

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    profiles     │1    * │    deliveries    │1    1 │    market_runs   │
├─────────────────┤───────├──────────────────┤───────├──────────────────┤
│ id (UUID, PK)   │       │ id (UUID, PK)    │       │ id (UUID, PK)    │
│ role (ENUM)     │       │ customer_id (FK) │       │ delivery_id (FK) │
│ full_name       │       │ assigned_rider   │       │ shopping_list    │
│ email           │       │ total_charge_kobo│       │ actual_total_kobo│
└─────────────────┘       └──────────────────┘       └──────────────────┘
         │1                        │1                         │1
         │                         │                          │
         │1                        │*                         │1
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ student_profiles│       │financial_ledger  │       │    waybills      │
├─────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (UUID, PK)   │       │ id (UUID, PK)    │       │ id (UUID, PK)    │
│ inst_name       │       │ user_id (FK)     │       │ delivery_id (FK) │
│ status (ENUM)   │       │ debit_kobo       │       │ waybill_number   │
└─────────────────┘       │ credit_kobo      │       │ weight_category  │
                          └──────────────────┘       └──────────────────┘
```

# **19\. SECURITY REQUIREMENTS**

# **19.1 Authentication & Authorization**

* Server-side Row-Level Security (RLS) policies enforce workspace isolation at the database layer.  
* Service role API keys must never be exposed in public client bundles.  
* All input requests undergo strict schema validation (Zod / Typebox).

# **19.2 Storage Security**

Identity proof documents, legal agreements, and guarantor records are uploaded to private storage buckets. Access requires short-lived (15-minute) authenticated signed URLs generated by authorized backend API handlers.

# **20\. RELIABILITY AND PERFORMANCE**

* **Mobile Optimizations:** PWA touch targets maintain a minimum dimension of 48px × 48px for outdoor ease of use.  
* **Low-Bandwidth Resiliency:** Uses skeleton loaders, optimistic UI updates, and local storage state sync to handle unreliable cellular networks.  
* **Database Performance:** Key index columns (`customer_id`, `assigned_rider_id`, `tracking_reference`, `created_at`) ensure query response times stay below 100ms under load.

# **21\. TECHNICAL IMPLEMENTATION SPECIFICATION**

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 FRONTEND AGENT                       │
│    [ Customer Web ]   [ Rider PWA ]   [ Vendor Hub ]   [ Admin Console]│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP ROUTER API                         │
│       • Server Actions                 • Zod Input Sanitization        │
│       • RBAC Middleware Guards         • Routing Engine Integration    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│      SUPABASE AUTH & STORAGE      │   │  POSTGRESQL DATABASE CLUSTER   │
│  • JWT Access Claim Tokens        │   │  • Double-Entry Integer Ledger │
│  • Private Storage Signed URLs    │   │  • Row-Level Security (RLS)    │
└───────────────────────────────────┘   └────────────────────────────────┘
```

# **22\. MANDATORY ACCEPTANCE TEST SUITE**

Every requirement in this specification serves as a release blocking test. Tests must pass in Staging before deployment to Production.

# **22.1 Customer & Booking Test Suite**

- [ ] Customer registers account, confirms email, and logs in successfully.  
- [ ] Customer submits local delivery booking; backend validates boundary limits and calculates authoritative price.  
- [ ] Customer schedules delivery for future time slot; job persists without premature dispatch.  
- [ ] System generates unique tracking reference; order details persist across sign-out/sign-in.  
- [ ] Unverified customer attempting student pricing is defaulted to standard pricing tariffs.  
- [ ] Customer A attempts direct URL access to Customer B's order details; system returns `403 Forbidden`.

# **22.2 Rider & Fulfillment Test Suite**

- [ ] Rider submits onboarding registration, identity document, vehicle records, and guarantor details.  
- [ ] Operations approves rider in Admin Console; rider profile updates to `APPROVED`.  
- [ ] Rider logs into mobile PWA, accepts DigiTrans Rider Agreement, and toggles status `ONLINE`.  
- [ ] Admin assigns delivery to rider; PWA receives assignment alert.  
- [ ] Rider completes delivery state progression: En Route → Pickup → Collected → Out for Delivery → Delivered.  
- [ ] Rider uploads pickup photo proof and collects customer OTP proof of delivery; status updates to `DELIVERED`.  
- [ ] Server updates financial ledger, crediting rider balance with exact 25% commission calculation.

# **22.3 Market Runs & Waybill Test Suite**

- [ ] Customer creates Market Run request with itemized list; admin assigns procurement agent.  
- [ ] Agent uploads receipt image; admin locks actual shopping total; system reconciles cost adjustments.  
- [ ] Walk-in customer submits parcel at office hub; admin inputs physical weight, generates barcoded waybill reference, and prints waybill.

# **22.4 Financial & Ledger Security Test Suite**

- [ ] All monetary operations execute using integer Kobo units; floating-point rounding errors are zero.  
- [ ] Attempted double completion of a single delivery generates zero duplicate ledger credits.  
- [ ] Rider submits withdrawal request exceeding available balance; server rejects request with insufficient funds error.  
- [ ] Payment provider webhook is simulated with invalid HMAC signature; backend rejects payload.

# **22.5 Security & Boundary Test Suite**

- [ ] Attempt to access private document bucket directly via raw public URL returns `404/403` error.  
- [ ] Non-admin user attempts API call to pricing modification endpoint; server blocks request with `403 Forbidden`.  
- [ ] Administrative actions (user approval, price change, manual dispatch) generate corresponding entries in `audit_logs`.

# **23\. RELEASE REQUIREMENTS**

Before production launch, the system must meet all baseline criteria:

1. **Zero High-Severity Security Flaws:** RLS policies verified; service keys absent from frontend bundles.  
2. **Complete Functional End-to-End Execution:** Every lifecycle (Order, Market Run, Waybill, Onboarding, Payout) tested without manual backend intervention.  
3. **Verified Financial Ledger:** Double-entry ledger balances verified to the exact Kobo.  
4. **Environment Infrastructure:** Production deployment environments running on Vercel and Supabase with custom domain configuration (`digitransdelivery.com`).

# **24\. DEVELOPMENT MILESTONES & IMPLEMENTATION ROADMAP**

| Milestone | Key Target Deliverables | Acceptance Target |
| :---- | :---- | :---- |
| **Milestone 1** | Public Website Infrastructure, Landing Pages, Service Descriptions, Dynamic Hero Slider. | Public pages load smoothly across mobile/desktop viewports; contact forms validate. |
| **Milestone 2** | Supabase Auth, RBAC Setup, Profile Entities (Customer, Student, Rider, Vendor, Investor). | Role workspace routing works; RLS rules enforce data privacy. |
| **Milestone 3** | Local Booking Engine, Rider PWA, Admin Dispatch Console, Proof of Delivery Module. | End-to-end local delivery lifecycle successfully completes with proof capture. |
| **Milestone 4** | Market Runs Shopping Engine, Intercity Waybill Module, Vendor Merchant Portal. | Shopping lists reconcile receipts; waybills generate barcodes; vendors manage dispatches. |
| **Milestone 5** | Double-Entry Integer Ledger, Rider 25% Commission Split, Investor Portfolio Portal. | Earnings calculate accurately in Kobo; payouts audit cleanly; investors view yields. |
| **Milestone 6** | Payment Gateway Webhooks, Notification Engine, Reliability Hardening, Launch. | Webhooks pass authentication checks; PWA works offline; system launches on custom domain. |

# **25\. CLIENT RESPONSIBILITIES AND BUSINESS DECISIONS**

DigiTrans management is responsible for providing and approving operational assets:

1. Official legal company details, logo graphics, and branding assets.  
2. Approved pricing structures for base fares, per-kilometer rates, student flat rates, and waybill weight tiers.  
3. Finalized Rider Legal Agreement text and Guarantor vetting policies.  
4. Payment gateway merchant account credentials (Paystack/Flutterwave API keys).  
5. Regulatory and legal clearance for investor asset programs.

# **26\. SCOPE CONTROL AND CHANGE MANAGEMENT**

Any proposed change to feature behavior, pricing rules, or system interfaces must be submitted via a formal Change Request documenting business rationale, tech stack impact, security considerations, and budget/schedule impacts. Major requirements may not be removed without formal written sign-off.

# **27\. DEFINITION OF DONE**

A platform feature is accepted as **DONE** only when:

1. Interface components are fully functional and responsive across mobile and desktop devices.  
2. Backend API routes perform input validation and enforce authorization checks.  
3. Database transactions update relevant records cleanly without data loss.  
4. Success and failure UI feedback states operate as expected.  
5. Security access rules and audit logging pass mandatory testing.  
6. Code passes integration and acceptance tests in the staging environment.

# **28\. FINAL PRODUCT EXPECTATION**

The final DigiTrans platform delivers a unified logistics engine for local dispatches, market runs, intercity waybills, merchant operations, and fleet investments. Supported by secure PostgreSQL database models, server-enforced business rules, dynamic pricing engines, and audit logs, the platform establishes a foundation for logistics operations in Calabar and expansion across Nigeria.