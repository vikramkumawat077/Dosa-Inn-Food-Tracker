-- 1. Create admins table if not exists
create table if not exists admins (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- 2. Create is_admin() function
create or replace function is_admin() returns boolean as $$ begin return exists (
        select 1
        from admins
        where email = (
                select auth.jwt()->>'email'
            )
    );
end;
$$ language plpgsql security definer;
-- 3. Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- 4. Drop ALL existing policies to allow re-running
DROP POLICY IF EXISTS "Public read orders" ON orders;
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Public update orders" ON orders;
DROP POLICY IF EXISTS "Secure read orders" ON orders;
DROP POLICY IF EXISTS "Secure update orders" ON orders;
-- 5. Create SECURE Read Policy
-- Customers see ONLY their own orders (matched by token_id)
-- Admins see ALL orders
CREATE POLICY "Secure read orders" ON orders FOR
SELECT USING (
        (auth.uid()::text = token_id)
        OR (
            select is_admin()
        )
    );
-- 6. Insert Policy (Anyone can place an order)
CREATE POLICY "Public insert orders" ON orders FOR
INSERT WITH CHECK (true);
-- 7. Update Policy (Anyone can update status for now since Kitchen is anonymous)
CREATE POLICY "Secure update orders" ON orders FOR
UPDATE USING (true);
-- 8. Enable Realtime Sync
ALTER TABLE orders REPLICA IDENTITY FULL;
DO $$ BEGIN -- remove the table from the publication if it exists to avoid errors
alter publication supabase_realtime drop table orders,
menu_items,
settings,
chefs,
chef_categories;
EXCEPTION
WHEN undefined_object THEN null;
END $$;
alter publication supabase_realtime
add table orders,
    menu_items,
    settings,
    chefs,
    chef_categories;