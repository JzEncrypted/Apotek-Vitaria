# Apotek Vitaria

Aplikasi manajemen operasional apotek modern dan layanan kesehatan digital berbasis **React 18**, **TypeScript**, **Tailwind CSS**, **Express.js**, dan **Supabase PostgreSQL**. Dirancang untuk memberikan pengalaman mobile-first yang intuitif bagi pasien serta sistem manajemen farmasi komprehensif bagi apoteker dan staf apotek.

---

## Fitur Utama

### 1. Portal Pasien / Pelanggan (*Customer Mobile App*)
- **Katalog & Pembelian Obat**: Pencarian obat bebas, bebas terbatas, dan obat resep dengan filter kategori.
- **Tebus Resep Dokter**: Pengunggahan foto resep dokter untuk diverifikasi oleh apoteker berlisensi (*APJ*).
- **Pengingat Minum Obat Pintar (*Smart Reminders*)**:
  - Rekomendasi otomatis dari riwayat pembelian obat.
  - Notifikasi jadwal minum obat harian (*pagi, siang, malam*).
- **Konsultasi Farmasi Real-time**: Layanan pesan dua arah (*live chat*) antara pasien dan apoteker untuk edukasi obat.
- **Manajemen Profil**: Pembaruan profil dengan fitur *avatar cropper* berbasis HTML5 Canvas.
- **Autentikasi Aman**: Login berbasis email/password dan integrasi Google OAuth (*Supabase Auth*).

### 2. Portal Apoteker & Staf (*Staff Operations & Inventory Hub*)
- **Dashboard Operasional**: Pemantauan metrik penjualan, katalog aktif, stok fisik, konsultasi pasien, dan peringatan inventaris kritis.
- **Katalog Obat & Penyesuaian Stok**:
  - CRUD katalog obat (nama, sediaan, dosis, satuan, harga modal, harga jual, nomor batch, masa kedaluwarsa).
  - Modal penyesuaian stok (*Stock Adjust Modal*) dengan audit log (masuk, keluar, penyesuaian/opname).
- **Laporan Stok & Peringatan Dini (*Early Warning Low-Stock Report*)**:
  - Banner peringatan dini otomatis saat stok mencapai ambang minimum ($\le \text{minStock}$) atau habis total.
  - Kartu metrik: Total SKU, Total Fisik Unit, Valuasi Aset Modal Farmasi (Rp), Item Kritis.
  - Indikator progres visual level stok dengan kode warna (Hijau, Kuning/Oranye, Merah).
  - Ekspor laporan inventaris ke Microsoft Excel (`.xlsx`) lengkap dengan kalkulasi nilai aset.
  - Format instan pembuatan Surat Pesanan (*Purchase Order*) untuk PBF / distributor via WhatsApp.
- **Laporan Penjualan & Kasir**:
  - Verifikasi bukti transfer dan validasi resep dokter.
  - Pelacakan status pengiriman (*Processing, Shipped, Completed*).
  - Cetak struk faktur resmi apotek dan ekspor laporan transaksi ke Excel.
- **Manajemen Pelanggan**: Direktori data pelanggan dengan akses cepat ke saluran konsultasi.

---

## Teknologi yang Digunakan

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Vite](https://vitejs.dev/)
- **Icons**: [FontAwesome SVG Icons](https://fontawesome.com/)
- **Backend**: [Express.js](https://expressjs.com/) (Node.js)
- **Database & Auth**: [Supabase](https://supabase.com/) ([PostgreSQL](https://www.postgresql.org/)), [Supabase Auth](https://supabase.com/auth)
- **Spreadsheet Engine**: [SheetJS (xlsx)](https://docs.sheetjs.com/)

---

## Panduan Instalasi & Menjalankan Proyek

### 1. Kloning Repositori
```bash
git clone https://github.com/JzEncrypted/Apotek-Vitaria.git
cd Apotek-Vitaria
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (*Environment Variables*)
Salin berkas `.env.example` menjadi `.env` dan lengkapi kredensial database Anda:
```bash
cp .env.example .env
```

Contoh konfigurasi `.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
VITE_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
NODE_ENV="development"
```

### 4. Menjalankan Aplikasi (Development Server)
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 5. Membangun Proyek untuk Produksi
```bash
npm run build
```

---

## Struktur Direktori Utama

```
Apotek-Vitaria/
├── api/                  # Serverless function handlers
├── database/             # Skema SQL & script inisialisasi tabel
├── public/               # Asset statis publik
├── scripts/              # Skrip migrasi & pengisian data (seed)
├── server/               # Backend Express.js API & database pool
├── src/
│   ├── components/       # Komponen UI (Navbar, Modal, Chat, dll.)
│   ├── context/          # State management (Auth, Medication, Pharmacy, Order, Chat)
│   ├── pages/
│   │   ├── auth/         # Login, Register, Lupa Password
│   │   ├── customer/     # Halaman Pelanggan (Home, Reminder, Store, Orders)
│   │   └── staff/        # Halaman Staf (Dashboard, Catalog, StockReport, SalesReport)
│   ├── types/            # TypeScript interface & types
│   └── App.tsx           # Komponen akar & navigasi
├── package.json
└── vite.config.ts
```

---

## Lisensi & Hak Cipta
Hak Cipta © 2026 Apotek Vitaria Magelang. Seluruh hak cipta dilindungi undang-undang.
