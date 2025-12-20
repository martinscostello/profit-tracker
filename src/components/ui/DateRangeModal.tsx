import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

interface DateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: string, end: string) => void;
}

export function DateRangeModal({ isOpen, onClose, onApply }: DateRangeModalProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Reset fields when opening? Or keep previous? Let's keep empty for now or current date.
            const today = new Date().toISOString().split('T')[0];
            if (!startDate) setStartDate(today);
            if (!endDate) setEndDate(today);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleApply = () => {
        if (!startDate || !endDate) return;
        onApply(startDate, endDate);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white', width: '90%', maxWidth: '400px',
                borderRadius: '1.5rem', padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', backgroundColor: '#f3e8ff', borderRadius: '0.5rem' }}>
                            <Calendar size={20} color="#9333ea" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Select Dates</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} color="#64748b" />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem',
                                borderRadius: '0.75rem', border: '1px solid #e2e8f0',
                                fontSize: '1rem', outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: '#f8fafc'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            style={{
                                width: '100%', padding: '0.75rem',
                                borderRadius: '0.75rem', border: '1px solid #e2e8f0',
                                fontSize: '1rem', outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: '#f8fafc'
                            }}
                        />
                    </div>
                </div>

                <button
                    onClick={handleApply}
                    disabled={!startDate || !endDate}
                    style={{
                        width: '100%', padding: '1rem',
                        backgroundColor: startDate && endDate ? '#9333ea' : '#e2e8f0',
                        color: startDate && endDate ? 'white' : '#94a3b8',
                        fontWeight: 'bold', fontSize: '1rem',
                        borderRadius: '1rem', border: 'none',
                        cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                    }}
                >
                    Apply Filter
                </button>
            </div>
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
