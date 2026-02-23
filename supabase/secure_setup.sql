-- ROCKY DA ADDA - MASTER SECURE SETUP
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ========================================================
-- 1. SETUP ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can check their own admin status" ON admins;
CREATE POLICY "Users can check their own admin status" ON admins FOR
SELECT USING (
        (
            SELECT auth.jwt()->>'email'
        ) = email
    );
-- Insert initial admin
INSERT INTO admins (email)
VALUES ('vikramkumawat077@gmail.com') ON CONFLICT (email) DO NOTHING;
-- 2. SCHEMA MIGRATION: RENAME VISITOR_ID TO TOKEN_ID
-- This "connects" the session with the concept of a token id.
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'orders'
        AND column_name = 'visitor_id'
) THEN
ALTER TABLE orders
    RENAME COLUMN visitor_id TO token_id;
END IF;
END $$;
-- 3. ENFORCE STRICT PRIVACY (RLS) ON ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- Remove all old policies
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;
DROP POLICY IF EXISTS "Strict read orders" ON orders;
DROP POLICY IF EXISTS "Strict insert orders" ON orders;
DROP POLICY IF EXISTS "Strict update orders" ON orders;
-- READ: User can see their own orders (matched by token_id) OR admin can see all.
CREATE POLICY "Secure read orders" ON orders FOR
SELECT USING (
        (auth.uid()::text = token_id)
        OR (
            EXISTS (
                SELECT 1
                FROM admins
                WHERE email = auth.jwt()->>'email'
            )
        )
    );
-- INSERT: Only authenticated anonymous users can place orders.
CREATE POLICY "Secure insert orders" ON orders FOR
INSERT WITH CHECK ((auth.uid()::text = token_id));
-- UPDATE: Only admins can update status.
CREATE POLICY "Secure update orders" ON orders FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM admins
            WHERE email = auth.jwt()->>'email'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1
            FROM admins
            WHERE email = auth.jwt()->>'email'
        )
    );