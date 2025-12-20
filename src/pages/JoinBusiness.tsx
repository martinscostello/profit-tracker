import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { ArrowLeft, QrCode, X } from 'lucide-react'; // Added X for stop scan
import { useData } from '../context/DataContext';

import { ApiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

export function JoinBusiness() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { importBusiness } = useData();
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    // Stop scan on unmount
    useEffect(() => {
        return () => {
            stopScan();
        };
    }, []);

    const startScan = async () => {
        setError(null);
        try {
            // Permission Logic
            const status = await BarcodeScanner.checkPermissions();
            if (status.camera === 'denied' || status.camera === 'prompt') {
                const response = await BarcodeScanner.requestPermissions();
                if (response.camera !== 'granted') {
                    setError('Camera permission was denied. Please enable it in settings.');
                    return;
                }
            }

            setIsScanning(true);
            document.body.classList.add('barcode-scanner-active');

            try {
                await BarcodeScanner.installGoogleBarcodeScannerModule();
            } catch (e) {
                // Ignore module install errors on web/hybrid
            }

            const { barcodes } = await BarcodeScanner.scan();

            if (barcodes.length > 0) {
                const scannedContent = barcodes[0].rawValue;
                if (scannedContent && scannedContent.length === 6) {
                    setCode(scannedContent);
                    handleJoin(scannedContent);
                } else {
                    setError(`Scanned: ${scannedContent}. Please ensure this is a valid 6-digit code.`);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to start camera.');
        } finally {
            stopScan();
        }
    };

    const stopScan = async () => {
        setIsScanning(false);
        document.body.classList.remove('barcode-scanner-active');
    };

    const handleJoin = async (codeOverride?: string) => {
        const codeToUse = typeof codeOverride === 'string' ? codeOverride : code;

        if (codeToUse.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }
        if (!currentUser) {
            setError('You must be logged in to join a business');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const result = await ApiService.joinBusiness(codeToUse);
            importBusiness(result.business);
            showToast(`Successfully Joined: ${result.business.name} `, 'success');
            navigate('/');
        } catch (err: any) {
            console.error("Join Failed:", err);
            // Better Error Parsing
            const msg = err.response?.data?.message || err.message || 'Failed to join business';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout disablePadding>
            <div style={{
                padding: 0,
                height: '100vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                paddingTop: 'calc(env(safe-area-inset-top))',
                visibility: isScanning ? 'hidden' : 'visible'
            }}>
                {/* Fixed Header */}
                <div style={{
                    padding: '1.5rem',
                    paddingBottom: '1rem',
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem', color: 'var(--color-text)' }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Join Business</h1>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 1.5rem 6rem 1.5rem',
                    display: 'flex', flexDirection: 'column'
                }}>

                    {/* Explicit Error Display */}
                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem',
                            border: '1px solid #fecaca',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            {error}
                            {error.includes('denied') && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <button
                                        onClick={() => BarcodeScanner.openSettings()}
                                        style={{
                                            backgroundColor: '#b91c1c', color: 'white', border: 'none',
                                            padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem'
                                        }}
                                    >
                                        Open Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Enter the 6-digit pairing code provided by the business owner to join their team.
                    </p>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                            Pairing Code <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>(Try: 111111)</span>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <input
                                    key={i}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={code[i] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && !/^\d+$/.test(val)) return;

                                        const newCode = code.split('');
                                        newCode[i] = val;
                                        const finalCode = newCode.join('').slice(0, 6);
                                        setCode(finalCode);
                                        // Clear error on type
                                        if (error) setError(null);

                                        if (finalCode.length === 6) {
                                            handleJoin(finalCode);
                                        }

                                        if (val && i < 5) {
                                            const nextInput = document.getElementById(`digit - ${i + 1} `);
                                            nextInput?.focus();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !code[i] && i > 0) {
                                            const prevInput = document.getElementById(`digit - ${i - 1} `);
                                            prevInput?.focus();
                                        }
                                    }}
                                    id={`digit - ${i} `}
                                    style={{
                                        width: '3rem', height: '3.5rem',
                                        fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center',
                                        borderRadius: '0.75rem', border: '1px solid var(--color-border)',
                                        backgroundColor: 'white'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Scanning & Action Area */}
                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>OR</div>
                            <button
                                onClick={startScan}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '1rem',
                                    backgroundColor: '#eff6ff', color: 'var(--color-primary)',
                                    border: '1px dashed var(--color-primary)', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                                }}>
                                <QrCode size={20} />
                                Scan QR Code
                            </button>
                        </div>

                        <Button
                            onClick={() => handleJoin()}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
                            disabled={code.length !== 6 || isLoading}
                        >
                            {isLoading ? 'Joining...' : 'Join Business'}
                        </Button>
                    </div>
                </div>
            </div>

            {isScanning && (
                <div style={{
                    position: 'fixed', bottom: '6rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999
                }}>
                    <button
                        onClick={stopScan}
                        style={{
                            padding: '1rem 2rem', borderRadius: '2rem',
                            backgroundColor: 'white', color: 'red', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <X size={20} /> Stop Scanning
                    </button>
                </div>
            )}
        </Layout>
    );
}

