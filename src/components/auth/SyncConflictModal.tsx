import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Check, Building2, AlertTriangle, ArrowRight, GitMerge, Copy, RefreshCw } from 'lucide-react';
import { type BusinessProfile } from '../../types';

interface SyncConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'PLAN_LIMIT_EXCEEDED' | 'NAME_COLLISION';
    limit?: number;
    businesses?: BusinessProfile[];
    cloudBusinesses?: BusinessProfile[]; // Added
    conflicts?: { local: BusinessProfile; cloud: BusinessProfile }[];
    onResolve: (resolutions: any) => void;
    onUpgrade: () => void;
}

export function SyncConflictModal({ isOpen, onClose, type, limit, businesses, cloudBusinesses, conflicts, onResolve, onUpgrade }: SyncConflictModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // For Plan Limit
    const [resolutions, setResolutions] = useState<Record<string, 'MERGE' | 'REPLACE' | 'KEEP_SEPARATE'>>({}); // For Name Collision

    // Initialize resolutions with default 'KEEP_SEPARATE' to avoid accidental merges
    useEffect(() => {
        if (type === 'NAME_COLLISION' && conflicts) {
            const initial: any = {};
            // DEFAULT IS NOW KEEP_SEPARATE
            conflicts.forEach(c => initial[c.local.id] = 'KEEP_SEPARATE');
            setResolutions(initial);
        }
    }, [isOpen, type, conflicts]);

    if (!isOpen) return null;

    // --- RENDERERS ---

    const renderPlanLimit = () => {
        const localList = businesses || [];
        const cloudList = cloudBusinesses || [];
        const allBusinesses = [...localList.map(b => ({ ...b, _origin: 'local' })), ...cloudList.map(b => ({ ...b, _origin: 'cloud' }))];

        const toggleSelection = (id: string) => {
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(bizId => bizId !== id));
            } else {
                if (selectedIds.length >= (limit || 0)) return;
                setSelectedIds(prev => [...prev, id]);
            }
        };

        return (
            <>
                {/* Header - Fixed */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#FEF3C7' }}>
                            <AlertTriangle size={24} color="#D97706" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Sync Limit Reached</h2>
                    </div>
                    <p style={{ color: '#6B7280' }}>
                        You have <strong>{allBusinesses.length}</strong> total businesses (Cloud + Local), but your plan only supports <strong>{limit}</strong>.
                    </p>
                </div>

                {/* Body - Scrollable */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>

                    {/* Option 1: Upgrade */}
                    <div style={{
                        padding: '1rem', borderRadius: '0.75rem',
                        backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE',
                        cursor: 'pointer', flexShrink: 0
                    }} onClick={onUpgrade}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontWeight: '600', color: '#1E40AF', marginBottom: '0.25rem' }}>Upgrade to Pro</h3>
                                <p style={{ fontSize: '0.875rem', color: '#1E3A8A' }}>Sync all businesses + more features</p>
                            </div>
                            <ArrowRight size={20} color="#1E40AF" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0', flexShrink: 0 }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
                        <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>OR SELECT {limit} TO KEEP</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
                    </div>

                    {/* Option 2: Select */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {allBusinesses.map((biz: any) => {
                            const isSelected = selectedIds.includes(biz.id);
                            const isCloud = biz._origin === 'cloud';
                            return (
                                <div
                                    key={biz.id}
                                    onClick={() => toggleSelection(biz.id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                                        backgroundColor: isSelected ? '#EFF6FF' : 'var(--color-surface)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        transition: 'all 0.2s', flexShrink: 0
                                    }}
                                >
                                    <div style={{
                                        width: '1.5rem', height: '1.5rem',
                                        borderRadius: '50%',
                                        border: `2px solid ${isSelected ? '#3B82F6' : '#D1D5DB'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: isSelected ? '#3B82F6' : 'transparent'
                                    }}>
                                        {isSelected && <Check size={14} color="white" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {biz.name}
                                            {isCloud && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: '#DBEAFE', color: '#1E40AF', borderRadius: '1rem' }}>CLOUD</span>}
                                            {!isCloud && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '1rem' }}>LOCAL</span>}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{biz.type || 'Business'}</div>
                                    </div>
                                    <Building2 size={20} color="#9CA3AF" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'var(--color-surface)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                    <Button onClick={onClose} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid #D1D5DB', color: '#374151' }}>Cancel</Button>
                    <Button
                        disabled={selectedIds.length === 0}
                        onClick={() => {
                            console.log("Confirming Limit Selection:", selectedIds);
                            onResolve(selectedIds);
                        }}
                        style={{ opacity: selectedIds.length === 0 ? 0.5 : 1 }}
                    >
                        Sync Selected ({selectedIds.length})
                    </Button>
                </div>
            </>
        );
    };

    const renderNameCollision = () => {
        return (
            <>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: '#DBEAFE' }}>
                            <GitMerge size={24} color="#1E40AF" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Conflict Found</h2>
                    </div>
                    <p style={{ color: '#6B7280' }}>
                        Some local businesses share names with your existing cloud businesses.
                    </p>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {conflicts?.map((conflict) => {
                        const decision = resolutions[conflict.local.id];
                        return (
                            <div key={conflict.local.id} style={{ border: '1px solid #E5E7EB', borderRadius: '0.75rem', padding: '1rem', flexShrink: 0 }}>
                                <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{conflict.local.name}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {/* Option 1: Merge */}
                                    <div onClick={() => setResolutions(prev => ({ ...prev, [conflict.local.id]: 'MERGE' }))}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem',
                                            border: `2px solid ${decision === 'MERGE' ? '#3B82F6' : '#E5E7EB'}`,
                                            backgroundColor: decision === 'MERGE' ? '#EFF6FF' : 'var(--color-surface)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem'
                                        }}>
                                        <GitMerge size={18} />
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Merge Data</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Combine sales & products</div>
                                        </div>
                                    </div>

                                    {/* Option 2: Replace */}
                                    <div onClick={() => setResolutions(prev => ({ ...prev, [conflict.local.id]: 'REPLACE' }))}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem',
                                            border: `2px solid ${decision === 'REPLACE' ? '#3B82F6' : '#E5E7EB'}`,
                                            backgroundColor: decision === 'REPLACE' ? '#EFF6FF' : 'var(--color-surface)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem'
                                        }}>
                                        <RefreshCw size={18} />
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Overwrite Cloud</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Replace cloud data with local</div>
                                        </div>
                                    </div>

                                    {/* Option 3: Keep Separate */}
                                    <div onClick={() => setResolutions(prev => ({ ...prev, [conflict.local.id]: 'KEEP_SEPARATE' }))}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem',
                                            border: `2px solid ${decision === 'KEEP_SEPARATE' ? '#3B82F6' : '#E5E7EB'}`,
                                            backgroundColor: decision === 'KEEP_SEPARATE' ? '#EFF6FF' : 'var(--color-surface)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem'
                                        }}>
                                        <Copy size={18} />
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Keep Separate</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Create as "{conflict.local.name} (Local)"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'var(--color-surface)', borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                    <Button onClick={onClose} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid #D1D5DB', color: '#374151' }}>Cancel</Button>
                    <Button onClick={() => onResolve(resolutions)}>
                        Confirm Choices
                    </Button>
                </div>
            </>
        );
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, // Boosted Z-Index
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '1rem',
                width: '100%', maxWidth: '500px',
                height: 'auto',
                maxHeight: '90vh', // Constrain height
                display: 'flex', flexDirection: 'column', // Flexbox for Scrollable Body
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden' // Hide overflow on container, scroll body
            }}>
                {type === 'PLAN_LIMIT_EXCEEDED' ? renderPlanLimit() : renderNameCollision()}
            </div>
        </div>
    );
}
