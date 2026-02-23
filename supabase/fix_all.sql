-- ==========================================
-- PART 1: SECURITY & VISIBILITY FIXES
-- ==========================================
-- 1. Create admins table safely
create table if not exists admins (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. Create or Update is_admin() function
create or replace function is_admin() returns boolean as $$ begin return exists (
        select 1
        from admins
        where email = (
                select auth.jwt()->>'email'
            )
    );
end;
$$ language plpgsql security definer;
-- 3. Enable RLS on orders (idempotent)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- 4. RESET ALL POLICIES (Aggressive Cleanup)
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;
DROP POLICY IF EXISTS "Secure read orders" ON orders;
DROP POLICY IF EXISTS "Secure update orders" ON orders;
DROP POLICY IF EXISTS "Visibility Policy" ON orders;
-- Just in case
-- 5. RE-CREATE POLICIES via SQL
-- Policy A: SECURE READ
-- Customers: See ONLY their own orders (auth.uid matches token_id)
-- Admins: See ALL orders
CREATE POLICY "Secure read orders" ON orders FOR
SELECT USING (
        (auth.uid()::text = token_id)
        OR (
            select is_admin()
        )
    );
-- Policy B: PUBLIC INSERT (Anyone can place order)
CREATE POLICY "Public insert orders" ON orders FOR
INSERT WITH CHECK (true);
-- Policy C: SECURE UPDATE (Admins/Kitchen only)
CREATE POLICY "Secure update orders" ON orders FOR
UPDATE USING (
        (
            select is_admin()
        )
    );
-- ==========================================
-- PART 2: MENU DATA UPDATES
-- ==========================================
-- 1. Update Parathas Extras (Chutneys)
UPDATE menu_items
SET extras = '[
    {"id": "dhaniya-chutney", "name": "Dhaniya Chutney", "price": 10},
    {"id": "schezwan-chutney", "name": "Schezwan Chutney", "price": 10}
]'::jsonb
WHERE category_id = 'parathas';
-- 2. Update Pav Bhaji Add-ons
UPDATE menu_items
SET add_ons = '[
    {"id": "cheese-pav", "name": "Cheese", "price": 25},
    {"id": "butter-pav", "name": "Butter", "price": 10},
    {"id": "extra-pav", "name": "Pav", "price": 10},
    {"id": "butter-pav-full", "name": "Butter Pav", "price": 20},
    {"id": "masala-pav", "name": "Masala Pav", "price": 20},
    {"id": "plain-pav-full", "name": "Plain Pav", "price": 10}
]'::jsonb
WHERE category_id = 'pav-bhaji';