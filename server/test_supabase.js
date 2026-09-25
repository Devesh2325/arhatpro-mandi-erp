const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:Devesh%4023251995@db.xswvatrgqgccidgjvara.supabase.co:5432/postgres';

async function migrate() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    const nowRes = await pool.query('SELECT NOW()');
    console.log('Connected! DB Time:', nowRes.rows[0].now);

    const schemaSql = fs.readFileSync(path.join(__dirname, 'database', 'supabase_schema.sql'), 'utf8');
    console.log('Applying supabase_schema.sql...');
    await pool.query(schemaSql);
    console.log('Schema applied successfully!');

    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Public tables in Supabase:', tablesRes.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Migration Error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
