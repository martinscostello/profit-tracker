import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Check, Calculator } from 'lucide-react';
import { formatCurrency, formatNumberAsYouType } from '../utils/format';

export function CustomSale() {
    const navigate = useNavigate();
    const { business, addSale } = useData();

    // Form State
    const [name, setName] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

    const calculations = useMemo(() => {
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(sellingPrice.replace(/,/g, '')) || 0;
        const cost = parseFloat(costPrice.replace(/,/g, '')) || 0;

        const revenue = price * qty;
        const totalCost = cost * qty;

        return {
            revenue,
            cost: totalCost,
            profit: revenue - totalCost
        };
    }, [quantity, sellingPrice, costPrice]);

    const handleSave = () => {
        if (!name.trim() || !sellingPrice) return;

        // Date Logic (Same as AddSale)
        const todayLocal = new Date().toLocaleDateString('en-CA');
        let finalDate = date;

        if (date === todayLocal) {
            const now = new Date();
            const offsetMs = now.getTimezoneOffset() * 60000;
            const localDate = new Date(now.getTime() - offsetMs);
            finalDate = localDate.toISOString().slice(0, 19);
        } else {
            finalDate = date;
        }

        // Append unit if present
        const finalName = unit.trim() ? `${name.trim()} (${unit.trim()})` : name.trim();

        // Generate a temporary ID that won't collide with real products
        // We use a prefix 'custom_' timestamp
        const randomId = `custom_${Date.now()}`;

        addSale({
            businessId: business.id,
            productId: randomId,
            productName: finalName,
            quantity: parseFloat(quantity) || 1,
            revenue: calculations.revenue,
            cost: calculations.cost,
            profit: calculations.profit,
            date: finalDate
        });

        navigate('/');
    };

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'calc(2rem + env(safe-area-inset-top))'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} color="var(--color-text)" />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Custom Sale</h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Sell an unlisted item</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

                    {/* Product Identity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Product / Service Name"
                            placeholder="e.g. Consultation"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                        <Input
                            label="Unit (Opt)"
                            placeholder="kg, hr"
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                        />
                    </div>

                    {/* Financials */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Selling Price"
                            type="text"
                            inputMode="decimal"
                            value={sellingPrice}
                            onChange={(e) => {
                                const formatted = formatNumberAsYouType(e.target.value);
                                setSellingPrice(formatted);
                            }}
                            placeholder="0.00"
                        />
                        <Input
                            label="Cost Price"
                            type="text"
                            inputMode="decimal"
                            value={costPrice}
                            onChange={(e) => {
                                const formatted = formatNumberAsYouType(e.target.value);
                                setCostPrice(formatted);
                            }}
                            placeholder="0.00"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Quantity"
                            type="number"
                            inputMode="decimal"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Calculation Preview */}
                    <div style={{
                        backgroundColor: '#F0FDFA',
                        border: '1px dashed var(--color-primary)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        marginTop: 'auto',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <Calculator size={20} />
                            <span style={{ fontWeight: '600' }}>Summary</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <span>Revenue</span>
                            <span>{formatCurrency(calculations.revenue)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <span>Total Cost</span>
                            <span>{formatCurrency(calculations.cost)}</span>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0.5rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                            <span>Profit</span>
                            <span>+{formatCurrency(calculations.profit)}</span>
                        </div>
                    </div>

                    <Button
                        disabled={!name.trim() || !sellingPrice}
                        onClick={handleSave}
                        style={{ padding: '1rem', fontSize: '1.125rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Check size={20} /> Confirm Custom Sale
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
