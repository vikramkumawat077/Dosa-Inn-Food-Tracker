const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log('Testing Orders Update...');

    const { data: existingOrders, error: fetchError } = await supabase.from('orders').select('*').limit(1);

    if (fetchError || !existingOrders || existingOrders.length === 0) {
        console.log('No orders or fetch failed:', fetchError);
        return;
    }

    const orderToUpdate = existingOrders[0];
    const newStatus = orderToUpdate.status === 'pending' ? 'preparing' : 'pending';

    console.log('Updating order', orderToUpdate.order_id, 'to status:', newStatus);

    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderToUpdate.order_id)
        .select();

    if (error) {
        console.error('Update failed:', error.message);
    } else {
        console.log('Update successful! Data:', data);
    }
}

testUpdate();
