import { useBarcodeScanner } from "@/lib/hooks/custom/useBarcodeScanner";
import React, { useState, useRef, useCallback } from "react";

type Props = {
    onScan: (text: string) => void;
    oneShot?: boolean;
};

type ScanHistory = {
    text: string;
    format?: string;
    timestamp: number;
    id: string;
};

const compactButtonStyle: React.CSSProperties = {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    border: "2px solid #007bff",
    backgroundColor: "#007bff",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    minHeight: "40px",
    flex: 1,
    transition: "all 0.2s ease"
};

const stopButtonStyle: React.CSSProperties = {
    ...compactButtonStyle,
    backgroundColor: "#dc3545",
    borderColor: "#dc3545"
};

const torchButtonStyle: React.CSSProperties = {
    ...compactButtonStyle,
    backgroundColor: "#28a745",
    borderColor: "#28a745"
};

const testButtonStyle: React.CSSProperties = {
    ...compactButtonStyle,
    backgroundColor: "#ffc107",
    borderColor: "#ffc107",
    color: "#212529"
};

export const BarcodeScanner: React.FC<Props> = ({ onScan, oneShot }) => {
    console.log("BarcodeScanner component rendering...");

    // Scan history state
    const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
    const [torchOn, setTorchOn] = useState(false);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [vibrationPermissionAsked, setVibrationPermissionAsked] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [continuousScan, setContinuousScan] = useState(true); // New state for continuous scanning
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Use ref to track scanned codes to avoid stale closure issues
    const scannedCodesRef = useRef<Set<string>>(new Set());
    const lastScanTimeRef = useRef<{ [key: string]: number }>({});

    // Client-side mounting check to avoid SSR issues
    React.useEffect(() => {
        setIsClient(true);
    }, []);

    // Check browser compatibility (only on client-side)
    const hasMediaDevices = isClient && typeof navigator !== 'undefined' && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && !!navigator.mediaDevices.getUserMedia;
    const isSecureContext = isClient && typeof window !== 'undefined' && (
        window.isSecureContext ||
        window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );
    const hasVibration = isClient && typeof navigator !== 'undefined' && !!navigator.vibrate;

    // Generate success sound using Web Audio API
    const playSuccessSound = useCallback(() => {
        console.log('🔊 Attempting to play success sound...');

        try {
            // Method 1: Try to play HTML audio first
            if (audioRef.current) {
                console.log('🔊 Trying HTML5 audio...');
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 0.7; // Set volume
                audioRef.current.play()
                    .then(() => {
                        console.log('✅ HTML5 audio played successfully');
                    })
                    .catch((audioError) => {
                        console.log('❌ HTML5 audio failed:', audioError);

                        // Method 2: Fallback to Web Audio API
                        try {
                            console.log('🔊 Trying Web Audio API fallback...');
                            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                            if (AudioContext) {
                                const audioContext = new AudioContext();
                                const oscillator = audioContext.createOscillator();
                                const gainNode = audioContext.createGain();

                                oscillator.connect(gainNode);
                                gainNode.connect(audioContext.destination);

                                // Create a pleasant beep sound
                                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);

                                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                                oscillator.start(audioContext.currentTime);
                                oscillator.stop(audioContext.currentTime + 0.3);

                                console.log('✅ Web Audio API beep triggered');
                            } else {
                                console.log('❌ AudioContext not available');
                            }
                        } catch (webAudioError) {
                            console.log('❌ Web Audio API failed:', webAudioError);

                            // Method 3: Try simple beep as last resort
                            try {
                                console.log('🔊 Trying simple beep fallback...');
                                // This might work on some systems
                                const utterance = new SpeechSynthesisUtterance('beep');
                                utterance.volume = 0.1;
                                utterance.rate = 10;
                                utterance.pitch = 2;
                                speechSynthesis.speak(utterance);
                                console.log('✅ Speech synthesis beep triggered');
                            } catch (speechError) {
                                console.log('❌ All audio methods failed:', speechError);
                            }
                        }
                    });
            } else {
                console.log('❌ audioRef.current is null');
            }
        } catch (e) {
            console.log('❌ Audio playback completely failed:', e);
        }
    }, []);

    // Handle successful scan with sound and vibration
    const handleScan = useCallback((result: any) => {
        console.log('🔍 Scan detected:', result.text);

        const currentTime = Date.now();
        const barcode = result.text;

        // Check for debouncing - ignore if same code scanned within 1 second
        const lastScanTime = lastScanTimeRef.current[barcode] || 0;
        const timeSinceLastScan = currentTime - lastScanTime;

        if (timeSinceLastScan < 300) { // 300ms debounce for faster scanning
            console.log(`📝 Debounced duplicate scan: ${barcode} (${timeSinceLastScan}ms ago)`);
            return; // Don't process if scanned too recently
        }

        // Check if this is a unique scan using ref (synchronous check)
        const isUnique = !scannedCodesRef.current.has(barcode);
        console.log('📝 Is unique scan:', isUnique);

        // Update last scan time for debouncing
        lastScanTimeRef.current[barcode] = currentTime;

        // Only process unique scans
        if (isUnique) {
            // Add to scanned codes set immediately (synchronous)
            scannedCodesRef.current.add(barcode);

            const scanData: ScanHistory = {
                text: result.text,
                format: result.format,
                timestamp: currentTime,
                id: `${currentTime}-${Math.random()}`
            };

            // Add to history (only unique scans)
            setScanHistory(prev => [scanData, ...prev]);

            console.log('🎵 Playing success sound...');
            // Play success sound
            playSuccessSound();

            console.log('📳 Triggering vibration...');
            // Vibrate on mobile (if supported and enabled)
            if (isClient && vibrationEnabled && hasVibration) {
                try {
                    // Try different vibration patterns for better compatibility
                    let vibrationResult = false;

                    // Method 1: Standard pattern
                    if (navigator.vibrate) {
                        vibrationResult = navigator.vibrate([200, 100, 200]);
                        console.log('📳 Standard vibration result:', vibrationResult);
                    }

                    // Method 2: Fallback for some Android devices
                    if (!vibrationResult && (navigator as any).vibrate) {
                        vibrationResult = (navigator as any).vibrate(200);
                        console.log('📳 Fallback vibration result:', vibrationResult);
                    }

                    // Method 3: WebKit vibration (iOS Safari might need this)
                    if (!vibrationResult && (navigator as any).webkitVibrate) {
                        vibrationResult = (navigator as any).webkitVibrate([200, 100, 200]);
                        console.log('📳 WebKit vibration result:', vibrationResult);
                    }

                    if (!vibrationResult) {
                        console.log('📳 All vibration methods failed');
                    }
                } catch (vibrationError) {
                    console.log('📳 Vibration error:', vibrationError);
                }
            } else if (!vibrationEnabled) {
                console.log('📳 Vibration disabled by user');
            } else if (!isClient) {
                console.log('📳 Client not ready');
            } else {
                console.log('📳 Vibration API not supported');
            }
        } else {
            console.log('🔄 Duplicate scan - no sound/vibration/history');
        }

        // Call original onScan (always call, even for duplicates, so parent can handle as needed)
        onScan(result.text);
    }, [onScan, playSuccessSound, isClient, vibrationEnabled, hasVibration]);

    const { videoRef, lastResult, error, usingDetector, isActive, start, stop, toggleTorch } =
        useBarcodeScanner(
            continuousScan ? handleScan : () => { }, // Pass empty function instead of undefined to keep camera active
            {
                continuous: continuousScan && !oneShot,
                debounceMs: 200 // Faster scanning - reduced from default 800ms
            }
        );

    console.log("BarcodeScanner state:", { isActive, error, usingDetector });

    // Handle torch toggle
    const handleTorchToggle = useCallback(() => {
        const newTorchState = !torchOn;
        setTorchOn(newTorchState);
        toggleTorch(newTorchState);
    }, [torchOn, toggleTorch]);

    // Separate manual scan processing to avoid hook interference
    const processManualScan = useCallback((result: any) => {
        console.log('📷 Processing manual scan:', result.text);

        const currentTime = Date.now();
        const barcode = result.text;

        // Check for debouncing - ignore if same code scanned within 300ms
        const lastScanTime = lastScanTimeRef.current[barcode] || 0;
        const timeSinceLastScan = currentTime - lastScanTime;

        if (timeSinceLastScan < 300) {
            console.log(`📝 Manual scan debounced: ${barcode} (${timeSinceLastScan}ms ago)`);
            return;
        }

        // Check if this is a unique scan
        const isUnique = !scannedCodesRef.current.has(barcode);
        console.log('📝 Manual scan is unique:', isUnique);

        // Update last scan time
        lastScanTimeRef.current[barcode] = currentTime;

        // Only process unique scans
        if (isUnique) {
            // Add to scanned codes set immediately
            scannedCodesRef.current.add(barcode);

            const scanData: ScanHistory = {
                text: result.text,
                format: result.format,
                timestamp: currentTime,
                id: `${currentTime}-${Math.random()}`
            };

            // Add to history
            setScanHistory(prev => [scanData, ...prev]);

            // Play success sound
            playSuccessSound();

            // Vibrate if enabled
            if (isClient && vibrationEnabled && hasVibration) {
                try {
                    if (navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                        console.log('📳 Manual scan vibration triggered');
                    }
                } catch (e) {
                    console.log('📳 Manual scan vibration error:', e);
                }
            }
        } else {
            console.log('🔄 Manual scan duplicate - ignored');
        }

        // Always call original onScan callback
        onScan(result.text);
    }, [isClient, vibrationEnabled, hasVibration, playSuccessSound, onScan]);

    // Manual scan function for when continuous scanning is off
    const handleManualScan = useCallback(async () => {
        if (!videoRef.current || !isActive) {
            console.log('📷 Manual scan failed: video not ready or scanner not active');
            return;
        }

        try {
            console.log('📷 Manual scan triggered...');

            // Try using BarcodeDetector if available
            if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
                const detector = new (window as any).BarcodeDetector({
                    formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39', 'itf', 'pdf417', 'data_matrix', 'codabar']
                });

                const codes = await detector.detect(videoRef.current);
                if (codes?.length) {
                    const first = codes[0];
                    const result = {
                        text: first.rawValue || '',
                        format: first.format,
                        ts: Date.now()
                    };
                    if (result.text) {
                        console.log('📷 Manual scan found barcode:', result.text);
                        // Use separate processing function to avoid hook interference
                        processManualScan(result);
                        return;
                    }
                }
            }

            console.log('📷 Manual scan: No barcode detected');
        } catch (error) {
            console.log('📷 Manual scan error:', error);
        }
    }, [videoRef, isActive, processManualScan]);

    return (
        <div style={{
            display: "grid",
            gap: "16px",
            padding: "16px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9"
        }}>
            <h3 style={{ margin: 0, color: "#333" }}>Barcode Scanner</h3>

            {/* Browser Compatibility Warning */}
            {(!hasMediaDevices || !hasGetUserMedia || !isSecureContext) && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffeaa7",
                    borderRadius: "4px",
                    color: "#856404"
                }}>
                    <div><strong>⚠️ Browser Compatibility Issues:</strong></div>
                    <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "13px" }}>
                        {!hasMediaDevices && <li>MediaDevices API not supported</li>}
                        {!hasGetUserMedia && <li>getUserMedia not available</li>}
                        {!isSecureContext && <li>Secure context (HTTPS) required</li>}
                    </ul>
                    <div style={{ fontSize: "12px", marginTop: "8px" }}>
                        Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
                    </div>
                </div>
            )}

            {/* Camera viewfinder with fixed barcode-friendly aspect ratio */}
            <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto",
                aspectRatio: "16/9", // Landscape aspect ratio for barcode scanning
                backgroundColor: "#000",
                borderRadius: "12px",
                border: "2px solid #333",
                overflow: "hidden"
            }}>
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // This will crop the video to fit the container
                        borderRadius: "10px"
                    }}
                />

                {/* Barcode scanning overlay */}
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "80%",
                    height: "4px",
                    backgroundColor: "red",
                    boxShadow: "0 0 10px rgba(255, 0, 0, 0.8)",
                    borderRadius: "2px",
                    animation: isActive ? "scan-line 2s ease-in-out infinite" : "none"
                }} />

                {/* Corner brackets for barcode area */}
                <div style={{
                    position: "absolute",
                    top: "30%",
                    left: "10%",
                    right: "10%",
                    bottom: "30%",
                    border: "2px solid rgba(255, 255, 255, 0.8)",
                    borderRadius: "8px",
                    pointerEvents: "none"
                }}>
                    {/* Corner indicators */}
                    <div style={{ position: "absolute", top: "-2px", left: "-2px", width: "20px", height: "20px", borderTop: "4px solid #00ff00", borderLeft: "4px solid #00ff00" }} />
                    <div style={{ position: "absolute", top: "-2px", right: "-2px", width: "20px", height: "20px", borderTop: "4px solid #00ff00", borderRight: "4px solid #00ff00" }} />
                    <div style={{ position: "absolute", bottom: "-2px", left: "-2px", width: "20px", height: "20px", borderBottom: "4px solid #00ff00", borderLeft: "4px solid #00ff00" }} />
                    <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "20px", height: "20px", borderBottom: "4px solid #00ff00", borderRight: "4px solid #00ff00" }} />
                </div>
            </div>

            {/* Hidden audio element for success sound */}
            <audio
                ref={audioRef}
                preload="auto"
            >
                {/* Multiple sources for better compatibility */}
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocATV+zPD3dzkJCVy07aJYFglCoN3wqA==" type="audio/wav" />
                <source src="data:audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAAOp4zJQEAAAAGlwAADnZvcmJpc0QAAABYaXBoLk9yZwqBCV9wb3J0aW9uAQAAAQAAAAEAAQAAAQAAAAEAAQABAAAAAA==" type="audio/ogg" />
            </audio>

            <style>{`
                @keyframes scan-line {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scaleX(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); }
                }
            `}</style>

            {/* Vibration Toggle */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px",
                backgroundColor: "#e9ecef",
                borderRadius: "6px",
                fontSize: "14px"
            }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={vibrationEnabled}
                        onChange={(e) => setVibrationEnabled(e.target.checked)}
                        style={{ cursor: "pointer" }}
                    />
                    <span>📳 Enable Vibration</span>
                </label>
                {isClient && !hasVibration && (
                    <small style={{ color: "#6c757d", marginLeft: "8px" }}>
                        (Not supported on this device)
                    </small>
                )}
                {!isClient && (
                    <small style={{ color: "#6c757d", marginLeft: "8px" }}>
                        (Loading...)
                    </small>
                )}
            </div>

            {/* Continuous Scan Toggle */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px",
                backgroundColor: "#e9ecef",
                borderRadius: "6px",
                fontSize: "14px"
            }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={continuousScan}
                        onChange={(e) => setContinuousScan(e.target.checked)}
                        style={{ cursor: "pointer" }}
                    />
                    <span>🔄 Continuous Scan Mode</span>
                </label>
                <small style={{ color: "#6c757d", marginLeft: "8px" }}>
                    {continuousScan ? "(Auto-detects barcodes)" : "(Manual scan mode)"}
                </small>
            </div>

            {/* Compact Control Buttons - 3 in one row */}
            <div style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                alignItems: "stretch"
            }}>
                {/* Start/Stop Button */}
                {!isActive ? (
                    <button
                        onClick={start}
                        style={compactButtonStyle}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
                    >
                        📷 Start
                    </button>
                ) : (
                    <button
                        onClick={stop}
                        style={stopButtonStyle}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
                    >
                        ⏹️ Stop
                    </button>
                )}

                {/* Torch Toggle Button */}
                <button
                    onClick={handleTorchToggle}
                    style={torchButtonStyle}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#218838"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#28a745"}
                >
                    {torchOn ? "💡 Torch Off" : "🔦 Torch On"}
                </button>

                {/* Test Button */}
                <button
                    onClick={() => {
                        console.log('🧪 Testing sound and vibration...');
                        playSuccessSound();

                        if (isClient && vibrationEnabled && hasVibration) {
                            try {
                                let vibResult = false;

                                if (navigator.vibrate) {
                                    vibResult = navigator.vibrate([200, 100, 200]);
                                    console.log('🧪 Test vibration (standard):', vibResult);
                                }

                                if (!vibResult && (navigator as any).vibrate) {
                                    vibResult = (navigator as any).vibrate(200);
                                    console.log('🧪 Test vibration (fallback):', vibResult);
                                }

                                if (!vibResult && (navigator as any).webkitVibrate) {
                                    vibResult = (navigator as any).webkitVibrate([200, 100, 200]);
                                    console.log('🧪 Test vibration (webkit):', vibResult);
                                }
                            } catch (e) {
                                console.log('🧪 Test vibration error:', e);
                            }
                        } else {
                            console.log('🧪 Vibration disabled or not supported');
                        }
                    }}
                    style={testButtonStyle}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e0a800"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ffc107"}
                >
                    🧪 Test
                </button>
            </div>

            {/* Manual Check Button - only show when continuous scan is off */}
            {!continuousScan && isActive && (
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "8px"
                }}>
                    <button
                        onClick={handleManualScan}
                        style={{
                            ...compactButtonStyle,
                            backgroundColor: "#17a2b8",
                            borderColor: "#17a2b8",
                            minWidth: "200px",
                            fontSize: "16px",
                            padding: "12px 24px"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#138496"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#17a2b8"}
                    >
                        📸 Check for Barcode
                    </button>
                </div>
            )}

            {/* Scan History */}
            {scanHistory.length > 0 ? (
                <div style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#fff"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        margin: 0,
                        padding: "12px",
                        backgroundColor: "#f8f9fa",
                        borderBottom: "1px solid #ddd"
                    }}>
                        <h4 style={{
                            margin: 0,
                            color: "#333"
                        }}>
                            📋 Scan History ({scanHistory.length})
                        </h4>
                        <button
                            onClick={() => {
                                setScanHistory([]);
                                scannedCodesRef.current.clear();
                                lastScanTimeRef.current = {};
                                console.log('🗑️ History cleared and refs reset');
                            }}
                            style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    <div style={{ padding: "8px" }}>
                        {scanHistory.map((scan, index) => (
                            <div key={scan.id} style={{
                                padding: "10px",
                                margin: "6px 0",
                                backgroundColor: index === 0 ? "#d4edda" : "#f8f9fa", // Highlight most recent
                                border: `1px solid ${index === 0 ? "#c3e6cb" : "#e9ecef"}`,
                                borderRadius: "6px",
                                borderLeft: index === 0 ? "4px solid #28a745" : "4px solid #6c757d"
                            }}>
                                <div style={{
                                    fontWeight: "bold",
                                    color: index === 0 ? "#155724" : "#495057",
                                    marginBottom: "4px",
                                    fontSize: "14px"
                                }}>
                                    {index === 0 ? "🆕 " : `${index + 1}. `}{scan.text}
                                </div>
                                <div style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <span>Format: {scan.format || "Unknown"}</span>
                                    <span>{new Date(scan.timestamp).toLocaleTimeString()}</span>
                                </div>

                                {/* Add checkbox for marking as processed */}
                                <div style={{ marginTop: "8px" }}>
                                    <label style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        fontSize: "12px",
                                        cursor: "pointer"
                                    }}>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                // Vibrate on checkbox interaction
                                                if (isClient && hasVibration && e.target.checked) {
                                                    navigator.vibrate(100);
                                                }
                                            }}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span style={{ color: "#6c757d" }}>Mark as processed</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: "20px",
                    textAlign: "center",
                    border: "2px dashed #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f8f9fa",
                    color: "#6c757d"
                }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>📊 No scans yet</div>
                    <small>Start scanning to see unique barcodes here. Duplicates will be ignored.</small>
                </div>
            )}

            {error && (
                <div role="alert" style={{
                    color: "#721c24",
                    backgroundColor: "#f8d7da",
                    border: "1px solid #f5c6cb",
                    borderRadius: "4px",
                    padding: "16px",
                    fontWeight: "bold"
                }}>
                    <div>❌ <strong>Camera Access Error:</strong></div>
                    <div style={{ marginTop: "8px", fontSize: "14px" }}>{error}</div>

                    {error.includes('MediaDevices') || error.includes('getUserMedia') && (
                        <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "normal" }}>
                            <strong>Possible solutions:</strong>
                            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                                <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
                                <li>Access the site via HTTPS (required for camera access)</li>
                                <li>Check if camera permissions are blocked in browser settings</li>
                                <li>Ensure your device has a camera available</li>
                            </ul>
                        </div>
                    )}

                    {error.includes('HTTPS') && (
                        <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: "normal" }}>
                            <strong>HTTPS Required:</strong> Camera access requires a secure connection.
                            Please access this site via HTTPS or use localhost for development.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
