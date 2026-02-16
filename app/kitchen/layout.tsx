import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function KitchenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check for active session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Redirect to login if not authenticated
        redirect('/login');
    }

    // Check if user is whitelisted
    const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();

    if (!adminData || adminError) {
        // console.error('Kitchen Access Denied:', adminError?.message || 'User not in whitelist');
        redirect('/unauthorized');
    }

    return (
        <section>
            {children}
        </section>
    );
}
