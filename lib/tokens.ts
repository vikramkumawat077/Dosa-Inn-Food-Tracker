import { supabase } from './supabaseClient';

/**
 * Generates a random token number between 1 and 200 that is not
 * currently active in the database (status != 'delivered')
 */
export async function getUniqueToken(): Promise<number> {
    try {
        if (!supabase) {
            console.error('Supabase client is not initialized');
            return Math.floor(Math.random() * 200) + 1;
        }

        // Fetch all active tokens from Supabase
        const { data, error } = await supabase
            .from('orders')
            .select('token_number')
            .neq('status', 'delivered');

        if (error) {
            console.error('Error fetching active tokens:', error);
            // Fallback to random if DB fails, but try to be safe
            return Math.floor(Math.random() * 200) + 1;
        }

        const activeTokens = new Set(data?.map(o => o.token_number).filter(Boolean));

        // If all 200 tokens are taken (unlikely), just pick a random one
        if (activeTokens.size >= 200) {
            return Math.floor(Math.random() * 200) + 1;
        }

        // Try picking random until we find one not in use
        let token;
        do {
            token = Math.floor(Math.random() * 200) + 1;
        } while (activeTokens.has(token));

        return token;
    } catch (err) {
        console.error('Failed to get unique token:', err);
        return Math.floor(Math.random() * 200) + 1;
    }
}
