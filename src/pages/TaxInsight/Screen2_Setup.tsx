import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Check, ChevronDown } from 'lucide-react';
import { CalculationOverlay } from './CalculationOverlay';
import type { TaxSettings } from '../../types';

interface Props {
    onNext: () => void;
}

export function Screen2_Setup({ onNext }: Props) {
    const { updateTaxSettings, business, businesses, switchBusiness } = useData();
    const stored: Partial<TaxSettings> = business.taxSettings || {};

    const [businessType, setBusinessType] = useState<TaxSettings['businessType']>(stored.businessType || 'SOLO');
    const [hasExemptItems, setHasExemptItems] = useState<TaxSettings['hasExemptItems']>(stored.hasExemptItems || 'IDK');
    const [loading, setLoading] = useState(false);
    const [showBusinessMenu, setShowBusinessMenu] = useState(false);
    const [showCalculation, setShowCalculation] = useState(false);

    // Auto-fill logic based on Business Name/Type
    useEffect(() => {
        // Only auto-fill if the user hasn't explicitly set it, or if we just switched businesses
        // But for this simple implementation, let's just do it on mount or business switch if it's default 'SOLO'
        // effectively resetting it. Or better, check if the current setting is "fresh".

        // Let's deduce from name
        const name = business.name.toLowerCase();
        if (name.includes('ltd') || name.includes('limited') || name.includes('plc')) {
            setBusinessType('LIMITED');
        } else if (name.includes('ent') || name.includes('venture') || name.includes('associates')) {
            setBusinessType('REGISTERED');
        }

        // Also sync state with the current business's stored settings if they exist
        if (business.taxSettings?.businessType) {
            setBusinessType(business.taxSettings.businessType);
        }
        if (business.taxSettings?.hasExemptItems) {
            setHasExemptItems(business.taxSettings.hasExemptItems);
        }

    }, [business.id]); // Run when business changes

    const handleSave = async () => {
        setLoading(true);
        await updateTaxSettings({
            businessType,
            hasExemptItems
        });
        // Fake calculation delay starts now
        setLoading(false);
        setShowCalculation(true);
    };

    const handleSwitchBusiness = (id: string) => {
        switchBusiness(id);
        setShowBusinessMenu(false);
    };

    const RadioCard = ({ selected, onClick, label, sub }: any) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem',
                backgroundColor: 'white',
                border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '1rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selected ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : 'none'
            }}
        >
            <div>
                <div style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{label}</div>
                {sub && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{sub}</div>}
            </div>
            <div style={{
                width: '1.5rem', height: '1.5rem',
                borderRadius: '50%',
                border: selected ? '5px solid #2563eb' : '2px solid #cbd5e1',
                backgroundColor: selected ? 'white' : 'transparent',
                transition: 'all 0.2s'
            }} />
        </div>
    );

    if (showCalculation) {
        return <CalculationOverlay onComplete={onNext} />;
    }

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '10rem' }}>

            {/* 0. Business Selector (New) */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    Select Business Profile
                </h3>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowBusinessMenu(!showBusinessMenu)}
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '1rem',
                            fontWeight: '600',
                            color: '#0f172a' // Hardcoded dark slate for visibility
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {business.name.charAt(0)}
                            </div>
                            <span>{business.name}</span>
                        </div>
                        <ChevronDown size={20} className="text-gray-400" />
                    </button>

                    {showBusinessMenu && (
                        <div style={{
                            position: 'absolute', top: '110%', left: 0, right: 0,
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            border: '1px solid #e2e8f0',
                            zIndex: 100, // Higher z-index for dropdown
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {businesses.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => handleSwitchBusiness(b.id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '1rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        textAlign: 'left',
                                        backgroundColor: b.id === business.id ? '#f0fdf4' : 'white'
                                    }}
                                >
                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', backgroundColor: b.id === business.id ? '#dcfce7' : '#f1f5f9', color: b.id === business.id ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {b.name.charAt(0)}
                                    </div>
                                    <span style={{ fontWeight: b.id === business.id ? '600' : '400', color: '#0f172a' }}>{b.name}</span>
                                    {b.id === business.id && <Check size={16} className="text-green-600 ml-auto" />}
                                </button>
                            ))}
                            <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                                Data will be saved to selected business
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. Business Type */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Business Entity
                </h3>

                <RadioCard
                    label="Solo Business"
                    sub="Individual trader"
                    selected={businessType === 'SOLO'}
                    onClick={() => setBusinessType('SOLO')}
                />
                <RadioCard
                    label="Registered Business Name"
                    sub="Business registered with CAC"
                    selected={businessType === 'REGISTERED'}
                    onClick={() => setBusinessType('REGISTERED')}
                />
                <RadioCard
                    label="Limited Liability Company"
                    sub="Incorporated company"
                    selected={businessType === 'LIMITED'}
                    onClick={() => setBusinessType('LIMITED')}
                />
            </div>

            {/* 2. Exempt Items */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                    Do you sell items that are tax-exempt?
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                    Tax-exempt items include: basic food items, agricultural produce, medical supplies, educational materials
                </p>

                <RadioCard
                    label="Yes"
                    selected={hasExemptItems === 'YES'}
                    onClick={() => setHasExemptItems('YES')}
                />
                <RadioCard
                    label="No"
                    selected={hasExemptItems === 'NO'}
                    onClick={() => setHasExemptItems('NO')}
                />
                <RadioCard
                    label="I don't know"
                    selected={hasExemptItems === 'IDK'}
                    onClick={() => setHasExemptItems('IDK')}
                />
            </div>

            {/* Fixed Bottom Button - Raised Higher for Visibility */}
            <div style={{
                position: 'fixed', bottom: '0', left: 0, right: 0,
                padding: '1rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom)) 1.5rem',
                backgroundColor: 'white',
                borderTop: '1px solid #f1f5f9',
                maxWidth: '600px', margin: '0 auto',
                zIndex: 999 // Super high z-index to ensure visibility
            }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1.125rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '0.875rem',
                        fontWeight: '600',
                        fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    {loading ? 'Saving...' : 'Save and Continue'}
                </button>
            </div>
        </div>
    );
}
