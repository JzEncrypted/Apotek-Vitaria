-- ========================================================
-- Apotek Vitaria Clean Production Seed Data
-- 0 Test Orders, Real Pharmacy Medicines Catalog
-- ========================================================

-- Insert Default APJ (Apoteker Penanggung Jawab) & Pelanggan
INSERT INTO users (id, name, email, phone, role, avatar_url)
VALUES 
    ('stf-apj-01', 'Apt. Siti Rahmawati, S.Farm', 'siti.rahmawati@apotekvitaria.id', '0812-9876-5432', 'staff', '/vitaria.jpg'),
    ('usr-customer-1', 'Budi Santoso', 'budi.santoso@gmail.com', '0812-3456-7890', 'customer', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150')
ON CONFLICT (id) DO NOTHING;

-- Insert Real Standard Pharmacy Medicines
INSERT INTO medicines (id, name, generic_name, category, dosage_form, strength, unit, price, stock, min_stock, requires_prescription, manufacturer, description)
VALUES
    ('med-001', 'Paracetamol 500mg', 'Paracetamol', 'Analgesik & Antipiretik', 'tablet', '500 mg', 'strip', 12000, 150, 20, FALSE, 'Kimia Farma', 'Meredakan rasa sakit kepala, sakit gigi, dan menurunkan demam.'),
    ('med-002', 'Amoxicillin 500mg', 'Amoxicillin Trihydrate', 'Antibiotik', 'kapsul', '500 mg', 'strip', 18500, 80, 15, TRUE, 'Kalbe Farma', 'Antibiotik spektrum luas untuk infeksi bakteri saluran pernapasan dan kulit. Wajib dihabiskan sesuai resep.'),
    ('med-003', 'Cetirizine 10mg', 'Cetirizine HCl', 'Antihistamin & Alergi', 'tablet', '10 mg', 'strip', 14000, 95, 15, FALSE, 'Dexa Medica', 'Meredakan gejala alergi seperti hidung berair, bersin-bersin, mata berair, dan gatal kulit.'),
    ('med-004', 'OBH Combi Batuk Flu', 'Succus Liquiritiae, Paracetamol, Pseudoephedrine', 'Batuk & Flu', 'sirup', '100 ml', 'botol', 22000, 60, 10, FALSE, 'Combiphar', 'Meredakan batuk yang disertai gejala flu seperti demam, sakit kepala, hidung tersumbat, dan bersin.'),
    ('med-005', 'Vitamin C 500mg IPI', 'Ascorbic Acid', 'Vitamin & Suplemen', 'tablet', '500 mg', 'botol', 15000, 120, 25, FALSE, 'Supra Ferbindo Farma', 'Membantu memelihara daya tahan tubuh dan mempercepat pemulihan saat sakit.'),
    ('med-006', 'Antasida Doen', 'Aluminium Hidroksida, Magnesium Hidroksida', 'Pencernaan & Lambung', 'tablet kunyah', '200 mg / 200 mg', 'strip', 8000, 110, 20, FALSE, 'Kimia Farma', 'Mengurangi gejala mual, perih lambung, dan kembung akibat asam lambung tinggi.')
ON CONFLICT (id) DO NOTHING;
