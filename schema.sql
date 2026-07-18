-- JB DataHub PostgreSQL Database Schema (for Supabase)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Admin Only)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Networks Table
CREATE TABLE IF NOT EXISTS networks (
    id TEXT PRIMARY KEY, -- 'mtn', 'telecel', 'airteltigo'
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    color TEXT,
    color_dark TEXT,
    color_bg TEXT,
    color_border TEXT,
    color_glow TEXT,
    emoji TEXT,
    initial TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Bundles Table
CREATE TABLE IF NOT EXISTS bundles (
    id SERIAL PRIMARY KEY,
    network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
    size_mb INTEGER NOT NULL,
    label TEXT NOT NULL, -- e.g. "1GB", "5.5GB"
    price_ghs DECIMAL(10, 2) NOT NULL,
    cost_price_ghs DECIMAL(10, 2) NOT NULL, -- wholesale cost
    validity_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    network_id TEXT REFERENCES networks(id),
    bundle_id INTEGER REFERENCES bundles(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('data', 'airtime')),
    amount_ghs DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'delivered', 'failed', 'refunded')),
    payment_reference TEXT UNIQUE NOT NULL,
    payment_provider TEXT NOT NULL DEFAULT 'paystack',
    wholesale_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Transactions Table (Audit log for payments)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    provider_reference TEXT NOT NULL,
    amount_ghs DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast queries
CREATE INDEX IF NOT EXISTS idx_orders_phone_number ON orders(phone_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bundles_network_id ON bundles(network_id);

-- Seeding Default Networks
INSERT INTO networks (id, name, slug, tagline, color, color_dark, color_bg, color_border, color_glow, emoji, initial, is_active)
VALUES
('mtn', 'MTN Ghana', 'mtn', 'Everywhere You Go', '#ffcc00', '#b38f00', 'rgba(255,204,0,0.08)', 'rgba(255,204,0,0.2)', 'rgba(255,204,0,0.15)', '🟡', 'M', true),
('telecel', 'Telecel Ghana', 'telecel', 'Together We Can', '#e8001d', '#a80015', 'rgba(232,0,29,0.08)', 'rgba(232,0,29,0.2)', 'rgba(232,0,29,0.12)', '🔴', 'T', true),
('airteltigo', 'AirtelTigo', 'airteltigo', 'Limitless Possibilities', '#0099cc', '#006e94', 'rgba(0,153,204,0.08)', 'rgba(0,153,204,0.2)', 'rgba(0,153,204,0.12)', '🔵', 'A', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    color = EXCLUDED.color,
    color_dark = EXCLUDED.color_dark,
    color_bg = EXCLUDED.color_bg,
    color_border = EXCLUDED.color_border,
    color_glow = EXCLUDED.color_glow,
    emoji = EXCLUDED.emoji,
    initial = EXCLUDED.initial;

-- Seeding Default Bundles for MTN
INSERT INTO bundles (network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days, is_active)
VALUES
('mtn', 1000, '1 GB', 12.00, 10.00, 30, true),
('mtn', 2000, '2 GB', 22.00, 18.50, 30, true),
('mtn', 5000, '5 GB', 45.00, 39.00, 30, true),
('mtn', 10000, '10 GB', 85.00, 75.00, 30, true),
('mtn', 20000, '20 GB', 150.00, 135.00, 30, true);

-- Seeding Default Bundles for Telecel
INSERT INTO bundles (network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days, is_active)
VALUES
('telecel', 1000, '1 GB', 11.00, 9.00, 30, true),
('telecel', 2500, '2.5 GB', 20.00, 17.00, 30, true),
('telecel', 6000, '6 GB', 40.00, 34.00, 30, true),
('telecel', 12000, '12 GB', 75.00, 65.00, 30, true);

-- Seeding Default Bundles for AirtelTigo
INSERT INTO bundles (network_id, size_mb, label, price_ghs, cost_price_ghs, validity_days, is_active)
VALUES
('airteltigo', 1000, '1 GB', 10.00, 8.50, 30, true),
('airteltigo', 3000, '3 GB', 20.00, 16.50, 30, true),
('airteltigo', 7500, '7.5 GB', 40.00, 33.00, 30, true),
('airteltigo', 15000, '15 GB', 70.00, 60.00, 30, true);
