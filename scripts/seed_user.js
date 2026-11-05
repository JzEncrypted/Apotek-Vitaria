import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.fmhmzmdyejmefztsmrjl:jzuvgti%403389@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const email = 'user@vitaria.com';
    const password = 'authgoogle@vitaria';
    const hash = bcrypt.hashSync(password, 10);

    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (id, name, email, phone, role, avatar_url, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['usr-demo-vitaria', 'Pengguna Apotek Vitaria', email, '087819622174', 'customer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', hash]
      );
      console.log('SUCCESS: Created user@vitaria.com with password authgoogle@vitaria');
    } else {
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
      console.log('SUCCESS: Updated user@vitaria.com password to authgoogle@vitaria');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
