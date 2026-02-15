-- Rocky Da Adda — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================
-- 1. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    icon TEXT NOT NULL DEFAULT '🍽️',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 2. MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    tags TEXT [] DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image TEXT,
    add_ons JSONB DEFAULT '[]',
    extras JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    order_type TEXT NOT NULL DEFAULT 'dine-in',
    table_number TEXT,
    preorder_details JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    extras JSONB NOT NULL DEFAULT '[]',
    total_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 4. SETTINGS TABLE (Rush Hour, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- Public read access for categories and menu items (customers need to see these)
CREATE POLICY "Public read categories" ON categories FOR
SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR
SELECT USING (true);
-- Public read/write for orders (customers place orders, admin updates status)
CREATE POLICY "Public read orders" ON orders FOR
SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON orders FOR
UPDATE USING (true);
-- Public read/write for settings (admin manages rush hour)
CREATE POLICY "Public read settings" ON settings FOR
SELECT USING (true);
CREATE POLICY "Public write settings" ON settings FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update settings" ON settings FOR
UPDATE USING (true);
-- Public write for menu items (admin CRUD)
CREATE POLICY "Public insert menu_items" ON menu_items FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update menu_items" ON menu_items FOR
UPDATE USING (true);
CREATE POLICY "Public delete menu_items" ON menu_items FOR DELETE USING (true);
-- Public write for categories (admin CRUD)
CREATE POLICY "Public insert categories" ON categories FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON categories FOR
UPDATE USING (true);
CREATE POLICY "Public delete categories" ON categories FOR DELETE USING (true);
-- ============================================
-- 7. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime
ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime
ADD TABLE orders;
ALTER PUBLICATION supabase_realtime
ADD TABLE settings;
-- ============================================
-- 8. INITIAL SETTINGS
-- ============================================
INSERT INTO settings (key, value)
VALUES ('rush_hour_mode', 'false'::jsonb),
    ('rush_hour_items', '[]'::jsonb) ON CONFLICT (key) DO NOTHING;