
import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Check, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { CurrencyModal } from '../components/ui/CurrencyModal';
import { CURRENCIES } from '../constants/currencies';

const BUSINESS_TYPES = [
    'Retail Shop', 'Supermarket', 'Pharmacy', 'Restaurant/Chop Bar',
    'Fashion/Tailoring', 'Electronics', 'Service', 'Other'
];

export function BusinessSetup({ onComplete }: { onComplete: () => void }) {
    const { addBusiness } = useData();
    const [name, setName] = useState('');
    const { showToast } = useToast();
    const [currency, setCurrency] = useState('₦');
    const [type, setType] = useState('');
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast('Please enter your business name', 'error');
            return;
        }
        if (!type) {
            showToast('Please select a business category', 'error');
            return;
        }

        // For first-time setup, we ADD the business so it gets a real ID and becomes active
        addBusiness({
            name: name.trim(),
            currency: currency || '₦',
            type: type,
            isPro: false,
            plan: 'FREE',
            onboardingCompleted: true,
            collaborators: []
        });
        onComplete();
    };

    const currentFlag = CURRENCIES.find(c => c.symbol === currency)?.flag || currency;

    return (
        <>
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem',
                backgroundColor: 'var(--color-bg)',
                paddingTop: 'calc(2rem + env(safe-area-inset-top))' // Safe area fix
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                        Tell us about your business
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '3rem' }}>
                        This helps us personalize your experience.
                    </p>

                    <form id="setup-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Input
                            label="Business Name (Required)"
                            placeholder="e.g. Iya Tope Provisions"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            enterKeyHint="next"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>Currency</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCurrencyModalOpen(true)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        justifyContent: 'space-between',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    <span style={{ fontSize: '1.25rem' }}>{currentFlag}</span>
                                    <ChevronDown size={16} color="var(--color-text-muted)" />
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                                            Business Category (Required)
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem',
                                                    paddingRight: '2.5rem',
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid var(--color-border)',
                                                    backgroundColor: 'var(--color-bg)',
                                                    fontSize: '1rem',
                                                    appearance: 'none',
                                                    color: type ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="" disabled>Select Category</option>
                                                {BUSINESS_TYPES.map(t => (
                                                    <option key={t} value={t} style={{ color: 'var(--color-text-primary)' }}>{t}</option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={20}
                                                style={{
                                                    position: 'absolute',
                                                    right: '1rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: 'var(--color-text-muted)',
                                                    pointerEvents: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <Button
                        type="submit"
                        form="setup-form"
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            fontSize: '1.25rem',
                            borderRadius: '3rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: 'var(--shadow-custom)'
                        }}
                    >
                        Continue <Check size={24} />
                    </Button>
                </div>

                {/* Login link removed as requested */}
            </div>

            <CurrencyModal
                isOpen={isCurrencyModalOpen}
                onClose={() => setIsCurrencyModalOpen(false)}
                currentCurrency={currency}
                onSelect={(curr) => {
                    setCurrency(curr);
                    setIsCurrencyModalOpen(false);
                }}
            />
        </>
    );
}
