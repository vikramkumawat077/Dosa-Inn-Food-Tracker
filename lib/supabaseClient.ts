/**
 * Supabase Client
 * 
 * Initializes and exports the Supabase client for use across the app.
 * Reads credentials from environment variables set in .env.local.
 * 
 * If Supabase is not configured, exports a null client. The menuContext
 * will fall back to localStorage in this case.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

const isConfigured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 10;

// Only create the client if we have valid credentials
export const supabase: SupabaseClient | null = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseReady = isConfigured;

if (!isConfigured && typeof window !== 'undefined') {
    console.warn(
        '⚠️ Supabase not configured — using localStorage fallback.\n' +
        '   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
}
