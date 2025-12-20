import { X, Check, Lock } from 'lucide-react';
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
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '600px',
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                padding: '1.5rem',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideUp 0.3s ease-out'
            }}>
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
