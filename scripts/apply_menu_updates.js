
const { createClient } = require('@supabase/supabase-js');

// Credentials from previous successful test script
const supabaseUrl = 'https://vhrgbmyrhvosejuxiwwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocmdibXlyaHZvc2VqdXhpd3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTIyOTgsImV4cCI6MjA4NjY2ODI5OH0.yoosiZBgs9xoUoSdqtkRPJUm4vQbPjZUWKMNLCpra04';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdates() {
    console.log('Applying menu updates...');

    // 1. Update Parathas Extras (Chutneys)
    const parathaExtras = [
        { id: 'dhaniya-chutney', name: 'Dhaniya Chutney', price: 10 },
        { id: 'schezwan-chutney', name: 'Schezwan Chutney', price: 10 },
    ];

    const { error: error1 } = await supabase
        .from('menu_items')
        .update({ extras: parathaExtras })
        .eq('category_id', 'parathas');

    if (error1) console.error('Error updating Parathas:', error1);
    else console.log('✅ Updated Parathas extras');


    // 2. Update Pav Bhaji Add-ons
    const pavBhajiAddOns = [
        { id: 'cheese-pav', name: 'Cheese', price: 25 },
        { id: 'butter-pav', name: 'Butter', price: 10 },
        { id: 'extra-pav', name: 'Pav', price: 10 },
        { id: 'butter-pav-full', name: 'Butter Pav', price: 20 },
        { id: 'masala-pav', name: 'Masala Pav', price: 20 },
        { id: 'plain-pav-full', name: 'Plain Pav', price: 10 },
    ];

    const { error: error2 } = await supabase
        .from('menu_items')
        .update({ add_ons: pavBhajiAddOns })
        .eq('category_id', 'pav-bhaji');

    if (error2) console.error('Error updating Pav Bhaji:', error2);
    else console.log('✅ Updated Pav Bhaji add-ons');
}

applyUpdates();
