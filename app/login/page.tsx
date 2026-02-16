'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

type LoginMethod = 'email' | 'phone' | 'google';

export default function LoginPage() {
    const [method, setMethod] = useState<LoginMethod>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    // 1. Google Login
    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    // 2. Email Login (OTP)
    const handleEmailRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // Only allow existing admins? Or true if self-signup is okay. Let's assume true for now.
            },
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setStep('verify');
            setMessage('Check your email for the login code.');
        }
    };

    const handleEmailVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            router.push('/admin');
            router.refresh();
        }
    };

    // 3. Phone Login
    const handlePhoneRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic formatting
        if (!phone.startsWith('+')) {
            setError('Please include country code (e.g., +91...)');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signInWithOtp({
            phone,
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setStep('verify');
            setMessage('Check your phone for the login code.');
        }
    };

    const handlePhoneVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.verifyOtp({
            phone,
            token: otp,
            type: 'sms',
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            router.push('/admin');
            router.refresh();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <img src="/logo.png" alt="Rocky Da Adda" className={styles.logo} />
                <h1 className={styles.title}>Admin Login</h1>
                <p className={styles.subtitle}>Secure access for management</p>

                {/* Tabs */}
                {step === 'request' && (
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${method === 'email' ? styles.tabActive : ''}`}
                            onClick={() => { setMethod('email'); setError(null); }}
                        >
                            Email
                        </button>
                        <button
                            className={`${styles.tab} ${method === 'phone' ? styles.tabActive : ''}`}
                            onClick={() => { setMethod('phone'); setError(null); }}
                        >
                            Phone
                        </button>
                    </div>
                )}

                {/* Error / Success Messages */}
                {error && <div className={styles.error}>{error}</div>}
                {message && <div className={styles.success}>{message}</div>}

                {/* ————— EMAIL FORM ————— */}
                {method === 'email' && (
                    <>
                        {step === 'request' ? (
                            <form className={styles.form} onSubmit={handleEmailRequest}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Email Address</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="admin@rockydaadda.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Login Code'} ➝
                                </button>
                            </form>
                        ) : (
                            <form className={styles.form} onSubmit={handleEmailVerify}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Enter Code sent to {email}</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnLink}
                                    onClick={() => { setStep('request'); setOtp(''); setMessage(null); }}
                                >
                                    ← Change Email
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* ————— PHONE FORM ————— */}
                {method === 'phone' && (
                    <>
                        {step === 'request' ? (
                            <form className={styles.form} onSubmit={handlePhoneRequest}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Phone Number</label>
                                    <input
                                        type="tel"
                                        className={styles.input}
                                        placeholder="+91 98765 43210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                                    {loading ? 'Sending...' : 'Send OTP'} ➝
                                </button>
                            </form>
                        ) : (
                            <form className={styles.form} onSubmit={handlePhoneVerify}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Enter OTP sent to {phone}</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className={styles.btnPrimary} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Login'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnLink}
                                    onClick={() => { setStep('request'); setOtp(''); setMessage(null); }}
                                >
                                    ← Change Number
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* ————— GOOGLE LOGIN ————— */}
                {step === 'request' && (
                    <>
                        <div className={styles.divider}>OR</div>
                        <button className={styles.btnGoogle} onClick={handleGoogleLogin} disabled={loading}>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="G" />
                            Continue with Google
                        </button>
                    </>
                )}

                <div style={{ marginTop: '24px' }}>
                    <Link href="/" className={styles.btnLink}>← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
