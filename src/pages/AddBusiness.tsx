import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { CurrencyModal } from '../components/ui/CurrencyModal';
import { CURRENCIES } from '../constants/currencies';

const BUSINESS_TYPES = [
    'Retail Shop', 'Supermarket', 'Pharmacy', 'Restaurant/Chop Bar',
    'Fashion/Tailoring', 'Electronics', 'Service', 'Other'
];

export function AddBusiness() {
    const navigate = useNavigate();
    const { addBusiness, business, businesses } = useData();
    const { showToast } = useToast();

    // Relaxed check: Allow creation if < 2 businesses (Free limit) or if User is Pro
    const freePlanLimit = 2;
    const canCreate = business.isPro || businesses.length < freePlanLimit;

    if (!canCreate) {
        navigate('/upgrade');
        return null;
    }

    const [name, setName] = useState('');
    const [type, setType] = useState('Retail Shop');
    const [currency, setCurrency] = useState('₦'); // Default to Naira
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

    const handleCreate = () => {
        if (!name.trim()) return showToast('Business Name is required', 'error');

        addBusiness({
            name,
            type,
            currency,
            isPro: business.isPro || false, // Use current business Pro status as default
            plan: business.plan || 'FREE',
            onboardingCompleted: true,
            collaborators: []
        });

        navigate('/');
    };

    const selectedCurrency = CURRENCIES.find(c => c.symbol === currency) || CURRENCIES[0];

    return (
        <Layout>
            <div style={{
                padding: '1.5rem',
                minHeight: '100vh',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem', color: 'var(--color-text)' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>New Business</h1>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <Input
                            label="Business Name"
                            placeholder="e.g. My Second Shop"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            enterKeyHint="done"
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Currency
                        </label>
                        <button
                            onClick={() => setIsCurrencyOpen(true)}
                            style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'white',
                                color: 'var(--color-text)',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{selectedCurrency.flag}</span>
                                <span style={{ fontSize: '1rem', fontWeight: '500' }}>
                                    {selectedCurrency.label} ({selectedCurrency.symbol})
                                </span>
                            </div>
                            <ChevronDown size={20} color="var(--color-text-muted)" />
                        </button>
                    </div>

                    <CurrencyModal
                        isOpen={isCurrencyOpen}
                        onClose={() => setIsCurrencyOpen(false)}
                        currentCurrency={currency}
                        onSelect={(c) => {
                            setCurrency(c);
                            setIsCurrencyOpen(false);
                        }}
                    />

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Business Type
                        </label>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'
                        }}>
                            {BUSINESS_TYPES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    style={{
                                        padding: '0.75rem', borderRadius: '0.5rem',
                                        border: type === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        backgroundColor: type === t ? '#ecfdf5' : 'transparent',
                                        color: type === t ? 'var(--color-primary)' : 'var(--color-text)',
                                        fontSize: '0.875rem', fontWeight: '500'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingBottom: '6rem' }}>
                    <Button onClick={handleCreate} style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>
                        Create Business
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
