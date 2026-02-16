'use client';

import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: '20px',
            color: '#333',
            fontFamily: 'var(--font-inter, sans-serif)',
        }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Access Denied</h1>
            <p style={{ maxWidth: '400px', marginBottom: '30px', lineHeight: '1.6', color: '#666' }}>
                Your account is not authorized to access this area. Please contact the administrator to request access.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
                <Link href="/" style={{
                    padding: '10px 20px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                }}>
                    Return Home
                </Link>
                <Link href="/login" style={{
                    padding: '10px 20px',
                    backgroundColor: '#000',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                }}>
                    Switch Account
                </Link>
            </div>
        </div>
    );
}
