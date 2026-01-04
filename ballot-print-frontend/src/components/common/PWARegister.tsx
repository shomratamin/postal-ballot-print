// app/_components/PWARegister.tsx
'use client';

import { useEffect } from 'react';

export default function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // register at root to control all routes
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
    }, []);
    return null;
}
