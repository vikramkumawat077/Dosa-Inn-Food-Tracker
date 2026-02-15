'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useCart } from '@/lib/cartContext';
import styles from './page.module.css';

export default function CartPage() {
    const router = useRouter();
    const {
        items,
        extras,
        tableNumber,
        updateItemQuantity,
        removeItem,
        updateExtraQuantity,
        removeExtra,
        totalAmount
    } = useCart();

    // Redirect if no table number
    useEffect(() => {
        if (!tableNumber) {
            router.push('/table');
        }
    }, [tableNumber, router]);

    const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeItem(cartItemId);
        } else {
            updateItemQuantity(cartItemId, newQuantity);
        }
    };

    const handleExtraQuantityChange = (extraId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeExtra(extraId);
        } else {
            updateExtraQuantity(extraId, newQuantity);
        }
    };

    const isEmpty = items.length === 0 && extras.length === 0;

    return (
        <div className={styles.container}>
            <Header
                showBack
                onBack={() => router.back()}
                title="Your Cart"
            />

            {isEmpty ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="9" cy="20" r="1" />
                            <circle cx="18" cy="20" r="1" />
                            <path d="M6 6L5 3H2" />
                        </svg>
                    </div>
                    <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                    <p className={styles.emptyText}>Add some delicious items from the menu</p>
                    <button className={styles.browseBtn} onClick={() => router.push('/menu')}>
                        Browse Menu
                    </button>
                </div>
            ) : (
                <>
                    {/* Table Info */}
                    <div className={styles.tableInfo}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="10" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <span>Delivering to Table {tableNumber}</span>
                    </div>

                    {/* Cart Items */}
                    <div className={styles.cartContent}>
                        <div className={styles.itemsList}>
                            {items.map(item => (
                                <div key={item.id} className={styles.cartItem}>
                                    <div className={styles.itemLeft}>
                                        <div className={styles.vegBadge} />
                                        <div className={styles.itemDetails}>
                                            <h3 className={styles.itemName}>{item.menuItem.name}</h3>
                                            {item.selectedAddOns.length > 0 && (
                                                <p className={styles.addOns}>
                                                    + {item.selectedAddOns.map(a => a.name).join(', ')}
                                                </p>
                                            )}
                                            <p className={styles.itemPrice}>₹{item.totalPrice}</p>
                                        </div>
                                    </div>
                                    <div className={styles.quantityControl}>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        >
                                            {item.quantity === 1 ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            ) : '−'}
                                        </button>
                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Extras */}
                            {extras.length > 0 && (
                                <>
                                    <div className={styles.sectionDivider}>
                                        <span>Extras</span>
                                    </div>
                                    {extras.map(extra => (
                                        <div key={extra.id} className={styles.cartItem}>
                                            <div className={styles.itemLeft}>
                                                <div className={styles.vegBadge} />
                                                <div className={styles.itemDetails}>
                                                    <h3 className={styles.itemName}>{extra.extra.name}</h3>
                                                    <p className={styles.itemPrice}>₹{extra.extra.price * extra.quantity}</p>
                                                </div>
                                            </div>
                                            <div className={styles.quantityControl}>
                                                <button
                                                    className={styles.qtyBtn}
                                                    onClick={() => handleExtraQuantityChange(extra.id, extra.quantity - 1)}
                                                >
                                                    {extra.quantity === 1 ? (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                        </svg>
                                                    ) : '−'}
                                                </button>
                                                <span className={styles.qtyValue}>{extra.quantity}</span>
                                                <button
                                                    className={styles.qtyBtn}
                                                    onClick={() => handleExtraQuantityChange(extra.id, extra.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Bill Summary */}
                        <div className={styles.billSummary}>
                            <h3 className={styles.billTitle}>Bill Summary</h3>
                            <div className={styles.billRow}>
                                <span>Item Total</span>
                                <span>₹{totalAmount}</span>
                            </div>
                            <div className={styles.billDivider} />
                            <div className={`${styles.billRow} ${styles.billTotal}`}>
                                <span>To Pay</span>
                                <span>₹{totalAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Checkout CTA */}
                    <div className={styles.ctaWrapper}>
                        <button
                            className={styles.checkoutBtn}
                            onClick={() => router.push('/checkout')}
                        >
                            <span>Proceed to Pay</span>
                            <span className={styles.checkoutAmount}>₹{totalAmount}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
