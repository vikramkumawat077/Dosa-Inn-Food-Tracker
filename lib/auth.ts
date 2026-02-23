import { supabase } from './supabaseClient';

/**
 * Ensures a valid anonymous session exists for the user.
 * If no session exists, it signs in anonymously.
 * Returns the user's ID (token).
 */
export async function ensureSession(): Promise<string | null> {
    if (!supabase) return null;

    // 1. Check if we already have a session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
        return session.user.id;
    }

    // 2. No session? Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
        console.error('Error establishing anonymous session:', error.message);
        return null;
    }

    return data.user?.id || null;
}

/**
 * Gets the current visitor ID (Supabase user ID)
 */
export async function getSessionUserId(): Promise<string | null> {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
}
