import pg from 'pg';

const { Pool } = pg;

// Load .env automatically in Node 20+
try {
  if (process.loadEnvFile) {
    process.loadEnvFile();
  }
} catch {}

// Supabase PostgreSQL Pool Configuration (IPv4 Connection Pooler)
const poolConfig = {
  host: process.env.PGHOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres.fmhmzmdyejmefztsmrjl',
  password: process.env.PGPASSWORD || 'jzuvgti@3389',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

let pgPool = null;

try {
  pgPool = new Pool(poolConfig);
  console.log('[Apotek Vitaria DB] PostgreSQL pool connected to Supabase.');
} catch (err) {
  console.error('[Apotek Vitaria DB] Failed to initialize PostgreSQL pool:', err.message);
}

// In-Memory store fallback: Clean Slate (0 records)
const memoryStore = {
  users: [],
  orders: [],
  medicines: [],
  consultations: []
};

export function getDatabase() {
  return memoryStore;
}

export function saveDatabase(data) {
  if (data && data.orders) {
    memoryStore.orders = data.orders;
  }
  if (data && data.medicines) {
    memoryStore.medicines = data.medicines;
  }
  if (data && data.users) {
    memoryStore.users = data.users;
  }
}

export function getPgPool() {
  return pgPool;
}
