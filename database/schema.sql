-- ========================================================
-- Apotek Vitaria Production Database Schema (PostgreSQL)
-- Compatible with Supabase, Neon.tech, and Vercel Postgres
-- ========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Users (Pelanggan, Apoteker & Staf Farmasi)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Katalog Obat Resmi Farmasi (Pharmacy Catalog)
CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(100),
    dosage_form VARCHAR(50) DEFAULT 'tablet',
    strength VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'strip',
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    requires_prescription BOOLEAN DEFAULT FALSE,
    manufacturer VARCHAR(255),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Transaksi / Pesanan (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    subtotal INTEGER NOT NULL DEFAULT 0,
    delivery_fee INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    grand_total INTEGER NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('qris', 'bank_transfer', 'cash_on_delivery', 'cash_in_store')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verifying', 'paid', 'failed', 'refunded')),
    payment_proof_url TEXT,
    prescription_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
    shipping_address TEXT,
    courier_notes TEXT,
    order_status VARCHAR(30) NOT NULL DEFAULT 'processing' CHECK (order_status IN ('pending_prescription', 'prescription_rejected', 'pending', 'processing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled')),
    staff_verifier_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Tabel Detail Item Pesanan (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    medicine_id VARCHAR(64),
    medicine_name VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(50),
    strength VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(50),
    unit_price INTEGER NOT NULL DEFAULT 0,
    total_price INTEGER NOT NULL DEFAULT 0,
    requires_prescription BOOLEAN DEFAULT FALSE,
    instructions TEXT
);

-- 5. Tabel Pesan Live Chat & Konsultasi Farmasi
CREATE TABLE IF NOT EXISTS consultation_messages (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) DEFAULT 'usr-customer-1',
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('customer', 'pharmacist')),
    sender_name VARCHAR(255) NOT NULL,
    text TEXT,
    image_url TEXT,
    image_caption TEXT,
    audio_url TEXT,
    audio_duration INTEGER,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_consultation_customer ON consultation_messages(customer_id);
