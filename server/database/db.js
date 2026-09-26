const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const DEFAULT_SUPABASE_URL = 'postgresql://postgres:Devesh%4023251995@db.xswvatrgqgccidgjvara.supabase.co:5432/postgres';
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || DEFAULT_SUPABASE_URL;
const isPostgres = !!connectionString;

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  pgPool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  console.log('⚡ Connected to Supabase Cloud PostgreSQL Database');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'mandi.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log('📦 Connected to Local SQLite Database (mandi.sqlite)');
}

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function toPgSql(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

// Normalize SQL DDL types for PostgreSQL
function normalizeDdl(sql) {
  if (!isPostgres) return sql;
  return sql
    .replace(/\bDATETIME\b/gi, 'TIMESTAMPTZ')
    .replace(/\bREAL\b/gi, 'NUMERIC')
    .replace(/\bPRAGMA foreign_keys = ON;?\b/gi, '');
}

// Promisified query helper (SELECT)
async function query(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(toPgSql(sql), params);
    return res.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Promisified single row query helper (SELECT LIMIT 1)
async function queryOne(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(toPgSql(sql), params);
    return res.rows[0] || null;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Promisified run helper (INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  if (isPostgres) {
    const cleanSql = normalizeDdl(sql).trim();
    if (!cleanSql || cleanSql.toUpperCase().startsWith('PRAGMA')) {
      return { lastID: null, changes: 0 };
    }
    const res = await pgPool.query(toPgSql(cleanSql), params);
    return { lastID: null, changes: res.rowCount };
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Initialize Relational SQL Schema
async function initSchema() {
  await run(`PRAGMA foreign_keys = ON;`);

  // 1. Tenants (Agencies)
  await run(`
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
      standard_commission REAL DEFAULT 2.5,
      palledari_rate_per_box REAL DEFAULT 12,
      stationery_charges REAL DEFAULT 15,
      bill_format TEXT DEFAULT 'thermal',
      bill_disclaimer TEXT,
      logo_icon TEXT DEFAULT '🍎',
      theme_color TEXT DEFAULT 'emerald',
      status TEXT DEFAULT 'Active',
      owner_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Subscriptions
  await run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      plan TEXT DEFAULT 'Monthly', -- Monthly, Yearly, Enterprise
      status TEXT DEFAULT 'Active', -- Active, Suspended, Expired
      valid_until DATE,
      price REAL DEFAULT 1999,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 3. Users & Staff
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      password TEXT,
      role TEXT NOT NULL, -- super_admin, shop_admin, munshi, accountant
      role_label TEXT,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
    );
  `);

  // 4. Commodities
  await run(`
    CREATE TABLE IF NOT EXISTS commodities (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_hi TEXT,
      category TEXT DEFAULT 'Fruit',
      default_unit TEXT DEFAULT 'Box (20kg)',
      unit_weight_kg REAL DEFAULT 20,
      tare_deduction_kg REAL DEFAULT 1.0,
      standard_commission_pct REAL DEFAULT 2.5,
      palledari_rate_per_unit REAL DEFAULT 10,
      active INTEGER DEFAULT 1,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 5. Parties (Farmers & Buyers)
  await run(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      short_code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- Farmer, Buyer
      mobile TEXT NOT NULL,
      address TEXT,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 6. Inward Arrivals (Trucks)
  await run(`
    CREATE TABLE IF NOT EXISTS arrivals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
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
      total_freight REAL DEFAULT 0,
      freight_advance_paid REAL DEFAULT 0,
      freight_balance REAL DEFAULT 0,
      unloading_palledari REAL DEFAULT 0,
      status TEXT DEFAULT 'Ready for Sale',
      transferred_to_lot INTEGER DEFAULT 0,
      lot_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 7. Sales Lots
  await run(`
    CREATE TABLE IF NOT EXISTS sales_lots (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
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
      reserve_price REAL,
      current_bid REAL,
      highest_bidder TEXT,
      bids_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'live', -- live, sold
      truck_no TEXT,
      freight_advance_paid REAL DEFAULT 0,
      palledari_per_unit REAL DEFAULT 12,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 8. Split Sales (Multi-Buyer Sales)
  await run(`
    CREATE TABLE IF NOT EXISTS split_sales (
      id TEXT PRIMARY KEY,
      lot_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      sale_code TEXT,
      buyer_name TEXT NOT NULL,
      buyer_contact TEXT,
      quantity INTEGER NOT NULL,
      rate REAL NOT NULL,
      gross_amount REAL NOT NULL,
      time TEXT,
      payment_mode TEXT DEFAULT 'Credit (7 Days)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lot_id) REFERENCES sales_lots(id) ON DELETE CASCADE,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 9. Accounts & Bahi-Khata Ledger
  await run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      party_name TEXT NOT NULL,
      short_code TEXT,
      contact TEXT,
      address TEXT,
      total_purchases REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      outstanding_udhaar REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      overdue_days INTEGER DEFAULT 0,
      monthly_interest_rate REAL DEFAULT 1.5,
      last_payment_date DATE,
      status TEXT DEFAULT 'Good',
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 10. Rokad Cashbook Transactions
  await run(`
    CREATE TABLE IF NOT EXISTS cash_transactions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      type TEXT NOT NULL, -- JAMA (Receipt), KHARCH (Payment)
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 11. General Journal Entries (रोजनामचा - Double Entry Dr = Cr)
  await run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      voucher_no TEXT NOT NULL,
      date DATE NOT NULL,
      debit_account TEXT NOT NULL,
      credit_account TEXT NOT NULL,
      amount REAL NOT NULL,
      narration TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  // 12. Pending Agency Access Requests
  await run(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      id TEXT PRIMARY KEY,
      firm_name TEXT NOT NULL,
      proprietor TEXT NOT NULL,
      shop_no TEXT,
      mandi_name TEXT,
      apmc_license_no TEXT,
      phone TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for table extensions
  const safeAlter = async (table, columnDef) => {
    try {
      if (isPostgres) {
        const cleanDef = columnDef.replace(/"Dr"/g, "'Dr'");
        await run(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${cleanDef}`);
      } else {
        await run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
      }
    } catch (e) {
      // Column already exists, ignore
    }
  };

  await safeAlter('tenants', 'logo_url TEXT');
  await safeAlter('parties', 'bank_name TEXT');
  await safeAlter('parties', 'account_no TEXT');
  await safeAlter('parties', 'ifsc TEXT');
  await safeAlter('parties', 'upi_id TEXT');
  await safeAlter('parties', 'account_holder TEXT');
  await safeAlter('parties', 'pan TEXT');
  await safeAlter('parties', 'gstin TEXT');
  await safeAlter('parties', 'state TEXT');
  await safeAlter('parties', 'city TEXT');
  await safeAlter('parties', 'pincode TEXT');
  await safeAlter('parties', 'father_name TEXT');
  await safeAlter('parties', 'alternate_mobile TEXT');
  await safeAlter('parties', 'payment_terms_days INTEGER DEFAULT 15');
  await safeAlter('parties', 'opening_balance REAL DEFAULT 0');
  await safeAlter('parties', "balance_type TEXT DEFAULT 'Dr'");

  await seedInitialData();
}

// Seed Initial Platform Data
async function seedInitialData() {
  // Check if super admin exists
  const superAdmin = await queryOne(`SELECT * FROM users WHERE email = 'dmchaturvedi@gmail.com'`);
  if (!superAdmin) {
    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES ('usr-superadmin', NULL, 'Devesh Chaturvedi', 'dmchaturvedi@gmail.com', '9999999999', 'Devesh@23251995', 'Devesh@23251995', 'super_admin', 'Platform Super Admin', 'Full Oversight');
    `);
  }

  // Check if tenant-sgfc exists
  const sgfc = await queryOne(`SELECT * FROM tenants WHERE id = 'tenant-sgfc'`);
  if (!sgfc) {
    // 1. Tenant SGFC
    await run(`
      INSERT INTO tenants (id, firm_name, hindi_name, tagline, proprietor, shop_no, mandi_name, apmc_license_no, gstin, phone, bank_name, account_no, ifsc, upi_id, standard_commission, palledari_rate_per_box, theme_color, status, owner_user_id)
      VALUES ('tenant-sgfc', 'Shree Ganesh Fruit Co.', 'श्री गणेश फ्रूट कंपनी', 'Specialist in Shimla & Kashmir Apples', 'Ganesh Shanker', 'Shop No. C-42, New Fruit Market', 'Azadpur Mandi, Delhi - 110033', 'DL-APMC-F-09142', '07AAECG1234F1Z5', '+91 98100 12345', 'Punjab National Bank, Azadpur', '0129002100045123', 'PUNB0012900', 'shreeganesh.fruit@pnb', 2.5, 12, 'emerald', 'Active', 'usr-sgfc-admin');
    `);

    // Subscription
    await run(`
      INSERT INTO subscriptions (id, tenant_id, plan, status, valid_until, price)
      VALUES ('sub-sgfc', 'tenant-sgfc', 'Monthly', 'Active', '2026-10-21', 1999);
    `);

    // Users
    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES 
        ('usr-sgfc-admin', 'tenant-sgfc', 'Ganesh Shanker', 'ganesh@shreeganesh.com', '9810012345', '1234', '1234', 'shop_admin', 'Agency Owner / Partner', 'Full Control'),
        ('usr-sgfc-munshi', 'tenant-sgfc', 'Radhe Shyam', 'radhe@shreeganesh.com', '9816612345', '1111', '1111', 'munshi', 'Munshi (Data Entry)', 'Arrivals, Sales & Slips'),
        ('usr-sgfc-accountant', 'tenant-sgfc', 'Mohan Lal', 'mohan@shreeganesh.com', '9817712345', '2222', '2222', 'accountant', 'Accountant (Cashier)', 'Bahi-Khata & Rokad');
    `);

    // Commodities
    await run(`
      INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
      VALUES 
        ('COMM-1', 'tenant-sgfc', 'Apple - Royal Delicious', 'सेब - रॉयल', 'Fruit', 'Box (20kg)', 20, 1.5, 2.5, 12, 1),
        ('COMM-2', 'tenant-sgfc', 'Apple - Golden Delicious', 'सेब - गोल्डन', 'Fruit', 'Box (20kg)', 20, 1.5, 2.5, 12, 1),
        ('COMM-3', 'tenant-sgfc', 'Pomegranate - Solapur Bhagwa', 'अनार - भगवा', 'Fruit', 'Crate (10kg)', 10, 0.8, 3.0, 8, 1);
    `);

    // Parties
    await run(`
      INSERT INTO parties (id, tenant_id, short_code, name, type, mobile, address, credit_limit, current_balance)
      VALUES 
        ('P-101', 'tenant-sgfc', 'AGW', 'Aggarwal Wholesale Mart', 'Buyer', '+91 98110 55432', 'Shop 14, Tilak Nagar Mandi', 200000, 125000),
        ('P-102', 'tenant-sgfc', 'RJD', 'Rajdhani Hotel Supplies', 'Buyer', '+91 99100 88776', 'B-21, Daryaganj, Delhi', 150000, 110000),
        ('P-201', 'tenant-sgfc', 'NEG', 'Harish Negi', 'Farmer', '+91 98160 44321', 'Kotkhai, Shimla (HP)', 0, 0);
    `);

    // Accounts
    await run(`
      INSERT INTO accounts (id, tenant_id, party_name, short_code, contact, address, total_purchases, total_paid, outstanding_udhaar, credit_limit, overdue_days, status)
      VALUES 
        ('ACC-1', 'tenant-sgfc', 'Aggarwal Wholesale Mart', 'AGW', '+91 98110 55432', 'Shop 14, Tilak Nagar', 485000, 360000, 125000, 200000, 14, 'Warning'),
        ('ACC-2', 'tenant-sgfc', 'Rajdhani Hotel Supplies', 'RJD', '+91 99100 88776', 'B-21, Daryaganj', 320000, 210000, 110000, 150000, 22, 'Critical');
    `);

    // Cashbook
    await run(`
      INSERT INTO cash_transactions (id, tenant_id, type, title, amount, time)
      VALUES 
        ('TX-1', 'tenant-sgfc', 'JAMA', 'Cash received from Aggarwal Mart', 45000, '06:10 AM'),
        ('TX-2', 'tenant-sgfc', 'KHARCH', 'Driver Freight Advance (HP-10-B-9812)', 15000, '04:30 AM');
    `);

    // Journals
    await run(`
      INSERT INTO journal_entries (id, tenant_id, voucher_no, date, debit_account, credit_account, amount, narration, created_by)
      VALUES 
        ('JV-1', 'tenant-sgfc', 'JV-2026-001', '2026-09-21', 'Cash in Hand (रोकड़)', 'Aggarwal Wholesale Mart (AGW)', 45000, 'Spot cash partial payment', 'Radhe Shyam (Munshi)');
    `);
  }

  // Check if tenant-rat exists
  const rat = await queryOne(`SELECT * FROM tenants WHERE id = 'tenant-rat'`);
  if (!rat) {
    // 2. Tenant Royal Apple Traders (Balwinder Singh)
    await run(`
      INSERT INTO tenants (id, firm_name, hindi_name, tagline, proprietor, shop_no, mandi_name, apmc_license_no, gstin, phone, bank_name, account_no, ifsc, upi_id, standard_commission, palledari_rate_per_box, theme_color, status, owner_user_id)
      VALUES ('tenant-rat', 'Royal Apple Traders', 'रॉयल एप्पल ट्रेडर्स', 'Premium Apple Commission Agents', 'Balwinder Singh', 'Shop No. B-12, Subzi Mandi', 'Azadpur Mandi, Delhi - 110033', 'DL-APMC-F-11029', '07BBECG9876F1Z2', '+91 98110 12345', 'State Bank of India, Azadpur', '0349002100088990', 'SBIN0001234', 'royalapple@sbi', 2.5, 12, 'maroon', 'Active', 'usr-rat-admin');
    `);

    // Subscription
    await run(`
      INSERT INTO subscriptions (id, tenant_id, plan, status, valid_until, price)
      VALUES ('sub-rat', 'tenant-rat', 'Yearly', 'Active', '2027-09-21', 19999);
    `);

    // User
    await run(`
      INSERT INTO users (id, tenant_id, name, email, phone, pin, password, role, role_label, permissions)
      VALUES ('usr-rat-admin', 'tenant-rat', 'Balwinder Singh', 'balwinder@mandi.in', '9811012345', '1234', '1234', 'shop_admin', 'Agency Owner / Partner', 'Full Control');
    `);

    // Commodities
    await run(`
      INSERT INTO commodities (id, tenant_id, name_en, name_hi, category, default_unit, unit_weight_kg, tare_deduction_kg, standard_commission_pct, palledari_rate_per_unit, active)
      VALUES 
        ('COMM-RAT-1', 'tenant-rat', 'Apple - Kinnaur Special', 'सेब - किन्नौर', 'Fruit', 'Box (20kg)', 20, 1.5, 2.5, 12, 1),
        ('COMM-RAT-2', 'tenant-rat', 'Tomato - Hybrid Green', 'टमाटर - हाइब्रिड', 'Vegetable', 'Crate (25kg)', 25, 1.0, 2.0, 5, 1);
    `);

    // Parties
    await run(`
      INSERT INTO parties (id, tenant_id, short_code, name, type, mobile, address, credit_limit, current_balance)
      VALUES 
        ('P-RAT-1', 'tenant-rat', 'KSP', 'Kisan Seva Kendra', 'Farmer', '+91 98765 11223', 'Theog, Shimla (HP)', 0, 0),
        ('P-RAT-2', 'tenant-rat', 'DMC', 'Delhi Metro Fruits', 'Buyer', '+91 98101 22334', 'Okhla Mandi, Delhi', 300000, 45000);
    `);

    // Accounts
    await run(`
      INSERT INTO accounts (id, tenant_id, party_name, short_code, contact, address, total_purchases, total_paid, outstanding_udhaar, credit_limit, overdue_days, status)
      VALUES 
        ('ACC-RAT-1', 'tenant-rat', 'Delhi Metro Fruits', 'DMC', '+91 98101 22334', 'Okhla Mandi', 145000, 100000, 45000, 300000, 5, 'Good');
    `);
  }
}

module.exports = {
  db: sqliteDb,
  pgPool,
  isPostgres,
  query,
  queryOne,
  run,
  initSchema
};
