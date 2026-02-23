
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhrgbmyrhvosejuxiwwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocmdibXlyaHZvc2VqdXhpd3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTIyOTgsImV4cCI6MjA4NjY2ODI5OH0.yoosiZBgs9xoUoSdqtkRPJUm4vQbPjZUWKMNLCpra04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthInsert() {
    console.log('Signing in anonymously...');
    const { data: { user }, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
        console.error('Sign in failed:', signInError);
        return;
    }

    console.log('Signed in as:', user?.id);

    const dummyOrder = {
        order_id: `verify-auth-${Date.now()}`,
        token_number: 888,
        items: [],
        extras: [],
        total_amount: 50,
        status: 'pending',
        created_at: new Date().toISOString(),
        token_id: user?.id
    };

    console.log('Inserting order...');
    const { data, error } = await supabase
        .from('orders')
        .insert(dummyOrder)
        .select();

    if (error) {
        console.error('INSERT FAILED (even with auth):', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testAuthInsert();
