
'use client';

import React, { useEffect, useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ControlBar, useConnectionState, ConnectionState } from '@livekit/components-react';
import '@livekit/components-styles';

export default function VoiceAssistant() {
    const [token, setToken] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Fetch token on mount
    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch('/api/livekit/token?username=customer-' + Math.floor(Math.random() * 1000));
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    if (!token) return null;

    return (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999 }}>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                    }}
                >
                    🎙️
                </button>
            ) : (
                <div style={{
                    width: '300px',
                    height: '400px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #eee'
                }}>
                    <div style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 'bold' }}>Rocky AI Assistant</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                        <LiveKitRoom
                            video={false}
                            audio={true}
                            token={token}
                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} // The user needs to verify this ENV
                            connect={true}
                            data-lk-theme="default"
                            style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div style={{ textAlign: 'center', color: '#666' }}>
                                <p>Tap microphone to speak</p>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>Ask about our specials or your order!</p>
                            </div>
                            <RoomAudioRenderer />
                            <ControlBar variation="minimal" controls={{ microphone: true, camera: false, screenShare: false }} />
                        </LiveKitRoom>
                    </div>
                </div>
            )}
        </div>
    );
}
