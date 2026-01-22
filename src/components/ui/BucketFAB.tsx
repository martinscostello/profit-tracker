import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/format';

export function BucketFAB() {
    const { salesBucket } = useData();
    const navigate = useNavigate();

    if (salesBucket.length === 0) return null;

    return (
        <button
            onClick={() => navigate('/add-sale', { state: { step: 'bucket' } })}
            style={{
                position: 'fixed',
                bottom: 'calc(5rem + env(safe-area-inset-bottom))', // Above bottom nav
                right: '1.5rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: 'bold',
                zIndex: 50,
                border: 'none',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
                animation: 'pulse-glow 2s infinite'
            }}
        >
            <style>{`
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
                }
            `}</style>
            <div style={{ position: 'relative' }}>
                <ShoppingBag size={24} />
                <span style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--color-primary)'
                }}>
                    {salesBucket.length}
                </span>
            </div>
            <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
            }}>
                {formatCurrency(salesBucket.reduce((acc, i) => acc + (i.quantity * i.sellingPrice), 0))}
            </span>
        </button>
    );
}
