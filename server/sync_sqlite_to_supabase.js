const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

const sqliteDb = new sqlite3.Database(path.join(__dirname, 'database', 'mandi.sqlite'));
const pgPool = new Pool({
  connectionString: 'postgresql://postgres:Devesh%4023251995@db.xswvatrgqgccidgjvara.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

function sqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function syncTable(tableName) {
  try {
    const rows = await sqliteAll(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) {
      console.log(`Table ${tableName}: 0 rows (skipped)`);
      return;
    }

    console.log(`Syncing ${rows.length} rows for ${tableName}...`);
    for (const row of rows) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const cols = keys.join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const insertSql = `
        INSERT INTO ${tableName} (${cols})
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
        ${keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ')}
      `;

      await pgPool.query(insertSql, values);
    }
    console.log(`✓ Table ${tableName} synced (${rows.length} rows)`);
  } catch (err) {
    console.error(`Error syncing table ${tableName}:`, err.message);
  }
}

async function runSync() {
  const tables = [
    'tenants',
    'subscriptions',
    'users',
    'commodities',
    'parties',
    'arrivals',
    'sales_lots',
    'split_sales',
    'accounts',
    'cash_transactions',
    'journal_entries',
    'pending_requests'
  ];

  for (const table of tables) {
    await syncTable(table);
  }

  console.log('🎉 All SQLite data successfully synced to Supabase Cloud PostgreSQL!');
  await pgPool.end();
  sqliteDb.close();
}

runSync();
