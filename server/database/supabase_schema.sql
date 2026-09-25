-- ==============================================================================
-- ArhatPro Mandi ERP - Supabase PostgreSQL Cloud Schema Migration
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants (Agencies / Mandi Firms)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  firm_name TEXT NOT NULL,
  hindi_name TEXT,
  tagline TEXT,
  proprietor TEXT NOT NULL,
  shop_no TEXT NOT NULL,
  mandi_name TEXT NOT NULL,
  apmc_license_no TEXT NOT NULL,
  gstin TEXT,
  phone TEXT NOT NULL,
  bank_name TEXT,
  account_no TEXT,
  ifsc TEXT,
  upi_id TEXT,
  standard_commission NUMERIC DEFAULT 2.5,
  palledari_rate_per_box NUMERIC DEFAULT 12,
  stationery_charges NUMERIC DEFAULT 15,
  bill_format TEXT DEFAULT 'thermal',
  bill_disclaimer TEXT,
  logo_icon TEXT DEFAULT '🍎',
  logo_url TEXT,
  theme_color TEXT DEFAULT 'emerald',
  status TEXT DEFAULT 'Active',
  owner_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'Monthly',
  status TEXT DEFAULT 'Active',
  valid_until DATE,
  price NUMERIC DEFAULT 1999,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Users & Staff
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  role_label TEXT,
  permissions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Commodities (Produce Master)
CREATE TABLE IF NOT EXISTS commodities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  category TEXT DEFAULT 'Fruit',
  default_unit TEXT DEFAULT 'Box (20kg)',
  unit_weight_kg NUMERIC DEFAULT 20,
  tare_deduction_kg NUMERIC DEFAULT 1.0,
  standard_commission_pct NUMERIC DEFAULT 2.5,
  palledari_rate_per_unit NUMERIC DEFAULT 10,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Parties (Farmers / Growers & Buyers / Khareeddar)
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Farmer' or 'Buyer'
  mobile TEXT NOT NULL,
  alternate_mobile TEXT,
  father_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  pan TEXT,
  gstin TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc TEXT,
  upi_id TEXT,
  account_holder TEXT,
  payment_terms_days INTEGER DEFAULT 15,
  credit_limit NUMERIC DEFAULT 0,
  opening_balance NUMERIC DEFAULT 0,
  balance_type TEXT DEFAULT 'Dr',
  current_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inward Arrivals (Truck Inward Register)
CREATE TABLE IF NOT EXISTS arrivals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  truck_no TEXT NOT NULL,
  driver_name TEXT,
  driver_phone TEXT,
  farmer_name TEXT NOT NULL,
  farmer_phone TEXT,
  farmer_location TEXT,
  commodity TEXT NOT NULL,
  variety TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT DEFAULT 'Box (20kg)',
  total_freight NUMERIC DEFAULT 0,
  freight_advance_paid NUMERIC DEFAULT 0,
  freight_balance NUMERIC DEFAULT 0,
  unloading_palledari NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Ready for Sale',
  transferred_to_lot INTEGER DEFAULT 0,
  lot_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sales Lots (Auction / Yard Inventory)
CREATE TABLE IF NOT EXISTS sales_lots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  arrival_id TEXT,
  commodity_name TEXT NOT NULL,
  variety TEXT,
  farmer_name TEXT,
  farmer_location TEXT,
  farmer_phone TEXT,
  total_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  unit TEXT DEFAULT 'Box (20kg)',
  grade TEXT DEFAULT 'Grade A',
  reserve_price NUMERIC,
  current_bid NUMERIC,
  highest_bidder TEXT,
  bids_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'live',
  truck_no TEXT,
  freight_advance_paid NUMERIC DEFAULT 0,
  palledari_per_unit NUMERIC DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Split Sales (Multi-Buyer Auction Sales)
CREATE TABLE IF NOT EXISTS split_sales (
  id TEXT PRIMARY KEY,
  lot_id TEXT NOT NULL REFERENCES sales_lots(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_code TEXT,
  buyer_name TEXT NOT NULL,
  buyer_contact TEXT,
  quantity INTEGER NOT NULL,
  rate NUMERIC NOT NULL,
  gross_amount NUMERIC NOT NULL,
  time TEXT,
  payment_mode TEXT DEFAULT 'Credit (7 Days)',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Accounts & Bahi-Khata Ledger
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  party_name TEXT NOT NULL,
  short_code TEXT,
  contact TEXT,
  address TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  outstanding_udhaar NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  overdue_days INTEGER DEFAULT 0,
  monthly_interest_rate NUMERIC DEFAULT 1.5,
  last_payment_date DATE,
  status TEXT DEFAULT 'Good',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Rokad Cashbook Transactions
CREATE TABLE IF NOT EXISTS cash_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'JAMA' or 'KHARCH'
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. General Journal Entries (रोजनामचा)
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  voucher_no TEXT NOT NULL,
  date DATE NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  narration TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Pending Agency Registrations
CREATE TABLE IF NOT EXISTS pending_requests (
  id TEXT PRIMARY KEY,
  firm_name TEXT NOT NULL,
  proprietor TEXT NOT NULL,
  shop_no TEXT,
  mandi_name TEXT,
  apmc_license_no TEXT,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create helpful indexes for ultra-fast queries
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_parties_tenant ON parties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_arrivals_tenant ON arrivals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_lots_tenant ON sales_lots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_split_sales_lot ON split_sales(lot_id);
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_tenant ON cash_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_tenant ON journal_entries(tenant_id);
