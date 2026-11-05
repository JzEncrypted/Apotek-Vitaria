import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.fmhmzmdyejmefztsmrjl',
  password: 'jzuvgti@3389',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('1. Dropping old orders_order_status_check constraint...');
  await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;');
  
  console.log('2. Adding new orders_order_status_check with prescription statuses...');
  await pool.query(`
    ALTER TABLE orders ADD CONSTRAINT orders_order_status_check 
    CHECK (order_status IN (
      'pending_prescription',
      'prescription_rejected',
      'pending',
      'processing',
      'shipped',
      'ready_for_pickup',
      'completed',
      'cancelled'
    ));
  `);

  console.log('3. Checking medicines table columns...');
  const medCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'medicines'
    ORDER BY ordinal_position;
  `);
  console.log('Medicines columns:', medCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  console.log('4. Checking consultation_messages table columns...');
  const chatCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'consultation_messages'
    ORDER BY ordinal_position;
  `);
  console.log('Chat columns:', chatCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  console.log('5. Creating user_medications and medication_logs tables...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_medications (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      dosage_form VARCHAR(50) DEFAULT 'tablet',
      strength VARCHAR(100),
      category VARCHAR(100),
      dose_per_take VARCHAR(50) DEFAULT '1',
      dose_unit VARCHAR(50) DEFAULT 'Tablet',
      frequency VARCHAR(50) DEFAULT '1x Sehari',
      times TEXT[] DEFAULT ARRAY['08:00'],
      instructions VARCHAR(100) DEFAULT 'Sesudah Makan',
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      notes TEXT,
      reminder_enabled BOOLEAN DEFAULT TRUE,
      reminder_sound BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      medication_id VARCHAR(64) REFERENCES user_medications(id) ON DELETE CASCADE,
      schedule_time VARCHAR(20),
      actual_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) NOT NULL CHECK (status IN ('taken', 'snoozed', 'missed')),
      note TEXT
    );
  `);

  console.log('Migration completed successfully!');
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
