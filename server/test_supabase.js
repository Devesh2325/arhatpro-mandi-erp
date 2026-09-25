const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:Devesh%4023251995@db.xswvatrgqgccidgjvara.supabase.co:5432/postgres';

async function checkLatest() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Querying live Supabase PostgreSQL...');
    const tenants = await pool.query('SELECT id, firm_name, proprietor, phone, created_at FROM tenants ORDER BY created_at DESC LIMIT 3');
    console.log('--- LATEST TENANTS IN SUPABASE ---');
    console.table(tenants.rows);

    const users = await pool.query('SELECT id, tenant_id, name, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 3');
    console.log('--- LATEST USERS IN SUPABASE ---');
    console.table(users.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkLatest();
