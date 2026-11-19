-- DigiTrans initial PostgreSQL schema; derived from server/db.js (55 SQLite tables).
-- Public `users` IDs are Supabase Auth UUIDs. Password hashes, sessions, and reset tokens are not copied:
-- Supabase Auth owns credentials/session lifecycle; legacy bcrypt hashes cannot be safely imported here.
-- All other application identifiers remain TEXT to preserve existing seeded and business IDs.
-- Do not apply to a production project until the API port, backup, Auth reset plan, and data dry-run are approved.

CREATE TABLE public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );
CREATE TABLE public.permissions (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    description TEXT
  );
CREATE TABLE public.role_permissions (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,

    role TEXT NOT NULL CHECK(role IN ('customer','student','rider','vendor','investor','ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin')),
    status TEXT NOT NULL DEFAULT 'pending_verification' CHECK(status IN ('pending_verification','active','rejected','suspended','deactivated','archived')),
    email_verified smallint NOT NULL DEFAULT 0,
    phone_verified smallint NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    dob TEXT,
    address TEXT,
    emergency_contact TEXT,
    profile_photo TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.addresses (
    id TEXT PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT,
    address_line TEXT NOT NULL,
    lat double precision, lng double precision,
    is_default smallint NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.student_profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    institution TEXT,
    matric_no TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','approved','rejected','expired')),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.student_documents (
    id TEXT PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.riders (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    vehicle_reg TEXT,
    vehicle_desc TEXT,
    bank_name TEXT, bank_account_name TEXT, bank_account_number TEXT,
    availability TEXT DEFAULT 'unavailable' CHECK(availability IN ('available','unavailable','on_delivery','suspended')),
    approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending','approved','rejected','suspended')),
    rejection_reason TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_documents (
    id TEXT PRIMARY KEY,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_guarantors (
    id TEXT PRIMARY KEY,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT, relationship TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_vehicles (
    id TEXT PRIMARY KEY,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, reg_no TEXT, description TEXT, condition TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_agreements (
    id TEXT PRIMARY KEY,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    accepted_at timestamptz DEFAULT now(),
    ip TEXT, session_ref TEXT,
    doc_ref TEXT
  );
CREATE TABLE public.vendors (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category TEXT,
    contact_person TEXT,
    business_address TEXT,
    service_location TEXT,
    description TEXT,
    operating_hours TEXT,
    logo TEXT,
    approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending','approved','rejected','suspended')),
    rejection_reason TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.vendor_documents (
    id TEXT PRIMARY KEY,
    vendor_id uuid NOT NULL REFERENCES public.vendors(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, file_path TEXT NOT NULL, status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investors (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    address TEXT, id_type TEXT, id_number TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','approved','rejected')),
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investor_documents (
    id TEXT PRIMARY KEY, investor_id uuid NOT NULL REFERENCES public.investors(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, file_path TEXT NOT NULL, status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL, description TEXT, category TEXT,
    min_investment bigint NOT NULL, max_investment bigint,
    duration_months INTEGER, start_date TEXT, closing_date TEXT, maturity_date TEXT,
    return_structure TEXT, projected_return_pct double precision, payment_terms TEXT, risk_disclosure TEXT,
    agreement_doc TEXT, eligibility TEXT, capacity bigint, subscribed bigint DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','published','fully_subscribed','suspended','closed','archived')),
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investment_applications (
    id TEXT PRIMARY KEY,
    investor_id uuid NOT NULL REFERENCES public.investors(user_id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id),
    amount bigint NOT NULL,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','approved','rejected','funded','active','matured','closed')),
    reference TEXT UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investment_agreements (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES public.investment_applications(id) ON DELETE CASCADE,
    version TEXT NOT NULL, doc_ref TEXT, accepted_at timestamptz DEFAULT now(), method TEXT DEFAULT 'click_accept', session_ref TEXT
  );
CREATE TABLE public.investments (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE REFERENCES public.investment_applications(id) ON DELETE CASCADE,
    investor_id uuid NOT NULL REFERENCES public.investors(user_id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES public.opportunities(id),
    principal bigint NOT NULL, start_date TEXT, maturity_date TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','approaching_maturity','matured','under_withdrawal_review','withdrawal_approved','withdrawal_processing','paid','closed')),
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investment_earnings (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    projected_amount bigint DEFAULT 0, actual_amount bigint DEFAULT 0,
    type TEXT CHECK(type IN ('projected','actual')),
    reference TEXT UNIQUE, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.investment_withdrawals (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    investor_id uuid NOT NULL REFERENCES public.investors(user_id) ON DELETE CASCADE,
    amount bigint NOT NULL, status TEXT DEFAULT 'requested' CHECK(status IN ('requested','under_review','approved','processing','paid','rejected','failed','cancelled')),
    reference TEXT UNIQUE NOT NULL, payout_reference TEXT, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.service_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, description TEXT,
    active smallint NOT NULL DEFAULT 1,
    supported_services TEXT DEFAULT 'local,market_runs',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.pricing_versions (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    base_fee bigint NOT NULL, per_km bigint NOT NULL, min_fee bigint NOT NULL,
    student_flat bigint, vendor_discount_pct double precision DEFAULT 0,
    scheduled_surcharge bigint DEFAULT 0, special_charge bigint DEFAULT 0,
    rider_commission_pct double precision DEFAULT 25,
    market_runs_fee bigint DEFAULT 1500,
    effective_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.waybill_pricing (
    id TEXT PRIMARY KEY,
    origin TEXT NOT NULL, destination TEXT NOT NULL,
    weight_band TEXT NOT NULL, price bigint NOT NULL,
    category TEXT DEFAULT 'general',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.deliveries (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customer_id uuid REFERENCES public.users(id),
    vendor_id uuid REFERENCES public.vendors(user_id),
    manual_customer_name TEXT, manual_customer_phone TEXT,
    pickup_address TEXT NOT NULL, dropoff_address TEXT NOT NULL,
    pickup_lat double precision, pickup_lng double precision, dropoff_lat double precision, dropoff_lng double precision,
    recipient_name TEXT NOT NULL, recipient_phone TEXT NOT NULL,
    package_category TEXT, package_desc TEXT, declared_value bigint,
    delivery_method TEXT DEFAULT 'bicycle', timing TEXT CHECK(timing IN ('now','scheduled')),
    scheduled_at timestamptz, instructions TEXT,
    status TEXT NOT NULL DEFAULT 'pending_confirmation',
    fee bigint NOT NULL, pricing_version_id TEXT REFERENCES public.pricing_versions(id),
    distance_km double precision, fee_breakdown TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','initiated','successful','failed','cancelled','reversed','refunded','under_review')),
    channel TEXT DEFAULT 'app' CHECK(channel IN ('app','phone','whatsapp','walk_in','manual')),
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.delivery_assignments (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id),
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned','accepted','rejected','completed','reassigned')),
    reference TEXT UNIQUE NOT NULL,
    assigned_by uuid REFERENCES public.users(id),
    reason TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.delivery_status_history (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    prev_status TEXT, new_status TEXT NOT NULL,
    actor_id uuid REFERENCES public.users(id),
    actor_role TEXT, lat double precision, lng double precision, notes TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.delivery_proof (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
    recipient_name TEXT, photo_path TEXT, notes TEXT, lat double precision, lng double precision,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.market_runs (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customer_id uuid REFERENCES public.users(id),
    contact_name TEXT NOT NULL, contact_phone TEXT NOT NULL,
    delivery_location TEXT NOT NULL, budget_estimate bigint,
    service_date TEXT, contact_preference TEXT, instructions TEXT,
    status TEXT DEFAULT 'submitted',
    service_fee bigint, estimated_items_cost bigint, final_total bigint,
    agent_id uuid REFERENCES public.users(id),
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.market_run_items (
    id TEXT PRIMARY KEY,
    market_run_id TEXT NOT NULL REFERENCES public.market_runs(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit TEXT, brand TEXT, description TEXT
  );
CREATE TABLE public.market_run_expenses (
    id TEXT PRIMARY KEY,
    market_run_id TEXT NOT NULL REFERENCES public.market_runs(id) ON DELETE CASCADE,
    item_name TEXT, amount bigint NOT NULL, receipt_path TEXT, status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.waybills (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL, waybill_number TEXT UNIQUE,
    customer_id uuid REFERENCES public.users(id),
    sender_name TEXT NOT NULL, sender_phone TEXT NOT NULL, sender_email TEXT,
    recipient_name TEXT NOT NULL, recipient_phone TEXT NOT NULL,
    destination_city TEXT NOT NULL, destination_address TEXT NOT NULL,
    origin TEXT NOT NULL, destination TEXT NOT NULL,
    item_category TEXT, item_desc TEXT, weight double precision, dimensions TEXT, declared_value bigint,
    packaging TEXT, handling TEXT, dispatch_date TEXT, delivery_method TEXT, office_dropoff TEXT,
    status TEXT DEFAULT 'submitted', fee bigint, payment_status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.waybill_parcels (
    id TEXT PRIMARY KEY, waybill_id TEXT NOT NULL REFERENCES public.waybills(id) ON DELETE CASCADE,
    weight double precision, dimensions TEXT, category TEXT
  );
CREATE TABLE public.waybill_tracking_events (
    id TEXT PRIMARY KEY, waybill_id TEXT NOT NULL REFERENCES public.waybills(id) ON DELETE CASCADE,
    status TEXT NOT NULL, location TEXT, notes TEXT, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.payments (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    user_id uuid REFERENCES public.users(id), delivery_id TEXT REFERENCES public.deliveries(id),
    waybill_id TEXT REFERENCES public.waybills(id), market_run_id TEXT REFERENCES public.market_runs(id),
    investment_id TEXT REFERENCES public.investments(id), investment_application_id TEXT REFERENCES public.investment_applications(id),
    amount bigint NOT NULL, provider TEXT DEFAULT 'paystack', provider_ref TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','initiated','successful','failed','cancelled','reversed','refunded','under_review')),
    authorization_url TEXT, access_code TEXT,
    idempotency_key TEXT UNIQUE, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.refunds (
    id TEXT PRIMARY KEY, payment_id TEXT NOT NULL REFERENCES public.payments(id),
    reference TEXT UNIQUE NOT NULL, amount bigint NOT NULL, reason TEXT, status TEXT DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_earnings (
    id TEXT PRIMARY KEY, rider_id uuid NOT NULL REFERENCES public.riders(user_id),
    delivery_id TEXT NOT NULL UNIQUE REFERENCES public.deliveries(id),
    eligible_fee bigint NOT NULL, commission_pct double precision NOT NULL,
    rider_earnings bigint NOT NULL, digitrans_share bigint NOT NULL,
    settlement_status TEXT DEFAULT 'pending' CHECK(settlement_status IN ('pending','settled','paid')),
    reference TEXT UNIQUE NOT NULL, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_settlements (
    id TEXT PRIMARY KEY, settlement_date TEXT NOT NULL, total_payable bigint NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','paid')),
    payout_reference TEXT, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_settlement_items (
    settlement_id TEXT NOT NULL REFERENCES public.rider_settlements(id) ON DELETE CASCADE,
    rider_id uuid NOT NULL REFERENCES public.riders(user_id),
    earnings_id TEXT NOT NULL REFERENCES public.rider_earnings(id),
    amount bigint NOT NULL,
    PRIMARY KEY (settlement_id, earnings_id)
  );
CREATE TABLE public.withdrawal_requests (
    id TEXT PRIMARY KEY, rider_id uuid NOT NULL REFERENCES public.riders(user_id),
    amount bigint NOT NULL, destination_account TEXT, status TEXT DEFAULT 'requested',
    reference TEXT UNIQUE NOT NULL, payout_reference TEXT, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.rider_withdrawal_items (
    withdrawal_id TEXT NOT NULL REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
    earnings_id TEXT NOT NULL REFERENCES public.rider_earnings(id),
    amount bigint NOT NULL,
    PRIMARY KEY (withdrawal_id, earnings_id)
  );
CREATE TABLE public.financial_ledger (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, amount bigint NOT NULL, currency TEXT DEFAULT 'NGN',
    related_id TEXT, related_type TEXT, description TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, message TEXT NOT NULL, type TEXT, related_id TEXT,
    is_read smallint NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.support_tickets (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    requester_id uuid NOT NULL REFERENCES public.users(id), category TEXT, description TEXT NOT NULL,
    related_id TEXT, status TEXT DEFAULT 'open' CHECK(status IN ('open','assigned','in_progress','awaiting_user','resolved','closed')),
    assigned_to uuid REFERENCES public.users(id), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.support_messages (
    id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id), message TEXT NOT NULL, is_internal smallint NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.contact_messages (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, category TEXT, message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','resolved','spam')),
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.banners (
    id TEXT PRIMARY KEY, heading TEXT NOT NULL, description TEXT, image_path TEXT,
    link TEXT, start_date timestamptz, end_date timestamptz, active smallint NOT NULL DEFAULT 1, sort_order INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.faqs (
    id TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, category TEXT, sort_order INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY, actor_id uuid REFERENCES public.users(id), actor_role TEXT,
    action TEXT NOT NULL, record_type TEXT, record_id TEXT,
    prev_value TEXT, new_value TEXT, reason TEXT, ip TEXT,
    created_at timestamptz DEFAULT now()
  );
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at timestamptz DEFAULT now()
  );
CREATE TABLE public.ratings (
    id TEXT PRIMARY KEY, delivery_id TEXT NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.users(id), rating INTEGER CHECK(rating BETWEEN 1 AND 5), comment TEXT,
    created_at timestamptz DEFAULT now()
  );

-- Original indexes, PostgreSQL foreign-key indexes, and operational indexes.
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON public.deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_ref ON public.financial_ledger(reference);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions (permission_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_user_id ON public.student_documents (user_id);
CREATE INDEX IF NOT EXISTS idx_rider_documents_rider_id ON public.rider_documents (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_guarantors_rider_id ON public.rider_guarantors (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_vehicles_rider_id ON public.rider_vehicles (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_agreements_rider_id ON public.rider_agreements (rider_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents (vendor_id);
CREATE INDEX IF NOT EXISTS idx_investor_documents_investor_id ON public.investor_documents (investor_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON public.opportunities (created_by);
CREATE INDEX IF NOT EXISTS idx_investment_applications_investor_id ON public.investment_applications (investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_applications_opportunity_id ON public.investment_applications (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_investment_agreements_application_id ON public.investment_agreements (application_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON public.investments (investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_opportunity_id ON public.investments (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_investment_earnings_investment_id ON public.investment_earnings (investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_withdrawals_investment_id ON public.investment_withdrawals (investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_withdrawals_investor_id ON public.investment_withdrawals (investor_id);
CREATE INDEX IF NOT EXISTS idx_pricing_versions_created_by ON public.pricing_versions (created_by);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON public.deliveries (customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vendor_id ON public.deliveries (vendor_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_pricing_version_id ON public.deliveries (pricing_version_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_by ON public.deliveries (created_by);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivery_id ON public.delivery_assignments (delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider_id ON public.delivery_assignments (rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_assigned_by ON public.delivery_assignments (assigned_by);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery_id ON public.delivery_status_history (delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_history_actor_id ON public.delivery_status_history (actor_id);
CREATE INDEX IF NOT EXISTS idx_market_runs_customer_id ON public.market_runs (customer_id);
CREATE INDEX IF NOT EXISTS idx_market_runs_agent_id ON public.market_runs (agent_id);
CREATE INDEX IF NOT EXISTS idx_market_run_items_market_run_id ON public.market_run_items (market_run_id);
CREATE INDEX IF NOT EXISTS idx_market_run_expenses_market_run_id ON public.market_run_expenses (market_run_id);
CREATE INDEX IF NOT EXISTS idx_waybills_customer_id ON public.waybills (customer_id);
CREATE INDEX IF NOT EXISTS idx_waybill_parcels_waybill_id ON public.waybill_parcels (waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_tracking_events_waybill_id ON public.waybill_tracking_events (waybill_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_delivery_id ON public.payments (delivery_id);
CREATE INDEX IF NOT EXISTS idx_payments_waybill_id ON public.payments (waybill_id);
CREATE INDEX IF NOT EXISTS idx_payments_market_run_id ON public.payments (market_run_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment_id ON public.payments (investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment_application_id ON public.payments (investment_application_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_rider_earnings_rider_id ON public.rider_earnings (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_settlement_items_settlement_id ON public.rider_settlement_items (settlement_id);
CREATE INDEX IF NOT EXISTS idx_rider_settlement_items_rider_id ON public.rider_settlement_items (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_settlement_items_earnings_id ON public.rider_settlement_items (earnings_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_rider_id ON public.withdrawal_requests (rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_withdrawal_items_withdrawal_id ON public.rider_withdrawal_items (withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_rider_withdrawal_items_earnings_id ON public.rider_withdrawal_items (earnings_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester_id ON public.support_tickets (requester_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets (assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages (ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON public.support_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_customer_id ON public.ratings (customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_reference ON public.deliveries(reference);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON public.audit_logs(actor_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_rider_status ON public.delivery_assignments(rider_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_provider_ref ON public.payments(provider,provider_ref) WHERE provider_ref IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlement_payout_ref ON public.rider_settlements(payout_reference) WHERE payout_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rider_withdrawal_payout_ref ON public.withdrawal_requests(payout_reference) WHERE payout_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_withdrawal_payout_ref ON public.investment_withdrawals(payout_reference) WHERE payout_reference IS NOT NULL;

-- Permission checks never trust editable Supabase user metadata.
CREATE OR REPLACE FUNCTION public.app_user_has_permission(permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users AS u
    JOIN public.role_permissions AS rp ON rp.role_id = u.role
    JOIN public.permissions AS p ON p.id = rp.permission_id
    WHERE u.id = auth.uid() AND u.status = 'active' AND p.key = permission_key
  );
$$;
REVOKE ALL ON FUNCTION public.app_user_has_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_user_has_permission(text) TO authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybill_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_run_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybill_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybill_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_withdrawal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_scoped_read ON public.users FOR SELECT TO authenticated USING (id = auth.uid() OR public.app_user_has_permission('users.read'));
CREATE POLICY profiles_scoped_read ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY addresses_scoped_read ON public.addresses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY student_profiles_scoped_read ON public.student_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('students.review'));
CREATE POLICY student_documents_scoped_read ON public.student_documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('students.review'));
CREATE POLICY riders_scoped_read ON public.riders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('riders.review'));
CREATE POLICY rider_documents_scoped_read ON public.rider_documents FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('riders.review'));
CREATE POLICY rider_guarantors_scoped_read ON public.rider_guarantors FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('riders.review'));
CREATE POLICY rider_vehicles_scoped_read ON public.rider_vehicles FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('riders.review'));
CREATE POLICY rider_agreements_scoped_read ON public.rider_agreements FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('riders.review'));
CREATE POLICY vendors_scoped_read ON public.vendors FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('vendors.review'));
CREATE POLICY vendor_documents_scoped_read ON public.vendor_documents FOR SELECT TO authenticated USING (vendor_id = auth.uid() OR public.app_user_has_permission('vendors.review'));
CREATE POLICY investors_scoped_read ON public.investors FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('investments.read'));
CREATE POLICY investor_documents_scoped_read ON public.investor_documents FOR SELECT TO authenticated USING (investor_id = auth.uid() OR public.app_user_has_permission('investments.manage'));
CREATE POLICY opportunities_scoped_read ON public.opportunities FOR SELECT TO authenticated USING (status = 'published' OR public.app_user_has_permission('investments.read'));
CREATE POLICY investment_applications_scoped_read ON public.investment_applications FOR SELECT TO authenticated USING (investor_id = auth.uid() OR public.app_user_has_permission('investments.read'));
CREATE POLICY investment_agreements_scoped_read ON public.investment_agreements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investment_applications a WHERE a.id = application_id AND a.investor_id = auth.uid()) OR public.app_user_has_permission('investments.read'));
CREATE POLICY investments_scoped_read ON public.investments FOR SELECT TO authenticated USING (investor_id = auth.uid() OR public.app_user_has_permission('investments.read'));
CREATE POLICY investment_earnings_scoped_read ON public.investment_earnings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.investments i WHERE i.id = investment_id AND i.investor_id = auth.uid()) OR public.app_user_has_permission('investments.read'));
CREATE POLICY investment_withdrawals_scoped_read ON public.investment_withdrawals FOR SELECT TO authenticated USING (investor_id = auth.uid() OR public.app_user_has_permission('investments.read'));
CREATE POLICY service_zones_scoped_read ON public.service_zones FOR SELECT TO authenticated USING (active = 1);
CREATE POLICY deliveries_scoped_read ON public.deliveries FOR SELECT TO authenticated USING (customer_id = auth.uid() OR vendor_id = auth.uid() OR public.app_user_has_permission('deliveries.read'));
CREATE POLICY delivery_assignments_scoped_read ON public.delivery_assignments FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('deliveries.read') OR public.app_user_has_permission('deliveries.assign'));
CREATE POLICY delivery_status_history_scoped_read ON public.delivery_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_id AND (d.customer_id = auth.uid() OR d.vendor_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.delivery_assignments a WHERE a.delivery_id = delivery_id AND a.rider_id = auth.uid()) OR public.app_user_has_permission('deliveries.read'));
CREATE POLICY delivery_proof_scoped_read ON public.delivery_proof FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_id AND (d.customer_id = auth.uid() OR d.vendor_id = auth.uid())) OR EXISTS (SELECT 1 FROM public.delivery_assignments a WHERE a.delivery_id = delivery_id AND a.rider_id = auth.uid()) OR public.app_user_has_permission('deliveries.read'));
CREATE POLICY market_runs_scoped_read ON public.market_runs FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.app_user_has_permission('market_runs.manage'));
CREATE POLICY market_run_items_scoped_read ON public.market_run_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.market_runs m WHERE m.id = market_run_id AND m.customer_id = auth.uid()) OR public.app_user_has_permission('market_runs.manage'));
CREATE POLICY market_run_expenses_scoped_read ON public.market_run_expenses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.market_runs m WHERE m.id = market_run_id AND m.customer_id = auth.uid()) OR public.app_user_has_permission('market_runs.manage') OR public.app_user_has_permission('finance.read'));
CREATE POLICY waybills_scoped_read ON public.waybills FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.app_user_has_permission('waybills.manage'));
CREATE POLICY waybill_parcels_scoped_read ON public.waybill_parcels FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.waybills w WHERE w.id = waybill_id AND w.customer_id = auth.uid()) OR public.app_user_has_permission('waybills.manage'));
CREATE POLICY waybill_tracking_events_scoped_read ON public.waybill_tracking_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.waybills w WHERE w.id = waybill_id AND w.customer_id = auth.uid()) OR public.app_user_has_permission('waybills.manage'));
CREATE POLICY payments_scoped_read ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.app_user_has_permission('finance.read'));
CREATE POLICY refunds_scoped_read ON public.refunds FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.user_id = auth.uid()) OR public.app_user_has_permission('finance.read'));
CREATE POLICY rider_earnings_scoped_read ON public.rider_earnings FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('finance.read'));
CREATE POLICY rider_settlements_scoped_read ON public.rider_settlements FOR SELECT TO authenticated USING (public.app_user_has_permission('finance.read'));
CREATE POLICY rider_settlement_items_scoped_read ON public.rider_settlement_items FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('finance.read'));
CREATE POLICY withdrawal_requests_scoped_read ON public.withdrawal_requests FOR SELECT TO authenticated USING (rider_id = auth.uid() OR public.app_user_has_permission('finance.read'));
CREATE POLICY rider_withdrawal_items_scoped_read ON public.rider_withdrawal_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.withdrawal_requests w WHERE w.id = withdrawal_id AND w.rider_id = auth.uid()) OR public.app_user_has_permission('finance.read'));
CREATE POLICY financial_ledger_scoped_read ON public.financial_ledger FOR SELECT TO authenticated USING (public.app_user_has_permission('finance.read'));
CREATE POLICY notifications_scoped_read ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY support_tickets_scoped_read ON public.support_tickets FOR SELECT TO authenticated USING (requester_id = auth.uid() OR public.app_user_has_permission('support.manage'));
CREATE POLICY support_messages_scoped_read ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.requester_id = auth.uid()) OR public.app_user_has_permission('support.manage'));
CREATE POLICY contact_messages_scoped_read ON public.contact_messages FOR SELECT TO authenticated USING (public.app_user_has_permission('support.manage'));
CREATE POLICY banners_scoped_read ON public.banners FOR SELECT TO authenticated USING ((active = 1 AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now())) OR public.app_user_has_permission('content.manage'));
CREATE POLICY audit_logs_scoped_read ON public.audit_logs FOR SELECT TO authenticated USING (public.app_user_has_permission('audit.read'));
CREATE POLICY system_settings_scoped_read ON public.system_settings FOR SELECT TO authenticated USING (public.app_user_has_permission('settings.manage'));
CREATE POLICY ratings_scoped_read ON public.ratings FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.app_user_has_permission('deliveries.read'));
CREATE POLICY roles_scoped_read ON public.roles FOR SELECT TO authenticated USING (public.app_user_has_permission('admin.manage'));
CREATE POLICY permissions_scoped_read ON public.permissions FOR SELECT TO authenticated USING (public.app_user_has_permission('admin.manage'));
CREATE POLICY role_permissions_scoped_read ON public.role_permissions FOR SELECT TO authenticated USING (public.app_user_has_permission('admin.manage'));
CREATE POLICY faqs_public_read ON public.faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY waybill_pricing_public_read ON public.waybill_pricing FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pricing_versions_public_read ON public.pricing_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY service_zones_public_read ON public.service_zones FOR SELECT TO anon, authenticated USING (active = 1);
CREATE POLICY banners_public_read ON public.banners FOR SELECT TO anon, authenticated USING (active = 1 AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
CREATE POLICY opportunities_public_read ON public.opportunities FOR SELECT TO anon, authenticated USING (status = 'published');

-- Restrict only the application tables created by this migration; do not alter grants on unrelated public-schema objects.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE
  public.roles,
  public.permissions,
  public.role_permissions,
  public.users,
  public.profiles,
  public.addresses,
  public.student_profiles,
  public.student_documents,
  public.riders,
  public.rider_documents,
  public.rider_guarantors,
  public.rider_vehicles,
  public.rider_agreements,
  public.vendors,
  public.vendor_documents,
  public.investors,
  public.investor_documents,
  public.opportunities,
  public.investment_applications,
  public.investment_agreements,
  public.investments,
  public.investment_earnings,
  public.investment_withdrawals,
  public.service_zones,
  public.pricing_versions,
  public.waybill_pricing,
  public.deliveries,
  public.delivery_assignments,
  public.delivery_status_history,
  public.delivery_proof,
  public.market_runs,
  public.market_run_items,
  public.market_run_expenses,
  public.waybills,
  public.waybill_parcels,
  public.waybill_tracking_events,
  public.payments,
  public.refunds,
  public.rider_earnings,
  public.rider_settlements,
  public.rider_settlement_items,
  public.withdrawal_requests,
  public.rider_withdrawal_items,
  public.financial_ledger,
  public.notifications,
  public.support_tickets,
  public.support_messages,
  public.contact_messages,
  public.banners,
  public.faqs,
  public.audit_logs,
  public.system_settings,
  public.ratings
FROM anon, authenticated;
GRANT SELECT ON TABLE
  public.roles,
  public.permissions,
  public.role_permissions,
  public.users,
  public.profiles,
  public.addresses,
  public.student_profiles,
  public.student_documents,
  public.riders,
  public.rider_documents,
  public.rider_guarantors,
  public.rider_vehicles,
  public.rider_agreements,
  public.vendors,
  public.vendor_documents,
  public.investors,
  public.investor_documents,
  public.opportunities,
  public.investment_applications,
  public.investment_agreements,
  public.investments,
  public.investment_earnings,
  public.investment_withdrawals,
  public.service_zones,
  public.pricing_versions,
  public.waybill_pricing,
  public.deliveries,
  public.delivery_assignments,
  public.delivery_status_history,
  public.delivery_proof,
  public.market_runs,
  public.market_run_items,
  public.market_run_expenses,
  public.waybills,
  public.waybill_parcels,
  public.waybill_tracking_events,
  public.payments,
  public.refunds,
  public.rider_earnings,
  public.rider_settlements,
  public.rider_settlement_items,
  public.withdrawal_requests,
  public.rider_withdrawal_items,
  public.financial_ledger,
  public.notifications,
  public.support_tickets,
  public.support_messages,
  public.contact_messages,
  public.banners,
  public.faqs,
  public.audit_logs,
  public.system_settings,
  public.ratings
TO authenticated;
GRANT SELECT ON TABLE public.faqs, public.service_zones, public.waybill_pricing, public.pricing_versions, public.banners, public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.roles,
  public.permissions,
  public.role_permissions,
  public.users,
  public.profiles,
  public.addresses,
  public.student_profiles,
  public.student_documents,
  public.riders,
  public.rider_documents,
  public.rider_guarantors,
  public.rider_vehicles,
  public.rider_agreements,
  public.vendors,
  public.vendor_documents,
  public.investors,
  public.investor_documents,
  public.opportunities,
  public.investment_applications,
  public.investment_agreements,
  public.investments,
  public.investment_earnings,
  public.investment_withdrawals,
  public.service_zones,
  public.pricing_versions,
  public.waybill_pricing,
  public.deliveries,
  public.delivery_assignments,
  public.delivery_status_history,
  public.delivery_proof,
  public.market_runs,
  public.market_run_items,
  public.market_run_expenses,
  public.waybills,
  public.waybill_parcels,
  public.waybill_tracking_events,
  public.payments,
  public.refunds,
  public.rider_earnings,
  public.rider_settlements,
  public.rider_settlement_items,
  public.withdrawal_requests,
  public.rider_withdrawal_items,
  public.financial_ledger,
  public.notifications,
  public.support_tickets,
  public.support_messages,
  public.contact_messages,
  public.banners,
  public.faqs,
  public.audit_logs,
  public.system_settings,
  public.ratings
TO service_role;
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.roles,
  public.permissions,
  public.role_permissions,
  public.users,
  public.profiles,
  public.addresses,
  public.student_profiles,
  public.student_documents,
  public.riders,
  public.rider_documents,
  public.rider_guarantors,
  public.rider_vehicles,
  public.rider_agreements,
  public.vendors,
  public.vendor_documents,
  public.investors,
  public.investor_documents,
  public.opportunities,
  public.investment_applications,
  public.investment_agreements,
  public.investments,
  public.investment_earnings,
  public.investment_withdrawals,
  public.service_zones,
  public.pricing_versions,
  public.waybill_pricing,
  public.deliveries,
  public.delivery_assignments,
  public.delivery_status_history,
  public.delivery_proof,
  public.market_runs,
  public.market_run_items,
  public.market_run_expenses,
  public.waybills,
  public.waybill_parcels,
  public.waybill_tracking_events,
  public.payments,
  public.refunds,
  public.rider_earnings,
  public.rider_settlements,
  public.rider_settlement_items,
  public.withdrawal_requests,
  public.rider_withdrawal_items,
  public.financial_ledger,
  public.notifications,
  public.support_tickets,
  public.support_messages,
  public.contact_messages,
  public.banners,
  public.faqs,
  public.audit_logs,
  public.system_settings,
  public.ratings
FROM anon, authenticated;

-- Private files are accessed only through the Node.js API's server-only service-role client.
-- There are intentionally no direct client policies for private object reads, uploads, updates, or deletes.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES
 ('identity-documents','identity-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('rider-documents','rider-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('vendor-documents','vendor-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('investor-documents','investor-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
 ('delivery-proof','delivery-proof',false,5242880,ARRAY['image/jpeg','image/png','image/webp']),
 ('market-run-receipts','market-run-receipts',false,5242880,ARRAY['image/jpeg','image/png','image/webp']),
 ('public-site-assets','public-site-assets',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $bucket_preflight$
BEGIN
  IF (SELECT count(*) FROM storage.buckets WHERE id IN ('identity-documents','rider-documents','vendor-documents','investor-documents','delivery-proof','market-run-receipts','public-site-assets')) <> 7 THEN
    RAISE EXCEPTION 'One or more required DigiTrans Storage buckets could not be created.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM storage.buckets b WHERE b.id IN ('identity-documents','rider-documents','vendor-documents','investor-documents','delivery-proof','market-run-receipts','public-site-assets')
    AND (
      (b.id='public-site-assets' AND (b.public IS DISTINCT FROM true OR b.file_size_limit IS DISTINCT FROM 5242880 OR b.allowed_mime_types IS DISTINCT FROM ARRAY['image/jpeg','image/png','image/webp']::text[]))
      OR (b.id<>'public-site-assets' AND (b.public IS DISTINCT FROM false OR b.file_size_limit IS DISTINCT FROM CASE WHEN b.id IN ('delivery-proof','market-run-receipts') THEN 5242880 ELSE 10485760 END OR b.allowed_mime_types IS DISTINCT FROM ARRAY['application/pdf','image/jpeg','image/png','image/webp']::text[] AND b.id NOT IN ('delivery-proof','market-run-receipts')))
      OR (b.id IN ('delivery-proof','market-run-receipts') AND b.allowed_mime_types IS DISTINCT FROM ARRAY['image/jpeg','image/png','image/webp']::text[])
    )
  ) THEN
    RAISE EXCEPTION 'Existing DigiTrans Storage bucket settings differ; review them before applying this migration.';
  END IF;
END;
$bucket_preflight$;


-- Supabase owns storage.objects on hosted projects and does not permit the
-- project database role to alter that managed table. Local/test stacks may
-- own it, so apply equivalent policies there when ownership permits; hosted
-- Storage operations use the server-only Supabase service key instead.
DO $storage_policy_optional$
DECLARE
  can_manage boolean := false;
BEGIN
  SELECT (pg_get_userbyid(c.relowner)=current_user)
    INTO can_manage
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='storage' AND c.relname='objects' AND c.relkind='r';
  IF can_manage THEN
    EXECUTE 'GRANT USAGE ON SCHEMA storage TO anon, authenticated';
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT ON storage.objects TO anon, authenticated';
    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated';
    EXECUTE $policy$CREATE POLICY digitrans_public_assets_read ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id='public-site-assets')$policy$;
    EXECUTE $policy$CREATE POLICY digitrans_public_assets_manage ON storage.objects FOR ALL TO authenticated
      USING (bucket_id='public-site-assets' AND public.app_user_has_permission('content.manage'))
      WITH CHECK (bucket_id='public-site-assets' AND public.app_user_has_permission('content.manage'))$policy$;
  END IF;
END;
$storage_policy_optional$;
