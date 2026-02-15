import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixImages() {
    // Get all items without images
    const { data: noImage } = await supabase
        .from('menu_items')
        .select('id, name')
        .is('image', null)
        .order('name');

    console.log('Items without images:');
    noImage?.forEach(i => console.log(`  - ${i.id} | ${i.name}`));
    console.log(`\nTotal: ${noImage?.length || 0} items missing images\n`);

    // Map combo items to appropriate existing images
    const imageMap: Record<string, string> = {
        // Paratha combos - use the main paratha image
        'plain-paratha-jeera-aloo': '/menu-images/plain-paratha.png',
        'plain-paratha-matar-paneer': '/menu-images/plain-paratha.png',
        'plain-paratha-mix-veg': '/menu-images/plain-paratha.png',
        'plain-paratha-dal-tadka': '/menu-images/plain-paratha.png',
        'plain-paratha-rajma': '/menu-images/plain-paratha.png',
        'plain-paratha-chole': '/menu-images/plain-paratha.png',
        'plain-paratha-kadi': '/menu-images/plain-paratha.png',
        'plain-paratha-paneer-masala': '/menu-images/plain-paratha.png',

        // Veg Fried Rice combos - use veg-fried-rice image
        'veg-fried-rice-chilli-paneer': '/menu-images/veg-fried-rice.png',
        'veg-fried-rice-manchurian': '/menu-images/veg-fried-rice.png',
        'veg-fried-rice-paneer-masala': '/menu-images/veg-fried-rice.png',

        // Schezwan Rice combos
        'schezwan-rice-chilli-paneer': '/menu-images/schezwan-rice.png',
        'schezwan-rice-mushroom-manchurian': '/menu-images/schezwan-rice.png',
        'schezwan-rice-paneer-masala': '/menu-images/schezwan-rice.png',

        // Dal combos
        'dal-chawal-combo': '/menu-images/dal-chawal.png',
        'rajma-chawal-combo': '/menu-images/rajma-chawal.png',
        'kadi-chawal-combo': '/menu-images/kadi-chawal.png',
        'chole-chawal-combo': '/menu-images/chole-chawal.png',

        // Beverages without images
        'mineral-water-500ml': '/menu-images/nimbu-paani.png',
        'mineral-water-1l': '/menu-images/nimbu-paani.png',
    };

    let updated = 0;
    if (noImage) {
        for (const item of noImage) {
            const img = imageMap[item.id];
            if (img) {
                const { error } = await supabase
                    .from('menu_items')
                    .update({ image: img })
                    .eq('id', item.id);
                if (!error) {
                    console.log(`✅ ${item.name} → ${img}`);
                    updated++;
                } else {
                    console.log(`❌ ${item.name}: ${error.message}`);
                }
            } else {
                console.log(`⚠️  No image mapped for: ${item.name} (${item.id})`);
            }
        }
    }

    console.log(`\nUpdated ${updated} items with images.`);
}

fixImages();
