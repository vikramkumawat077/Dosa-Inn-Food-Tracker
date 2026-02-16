-- Enable Realtime for the orders table
alter publication supabase_realtime
add table orders;
-- Also enable for other relevant tables if they aren't already
alter publication supabase_realtime
add table menu_items;
alter publication supabase_realtime
add table chefs;
alter publication supabase_realtime
add table chef_categories;