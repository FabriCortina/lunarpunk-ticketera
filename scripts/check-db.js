'use strict';

const { Client } = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('❌ DATABASE_URL is not set.');
    console.error('   In Railway: Variables → Add Reference → Postgres → DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    console.log('✅ Database connection OK');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Verify Postgres is running and DATABASE_URL references the Postgres service.');
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main();
