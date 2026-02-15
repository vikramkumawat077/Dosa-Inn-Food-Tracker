-- Rocky Da Adda — Kitchen Dashboard Schema
-- Run this in the Supabase SQL Editor
-- ============================================
-- 1. CHEFS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chefs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    color TEXT NOT NULL DEFAULT '#4CAF50',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ============================================
-- 2. CHEF ↔ CATEGORY ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS chef_categories (
    chef_id TEXT NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (chef_id, category_id)
);
-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chef_categories_chef ON chef_categories(chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_categories_category ON chef_categories(category_id);
-- ============================================
-- 4. RLS POLICIES
-- ============================================
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read chefs" ON chefs FOR
SELECT USING (true);
CREATE POLICY "Public insert chefs" ON chefs FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public update chefs" ON chefs FOR
UPDATE USING (true);
CREATE POLICY "Public delete chefs" ON chefs FOR DELETE USING (true);
CREATE POLICY "Public read chef_categories" ON chef_categories FOR
SELECT USING (true);
CREATE POLICY "Public insert chef_categories" ON chef_categories FOR
INSERT WITH CHECK (true);
CREATE POLICY "Public delete chef_categories" ON chef_categories FOR DELETE USING (true);
-- ============================================
-- 5. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime
ADD TABLE chefs;
ALTER PUBLICATION supabase_realtime
ADD TABLE chef_categories;