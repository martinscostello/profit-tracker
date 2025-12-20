import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from './Card';
import { Button } from './Button';
import { Database, Cloud, Merge, Copy, Trash2, AlertTriangle } from 'lucide-react';

export function DataConsolidationModal() {
    const { pendingConsolidation, resolveConsolidation, syncStatus } = useData();
    const [selectedTarget, setSelectedTarget] = useState<string>('');

    if (!pendingConsolidation) return null;

    const { localBusiness, cloudBusinesses, localData } = pendingConsolidation;
    const isSyncing = syncStatus === 'syncing';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10002,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            padding: '1.5rem'
        }}>
            <Card style={{
                width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                position: 'relative', padding: '2rem'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <Merge size={32} color="#d97706" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        Data Sync Conflict
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                        We found existing data in both your cloud account and this device. How would you like to proceed?
                    </p>
                </div>

                {/* Data Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            <Database size={14} /> Local Data
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '600' }}>{localBusiness.name}</div>
                            <div style={{ color: '#64748b' }}>
                                {localData.products.length} Products, {localData.sales.length} Sales
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            <Cloud size={14} /> Cloud Account
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ fontWeight: '600' }}>{cloudBusinesses.length} Business(es)</div>
                            <div style={{ color: '#3b82f6' }}>Found on your account</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Option 1: Create New */}
                    <button
                        onClick={() => resolveConsolidation('create_new')}
                        disabled={isSyncing}
                        style={{
                            width: '100%', padding: '1.25rem', textAlign: 'left',
                            backgroundColor: 'white', border: '2px solid var(--color-border)',
                            borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                        <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.75rem' }}>
                            <Copy size={24} color="#16a34a" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>Keep Both (Recommended)</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Save this offline business as a new separate business.
                            </div>
                        </div>
                    </button>

                    {/* Option 2: Merge into existing */}
                    <div style={{
                        padding: '1.25rem', backgroundColor: 'white',
                        border: '2px solid var(--color-border)', borderRadius: '1rem',
                        display: 'flex', flexDirection: 'column', gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                <Merge size={24} color="#3b82f6" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold' }}>Merge with Existing</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    Add your local data into one of your cloud businesses.
                                </div>
                            </div>
                        </div>

                        <select
                            value={selectedTarget}
                            onChange={(e) => setSelectedTarget(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)', backgroundColor: '#f8fafc'
                            }}
                        >
                            <option value="">Select Target Business</option>
                            {cloudBusinesses.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        <Button
                            variant="primary"
                            disabled={!selectedTarget || isSyncing}
                            onClick={() => resolveConsolidation('merge', selectedTarget)}
                            style={{ width: '100%' }}
                        >
                            Confirm Merge
                        </Button>
                    </div>

                    {/* Warning Section */}
                    <div style={{
                        marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed',
                        borderRadius: '0.75rem', border: '1px solid #ffedd5',
                        display: 'flex', gap: '0.75rem'
                    }}>
                        <AlertTriangle size={20} color="#ea580c" />
                        <div style={{ fontSize: '0.75rem', color: '#9a3412', lineHeight: '1.4' }}>
                            Choose <strong>Merge</strong> if you want to combine data.
                            Choose <strong>Keep Both</strong> to start fresh online without losing your offline setup.
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            onClick={() => resolveConsolidation('use_cloud')}
                            disabled={isSyncing}
                            style={{
                                padding: '0.75rem', backgroundColor: 'transparent',
                                border: '1px solid #fee2e2', borderRadius: '0.5rem',
                                color: '#dc2626', fontSize: '0.875rem', fontWeight: '600',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <Trash2 size={16} /> Discard Local
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm("WARNING: This will overwrite products/sales on your cloud business with this local data. Are you sure?")) {
                                    resolveConsolidation('replace_cloud', selectedTarget);
                                }
                            }}
                            disabled={!selectedTarget || isSyncing}
                            style={{
                                padding: '0.75rem', backgroundColor: '#fee2e2',
                                border: '1px solid #fca5a5', borderRadius: '0.5rem',
                                color: '#991b1b', fontSize: '0.875rem', fontWeight: 'bold',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            <AlertTriangle size={16} /> Overwrite Cloud
                        </button>
                    </div>
                </div>

                {isSyncing && (
                    <div style={{
                        position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '1rem', zIndex: 10
                    }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Syncing Data...</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
