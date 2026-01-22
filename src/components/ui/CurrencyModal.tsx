import { X, Check, Lock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { CURRENCIES } from '../../constants/currencies';

interface CurrencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCurrency: string;
    onSelect: (currency: string) => void;
}

export function CurrencyModal({ isOpen, onClose, currentCurrency, onSelect }: CurrencyModalProps) {
    const { showToast } = useToast();
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [offsetY, setOffsetY] = useState(0);

    // Reset offset when opening
    if (!isOpen && offsetY !== 0) {
        setOffsetY(0);
    }

    if (!isOpen) return null;

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStart;
        if (diff > 0) {
            setOffsetY(diff);
        }
    };

    const handleTouchEnd = () => {
        if (offsetY > 100) {
            onClose(); // Swipe down to close
        }
        setOffsetY(0); // Reset or snap back
        setTouchStart(null);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: `rgba(0,0,0,${Math.max(0, 0.5 - (offsetY / 1000))})`, // Fade out bg
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
        }}
            onClick={onClose} // Click outside to close
        >
            <div
                onClick={e => e.stopPropagation()} // Prevent click-through closing
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    backgroundColor: 'var(--color-surface)',
                    width: '100%',
                    maxWidth: '600px',
                    borderTopLeftRadius: '1.5rem',
                    borderTopRightRadius: '1.5rem',
                    padding: '1.5rem',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.3s ease-out',
                    transform: `translateY(${offsetY}px)`,
                    transition: touchStart ? 'none' : 'transform 0.2s', // Smooth snap back
                    position: 'relative'
                }}>
                {/* Drag Handle */}
                <div style={{
                    width: '40px',
                    height: '5px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '5rem',
                    margin: '0 auto 1.5rem auto',
                    marginTop: '-0.5rem' // Pull it up a bit
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Select Currency</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0 }}>
                        <X size={24} color="var(--color-text-muted)" />
                    </button>
                </div>

                <div style={{ overflowY: 'auto' }}>
                    {CURRENCIES.map((curr) => {
                        const isLocked = (curr as any).locked;
                        return (
                            <button
                                key={curr.symbol}
                                onClick={() => {
                                    if (isLocked) {
                                        showToast('This currency is coming soon!', 'info');
                                        return;
                                    }
                                    onSelect(curr.symbol);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    color: 'var(--color-text)',
                                    opacity: isLocked ? 0.6 : 1
                                }}
                            >
                                <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{curr.flag}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{curr.label} ({curr.symbol})</span>
                                        {isLocked && <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>Coming Soon</span>}
                                    </div>
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {isLocked && <Lock size={16} color="#64748b" />}
                                    {currentCurrency === curr.symbol && (
                                        <Check size={20} color="var(--color-primary)" />
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
