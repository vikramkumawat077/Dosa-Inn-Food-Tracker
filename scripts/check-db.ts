import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    const { data: cats, error: e1 } = await supabase.from('categories').select('id');
    const { data: items, error: e2 } = await supabase.from('menu_items').select('id');
    const { data: settings, error: e3 } = await supabase.from('settings').select('key');
    const { data: orders, error: e4 } = await supabase.from('orders').select('order_id');

    if (e1 || e2 || e3 || e4) {
        console.log('ERRORS:', e1?.message, e2?.message, e3?.message, e4?.message);
        return;
    }

    console.log('=== Supabase Database Status ===');
    console.log('Categories:', cats?.length ?? 0);
    console.log('Menu Items:', items?.length ?? 0);
    console.log('Settings:', settings?.map(s => s.key).join(', ') ?? 'none');
    console.log('Orders:', orders?.length ?? 0);
    console.log('================================');
    console.log(cats?.length && items?.length ? '✅ Database is ready!' : '❌ Data missing');
}

check();
