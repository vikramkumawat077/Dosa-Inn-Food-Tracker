/**
 * Cart Context Provider
 * 
 * Manages the customer's shopping cart state including:
 * - Cart items with quantities and add-ons
 * - Extra items (RDA Specials)
 * - Table number for dine-in orders
 * - Preorder details (pickup time, customer info)
 * - Cart totals (items count and amount)
 * 
 * The cart state is stored in memory and cleared after checkout.
 * Order type determines flow: 'dine-in' or 'preorder'
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MenuItem, AddOn, Extra } from './menuData';

export type OrderType = 'dine-in' | 'preorder';

export interface CartItem {
    id: string; // unique cart item id
    menuItem: MenuItem;
    quantity: number;
    selectedAddOns: AddOn[];
    totalPrice: number;
}

export interface CartExtra {
    id: string;
    extra: Extra;
    quantity: number;
}

export interface PreorderDetails {
    pickupTime: string;
    customerName: string;
    customerPhone: string;
}

interface CartContextType {
    items: CartItem[];
    extras: CartExtra[];
    tableNumber: string | null;
    orderType: OrderType;
    preorderDetails: PreorderDetails | null;
    setTableNumber: (table: string) => void;
    setOrderType: (type: OrderType) => void;
    setPreorderDetails: (details: PreorderDetails) => void;
    addItem: (menuItem: MenuItem, quantity: number, addOns: AddOn[]) => void;
    updateItemQuantity: (cartItemId: string, quantity: number) => void;
    removeItem: (cartItemId: string) => void;
    addExtra: (extra: Extra) => void;
    updateExtraQuantity: (extraId: string, quantity: number) => void;
    removeExtra: (extraId: string) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [extras, setExtras] = useState<CartExtra[]>([]);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [orderType, setOrderType] = useState<OrderType>('dine-in');
    const [preorderDetails, setPreorderDetails] = useState<PreorderDetails | null>(null);

    const addItem = useCallback((menuItem: MenuItem, quantity: number, addOns: AddOn[]) => {
        const addOnsPrice = addOns.reduce((sum, a) => sum + a.price, 0);
        const totalPrice = (menuItem.price + addOnsPrice) * quantity;

        const newItem: CartItem = {
            id: `${menuItem.id}-${Date.now()}`,
            menuItem,
            quantity,
            selectedAddOns: addOns,
            totalPrice,
        };

        setItems(prev => [...prev, newItem]);
    }, []);

    const updateItemQuantity = useCallback((cartItemId: string, quantity: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === cartItemId) {
                const addOnsPrice = item.selectedAddOns.reduce((sum, a) => sum + a.price, 0);
                return {
                    ...item,
                    quantity,
                    totalPrice: (item.menuItem.price + addOnsPrice) * quantity,
                };
            }
            return item;
        }));
    }, []);

    const removeItem = useCallback((cartItemId: string) => {
        setItems(prev => prev.filter(item => item.id !== cartItemId));
    }, []);

    const addExtra = useCallback((extra: Extra) => {
        setExtras(prev => {
            const existing = prev.find(e => e.extra.id === extra.id);
            if (existing) {
                return prev.map(e =>
                    e.extra.id === extra.id
                        ? { ...e, quantity: e.quantity + 1 }
                        : e
                );
            }
            return [...prev, { id: extra.id, extra, quantity: 1 }];
        });
    }, []);

    const updateExtraQuantity = useCallback((extraId: string, quantity: number) => {
        setExtras(prev => prev.map(e =>
            e.id === extraId ? { ...e, quantity } : e
        ));
    }, []);

    const removeExtra = useCallback((extraId: string) => {
        setExtras(prev => prev.filter(e => e.id !== extraId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        setExtras([]);
        setPreorderDetails(null);
        setOrderType('dine-in');
    }, []);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) +
        extras.reduce((sum, e) => sum + e.quantity, 0);

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0) +
        extras.reduce((sum, e) => sum + (e.extra.price * e.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            extras,
            tableNumber,
            orderType,
            preorderDetails,
            setTableNumber,
            setOrderType,
            setPreorderDetails,
            addItem,
            updateItemQuantity,
            removeItem,
            addExtra,
            updateExtraQuantity,
            removeExtra,
            clearCart,
            totalItems,
            totalAmount,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

