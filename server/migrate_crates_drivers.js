const { query, run } = require('./database/db');

async function migrate() {
  console.log('⚡ Running Crate & Driver Ledger Database Migrations on Supabase Cloud...');

  // 1. Create crate_transactions table
  await run(`
    CREATE TABLE IF NOT EXISTS crate_transactions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      date DATE NOT NULL,
      entity_type TEXT NOT NULL, -- 'party', 'driver'
      entity_name TEXT NOT NULL,
      entity_phone TEXT,
      party_type TEXT, -- 'Farmer', 'Buyer', 'Agent', 'Driver'
      vehicle_no TEXT,
      movement_type TEXT NOT NULL, -- 'RECEIVED' (Crates In), 'GIVEN' (Crates Out/Returned)
      crates_count INTEGER NOT NULL,
      reference_type TEXT, -- 'arrival', 'sale', 'manual_adjustment', 'empty_return'
      reference_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ crate_transactions table verified');

  // 2. Add columns to arrivals
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS farmer_crates_in INTEGER DEFAULT 0`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS farmer_crates_returned INTEGER DEFAULT 0`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS farmer_crates_balance INTEGER DEFAULT 0`);
  await run(`ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS freight_payment_mode TEXT DEFAULT 'cash'`);
  console.log('✓ arrivals table columns verified');

  // 3. Add columns to parties
  await run(`ALTER TABLE parties ADD COLUMN IF NOT EXISTS crates_balance INTEGER DEFAULT 0`);
  console.log('✓ parties table columns verified');

  // 4. Populate sample driver & crate data for Golden Banana Ripening Store & Co. (tenant-banana-store)
  const tenantId = 'tenant-banana-store';
  const existingTx = await query(`SELECT id FROM crate_transactions WHERE tenant_id = ? LIMIT 1`, [tenantId]);
  
  if (existingTx.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    
    // Sample crate movements for testing
    await run(`
      INSERT INTO crate_transactions (id, tenant_id, date, entity_type, entity_name, entity_phone, party_type, vehicle_no, movement_type, crates_count, reference_type, notes)
      VALUES 
      ('CTX-001', ?, ?, 'driver', 'Gurmel Singh Transporter', '9812033445', 'Driver', 'MH-12-RN-4589', 'RECEIVED', 450, 'arrival', 'Initial arrival 450 G9 Banana crates'),
      ('CTX-002', ?, ?, 'driver', 'Gurmel Singh Transporter', '9812033445', 'Driver', 'MH-12-RN-4589', 'GIVEN', 80, 'empty_return', 'Empty crates returned to driver'),
      ('CTX-003', ?, ?, 'party', 'Suresh Patil (Jalgaon Banana)', '9822011223', 'Farmer', NULL, 'RECEIVED', 450, 'arrival', 'Inward G9 Banana from farm in grower crates'),
      ('CTX-004', ?, ?, 'party', 'Azad Fruits & Retailers', '9811099887', 'Buyer', NULL, 'GIVEN', 120, 'sale', 'Issued 120 crates with banana dispatch to shop')
    `, [tenantId, today, tenantId, today, tenantId, today, tenantId, today]);
    console.log('✓ Seeded sample crate transactions for tenant-banana-store');
  }

  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
