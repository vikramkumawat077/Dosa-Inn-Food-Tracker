'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import LeafLoader from '@/components/LeafLoader';
import styles from './page.module.css';

export default function TablePage() {
    const router = useRouter();
    const { setTableNumber } = useCart();
    const [table, setTable] = useState('');
    const [showLoader, setShowLoader] = useState(false);
    const [error, setError] = useState('');

    const handleKeyPress = (key: string) => {
        if (key === 'backspace') {
            setTable(prev => prev.slice(0, -1));
        } else if (key === 'clear') {
            setTable('');
        } else if (table.length < 3) {
            setTable(prev => prev + key);
        }
        setError('');
    };

    const handleContinue = () => {
        if (!table || table === '0') {
            setError('Please enter a valid table number');
            return;
        }

        // Check if there's an existing session for a different table
        // Only clear orders if switching to a different table
        const existingOrders = localStorage.getItem('customerOrders');
        if (existingOrders) {
            const orders = JSON.parse(existingOrders);
            // Check if any orders belong to a different table
            const hasDifferentTableOrders = orders.some((order: { tableNumber: string }) =>
                order.tableNumber !== table
            );

            if (hasDifferentTableOrders) {
                // Clear orders from different tables
                const sameTableOrders = orders.filter((order: { tableNumber: string }) =>
                    order.tableNumber === table
                );
                if (sameTableOrders.length > 0) {
                    localStorage.setItem('customerOrders', JSON.stringify(sameTableOrders));
                } else {
                    localStorage.removeItem('customerOrders');
                }
                sessionStorage.removeItem('lastOrder');
            }
            // If same table, keep the existing orders (rejoin session)
        }

        setTableNumber(table);
        setShowLoader(true);
    };

    const handleLoaderComplete = () => {
        router.push('/menu');
    };

    return (
        <>
            <LeafLoader
                isVisible={showLoader}
                variant="transition"
                onComplete={handleLoaderComplete}
            />

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link href="/" className={styles.logoLink}>
                        <img src="/logo.png" alt="Rocky Da Adda" className={styles.logo} />
                    </Link>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>What's your table?</h1>
                        <p className={styles.subtitle}>Check the number on your table stand</p>
                    </div>

                    {/* Table number display */}
                    <div className={styles.displayWrapper}>
                        <div className={`${styles.display} ${error ? styles.displayError : ''}`}>
                            {table || <span className={styles.placeholder}>00</span>}
                        </div>
                        {error && <p className={styles.errorText}>{error}</p>}
                    </div>

                    {/* Keypad */}
                    <div className={styles.keypad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                className={styles.key}
                                onClick={() => handleKeyPress(num.toString())}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            className={`${styles.key} ${styles.keyAction}`}
                            onClick={() => handleKeyPress('clear')}
                        >
                            C
                        </button>
                        <button
                            className={styles.key}
                            onClick={() => handleKeyPress('0')}
                        >
                            0
                        </button>
                        <button
                            className={`${styles.key} ${styles.keyAction}`}
                            onClick={() => handleKeyPress('backspace')}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="18" y1="9" x2="12" y2="15" strokeLinecap="round" />
                                <line x1="12" y1="9" x2="18" y2="15" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* CTA */}
                <div className={styles.ctaWrapper}>
                    <button
                        className={`${styles.ctaBtn} ${!table ? styles.ctaBtnDisabled : ''}`}
                        onClick={handleContinue}
                        disabled={!table}
                    >
                        Continue to Menu
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}
