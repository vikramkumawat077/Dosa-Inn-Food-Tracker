'use client';

import React, { useState, useEffect } from 'react';
import styles from './LeafLoader.module.css';
import { loadingMessages, paymentMessages } from '@/lib/menuData';

interface LeafLoaderProps {
    isVisible: boolean;
    variant?: 'transition' | 'payment' | 'success';
    onComplete?: () => void;
}

export default function LeafLoader({ isVisible, variant = 'transition', onComplete }: LeafLoaderProps) {
    const [message, setMessage] = useState('');
    const [showPulse, setShowPulse] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Select appropriate message pool
            const messages = variant === 'payment' ? paymentMessages : loadingMessages;
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            setMessage(randomMessage);

            // Timing based on variant
            const duration = variant === 'payment' ? 450 : variant === 'success' ? 1000 : 700;

            if (variant === 'success') {
                setTimeout(() => setShowPulse(true), duration);
            }

            if (onComplete) {
                const timer = setTimeout(onComplete, duration + (variant === 'success' ? 800 : 0));
                return () => clearTimeout(timer);
            }
        } else {
            setShowPulse(false);
        }
    }, [isVisible, variant, onComplete]);

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={`${styles.leafWrapper} ${showPulse ? styles.pulse : ''}`}>
                    {/* Leaf SVG - extracted from logo design */}
                    <svg
                        className={styles.leafOutline}
                        viewBox="0 0 100 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Outer leaf outline */}
                        <path
                            d="M50 5C25 25 10 55 10 85C10 95 15 105 25 110C35 115 45 115 50 115C55 115 65 115 75 110C85 105 90 95 90 85C90 55 75 25 50 5Z"
                            stroke="#7cb342"
                            strokeWidth="3"
                            fill="none"
                            className={styles.leafPath}
                        />
                        {/* Center vein */}
                        <path
                            d="M50 20V100"
                            stroke="#7cb342"
                            strokeWidth="2"
                            className={styles.veinPath}
                        />
                        {/* Side veins */}
                        <path
                            d="M50 40L30 55M50 55L25 75M50 70L30 88"
                            stroke="#7cb342"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className={styles.veinPath}
                        />
                        <path
                            d="M50 40L70 55M50 55L75 75M50 70L70 88"
                            stroke="#7cb342"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            className={styles.veinPath}
                        />
                    </svg>

                    {/* Filled leaf that animates */}
                    <svg
                        className={styles.leafFill}
                        viewBox="0 0 100 120"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="leafGradient" x1="50%" y1="100%" x2="50%" y2="0%">
                                <stop offset="0%" stopColor="#558b2f" />
                                <stop offset="50%" stopColor="#7cb342" />
                                <stop offset="100%" stopColor="#9ccc65" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M50 5C25 25 10 55 10 85C10 95 15 105 25 110C35 115 45 115 50 115C55 115 65 115 75 110C85 105 90 95 90 85C90 55 75 25 50 5Z"
                            fill="url(#leafGradient)"
                        />
                        {/* White veins on filled leaf */}
                        <path
                            d="M50 20V100"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="2"
                        />
                        <path
                            d="M50 40L30 55M50 55L25 75M50 70L30 88"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M50 40L70 55M50 55L75 75M50 70L70 88"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                <p className={styles.message}>{message}</p>
            </div>
        </div>
    );
}
