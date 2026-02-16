-- Create a table for whitelisted admin emails
create table if not exists admins (
    id uuid default gen_random_uuid() primary key,
    email text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table admins enable row level security;
-- Policy: Users can only see their own entry in the admins table
-- This allows the app to check "Am I an admin?" by querying for their own email.
create policy "Users can check their own admin status" on admins for
select using (
        (
            select auth.jwt()->>'email'
        ) = email
    );
-- Insert the initial admin (YOU)
insert into admins (email)
values ('vikramkumawat077@gmail.com') on conflict (email) do nothing;