'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMenu } from '@/lib/menuContext';

// Basic Voice API Payload based on Voicebox
// {"text": "Hello world", "profile_id": "abc123", "language": "en"}

export default function KitchenAnnouncer() {
    const { orders } = useMenu();
    const lastOrderIdRef = useRef<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

    // UI Settings State
    const [enabled, setEnabled] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Voice API Configuration
    const [apiUrl, setApiUrl] = useState('http://localhost:8000/generate');
    const [gender, setGender] = useState('female'); // Toggle between 'male' and 'female'
    const [profileId, setProfileId] = useState('indian_female_1'); // Default based on gender
    const [language, setLanguage] = useState('hi'); // Default to Hindi/Hinglish
    const [intervalMin, setIntervalMin] = useState(5); // Default 5 mins

    // Audio Queue System
    const queueRef = useRef<string[]>([]);
    const isPlayingRef = useRef(false);

    useEffect(() => {
        setIsClient(true);
        // Load settings from localStorage if available
        const savedApiUrl = localStorage.getItem('rda_voice_api_url');
        const savedGender = localStorage.getItem('rda_voice_gender');
        const savedProfileId = localStorage.getItem('rda_voice_profile_id');
        const savedLanguage = localStorage.getItem('rda_voice_language');
        const savedInterval = localStorage.getItem('rda_voice_interval');

        if (savedApiUrl) setApiUrl(savedApiUrl);
        if (savedGender) setGender(savedGender);
        if (savedProfileId) setProfileId(savedProfileId);
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedInterval) setIntervalMin(Number(savedInterval));

        // Load voices if available
        if ('speechSynthesis' in window) {
            const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Save settings when they change
    useEffect(() => {
        if (!isClient) return;
        localStorage.setItem('rda_voice_api_url', apiUrl);
        localStorage.setItem('rda_voice_gender', gender);
        localStorage.setItem('rda_voice_profile_id', profileId);
        localStorage.setItem('rda_voice_language', language);
        localStorage.setItem('rda_voice_interval', intervalMin.toString());
    }, [apiUrl, gender, profileId, language, intervalMin, isClient]);

    // Async Queue Processor
    const processQueue = useCallback(async () => {
        if (isPlayingRef.current || queueRef.current.length === 0) return;

        isPlayingRef.current = true;
        const text = queueRef.current.shift()!; // Dequeue

        try {
            // Attempt to hit the Voicebox API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    profile_id: profileId,
                    language: language
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            // API returned audio blob
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                isPlayingRef.current = false;
                processQueue(); // Process next in queue
            };

            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                console.error("Audio playback error");
                fallbackSpeak(text); // Fallback to browser TTS if blob fails
            };

            audio.play().catch(e => {
                console.error("Autoplay prevented", e);
                fallbackSpeak(text);
            });

        } catch (error) {
            console.error("Voice API failed, using browser fallback:", error);
            fallbackSpeak(text);
        }
    }, [apiUrl, profileId, language]);

    // Fallback using browser native SpeechSynthesis
    const fallbackSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const isFemale = gender === 'female';

            // To simulate a 26yo Female: Keep pitch natural, slightly energetic rate.
            // To simulate a 25yo Male: Slightly lower pitch, normal rate.
            utterance.rate = isFemale ? 1.05 : 1.0;
            utterance.pitch = isFemale ? 1.05 : 0.85;
            utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

            // Try to find a matching voice if possible
            if (availableVoices.length > 0) {
                // Filter by language first
                let langVoices = availableVoices.filter(v => v.lang.includes(language === 'hi' ? 'hi' : 'en-IN'));
                if (langVoices.length === 0) langVoices = availableVoices; // Fallback to any

                // Look for high-quality cloud/neural browser voices first (they sound significantly younger and more natural)
                const premiumVoices = langVoices.filter(v => v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Online"));
                const searchPool = premiumVoices.length > 0 ? premiumVoices : langVoices;

                // Improved heuristics to find male/female Indian voices
                const femaleRegex = /(female|woman|girl|samantha|zira|neerja|kavya|swara)/i;
                const maleRegex = /(male|man|boy|david|mark|prabhat|ravi|madhur)/i;

                let matchedVoice;
                if (isFemale) {
                    matchedVoice = searchPool.find(v => femaleRegex.test(v.name));
                } else {
                    matchedVoice = searchPool.find(v => maleRegex.test(v.name));
                    // If no explicit male voice found, find one that is NOT explicitly female
                    if (!matchedVoice) {
                        matchedVoice = searchPool.find(v => !femaleRegex.test(v.name));
                    }
                }

                // Final fallback if the pool was premium but missing the gender
                if (!matchedVoice && searchPool !== langVoices) {
                    matchedVoice = isFemale
                        ? langVoices.find(v => femaleRegex.test(v.name))
                        : langVoices.find(v => maleRegex.test(v.name));
                }

                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                } else {
                    utterance.voice = langVoices[0];
                }
            }

            utterance.onend = () => {
                isPlayingRef.current = false;
                processQueue();
            };

            utterance.onerror = () => {
                isPlayingRef.current = false;
                processQueue();
            };

            window.speechSynthesis.speak(utterance);
        } else {
            isPlayingRef.current = false;
            processQueue();
        }
    };

    // Safely add to queue
    const enqueueSpeech = useCallback((text: string) => {
        queueRef.current.push(text);
        processQueue();
    }, [processQueue]);

    // 1. ANNOUNCE NEW ORDERS (Hinglish Support)
    useEffect(() => {
        if (!enabled || orders.length === 0) return;

        if (lastOrderIdRef.current === null) {
            lastOrderIdRef.current = orders[0].orderId;
            return;
        }

        const latestOrder = orders[0];
        if (latestOrder.orderId !== lastOrderIdRef.current) {
            // It's a new order!
            // Format: Token number XYZ. Items: 1 Burger, 2 Fries.
            const isParcel = latestOrder.orderType === 'preorder' || !latestOrder.tableNumber;
            const orderTypeLabel = isParcel ? (language === 'hi' ? 'Parcel ' : 'Parcel ') : '';

            const intro = language === 'hi'
                ? `Naya ${orderTypeLabel}order aaya hai. Token number ${latestOrder.tokenNumber}. Order mein hai:`
                : `New ${orderTypeLabel}Order received. Token number ${latestOrder.tokenNumber}. The items are:`;

            const itemsText = latestOrder.items.map(i => `${i.quantity} ${i.menuItem.name}`).join(', aur ');

            enqueueSpeech(`${intro} ${itemsText}`);
            lastOrderIdRef.current = latestOrder.orderId;
        }
    }, [orders, enabled, enqueueSpeech, language]);

    // 2. REPEAT PENDING ORDERS (Custom Interval)
    useEffect(() => {
        if (!enabled || intervalMin <= 0) return;

        const interval = setInterval(() => {
            const pending = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
            if (pending.length === 0) return;

            // Hinglish Prompt
            const text = language === 'hi'
                ? `Dhyan dijiye. Kitchen mein abhi ${pending.length} orders pending hain.`
                : `Kitchen Attention. You currently have ${pending.length} active orders pending.`;

            enqueueSpeech(text);

        }, intervalMin * 60 * 1000);

        return () => clearInterval(interval);
    }, [enabled, orders, intervalMin, enqueueSpeech, language]);

    if (!isClient) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1000,
            maxWidth: '300px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{enabled ? '🔊' : '🔇'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>Voice Agent</span>
                </div>

                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            fontSize: '16px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            background: enabled ? '#ffeb3b' : '#f5f5f5',
                            color: '#333',
                            border: '1px solid #ccc',
                            borderRadius: '6px'
                        }}
                    >
                        {enabled ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* Config Settings Panel */}
            {showSettings && (
                <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '12px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>Repeat Interval</label>
                        <select
                            value={intervalMin}
                            onChange={(e) => setIntervalMin(Number(e.target.value))}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value={1}>Every 1 minute</option>
                            <option value={3}>Every 3 minutes</option>
                            <option value={5}>Every 5 minutes</option>
                            <option value={10}>Every 10 minutes</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>Language</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="en">Indian English (en-IN)</option>
                            <option value="hi">Hinglish / Hindi (hi-IN)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>Agent Voice</label>
                        <select
                            value={gender}
                            onChange={(e) => {
                                const newGender = e.target.value;
                                setGender(newGender);
                                // Reset default profile ID to 1 when switching
                                setProfileId(newGender === 'female' ? 'indian_female_1' : 'indian_male_1');
                            }}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>Voice Profile ID</label>
                        <input
                            type="text"
                            value={profileId}
                            onChange={(e) => setProfileId(e.target.value)}
                            placeholder="e.g. abc123"
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>API URL</label>
                        <input
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="http://localhost:8000/generate"
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <span style={{ fontSize: '10px', color: '#888' }}>
                            Uses Voicebox API. Must return an audio blob.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
