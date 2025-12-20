import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

import { useData } from '../../context/DataContext';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const navigate = useNavigate();
    const { business } = useData();
    const [messageVariant, setMessageVariant] = useState<1 | 2>(1);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            // Alternate message logic
            const last = parseInt(sessionStorage.getItem('upgrade_msg_variant') || '0');
            const next = last === 1 ? 2 : 1;
            setMessageVariant(next);
            sessionStorage.setItem('upgrade_msg_variant', next.toString());
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Vip Badge (reused)
    const VipBadge = () => (
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto' }}>
            <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(253, 185, 49, 0.4) 0%, rgba(255, 215, 0, 0) 70%)',
                animation: 'gold-pulse 2s infinite ease-in-out'
            }} />
            <svg width="80" height="80" viewBox="0 0 100 100" style={{ position: 'relative', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="1" />
                <circle cx="50" cy="50" r="40" fill="#1a1a1a" />
                <path d="M50 35L58 45L66 38L64 54H36L34 38L42 45L50 35Z" fill="#FFD700" stroke="#FDB931" strokeWidth="1" />
                <circle cx="34" cy="36" r="3" fill="#FFD700" />
                <circle cx="50" cy="33" r="3" fill="#FFD700" />
                <circle cx="66" cy="36" r="3" fill="#FFD700" />
                <text x="50" y="75" textAnchor="middle" fontFamily="serif" fontWeight="bold" fontSize="24" fill="#FFD700" letterSpacing="2">VIP</text>
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FDB931" />
                        <stop offset="50%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'white', width: '100%', maxWidth: '400px',
                borderRadius: '1.5rem', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                padding: '2.5rem 2rem', textAlign: 'center'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', right: '1rem', top: '1rem',
                    background: 'white', border: 'none', borderRadius: '50%', padding: '0.5rem',
                    cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                    <X size={20} color="#64748b" />
                </button>

                <div style={{ marginBottom: '1.5rem' }}>
                    <VipBadge />
                </div>

                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                    Unlock the full power of your Business
                </p>

                {business.isPro ? (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16A34A', marginBottom: '1rem' }}>
                            You are a Pro Member!
                        </h2>
                        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>
                            You already have access to all premium features, including advanced reports and multi-business management.
                        </p>
                    </div>
                ) : (
                    messageVariant === 1 ? (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem', lineHeight: '1.4' }}>
                                Most business owners don’t know their real profit.
                            </h2>
                            <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#334155' }}>DailyProfit Pro shows:</p>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#475569' }}>
                                    <li>• What you make daily</li>
                                    <li>• Where your money goes</li>
                                    <li>• How to plan better</li>
                                </ul>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>You can upgrade anytime.</p>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem', lineHeight: '1.4' }}>
                                Know Your Real Profit — Every Day
                            </h2>
                            <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem' }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#334155' }}>DailyProfit Pro helps you:</p>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#475569' }}>
                                    <li>• See your full profit history</li>
                                    <li>• Track expenses properly</li>
                                    <li>• Know what your business truly makes</li>
                                    <li>• Never lose your data</li>
                                </ul>
                            </div>
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>Upgrade when you’re ready.</p>
                        </div>
                    )
                )}

                <button
                    onClick={() => {
                        if (business.isPro) {
                            onClose();
                        } else {
                            onClose();
                            navigate('/upgrade');
                        }
                    }}
                    style={{
                        width: '100%', padding: '1rem',
                        background: business.isPro ? '#16A34A' : 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                        color: 'white', fontWeight: 'bold', fontSize: '1.125rem',
                        borderRadius: '1rem', border: 'none',
                        boxShadow: business.isPro ? '0 4px 6px -1px rgba(22, 163, 74, 0.4)' : '0 4px 6px -1px rgba(147, 51, 234, 0.4)',
                        cursor: 'pointer', transition: 'transform 0.1s'
                    }}
                >
                    {business.isPro ? 'Great!' : 'I\'m Ready'}
                </button>

                <style>{`
@keyframes gold-pulse {
    0% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}
`}</style>
            </div>
        </div>
    );
}
