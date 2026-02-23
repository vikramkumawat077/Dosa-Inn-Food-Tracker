
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhrgbmyrhvosejuxiwwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocmdibXlyaHZvc2VqdXhpd3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTIyOTgsImV4cCI6MjA4NjY2ODI5OH0.yoosiZBgs9xoUoSdqtkRPJUm4vQbPjZUWKMNLCpra04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertAndRead() {
    console.log('Attempting to insert dummy order...');
    const dummyOrder = {
        order_id: `verify-${Date.now()}`,
        order_type: 'dine-in',
        table_number: '99',
        token_number: 999,
        items: [],
        extras: [],
        total_amount: 10,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
        .from('orders')
        .insert(dummyOrder)
        .select();

    if (insertError) {
        console.error('INSERT FAILED:', insertError);
    } else {
        console.log('INSERT SUCCESS:', insertData);
    }

    console.log('Reading orders...');
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log('Last 5 orders:');
    data.forEach(order => {
        console.log(`Order ID: ${order.order_id}, Token: ${order.token_number}, Status: ${order.status}`);
    });
}

testInsertAndRead();
