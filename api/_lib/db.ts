import { neon } from '@neondatabase/serverless';

// Uses HTTP transport — no WebSocket, no `ws` package needed.
// This is the correct driver for Vercel serverless (esbuild-compatible).
let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

export async function query(text: string, params?: any[]): Promise<{ rows: any[] }> {
  const sql = getSql();
  // sql.query() returns Row[] directly (confirmed), not { rows: Row[] }
  const rows = await sql.query(text, params ?? []) as any[];
  return { rows };
}

// Schema statements split individually (neon HTTP runs one statement at a time)
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false
  )`,
  `CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone)`,
  `CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    owner_phone TEXT NOT NULL UNIQUE,
    business_name TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    logo_url TEXT,
    storefront_slug TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT 'light',
    theme_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    kyc_tier INTEGER NOT NULL DEFAULT 0,
    linked_bank_account_id TEXT,
    cac_verification JSONB,
    tin_number TEXT,
    bank_consent_granted_at TIMESTAMPTZ,
    password_hash TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_url TEXT,
    stock_count INTEGER,
    is_available BOOLEAN NOT NULL DEFAULT true,
    category TEXT,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    payment_method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verification_source TEXT NOT NULL DEFAULT 'manual_unverified',
    bank_transaction_id TEXT,
    verified_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    institution_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    last_synced_at TIMESTAMPTZ,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    mono_account_id TEXT,
    paystack_dva JSONB
  )`,
  `CREATE TABLE IF NOT EXISTS bank_transactions (
    id TEXT PRIMARY KEY,
    bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    narration TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    balance INTEGER NOT NULL,
    category TEXT,
    matched_ledger_entry_id TEXT,
    matched_order_id TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    tier_id TEXT NOT NULL,
    tier_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    interest_rate INTEGER NOT NULL,
    repayment_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_at TIMESTAMPTZ NOT NULL,
    repaid_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS trust_score_snapshots (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    score INTEGER NOT NULL,
    tier TEXT NOT NULL,
    UNIQUE(business_id, date)
  )`,
  `CREATE TABLE IF NOT EXISTS cac_verifications (
    business_id TEXT PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    rc_number TEXT NOT NULL,
    company_name TEXT NOT NULL,
    registration_date DATE,
    company_type TEXT,
    status TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    msg_type TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS msg_type TEXT DEFAULT 'text'`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_business_time ON chat_messages(business_id, created_at DESC)`,
];

// Run once to set up the database schema.
// The schema already exists in production — only needed for fresh databases.
export async function initSchema() {
  console.log('[DB] Running schema init...');
  const sql = getSql();
  for (const stmt of SCHEMA_STATEMENTS) {
    try {
      await sql.query(stmt, []);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (!err?.message?.includes('already exists')) {
        console.error('[DB] Schema statement failed:', err.message);
      }
    }
  }
  try {
    await sql.query("DELETE FROM products WHERE id LIKE 'prod_mock%'", []);
    console.log('[DB] Cleaned up existing mock products');
  } catch (err: any) {
    console.error('[DB] Mock product cleanup failed:', err.message);
  }
  try {
    await sql.query("DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '48 hours'", []);
    console.log('[DB] Cleaned up chat messages older than 30 days');
  } catch (err: any) {
    console.error('[DB] Chat message cleanup failed:', err.message);
  }
  console.log('[DB] Schema init complete');
}
