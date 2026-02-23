-- Secure Order Privacy Policy
-- Run this in the Supabase SQL Editor to enforce privacy.
-- ========================================================
-- 1. Ensure RLS is enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- 2. Remove old permissive policies
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;
-- 3. Create Strict Access Policies
-- READ: Users can see their own orders OR admins can see everything.
CREATE POLICY "Strict read orders" ON orders FOR
SELECT USING (
        (auth.uid()::text = visitor_id)
        OR (
            EXISTS (
                SELECT 1
                FROM admins
                WHERE email = auth.jwt()->>'email'
            )
        )
    );
-- INSERT: Anyone can place an order, but they must tag it with their unique Auth ID.
CREATE POLICY "Strict insert orders" ON orders FOR
INSERT WITH CHECK ((auth.uid()::text = visitor_id));
-- UPDATE: Only whitelisted admins can change order status (preparing -> ready -> delivered).
CREATE POLICY "Strict update orders" ON orders FOR
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