'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LeafLoader from '@/components/LeafLoader';
import { useCart } from '@/lib/cartContext';
import { useMenu } from '@/lib/menuContext';
import { getUniqueToken } from '@/lib/tokens';
import styles from './page.module.css';

const UPI_APPS = [
    { id: 'gpay', name: 'Google Pay', color: '#4285F4' },
    { id: 'phonepe', name: 'PhonePe', color: '#5F259F' },
    { id: 'paytm', name: 'Paytm', color: '#00BAF2' },
    { id: 'bhim', name: 'BHIM UPI', color: '#00A651' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { items, extras, tableNumber, orderType, preorderDetails, totalAmount, clearCart } = useCart();
    const { addOrder } = useMenu();
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const orderCompleted = useRef(false);

    // Redirect if cart is empty (but not after successful order placement)
    useEffect(() => {
        if (orderCompleted.current) return;
        if (items.length === 0 && extras.length === 0) {
            router.push('/menu');
        }
    }, [items, extras, router]);

    const handlePayment = async (appId: string) => {
        setSelectedApp(appId);
        setIsProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            setShowSuccess(true);
        }, 2000);
    };

    const handleSuccessComplete = async () => {
        // Get token number: 
        // For dine-in, use the one assigned at the start. 
        // For preorder, generate a unique one now.
        let tokenNumberValue: number;
        if (orderType === 'dine-in' && tableNumber) {
            tokenNumberValue = parseInt(tableNumber);
        } else {
            tokenNumberValue = await getUniqueToken();
        }

        // Generate order ID (Connected to Token Number)
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderId = `#${tokenNumberValue}-RDA-${randomSuffix}`;

        // Get authenticated session ID
        const { ensureSession } = await import('@/lib/auth');
        const tokenId = await ensureSession();

        // Prepare order data for admin
        const orderData = {
            orderId,
            orderType,
            tableNumber: orderType === 'dine-in' ? (tableNumber || '0') : null,
            preorderDetails: orderType === 'preorder' ? preorderDetails : null,
            tokenNumber: tokenNumberValue,
            items: items.map(item => ({
                menuItem: {
                    id: item.menuItem.id,
                    name: item.menuItem.name,
                    price: item.menuItem.price,
                },
                quantity: item.quantity,
                selectedAddOns: item.selectedAddOns.map(a => ({
                    id: a.id,
                    name: a.name,
                    price: a.price,
                })),
                totalPrice: item.totalPrice,
            })),
            extras: extras.map(e => ({
                extra: {
                    id: e.extra.id,
                    name: e.extra.name,
                    price: e.extra.price,
                },
                quantity: e.quantity,
            })),
            totalAmount,
            timestamp: new Date().toISOString(),
            status: 'preparing',
            estimatedTime: 15, // Default 15 minutes
            tokenId: tokenId || '',
        };

        // Add order to shared context (visible in admin)
        addOrder(orderData);

        // Save to sessionStorage for order confirmation page
        sessionStorage.setItem('lastOrder', JSON.stringify(orderData));

        // Mark order as completed to prevent empty-cart redirect from firing
        orderCompleted.current = true;
        clearCart();
        router.push('/order-confirmed');
    };

    const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0) +
        extras.reduce((sum, e) => sum + e.quantity, 0);

    return (
        <>
            <LeafLoader
                isVisible={isProcessing}
                variant="payment"
            />
            <LeafLoader
                isVisible={showSuccess}
                variant="success"
                onComplete={handleSuccessComplete}
            />

            <div className={styles.container}>
                <Header
                    showBack
                    onBack={() => router.back()}
                    title="Checkout"
                    showServing={false}
                />

                <div className={styles.content}>
                    {/* Order Summary */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Order Summary</h2>
                        <div className={styles.summaryCard}>
                            <div className={styles.tableRow}>
                                {orderType === 'preorder' ? (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        <div className={styles.preorderInfo}>
                                            <span>Arrive at {preorderDetails?.pickupTime}</span>
                                            <span className={styles.preorderCustomer}>{preorderDetails?.customerName} • {preorderDetails?.customerPhone}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="10" rx="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                        <span>Token No {tableNumber}</span>
                                    </>
                                )}
                            </div>
                            <div className={styles.divider} />

                            {/* Order Items Preview */}
                            <div className={styles.orderPreview}>
                                {items.slice(0, 3).map((item, i) => (
                                    <div key={i} className={styles.previewItem}>
                                        <span className={styles.previewQty}>{item.quantity}x</span>
                                        <span className={styles.previewName}>{item.menuItem.name}</span>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <span className={styles.moreItems}>+ {items.length - 3} more items</span>
                                )}
                            </div>

                            <div className={styles.divider} />
                            <div className={styles.totalRow}>
                                <div>
                                    <span className={styles.itemsCount}>{totalItemsCount} items</span>
                                    <span className={styles.totalLabel}>Total Amount</span>
                                </div>
                                <span className={styles.totalAmount}>₹{totalAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Pay using UPI</h2>
                        <p className={styles.sectionSubtitle}>Select an app to complete payment</p>
                        <div className={styles.upiGrid}>
                            {UPI_APPS.map(app => (
                                <button
                                    key={app.id}
                                    className={`${styles.upiBtn} ${selectedApp === app.id ? styles.selected : ''}`}
                                    onClick={() => handlePayment(app.id)}
                                    style={{ '--app-color': app.color } as React.CSSProperties}
                                >
                                    <div className={styles.upiIcon} style={{ backgroundColor: app.color }}>
                                        {app.id === 'gpay' && 'G'}
                                        {app.id === 'phonepe' && 'P'}
                                        {app.id === 'paytm' && '₽'}
                                        {app.id === 'bhim' && 'B'}
                                    </div>
                                    <span className={styles.upiName}>{app.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className={styles.infoBox}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <div>
                            <p className={styles.infoTitle}>Secure Payment</p>
                            <p className={styles.infoText}>You'll be redirected to your UPI app to complete the payment securely.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
