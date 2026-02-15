'use client';

import { ReactNode } from 'react';
import { CartProvider } from '@/lib/cartContext';
import { MenuProvider } from '@/lib/menuContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <MenuProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </MenuProvider>
    );
}
