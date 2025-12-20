import { useDialog } from '../../context/DialogContext';
import { useToast } from '../../context/ToastContext';
import { Card } from './Card';
import { X, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useState } from 'react';

interface ClearSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ClearSalesModal({ isOpen, onClose }: ClearSalesModalProps) {
    const { clearSales } = useData();
    const { showToast } = useToast();
    const { confirm } = useDialog();
    const [isClearing, setIsClearing] = useState(false);

    if (!isOpen) return null;

    const handleClear = async (range: 'today' | 'week' | 'month' | 'all', label: string) => {
        const isConfirmed = await confirm({
            title: `Clear ${label} Sales?`,
            message: `Are you sure you want to delete all sales for ${label.toLowerCase()}? This action cannot be undone.`,
            confirmText: 'Delete Forever',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                setIsClearing(true);
                await clearSales(range);
                showToast(`Sales for ${label.toLowerCase()} cleared successfully`, 'success');
                onClose();
            } catch (error) {
                showToast("Failed to clear sales. Please try again.", 'error');
                console.error(error);
            } finally {
                setIsClearing(false);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '24rem', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#DC2626' }}>
                        <Trash2 size={24} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Clear Sales History</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        Choose which sales records you want to permanently delete.
                    </p>

                    <button
                        disabled={isClearing}
                        onClick={() => handleClear('today', 'Today')}
                        style={optionStyle}
                    >
                        <span style={{ fontWeight: '600' }}>Clear Today's Sales</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Reset daily progress</span>
                    </button>

                    <button
                        disabled={isClearing}
                        onClick={() => handleClear('week', 'This Week')}
                        style={optionStyle}
                    >
                        <span style={{ fontWeight: '600' }}>Clear This Week</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Reset weekly stats</span>
                    </button>

                    <button
                        disabled={isClearing}
                        onClick={() => handleClear('month', 'This Month')}
                        style={optionStyle}
                    >
                        <span style={{ fontWeight: '600' }}>Clear This Month</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Reset monthly stats</span>
                    </button>

                    <button
                        disabled={isClearing}
                        onClick={() => handleClear('all', 'All Time')}
                        style={{ ...optionStyle, backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626' }}
                    >
                        <span style={{ fontWeight: '600' }}>Clear All History</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Start completely fresh</span>
                    </button>
                </div>
            </Card>
        </div>
    );
}

const optionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
};
