'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getVisitorId } from '@/lib/visitorId';
import styles from './page.module.css';

interface OrderItem {
    menuItem: { name: string };
    quantity: number;
    selectedAddOns: Array<{ name: string }>;
    totalPrice: number;
}

interface OrderExtra {
    extra: { name: string; price: number };
    quantity: number;
}

interface OrderData {
    orderId: string;
    orderType?: 'dine-in' | 'preorder';
    tableNumber: string | null;
    items: OrderItem[];
    extras: OrderExtra[];
    totalAmount: number;
    timestamp: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'served';
    estimatedTime?: number; // in minutes
    preorderDetails?: {
        pickupTime: string;
    } | null;
}

export default function TrackOrderPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const loadMyOrders = async () => {
            const visitorId = getVisitorId();
            if (!visitorId) {
                setOrders([]);
                return;
            }

            // Query Supabase directly for this visitor's recent orders (last 2 hours)
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

            if (supabase) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('visitor_id', visitorId)
                    .neq('status', 'delivered')
                    .gte('created_at', twoHoursAgo)
                    .order('created_at', { ascending: false });

                if (!error) {
                    // Supabase query succeeded — trust its result even if empty
                    if (data && data.length > 0) {
                        const mappedOrders: OrderData[] = data.map(row => ({
                            orderId: row.order_id,
                            orderType: row.order_type,
                            tableNumber: row.table_number,
                            items: (row.items || []).map((i: Record<string, unknown>) => ({
                                menuItem: { name: (i.menuItem as Record<string, unknown>)?.name || '' },
                                quantity: i.quantity as number,
                                selectedAddOns: ((i.selectedAddOns as Array<Record<string, unknown>>) || []).map(a => ({ name: a.name as string })),
                                totalPrice: i.totalPrice as number
                            })),
                            extras: (row.extras || []).map((e: Record<string, unknown>) => ({
                                extra: { name: (e.extra as Record<string, unknown>)?.name as string || '', price: (e.extra as Record<string, unknown>)?.price as number || 0 },
                                quantity: e.quantity as number
                            })),
                            totalAmount: row.total_amount,
                            timestamp: row.created_at,
                            status: row.status,
                            preorderDetails: row.preorder_details
                        }));
                        setOrders(mappedOrders);
                    } else {
                        // No active orders — all delivered or none exist
                        setOrders([]);
                    }
                    return;
                }
            }

            // Fallback only if Supabase is unavailable/errored: check sessionStorage
            const lastOrderStr = sessionStorage.getItem('lastOrder');
            if (lastOrderStr) {
                const lastOrder = JSON.parse(lastOrderStr);
                setOrders([lastOrder]);
            } else {
                setOrders([]);
            }
        };

        loadMyOrders();

        // Re-fetch every 5 seconds to get status updates
        const pollInterval = setInterval(loadMyOrders, 5000);

        // Update current time every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(timeInterval);
        };
    }, []);

    const getTimeSinceOrder = (timestamp: string) => {
        const orderTime = new Date(timestamp);
        const diff = currentTime.getTime() - orderTime.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (minutes < 1) {
            return `${seconds}s ago`;
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else {
            const hours = Math.floor(minutes / 60);
            return `${hours}h ${minutes % 60}m ago`;
        }
    };

    const getOrderTime = (timestamp: string) => {
        const orderTime = new Date(timestamp);
        return orderTime.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getOrderDate = (timestamp: string) => {
        const orderTime = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (orderTime.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (orderTime.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return orderTime.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            });
        }
    };

    const getEstimatedTimeRemaining = (order: OrderData) => {
        const orderTime = new Date(order.timestamp);
        const estimatedMinutes = order.estimatedTime || 15;
        const elapsedMs = currentTime.getTime() - orderTime.getTime();
        const elapsedMinutes = elapsedMs / (1000 * 60);
        const remainingMinutes = Math.max(0, Math.ceil(estimatedMinutes - elapsedMinutes));

        return remainingMinutes;
    };

    const getProgressPercentage = (order: OrderData) => {
        const orderTime = new Date(order.timestamp);
        const estimatedMinutes = order.estimatedTime || 15;
        const elapsedMs = currentTime.getTime() - orderTime.getTime();
        const elapsedMinutes = elapsedMs / (1000 * 60);

        return Math.min(100, (elapsedMinutes / estimatedMinutes) * 100);
    };

    // Use status directly from order object (synced from Supabase)
    const getOrderStatus = (order: OrderData) => {
        if (order.status) return order.status;

        // Fallback logic if status is missing
        const orderTime = new Date(order.timestamp);
        const elapsedMinutes = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60);
        if (elapsedMinutes < 15) return 'preparing';
        else if (elapsedMinutes < 30) return 'ready';
        else return 'served';
    };

    if (orders.length === 0) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/" className={styles.logoLink}>
                        <img src="/logo.png" alt="Rocky Da Adda" className={styles.logo} />
                    </Link>
                    <h2 className={styles.headerTitle}>Track Orders</h2>
                </header>

                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📦</div>
                    <h2>No Orders Yet</h2>
                    <p>You haven't placed any orders recently.</p>
                    <Link href="/menu" className={styles.orderNowBtn}>
                        Start Ordering
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.logoLink}>
                    <img src="/logo.png" alt="Rocky Da Adda" className={styles.logo} />
                </Link>
                <h2 className={styles.headerTitle}>Track Orders</h2>
            </header>

            <div className={styles.content}>
                <div className={styles.ordersGrid}>
                    {orders.map((order) => {
                        const status = getOrderStatus(order);
                        const remainingMinutes = getEstimatedTimeRemaining(order);
                        const progress = getProgressPercentage(order);

                        return (
                            <div key={order.orderId} className={styles.orderCard}>
                                {/* Order Header */}
                                <div className={styles.orderHeader}>
                                    <div className={styles.orderIdSection}>
                                        <span className={styles.orderLabel}>Order</span>
                                        <span className={styles.orderId}>#{order.orderId.slice(-6).toUpperCase()}</span>
                                    </div>

                                    {order.orderType === 'preorder' ? (
                                        <div className={styles.tableTag}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            Pickup: {order.preorderDetails?.pickupTime || 'Time N/A'}
                                        </div>
                                    ) : (
                                        <div className={styles.tableTag}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                            Table {order.tableNumber}
                                        </div>
                                    )}
                                </div>

                                {/* Time Info */}
                                <div className={styles.timeInfo}>
                                    <div className={styles.orderTimeDetail}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        <span>{getOrderDate(order.timestamp)} at {getOrderTime(order.timestamp)}</span>
                                    </div>
                                    <span className={styles.timeSince}>{getTimeSinceOrder(order.timestamp)}</span>
                                </div>

                                {/* Status Section */}
                                <div className={`${styles.statusSection} ${styles[status]}`}>
                                    <div className={styles.statusHeader}>
                                        <div className={styles.statusIndicator}>
                                            {status === 'preparing' && (
                                                <div className={styles.cookingAnimation}>
                                                    <span className={styles.steam}>🍳</span>
                                                </div>
                                            )}
                                            {status === 'ready' && <span className={styles.readyIcon}>✅</span>}
                                            {(status === 'served' || status === 'delivered') && <span className={styles.servedIcon}>🎉</span>}
                                        </div>
                                        <div className={styles.statusText}>
                                            <span className={styles.statusLabel}>
                                                {status === 'preparing' && 'Preparing Your Order'}
                                                {status === 'ready' && 'Ready for Pickup!'}
                                                {(status === 'served' || status === 'delivered') && 'Order Complete'}
                                            </span>
                                            {status === 'preparing' && remainingMinutes > 0 && (
                                                <span className={styles.estimatedTime}>
                                                    ~{remainingMinutes} min remaining
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {status === 'preparing' && (
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Order Items */}
                                <div className={styles.itemsList}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className={styles.orderItem}>
                                            <div className={styles.itemQty}>{item.quantity}×</div>
                                            <div className={styles.itemDetails}>
                                                <span className={styles.itemName}>{item.menuItem.name}</span>
                                                {item.selectedAddOns.length > 0 && (
                                                    <span className={styles.itemAddOns}>
                                                        + {item.selectedAddOns.map(a => a.name).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={styles.itemPrice}>₹{item.totalPrice}</span>
                                        </div>
                                    ))}
                                    {order.extras.map((extra, idx) => (
                                        <div key={`extra-${idx}`} className={styles.orderItem}>
                                            <div className={styles.itemQty}>{extra.quantity}×</div>
                                            <div className={styles.itemDetails}>
                                                <span className={styles.itemName}>{extra.extra.name}</span>
                                            </div>
                                            <span className={styles.itemPrice}>₹{extra.extra.price * extra.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className={styles.totalSection}>
                                    <span className={styles.totalLabel}>Total Paid</span>
                                    <span className={styles.totalAmount}>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <button className={styles.orderMoreBtn} onClick={() => router.push('/menu')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Order More
                    </button>
                    <Link href="/menu" className={styles.homeBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to Menu
                    </Link>
                </div>
            </div>
        </div>
    );
}
