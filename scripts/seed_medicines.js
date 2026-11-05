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

const defaultMedicines = [
  {
    id: 'med-amox-500',
    name: 'Amoxicillin Trihydrate 500mg',
    generic_name: 'Amoxicillin Trihydrate',
    category: 'Antibiotik & Resep',
    dosage_form: 'kapsul',
    strength: '500 mg',
    unit: 'strip (10 kapsul)',
    price: 12000,
    stock: 50,
    min_stock: 15,
    requires_prescription: true,
    manufacturer: 'PT Kimia Farma Tbk',
    description: 'Antibiotik spektrum luas golongan penisilin untuk infeksi saluran napas, kulit, dan saluran kemih. Wajib diminum tuntas sesuai instruksi resep dokter.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-pct-500',
    name: 'Paracetamol 500mg',
    generic_name: 'Paracetamol',
    category: 'Analgesik & Antipiretik',
    dosage_form: 'kaplet',
    strength: '500 mg',
    unit: 'strip (10 kaplet)',
    price: 6500,
    stock: 120,
    min_stock: 20,
    requires_prescription: false,
    manufacturer: 'PT Kalbe Farma Tbk',
    description: 'Meredakan sakit kepala, nyeri gigi, nyeri otot, dan menurunkan demam.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-cefix-100',
    name: 'Cefixime 100mg',
    generic_name: 'Cefixime Trihydrate',
    category: 'Antibiotik & Resep',
    dosage_form: 'kapsul',
    strength: '100 mg',
    unit: 'strip (10 kapsul)',
    price: 28000,
    stock: 35,
    min_stock: 10,
    requires_prescription: true,
    manufacturer: 'PT Dexa Medica',
    description: 'Antibiotik sefalosporin generasi ketiga untuk infeksi bakteri saluran pernapasan dan kemih.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-antasida',
    name: 'Antasida Doen Suspensi 60ml',
    generic_name: 'Aluminium Hydroxide & Magnesium Hydroxide',
    category: 'Saluran Pencernaan',
    dosage_form: 'sirup',
    strength: '60 ml',
    unit: 'botol',
    price: 9500,
    stock: 45,
    min_stock: 15,
    requires_prescription: false,
    manufacturer: 'PT Kimia Farma Tbk',
    description: 'Mengurangi gejala hiperasiditas lambung, gastritis, tukak lambung, dan rasa kembung/mual.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-cetirizine-10',
    name: 'Cetirizine HCl 10mg',
    generic_name: 'Cetirizine HCl',
    category: 'Alergi & Antihistamin',
    dosage_form: 'tablet',
    strength: '10 mg',
    unit: 'strip (10 tablet)',
    price: 8500,
    stock: 60,
    min_stock: 15,
    requires_prescription: false,
    manufacturer: 'PT Novell Pharmaceutical',
    description: 'Antihistamin generasi kedua untuk mengatasi rinitis alergi, bersin-bersin, gatal biduran, dan konjungtivitis alergi.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-obh-combi',
    name: 'OBH Combi Plus Batuk Flu 100ml',
    generic_name: 'Succus Liquiritiae, Paracetamol, Pseudoephedrine, Chlorpheniramine',
    category: 'Batuk, Flu & Pernapasan',
    dosage_form: 'sirup',
    strength: '100 ml',
    unit: 'botol',
    price: 24500,
    stock: 40,
    min_stock: 10,
    requires_prescription: false,
    manufacturer: 'Combiphar',
    description: 'Meredakan batuk yang disertai gejala flu seperti demam, sakit kepala, hidung tersumbat, dan bersin.',
    image_url: '/vitaria.jpg'
  },
  {
    id: 'med-vit-c-ipi',
    name: 'Vitamin C IPI 50mg (45 Tablet)',
    generic_name: 'Acidum Ascorbicum (Vitamin C)',
    category: 'Vitamin & Imunitas',
    dosage_form: 'tablet',
    strength: '50 mg',
    unit: 'pot (45 tablet)',
    price: 10000,
    stock: 80,
    min_stock: 20,
    requires_prescription: false,
    manufacturer: 'PT Supra Ferbindo Farma',
    description: 'Suplemen vitamin C untuk memelihara daya tahan tubuh dan membantu proses penyembuhan.',
    image_url: '/vitaria.jpg'
  }
];

async function seed() {
  const countRes = await pool.query('SELECT count(*) FROM medicines;');
  const count = parseInt(countRes.rows[0].count, 10);
  console.log(`Current medicines count in Supabase: ${count}`);

  if (count === 0) {
    console.log('Seeding official pharmacy catalog into Supabase PostgreSQL...');
    for (const m of defaultMedicines) {
      await pool.query(
        `INSERT INTO medicines 
         (id, name, generic_name, category, dosage_form, strength, unit, price, stock, min_stock, requires_prescription, manufacturer, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING;`,
        [
          m.id,
          m.name,
          m.generic_name,
          m.category,
          m.dosage_form,
          m.strength,
          m.unit,
          m.price,
          m.stock,
          m.min_stock,
          m.requires_prescription,
          m.manufacturer,
          m.description,
          m.image_url
        ]
      );
    }
    console.log('Successfully seeded 7 official pharmacy medicines into Supabase!');
  } else {
    console.log('Medicines already exist in Supabase.');
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
