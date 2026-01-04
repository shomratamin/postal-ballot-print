import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

export type ScanResult = {
    text: string;
    format?: string;
    ts: number;
};

export type UseBarcodeScannerOptions = {
    continuous?: boolean;           // keep scanning after a hit (default: true)
    debounceMs?: number;            // ignore duplicate hits within this window
    preferredFormats?: string[];    // passed to BarcodeDetector when supported
    videoConstraints?: MediaTrackConstraints;
};

export type UseBarcodeScannerReturn = {
    videoRef: React.RefObject<HTMLVideoElement>;
    lastResult: ScanResult | null;
    error: string | null;
    usingDetector: boolean;
    isActive: boolean;
    start: () => Promise<void>;
    stop: () => void;
    toggleTorch: (on: boolean) => Promise<void>;
};

export function useBarcodeScanner(
    onScan?: (result: ScanResult) => void,
    opts?: UseBarcodeScannerOptions
): UseBarcodeScannerReturn {
    const {
        continuous = true,
        debounceMs = 800,
        preferredFormats = ["qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e", "code_39", "itf", "pdf417", "data_matrix", "codabar"],
        videoConstraints = {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            aspectRatio: { ideal: 16 / 9 },
            focusMode: { ideal: "continuous" },
            exposureMode: { ideal: "manual" },
            whiteBalanceMode: { ideal: "manual" }
        }
    } = opts || {};

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const lastHitTextRef = useRef<string>("");
    const lastHitTsRef = useRef<number>(0);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usingDetector, setUsingDetector] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const stop = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;

        controlsRef.current?.stop();
        controlsRef.current = null;

        // readerRef.current?.reset();
        readerRef.current = null;

        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        setIsActive(false);
    }, []);

    const emit = useCallback((text: string, format?: string) => {
        const now = Date.now();
        if (text === lastHitTextRef.current && now - lastHitTsRef.current < debounceMs) return;
        lastHitTextRef.current = text;
        lastHitTsRef.current = now;
        const result: ScanResult = { text, format, ts: now };
        setLastResult(result);
        onScan?.(result);
    }, [debounceMs, onScan]);

    const start = useCallback(async () => {
        try {
            setError(null);

            // Check if we're in a browser environment
            if (typeof window === "undefined") {
                throw new Error("Camera access is not available in server-side environment");
            }

            // Check if navigator and mediaDevices are available
            if (!navigator) {
                throw new Error("Navigator is not available");
            }

            if (!navigator.mediaDevices) {
                throw new Error("MediaDevices API is not supported in this browser. Please use a modern browser with HTTPS.");
            }

            if (!navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia is not supported in this browser");
            }

            // Check if we're on HTTPS (required for getUserMedia except on localhost)
            if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
                throw new Error("Camera access requires HTTPS. Please access the site via HTTPS.");
            }

            // 1) Ask for camera
            const stream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false
            });
            streamRef.current = stream;
            const video = videoRef.current!;
            video.srcObject = stream;
            await video.play();

            // 2) If BarcodeDetector exists, use it
            if (typeof window !== "undefined" && "BarcodeDetector" in window) {
                setUsingDetector(true);
                setIsActive(true);

                const detector = new BarcodeDetector({ formats: preferredFormats as any });

                const tick = async () => {
                    if (!video.videoWidth) {
                        rafRef.current = requestAnimationFrame(tick);
                        return;
                    }
                    try {
                        const codes = await detector.detect(video);
                        if (codes?.length) {
                            const first = codes[0];
                            const value = first.rawValue || "";
                            if (value) {
                                emit(value, first.format);
                                if (!continuous) { stop(); return; }
                            }
                        }
                    } catch {
                        // swallow per-frame errors
                    }
                    rafRef.current = requestAnimationFrame(tick);
                };
                tick();
                return;
            }

            // 3) Fallback: ZXing
            setUsingDetector(false);
            setIsActive(true);

            const reader = new BrowserMultiFormatReader();
            readerRef.current = reader;

            // Decode in a loop (decodeOnce + RAF for resilience)
            const loop = async () => {
                try {
                    const result = await reader.decodeOnceFromVideoElement(video);
                    const text = result.getText();
                    if (text) {
                        emit(text, result.getBarcodeFormat()?.toString());
                        if (!continuous) { stop(); return; }
                    }
                } catch (e) {
                    if (!(e instanceof NotFoundException)) {
                        // real error: surface once
                        setError((e as Error).message ?? "Decode error");
                    }
                } finally {
                    rafRef.current = requestAnimationFrame(loop);
                }
            };
            loop();
        } catch (e) {
            setError((e as Error).message ?? "Camera error");
            stop();
        }
    }, [continuous, emit, preferredFormats, stop, videoConstraints]);

    const toggleTorch = useCallback(async (on: boolean) => {
        const track = streamRef.current?.getVideoTracks()[0];
        if (!track) return;
        const capabilities = (track.getCapabilities?.() || {}) as MediaTrackCapabilities & { torch?: boolean };
        if (!capabilities.torch) return;
        // await track.applyConstraints({ advanced: [{ torch: on }] as MediaTrackConstraintSet[] });
        await track.applyConstraints({ advanced: [{ torch: on }] } as unknown as MediaTrackConstraints);

    }, []);

    useEffect(() => () => stop(), [stop]);

    return { videoRef, lastResult, error, usingDetector, isActive, start, stop, toggleTorch };
}
