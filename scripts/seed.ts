/**
 * Seed Script — Populate Supabase with Menu Data
 * 
 * Run this ONCE after setting up schema.sql:
 *   npx tsx scripts/seed.ts
 * 
 * Requires .env.local to be configured with Supabase credentials.
 */

import { createClient } from '@supabase/supabase-js';
import { categories, menuItems } from '../lib/menuData';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url-here') {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Seeding Supabase database...\n');

    // 1. Seed Categories
    console.log('📂 Inserting categories...');
    const categoryRows = categories.map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        tagline: cat.tagline || null,
        icon: cat.icon,
        sort_order: index,
    }));

    const { error: catError } = await supabase
        .from('categories')
        .upsert(categoryRows, { onConflict: 'id' });

    if (catError) {
        console.error('❌ Categories error:', catError.message);
        return;
    }
    console.log(`   ✅ ${categoryRows.length} categories inserted\n`);

    // 2. Seed Menu Items
    console.log('🍽️ Inserting menu items...');
    const menuRows = menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category_id: item.categoryId,
        tags: item.tags || [],
        is_available: item.isAvailable,
        image: item.image || null,
        add_ons: item.addOns ? JSON.parse(JSON.stringify(item.addOns)) : [],
        extras: item.extras ? JSON.parse(JSON.stringify(item.extras)) : [],
    }));

    // Insert in batches of 50 to avoid payload limits
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < menuRows.length; i += batchSize) {
        const batch = menuRows.slice(i, i + batchSize);
        const { error: menuError } = await supabase
            .from('menu_items')
            .upsert(batch, { onConflict: 'id' });

        if (menuError) {
            console.error(`❌ Menu items batch ${i / batchSize + 1} error:`, menuError.message);
            return;
        }
        insertedCount += batch.length;
    }
    console.log(`   ✅ ${insertedCount} menu items inserted\n`);

    // 3. Initialize settings
    console.log('⚙️ Initializing settings...');
    const { error: settingsError } = await supabase
        .from('settings')
        .upsert([
            { key: 'rush_hour_mode', value: false },
            { key: 'rush_hour_items', value: [] },
        ], { onConflict: 'key' });

    if (settingsError) {
        console.error('❌ Settings error:', settingsError.message);
        return;
    }
    console.log('   ✅ Settings initialized\n');

    console.log('🎉 Database seeded successfully!');
    console.log(`   Categories: ${categoryRows.length}`);
    console.log(`   Menu Items: ${insertedCount}`);
    console.log('   Settings: rush_hour_mode, rush_hour_items');
}

seed().catch(console.error);
