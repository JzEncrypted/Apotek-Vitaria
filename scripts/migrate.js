import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Supabase Connection Settings
export const dbConfig = {
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.fmhmzmdyejmefztsmrjl',
  password: 'jzuvgti@3389',
  ssl: { rejectUnauthorized: false }
};

// URI format with proper URL-encoding (@ -> %40)
export const databaseUrl = `postgresql://postgres.fmhmzmdyejmefztsmrjl:jzuvgti%403389@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`;

async function runMigration() {
  console.log('[Migration] Connecting to Supabase database...');
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('[Migration] Connected to Supabase PostgreSQL successfully!');

    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Migration] Creating production tables (users, medicines, orders, order_items, consultation_messages)...');
    await client.query(schemaSql);
    console.log('[Migration] All tables created successfully!');

    // Read seed_production.sql
    const seedPath = path.join(__dirname, '..', 'database', 'seed_production.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('[Migration] Populating clean production seed data (medicines & licensed staff)...');
    await client.query(seedSql);
    console.log('[Migration] Production seeds applied successfully!');

    // Verify created tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n--- VERIFIED SUPABASE PUBLIC TABLES ---');
    tablesRes.rows.forEach(r => console.log(`✓ ${r.table_name}`));

    // Check row counts
    const userCount = await client.query('SELECT count(*) FROM users;');
    const medCount = await client.query('SELECT count(*) FROM medicines;');
    const ordCount = await client.query('SELECT count(*) FROM orders;');
    const msgCount = await client.query('SELECT count(*) FROM consultation_messages;');

    console.log('\n--- ROW COUNTS IN SUPABASE ---');
    console.log(`✓ users: ${userCount.rows[0].count}`);
    console.log(`✓ medicines: ${medCount.rows[0].count}`);
    console.log(`✓ orders: ${ordCount.rows[0].count} (Pristine clean production)`);
    console.log(`✓ consultation_messages: ${msgCount.rows[0].count}`);

    console.log('\n[Migration] Complete! Database tables are 100% created and ready.');
  } catch (err) {
    console.error('[Migration Error]:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();
