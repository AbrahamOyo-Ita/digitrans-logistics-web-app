import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configuredDatabasePath=process.env.DATABASE_PATH;
if(process.env.NODE_ENV==='production'&&(!configuredDatabasePath||!path.isAbsolute(configuredDatabasePath)))throw new Error('DATABASE_PATH must point to an absolute persistent volume path in production.');
const DB_PATH = configuredDatabasePath || path.join(__dirname, '..', 'data', 'digitrans.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const SQL = await initSqlJs({ locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file) });
const raw = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
let transactionDepth = 0;
function persist() {
  if (transactionDepth) return;
  const temp = `${DB_PATH}.tmp`;
  fs.writeFileSync(temp, Buffer.from(raw.export()));
  fs.renameSync(temp, DB_PATH);
}
function paramsOf(args) {
  if (!args.length) return [];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') return args[0];
  return args;
}
const db = {
  pragma(value) { try { raw.run(`PRAGMA ${value}`); } catch {} },
  exec(sql) { raw.exec(sql); persist(); },
  prepare(sql) {
    return {
      get(...args) {
        const stmt = raw.prepare(sql);
        const params = paramsOf(args);
        if (params && ((Array.isArray(params) && params.length) || (!Array.isArray(params) && Object.keys(params).length))) stmt.bind(params);
        const result = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return result;
      },
      all(...args) {
        const stmt = raw.prepare(sql);
        const params = paramsOf(args);
        if (params && ((Array.isArray(params) && params.length) || (!Array.isArray(params) && Object.keys(params).length))) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      run(...args) {
        const stmt = raw.prepare(sql);
        const params = paramsOf(args);
        if (params && ((Array.isArray(params) && params.length) || (!Array.isArray(params) && Object.keys(params).length))) stmt.bind(params);
        stmt.step();
        const changes = raw.getRowsModified();
        stmt.free();
        persist();
        return { changes, lastInsertRowid: raw.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? null };
      }
    };
  },
  transaction(fn) {
    return (...args) => {
      const outer = transactionDepth === 0;
      if (outer) raw.run('BEGIN IMMEDIATE');
      transactionDepth++;
      try {
        const result = fn(...args);
        transactionDepth--;
        if (outer) { raw.run('COMMIT'); persist(); }
        return result;
      } catch (error) {
        transactionDepth--;
        if (outer) raw.run('ROLLBACK');
        throw error;
      }
    };
  },
  close() { persist(); raw.close(); }
};
raw.run('PRAGMA foreign_keys = ON');

export function migrate() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer','student','rider','vendor','investor','ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin')),
    status TEXT NOT NULL DEFAULT 'pending_verification' CHECK(status IN ('pending_verification','active','rejected','suspended','deactivated','archived')),
    email_verified INTEGER DEFAULT 0,
    phone_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    dob TEXT,
    address TEXT,
    emergency_contact TEXT,
    profile_photo TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    ip TEXT,
    user_agent TEXT,
    revoked INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,
    address_line TEXT NOT NULL,
    lat REAL, lng REAL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS student_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    institution TEXT,
    matric_no TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','approved','rejected','expired')),
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS student_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS riders (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    vehicle_reg TEXT,
    vehicle_desc TEXT,
    bank_name TEXT, bank_account_name TEXT, bank_account_number TEXT,
    availability TEXT DEFAULT 'unavailable' CHECK(availability IN ('available','unavailable','on_delivery','suspended')),
    approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending','approved','rejected','suspended')),
    rejection_reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_documents (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL REFERENCES riders(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_guarantors (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL REFERENCES riders(user_id) ON DELETE CASCADE,
    full_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT, relationship TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_vehicles (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL REFERENCES riders(user_id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL, reg_no TEXT, description TEXT, condition TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_agreements (
    id TEXT PRIMARY KEY,
    rider_id TEXT NOT NULL REFERENCES riders(user_id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    accepted_at TEXT DEFAULT (datetime('now')),
    ip TEXT, session_ref TEXT,
    doc_ref TEXT
  );
  CREATE TABLE IF NOT EXISTS vendors (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS vendor_documents (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendors(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, file_path TEXT NOT NULL, status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investors (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address TEXT, id_type TEXT, id_number TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','approved','rejected')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investor_documents (
    id TEXT PRIMARY KEY, investor_id TEXT NOT NULL REFERENCES investors(user_id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, file_path TEXT NOT NULL, status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL, description TEXT, category TEXT,
    min_investment INTEGER NOT NULL, max_investment INTEGER,
    duration_months INTEGER, start_date TEXT, closing_date TEXT, maturity_date TEXT,
    return_structure TEXT, projected_return_pct REAL, payment_terms TEXT, risk_disclosure TEXT,
    agreement_doc TEXT, eligibility TEXT, capacity INTEGER, subscribed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','under_review','approved','published','fully_subscribed','suspended','closed','archived')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investment_applications (
    id TEXT PRIMARY KEY,
    investor_id TEXT NOT NULL REFERENCES investors(user_id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','approved','rejected','funded','active','matured','closed')),
    reference TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investment_agreements (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES investment_applications(id) ON DELETE CASCADE,
    version TEXT NOT NULL, doc_ref TEXT, accepted_at TEXT DEFAULT (datetime('now')), method TEXT DEFAULT 'click_accept', session_ref TEXT
  );
  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE REFERENCES investment_applications(id) ON DELETE CASCADE,
    investor_id TEXT NOT NULL REFERENCES investors(user_id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
    principal INTEGER NOT NULL, start_date TEXT, maturity_date TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','approaching_maturity','matured','under_withdrawal_review','withdrawal_approved','withdrawal_processing','paid','closed')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investment_earnings (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    projected_amount INTEGER DEFAULT 0, actual_amount INTEGER DEFAULT 0,
    type TEXT CHECK(type IN ('projected','actual')),
    reference TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS investment_withdrawals (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    investor_id TEXT NOT NULL REFERENCES investors(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, status TEXT DEFAULT 'requested' CHECK(status IN ('requested','under_review','approved','processing','paid','rejected','failed','cancelled')),
    reference TEXT UNIQUE NOT NULL, payout_reference TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS service_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, description TEXT,
    active INTEGER DEFAULT 1,
    supported_services TEXT DEFAULT 'local,market_runs',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS pricing_versions (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    base_fee INTEGER NOT NULL, per_km INTEGER NOT NULL, min_fee INTEGER NOT NULL,
    student_flat INTEGER, vendor_discount_pct REAL DEFAULT 0,
    scheduled_surcharge INTEGER DEFAULT 0, special_charge INTEGER DEFAULT 0,
    rider_commission_pct REAL DEFAULT 25,
    market_runs_fee INTEGER DEFAULT 1500,
    effective_at TEXT DEFAULT (datetime('now')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS waybill_pricing (
    id TEXT PRIMARY KEY,
    origin TEXT NOT NULL, destination TEXT NOT NULL,
    weight_band TEXT NOT NULL, price INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES users(id),
    vendor_id TEXT REFERENCES vendors(user_id),
    manual_customer_name TEXT, manual_customer_phone TEXT,
    pickup_address TEXT NOT NULL, dropoff_address TEXT NOT NULL,
    pickup_lat REAL, pickup_lng REAL, dropoff_lat REAL, dropoff_lng REAL,
    recipient_name TEXT NOT NULL, recipient_phone TEXT NOT NULL,
    package_category TEXT, package_desc TEXT, declared_value INTEGER,
    delivery_method TEXT DEFAULT 'bicycle', timing TEXT CHECK(timing IN ('now','scheduled')),
    scheduled_at TEXT, instructions TEXT,
    status TEXT NOT NULL DEFAULT 'pending_confirmation',
    fee INTEGER NOT NULL, pricing_version_id TEXT REFERENCES pricing_versions(id),
    distance_km REAL, fee_breakdown TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','initiated','successful','failed','cancelled','reversed','refunded','under_review')),
    channel TEXT DEFAULT 'app' CHECK(channel IN ('app','phone','whatsapp','walk_in','manual')),
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS delivery_assignments (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    rider_id TEXT NOT NULL REFERENCES riders(user_id),
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned','accepted','rejected','completed','reassigned')),
    reference TEXT UNIQUE NOT NULL,
    assigned_by TEXT REFERENCES users(id),
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS delivery_status_history (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    prev_status TEXT, new_status TEXT NOT NULL,
    actor_id TEXT REFERENCES users(id),
    actor_role TEXT, lat REAL, lng REAL, notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS delivery_proof (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE CASCADE,
    recipient_name TEXT, photo_path TEXT, notes TEXT, lat REAL, lng REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS market_runs (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES users(id),
    contact_name TEXT NOT NULL, contact_phone TEXT NOT NULL,
    delivery_location TEXT NOT NULL, budget_estimate INTEGER,
    service_date TEXT, contact_preference TEXT, instructions TEXT,
    status TEXT DEFAULT 'submitted',
    service_fee INTEGER, estimated_items_cost INTEGER, final_total INTEGER,
    agent_id TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS market_run_items (
    id TEXT PRIMARY KEY,
    market_run_id TEXT NOT NULL REFERENCES market_runs(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit TEXT, brand TEXT, description TEXT
  );
  CREATE TABLE IF NOT EXISTS market_run_expenses (
    id TEXT PRIMARY KEY,
    market_run_id TEXT NOT NULL REFERENCES market_runs(id) ON DELETE CASCADE,
    item_name TEXT, amount INTEGER NOT NULL, receipt_path TEXT, status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS waybills (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL, waybill_number TEXT UNIQUE,
    customer_id TEXT REFERENCES users(id),
    sender_name TEXT NOT NULL, sender_phone TEXT NOT NULL, sender_email TEXT,
    recipient_name TEXT NOT NULL, recipient_phone TEXT NOT NULL,
    destination_city TEXT NOT NULL, destination_address TEXT NOT NULL,
    origin TEXT NOT NULL, destination TEXT NOT NULL,
    item_category TEXT, item_desc TEXT, weight REAL, dimensions TEXT, declared_value INTEGER,
    packaging TEXT, handling TEXT, dispatch_date TEXT, delivery_method TEXT, office_dropoff TEXT,
    status TEXT DEFAULT 'submitted', fee INTEGER, payment_status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS waybill_parcels (
    id TEXT PRIMARY KEY, waybill_id TEXT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    weight REAL, dimensions TEXT, category TEXT
  );
  CREATE TABLE IF NOT EXISTS waybill_tracking_events (
    id TEXT PRIMARY KEY, waybill_id TEXT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
    status TEXT NOT NULL, location TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id), delivery_id TEXT REFERENCES deliveries(id),
    waybill_id TEXT REFERENCES waybills(id), market_run_id TEXT REFERENCES market_runs(id),
    investment_id TEXT REFERENCES investments(id), investment_application_id TEXT REFERENCES investment_applications(id),
    amount INTEGER NOT NULL, provider TEXT DEFAULT 'paystack', provider_ref TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','initiated','successful','failed','cancelled','reversed','refunded','under_review')),
    authorization_url TEXT, access_code TEXT,
    idempotency_key TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY, payment_id TEXT NOT NULL REFERENCES payments(id),
    reference TEXT UNIQUE NOT NULL, amount INTEGER NOT NULL, reason TEXT, status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_earnings (
    id TEXT PRIMARY KEY, rider_id TEXT NOT NULL REFERENCES riders(user_id),
    delivery_id TEXT NOT NULL UNIQUE REFERENCES deliveries(id),
    eligible_fee INTEGER NOT NULL, commission_pct REAL NOT NULL,
    rider_earnings INTEGER NOT NULL, digitrans_share INTEGER NOT NULL,
    settlement_status TEXT DEFAULT 'pending' CHECK(settlement_status IN ('pending','settled','paid')),
    reference TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_settlements (
    id TEXT PRIMARY KEY, settlement_date TEXT NOT NULL, total_payable INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','paid')),
    payout_reference TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_settlement_items (
    settlement_id TEXT NOT NULL REFERENCES rider_settlements(id) ON DELETE CASCADE,
    rider_id TEXT NOT NULL REFERENCES riders(user_id),
    earnings_id TEXT NOT NULL REFERENCES rider_earnings(id),
    amount INTEGER NOT NULL,
    PRIMARY KEY (settlement_id, earnings_id)
  );
  CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id TEXT PRIMARY KEY, rider_id TEXT NOT NULL REFERENCES riders(user_id),
    amount INTEGER NOT NULL, destination_account TEXT, status TEXT DEFAULT 'requested',
    reference TEXT UNIQUE NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rider_withdrawal_items (
    withdrawal_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
    earnings_id TEXT NOT NULL REFERENCES rider_earnings(id),
    amount INTEGER NOT NULL,
    PRIMARY KEY (withdrawal_id, earnings_id)
  );
  CREATE TABLE IF NOT EXISTS financial_ledger (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT DEFAULT 'NGN',
    related_id TEXT, related_type TEXT, description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, message TEXT NOT NULL, type TEXT, related_id TEXT,
    is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL,
    requester_id TEXT NOT NULL REFERENCES users(id), category TEXT, description TEXT NOT NULL,
    related_id TEXT, status TEXT DEFAULT 'open' CHECK(status IN ('open','assigned','in_progress','awaiting_user','resolved','closed')),
    assigned_to TEXT REFERENCES users(id), created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id), message TEXT NOT NULL, is_internal INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, category TEXT, message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new','contacted','resolved','spam')),
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY, heading TEXT NOT NULL, description TEXT, image_path TEXT,
    link TEXT, start_date TEXT, end_date TEXT, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, category TEXT, sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), actor_role TEXT,
    action TEXT NOT NULL, record_type TEXT, record_id TEXT,
    prev_value TEXT, new_value TEXT, reason TEXT, ip TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY, delivery_id TEXT NOT NULL UNIQUE REFERENCES deliveries(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES users(id), rating INTEGER CHECK(rating BETWEEN 1 AND 5), comment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
  CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
  CREATE INDEX IF NOT EXISTS idx_ledger_ref ON financial_ledger(reference);
  `);
  const deliveryColumns = new Set(raw.exec('PRAGMA table_info(deliveries)')[0]?.values?.map(row => row[1]) || []);
  if (!deliveryColumns.has('manual_customer_name')) raw.run('ALTER TABLE deliveries ADD COLUMN manual_customer_name TEXT');
  if (!deliveryColumns.has('manual_customer_phone')) raw.run('ALTER TABLE deliveries ADD COLUMN manual_customer_phone TEXT');
  const opportunityColumns = new Set(raw.exec('PRAGMA table_info(opportunities)')[0]?.values?.map(row => row[1]) || []);
  if (!opportunityColumns.has('projected_return_pct')) raw.run('ALTER TABLE opportunities ADD COLUMN projected_return_pct REAL');
  const paymentColumns = new Set(raw.exec('PRAGMA table_info(payments)')[0]?.values?.map(row => row[1]) || []);
  if (!paymentColumns.has('investment_application_id')) raw.run('ALTER TABLE payments ADD COLUMN investment_application_id TEXT');
  if (!paymentColumns.has('authorization_url')) raw.run('ALTER TABLE payments ADD COLUMN authorization_url TEXT');
  if (!paymentColumns.has('access_code')) raw.run('ALTER TABLE payments ADD COLUMN access_code TEXT');
  for(const table of ['withdrawal_requests','investment_withdrawals']){
    const columns=new Set(raw.exec(`PRAGMA table_info(${table})`)[0]?.values?.map(row=>row[1])||[]);
    if(!columns.has('payout_reference'))raw.run(`ALTER TABLE ${table} ADD COLUMN payout_reference TEXT`);
  }
  raw.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_provider_ref ON payments(provider,provider_ref) WHERE provider_ref IS NOT NULL');
  raw.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_settlement_payout_ref ON rider_settlements(payout_reference) WHERE payout_reference IS NOT NULL');
  raw.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_rider_withdrawal_payout_ref ON withdrawal_requests(payout_reference) WHERE payout_reference IS NOT NULL');
  raw.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_withdrawal_payout_ref ON investment_withdrawals(payout_reference) WHERE payout_reference IS NOT NULL');
  persist();
}

export default db;
