/**
 * Menu Context Provider — Supabase Edition
 * 
 * This context manages the global menu state, orders, and rush hour mode.
 * Data is persisted in Supabase and synced in real-time across all devices.
 * 
 * Features:
 * - Full CRUD for menu items (backed by Supabase)
 * - Order management with status updates
 * - Rush hour mode (bulk disable/enable items)
 * - Real-time sync via Supabase Realtime subscriptions
 * - Fallback to local state if Supabase is not configured
 * 
 * Tables used:
 * - menu_items: All menu item data
 * - categories: Category metadata
 * - orders: Customer orders
 * - settings: Rush hour mode & items
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { menuItems as initialMenuItems, MenuItem, categories as initialCategories, Category } from './menuData';
import { supabase, isSupabaseReady } from './supabaseClient';
import { OrderType, PreorderDetails } from './cartContext';

interface Order {
    orderId: string;
    orderType: OrderType;
    tableNumber: string | null;
    preorderDetails: PreorderDetails | null;
    items: Array<{
        menuItem: { id: string; name: string; price: number };
        quantity: number;
        selectedAddOns: Array<{ id: string; name: string; price: number }>;
        totalPrice: number;
    }>;
    extras: Array<{
        extra: { id: string; name: string; price: number };
        quantity: number;
    }>;
    totalAmount: number;
    timestamp: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

interface MenuContextType {
    menuItems: MenuItem[];
    categories: Category[];
    orders: Order[];
    rushHourMode: boolean;
    rushHourItems: string[];
    toggleItemAvailability: (itemId: string) => void;
    updateItemPrice: (itemId: string, newPrice: number) => void;
    addMenuItem: (item: MenuItem) => void;
    updateMenuItem: (itemId: string, updates: Partial<MenuItem>) => void;
    deleteMenuItem: (itemId: string) => void;
    setRushHourMode: (mode: boolean) => void;
    toggleRushHourItem: (itemId: string) => void;
    setRushHourItems: (itemIds: string[]) => void;
    addOrder: (order: Omit<Order, 'status'>) => void;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
    getAvailableItems: () => MenuItem[];
    refreshMenuState: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Supabase readiness is determined by the client module
const supabaseConfigured = isSupabaseReady;

// Helper: Convert Supabase row to MenuItem
function rowToMenuItem(row: Record<string, unknown>): MenuItem {
    return {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) || '',
        price: row.price as number,
        categoryId: row.category_id as string,
        tags: (row.tags as string[] || []).length > 0
            ? (row.tags as ('bestSeller' | 'readyFast')[])
            : undefined,
        isAvailable: row.is_available as boolean,
        image: (row.image as string) || undefined,
        addOns: (row.add_ons as MenuItem['addOns']) || undefined,
        extras: (row.extras as MenuItem['extras']) || undefined,
    };
}

// Helper: Convert Supabase row to Category
function rowToCategory(row: Record<string, unknown>): Category {
    return {
        id: row.id as string,
        name: row.name as string,
        tagline: (row.tagline as string) || undefined,
        icon: row.icon as string,
    };
}

// Helper: Convert Supabase row to Order
function rowToOrder(row: Record<string, unknown>): Order {
    return {
        orderId: row.order_id as string,
        orderType: row.order_type as OrderType,
        tableNumber: (row.table_number as string) || null,
        preorderDetails: (row.preorder_details as PreorderDetails) || null,
        items: (row.items as Order['items']) || [],
        extras: (row.extras as Order['extras']) || [],
        totalAmount: row.total_amount as number,
        timestamp: row.created_at as string,
        status: row.status as Order['status'],
    };
}

// ======= localStorage fallback keys (used when Supabase is not configured) =======
const STORAGE_KEY = 'rocky_da_adda_menu_state';
const ORDERS_KEY = 'rocky_da_adda_orders';
const RUSH_HOUR_ITEMS_KEY = 'rocky_da_adda_rush_hour_items';
const ADMIN_ITEMS_KEY = 'rocky_da_adda_admin_items';

export function MenuProvider({ children }: { children: ReactNode }) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [orders, setOrders] = useState<Order[]>([]);
    const [rushHourMode, setRushHourModeState] = useState(false);
    const [rushHourItems, setRushHourItemsState] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [useSupabase] = useState(supabaseConfigured);

    // ========================
    // DATA LOADING
    // ========================

    const loadFromSupabase = useCallback(async () => {
        if (!supabase) return;
        try {
            // Load categories
            const { data: catData } = await supabase!
                .from('categories')
                .select('*')
                .order('sort_order');
            if (catData && catData.length > 0) {
                setCategories(catData.map(rowToCategory));
            }

            // Load menu items
            const { data: menuData } = await supabase!
                .from('menu_items')
                .select('*')
                .order('created_at');
            if (menuData && menuData.length > 0) {
                setMenuItems(menuData.map(rowToMenuItem));
            }

            // Load orders
            const { data: orderData } = await supabase!
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (orderData) {
                setOrders(orderData.map(rowToOrder));
            }

            // Load settings
            const { data: settingsData } = await supabase!
                .from('settings')
                .select('*');
            if (settingsData) {
                const rushMode = settingsData.find(s => s.key === 'rush_hour_mode');
                const rushItems = settingsData.find(s => s.key === 'rush_hour_items');
                if (rushMode) setRushHourModeState(rushMode.value === true || rushMode.value === 'true');
                if (rushItems && Array.isArray(rushItems.value)) setRushHourItemsState(rushItems.value);
            }
        } catch (error) {
            console.error('Error loading from Supabase:', error);
        }
    }, []);

    const loadFromLocalStorage = useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            const savedAdminItems = localStorage.getItem(ADMIN_ITEMS_KEY);
            const adminItems: MenuItem[] = savedAdminItems ? JSON.parse(savedAdminItems) : [];

            const savedMenu = localStorage.getItem(STORAGE_KEY);
            let mergedItems = [...initialMenuItems];
            let rushMode = false;

            if (savedMenu) {
                const parsed = JSON.parse(savedMenu);
                rushMode = parsed.rushHourMode || false;
                const deletedIds: string[] = parsed.deletedIds || [];
                mergedItems = mergedItems.filter(item => !deletedIds.includes(item.id));

                mergedItems = mergedItems.map(item => {
                    const savedItem = parsed.items?.find((i: { id: string }) => i.id === item.id);
                    return savedItem ? {
                        ...item,
                        isAvailable: savedItem.isAvailable ?? item.isAvailable,
                        price: savedItem.price || item.price,
                        name: savedItem.name || item.name,
                        description: savedItem.description ?? item.description,
                        image: savedItem.image !== undefined ? savedItem.image : item.image,
                        categoryId: savedItem.categoryId || item.categoryId,
                        tags: savedItem.tags !== undefined ? savedItem.tags : item.tags,
                    } : item;
                });
                setRushHourModeState(rushMode);
            }

            setMenuItems([...mergedItems, ...adminItems]);

            const savedRushHourItems = localStorage.getItem(RUSH_HOUR_ITEMS_KEY);
            if (savedRushHourItems) setRushHourItemsState(JSON.parse(savedRushHourItems));

            const savedOrders = localStorage.getItem(ORDERS_KEY);
            if (savedOrders) setOrders(JSON.parse(savedOrders));
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }, []);

    const loadMenuState = useCallback(() => {
        if (useSupabase) {
            loadFromSupabase();
        } else {
            loadFromLocalStorage();
        }
    }, [useSupabase, loadFromSupabase, loadFromLocalStorage]);

    // ========================
    // INITIALIZATION & SYNC
    // ========================

    // Initial load
    useEffect(() => {
        loadMenuState();
        setIsInitialized(true);
    }, [loadMenuState]);

    // Supabase Realtime subscriptions
    useEffect(() => {
        if (!useSupabase) return;

        const menuChannel = supabase!
            .channel('menu-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                loadFromSupabase();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadFromSupabase();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
                loadFromSupabase();
            })
            .subscribe();

        return () => {
            supabase!.removeChannel(menuChannel);
        };
    }, [useSupabase, loadFromSupabase]);

    // localStorage fallback: storage event listener + polling
    useEffect(() => {
        if (useSupabase) return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY || e.key === ORDERS_KEY || e.key === RUSH_HOUR_ITEMS_KEY) {
                loadFromLocalStorage();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        const interval = setInterval(() => loadFromLocalStorage(), 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [useSupabase, loadFromLocalStorage]);

    // ========================
    // LOCALSTORAGE PERSISTENCE (fallback only)
    // ========================

    const persistToLocalStorage = useCallback((items: MenuItem[], rushMode: boolean) => {
        if (typeof window === 'undefined' || useSupabase) return;

        const hardcodedIds = new Set(initialMenuItems.map(i => i.id));
        const hardcodedOverrides = items.filter(i => hardcodedIds.has(i.id)).map(item => ({
            id: item.id, isAvailable: item.isAvailable, price: item.price,
            name: item.name, description: item.description, image: item.image,
            categoryId: item.categoryId, tags: item.tags,
        }));
        const adminItems = items.filter(i => !hardcodedIds.has(i.id));
        const existingIds = new Set(items.map(i => i.id));
        const deletedIds = initialMenuItems.filter(i => !existingIds.has(i.id)).map(i => i.id);

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: hardcodedOverrides, rushHourMode: rushMode, deletedIds }));
        localStorage.setItem(ADMIN_ITEMS_KEY, JSON.stringify(adminItems));
    }, [useSupabase]);

    // Auto-save to localStorage when state changes (fallback)
    useEffect(() => {
        if (!isInitialized || useSupabase || typeof window === 'undefined') return;
        try { persistToLocalStorage(menuItems, rushHourMode); } catch (e) { console.error(e); }
    }, [menuItems, rushHourMode, isInitialized, useSupabase, persistToLocalStorage]);

    useEffect(() => {
        if (!isInitialized || useSupabase || typeof window === 'undefined') return;
        try { localStorage.setItem(RUSH_HOUR_ITEMS_KEY, JSON.stringify(rushHourItems)); } catch (e) { console.error(e); }
    }, [rushHourItems, isInitialized, useSupabase]);

    useEffect(() => {
        if (!isInitialized || useSupabase || typeof window === 'undefined') return;
        try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (e) { console.error(e); }
    }, [orders, isInitialized, useSupabase]);

    // ========================
    // MENU ITEM OPERATIONS
    // ========================

    const toggleItemAvailability = useCallback(async (itemId: string) => {
        const item = menuItems.find(i => i.id === itemId);
        if (!item) return;

        const newAvail = !item.isAvailable;
        setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: newAvail } : i));

        if (useSupabase) {
            await supabase!.from('menu_items').update({ is_available: newAvail }).eq('id', itemId);
        } else {
            persistToLocalStorage(
                menuItems.map(i => i.id === itemId ? { ...i, isAvailable: newAvail } : i),
                rushHourMode
            );
        }
    }, [menuItems, rushHourMode, useSupabase, persistToLocalStorage]);

    const updateItemPrice = useCallback(async (itemId: string, newPrice: number) => {
        setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, price: newPrice } : i));

        if (useSupabase) {
            await supabase!.from('menu_items').update({ price: newPrice }).eq('id', itemId);
        } else {
            persistToLocalStorage(
                menuItems.map(i => i.id === itemId ? { ...i, price: newPrice } : i),
                rushHourMode
            );
        }
    }, [menuItems, rushHourMode, useSupabase, persistToLocalStorage]);

    const addMenuItem = useCallback(async (item: MenuItem) => {
        setMenuItems(prev => [...prev, item]);

        if (useSupabase) {
            await supabase!.from('menu_items').insert({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                category_id: item.categoryId,
                tags: item.tags || [],
                is_available: item.isAvailable,
                image: item.image || null,
                add_ons: item.addOns || [],
                extras: item.extras || [],
            });
        } else {
            persistToLocalStorage([...menuItems, item], rushHourMode);
        }
    }, [menuItems, rushHourMode, useSupabase, persistToLocalStorage]);

    const updateMenuItem = useCallback(async (itemId: string, updates: Partial<MenuItem>) => {
        setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));

        if (useSupabase) {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.price !== undefined) dbUpdates.price = updates.price;
            if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags || [];
            if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
            if (updates.image !== undefined) dbUpdates.image = updates.image || null;
            if (updates.addOns !== undefined) dbUpdates.add_ons = updates.addOns || [];
            if (updates.extras !== undefined) dbUpdates.extras = updates.extras || [];

            await supabase!.from('menu_items').update(dbUpdates).eq('id', itemId);
        } else {
            persistToLocalStorage(
                menuItems.map(i => i.id === itemId ? { ...i, ...updates } : i),
                rushHourMode
            );
        }
    }, [menuItems, rushHourMode, useSupabase, persistToLocalStorage]);

    const deleteMenuItem = useCallback(async (itemId: string) => {
        setMenuItems(prev => prev.filter(i => i.id !== itemId));

        if (useSupabase) {
            await supabase!.from('menu_items').delete().eq('id', itemId);
        } else {
            persistToLocalStorage(menuItems.filter(i => i.id !== itemId), rushHourMode);
        }
    }, [menuItems, rushHourMode, useSupabase, persistToLocalStorage]);

    // ========================
    // RUSH HOUR OPERATIONS
    // ========================

    const setRushHourMode = useCallback(async (mode: boolean) => {
        setRushHourModeState(mode);

        setMenuItems(prev => {
            const newItems = prev.map(item => {
                if (rushHourItems.includes(item.id)) {
                    return { ...item, isAvailable: !mode ? true : false };
                }
                return item;
            });

            if (useSupabase) {
                // Batch update availability in Supabase
                rushHourItems.forEach(async (itemId) => {
                    await supabase!.from('menu_items')
                        .update({ is_available: !mode })
                        .eq('id', itemId);
                });
                // Save rush hour mode setting
                supabase!.from('settings')
                    .upsert({ key: 'rush_hour_mode', value: mode, updated_at: new Date().toISOString() })
                    .then();
            } else {
                persistToLocalStorage(newItems, mode);
            }

            return newItems;
        });
    }, [rushHourItems, useSupabase, persistToLocalStorage]);

    const toggleRushHourItem = useCallback(async (itemId: string) => {
        setRushHourItemsState(prev => {
            const newItems = prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId];

            if (useSupabase) {
                supabase!.from('settings')
                    .upsert({ key: 'rush_hour_items', value: newItems, updated_at: new Date().toISOString() })
                    .then();
            }

            return newItems;
        });
    }, [useSupabase]);

    const setRushHourItems = useCallback(async (itemIds: string[]) => {
        setRushHourItemsState(itemIds);

        if (useSupabase) {
            await supabase!.from('settings')
                .upsert({ key: 'rush_hour_items', value: itemIds, updated_at: new Date().toISOString() });
        }
    }, [useSupabase]);

    // ========================
    // ORDER OPERATIONS
    // ========================

    const addOrder = useCallback(async (orderData: Omit<Order, 'status'>) => {
        const newOrder: Order = { ...orderData, status: 'pending' };
        setOrders(prev => [newOrder, ...prev]);

        if (useSupabase) {
            await supabase!.from('orders').insert({
                order_id: newOrder.orderId,
                order_type: newOrder.orderType,
                table_number: newOrder.tableNumber,
                preorder_details: newOrder.preorderDetails,
                items: newOrder.items,
                extras: newOrder.extras,
                total_amount: newOrder.totalAmount,
                status: 'pending',
                created_at: newOrder.timestamp,
            });
        }
    }, [useSupabase]);

    const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status } : o));

        if (useSupabase) {
            await supabase!.from('orders').update({ status }).eq('order_id', orderId);
        }

        // Legacy: Also handle localStorage notifications for customer tab sync
        if (status === 'delivered' && typeof window !== 'undefined') {
            const deliveredOrdersKey = 'rocky_da_adda_delivered_orders';
            const existingDelivered = localStorage.getItem(deliveredOrdersKey);
            const deliveredList: string[] = existingDelivered ? JSON.parse(existingDelivered) : [];
            if (!deliveredList.includes(orderId)) {
                deliveredList.push(orderId);
                localStorage.setItem(deliveredOrdersKey, JSON.stringify(deliveredList));
            }
            const customerOrders = localStorage.getItem('customerOrders');
            if (customerOrders) {
                const cOrders = JSON.parse(customerOrders);
                const filteredOrders = cOrders.filter((o: { orderId: string }) => o.orderId !== orderId);
                if (filteredOrders.length > 0) {
                    localStorage.setItem('customerOrders', JSON.stringify(filteredOrders));
                } else {
                    localStorage.removeItem('customerOrders');
                }
            }
            const lastOrder = sessionStorage.getItem('lastOrder');
            if (lastOrder) {
                const order = JSON.parse(lastOrder);
                if (order.orderId === orderId) sessionStorage.removeItem('lastOrder');
            }
        }
    }, [useSupabase]);

    // ========================
    // UTILITY
    // ========================

    const getAvailableItems = useCallback(() => {
        return menuItems.filter(item => item.isAvailable);
    }, [menuItems]);

    const refreshMenuState = useCallback(() => {
        loadMenuState();
    }, [loadMenuState]);

    return (
        <MenuContext.Provider value={{
            menuItems,
            categories,
            orders,
            rushHourMode,
            rushHourItems,
            toggleItemAvailability,
            updateItemPrice,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            setRushHourMode,
            toggleRushHourItem,
            setRushHourItems,
            addOrder,
            updateOrderStatus,
            getAvailableItems,
            refreshMenuState,
        }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (context === undefined) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
}

export type { Order };
