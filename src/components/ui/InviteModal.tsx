import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, RefreshCcw, AlertTriangle, QrCode } from 'lucide-react';
import { ApiService } from '../../services/ApiService';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import QRCode from "react-qr-code";


interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
    const navigate = useNavigate();
    const { business } = useData();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [pairingCode, setPairingCode] = useState('...');
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showQr, setShowQr] = useState(false);


    const generateCode = async () => {
        if (!isOpen || !currentUser) return;

        setIsLoading(true);
        setErrorMsg(null);
        setPairingCode('...');

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out - Check internet connection")), 5000)
            );

            const codePromise = ApiService.createInvitation(business.id).then(res => res.code);

            // Race the actual request against the timeout
            const code = await Promise.race([codePromise, timeoutPromise]) as string;

            setPairingCode(code);
            setTimeLeft(900); // Reset timer
        } catch (error: any) {
            console.error("Failed to generate code", error);
            const msg = error.message || "Unknown error";
            setErrorMsg(msg);
            setPairingCode('Error');
            showToast(`Failed: ${msg}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) generateCode();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || isLoading) return;

        const timer = setInterval(() => {
            setTimeLeft((p) => {
                if (p <= 1) {
                    generateCode();
                    return 900;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, isLoading]);

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div style={{
                backgroundColor: 'white', width: '100%', maxWidth: '400px',
                borderRadius: '1.5rem', padding: '1.5rem',
                animation: 'scaleUp 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Company Managers</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '0.5rem' }}>
                        <X size={24} color="#64748b" />
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {!currentUser ? (
                        <div style={{ padding: '2rem 1rem' }}>
                            <div style={{ marginBottom: '1rem', color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
                                <AlertTriangle size={48} />
                            </div>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Authentication Required</h4>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                You need to be signed in to invite managers and sync data to the cloud.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/login');
                                }}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '0.75rem',
                                    backgroundColor: 'var(--color-primary)', color: 'white',
                                    border: 'none', fontWeight: 'bold', fontSize: '1rem'
                                }}
                            >
                                Sign In to Invite
                            </button>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const plan = business.plan || 'FREE';
                                // Exclude Owner from the count
                                const managerCount = business.collaborators?.filter(c => c.role !== 'OWNER').length || 0;
                                let limit = 0;

                                if (plan === 'FREE') limit = 0;
                                else if (plan === 'LITE') limit = 1; // Updated: Lite gets 1 Manager
                                else if (plan === 'ENTREPRENEUR') limit = 5;
                                else limit = 9999;

                                const isLimitReached = managerCount >= limit;

                                if (isLimitReached) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
                                            <div style={{ marginBottom: '1rem', color: '#f59e0b', display: 'flex', justifyContent: 'center' }}>
                                                <AlertTriangle size={36} />
                                            </div>
                                            <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
                                                {limit === 0 ? "Unlock Team Access" : "Manager Limit Reached"}
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                                {limit === 0
                                                    ? "Upgrade to the Entrepreneur plan to start adding managers to your business."
                                                    : `You've reached the limit of ${limit} managers on your current plan.`
                                                }
                                            </p>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    navigate('/upgrade');
                                                }}
                                                style={{
                                                    width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
                                                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                                                    color: 'white', fontWeight: 'bold', fontSize: '0.875rem', border: 'none'
                                                }}
                                            >
                                                View Upgrade Options
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                            Share this pairing code with your partner to add them to this business.
                                        </p>
                                        <div style={{
                                            backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1rem',
                                            border: '2px dashed #94a3b8', marginBottom: '1rem',
                                            position: 'relative'
                                        }}>
                                            <div style={{ fontSize: '3rem', fontWeight: 'bold', letterSpacing: '0.5rem', color: pairingCode === 'Error' ? '#ef4444' : '#1e293b' }}>
                                                {pairingCode}
                                            </div>
                                            {errorMsg && (
                                                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                                    {errorMsg}
                                                </div>
                                            )}
                                            <div style={{
                                                position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                                                fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold'
                                            }}>
                                                {pairingCode !== '...' && pairingCode !== 'Error' && `Expires in ${formatTime(timeLeft)}`}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(pairingCode);
                                                    showToast('Code copied!', 'success');
                                                }}
                                                disabled={pairingCode === '...' || pairingCode === 'Error'}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                                                    backgroundColor: '#f1f5f9', color: '#475569',
                                                    border: 'none', fontWeight: '600',
                                                    opacity: pairingCode === '...' ? 0.5 : 1
                                                }}
                                            >
                                                <Copy size={18} /> Copy
                                            </button>
                                            <button
                                                onClick={generateCode}
                                                disabled={isLoading}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                                                    backgroundColor: '#f1f5f9', color: '#475569',
                                                    border: 'none', fontWeight: '600',
                                                    opacity: isLoading ? 0.5 : 1
                                                }}
                                            >
                                                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                                                {isLoading ? 'Wait...' : 'Generate New'}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </>
                    )}
                </div>

                <div style={{ borderTop: '0px solid #e2e8f0', paddingTop: '0rem', marginTop: '1rem' }}>

                    {!showQr ? (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>OR</div>
                            <button
                                onClick={() => setShowQr(true)}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '1rem',
                                    backgroundColor: '#eff6ff', color: 'var(--color-primary)',
                                    border: '1px dashed var(--color-primary)', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                                }}>
                                <QrCode size={20} />
                                Generate QR Code
                            </button>
                        </div>
                    ) : (
                        pairingCode !== '...' && pairingCode !== 'Error' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '2px solid #e2e8f0' }}>
                                    <QRCode value={pairingCode} size={150} />
                                </div>
                                <button onClick={() => setShowQr(false)} style={{ color: '#64748b', fontSize: '0.875rem', background: 'none', border: 'none', textDecoration: 'underline' }}>
                                    Hide QR Code
                                </button>
                            </div>
                        )
                    )}

                </div>

            </div>
            <style>{`
            @keyframes scaleUp {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `}</style>
        </div >
    );
}
