// app/_components/InstallPWA.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';

/** Chromium-only event type (not in TS lib) */
declare global {
    interface BeforeInstallPromptEvent extends Event {
        readonly platforms: string[];
        readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
        prompt: () => Promise<void>;
    }
}

export default function InstallPWA() {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    // Detect iOS A2HS situation (Safari/Chrome/Firefox on iOS are WebKit)
    const isIOS = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }, []);

    const isStandalone = useMemo(() => {
        if (typeof window === 'undefined') return false;
        // iOS PWA uses navigator.standalone, Chromium uses display-mode
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
            || (typeof (navigator as any).standalone === 'boolean' && (navigator as any).standalone);
    }, []);

    useEffect(() => {
        const onBIP = (e: Event) => {
            const ev = e as BeforeInstallPromptEvent;
            ev.preventDefault(); // stop the mini-infobar; let us trigger later
            setDeferred(ev);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferred(null);
        };

        window.addEventListener('beforeinstallprompt', onBIP);
        window.addEventListener('appinstalled', onInstalled);

        // If already running standalone, mark installed
        if (isStandalone) setInstalled(true);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBIP);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, [isStandalone]);

    const canInstall = !!deferred && !installed;

    const handleInstall = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        // You could log choice.outcome here
        setDeferred(null); // you can only call prompt() once
    };

    // Super minimal UI; style this however you like
    return (
        <>
            {canInstall && (
                <button
                    onClick={handleInstall}
                    aria-label="Install app"
                    style={{ position: 'fixed', right: 16, bottom: 16, padding: '10px 14px', borderRadius: 8 }}
                >
                    Install App
                </button>
            )}

            {isIOS && !installed && (
                <div
                    role="note"
                    style={{
                        position: 'fixed', left: 16, bottom: 16, right: 16,
                        padding: 12, borderRadius: 8, background: 'rgba(0,0,0,.75)', color: 'white'
                    }}
                >
                    Add to Home Screen: open the Share menu and tap <strong>Add to Home Screen</strong>.
                </div>
            )}
        </>
    );
}
