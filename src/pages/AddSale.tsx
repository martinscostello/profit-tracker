import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Search, Check, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export function AddSale() {
    const navigate = useNavigate();
    const { business, products, addSale } = useData();
    const [step, setStep] = useState<'product' | 'details'>('product');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [sellingPrice, setSellingPrice] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
    // const quantityInputRef = useRef<HTMLInputElement>(null);

    // ... (rest of code)

    // Inside render, Selling Price Input


    const selectedProduct = products.find(p => p.id === selectedProductId);

    const filteredProducts = useMemo(() =>
        products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    // Update selling price when product changes
    useEffect(() => {
        if (selectedProduct) {
            setSellingPrice(selectedProduct.sellingPrice.toString());
        }
    }, [selectedProduct]);

    const calculations = useMemo(() => {
        if (!selectedProduct) return { revenue: 0, cost: 0, profit: 0 };
        const qty = parseInt(quantity) || 0;
        const price = parseFloat(sellingPrice) || 0;
        const revenue = price * qty;
        const cost = selectedProduct.costPrice * qty;
        return {
            revenue,
            cost,
            profit: revenue - cost
        };
    }, [selectedProduct, quantity, sellingPrice]);

    const handleSave = () => {
        if (!selectedProduct) return;

        // Date Logic vs Sorting
        // 1. If user selected 'Today' (in their local time), use the REAL current timestamp (toISOString).
        //    This ensures "Just Now" is truly sorted as newest.
        // 2. If user selected a past/future date, preserve that date (midnight) or append current time? 
        //    Appending current time to a past date is risky (as seen with timezone bugs). 
        //    Let's stick to: "If Today -> Now(). If Custom -> Date + T00:00:00" OR "Date + CurrentTime" if consistent.
        //    Safest: If input date string == local today string, use new Date().toISOString().
        //    Else: use the input date string (which likely defaults to UTC 00:00 by simple usage is ok, or append user's local time?).
        //    Actually, implicit string 'YYYY-MM-DD' usually resolves to UTC midnight.

        const todayLocal = new Date().toLocaleDateString('en-CA');
        let finalDate = date;

        if (date === todayLocal) {
            // Construct LOCAL ISO string (YYYY-MM-DDTHH:mm:ss) to match local clock
            const now = new Date();
            const offsetMs = now.getTimezoneOffset() * 60000;
            const localDate = new Date(now.getTime() - offsetMs);
            finalDate = localDate.toISOString().slice(0, 19); // Remove 'Z' and ms to force Local interpretation
        } else {
            // Keep selected date (YYYY-MM-DD)
            // This defaults to Local Midnight when parsed
            finalDate = date;
        }

        addSale({
            businessId: business.id,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: parseInt(quantity) || 1,
            revenue: calculations.revenue,
            cost: calculations.cost,
            profit: calculations.profit,
            date: finalDate
        });

        navigate('/');
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove formatting to get raw number
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        setSellingPrice(rawValue);
    };

    // Format for display (always active)
    const formattedPrice = sellingPrice ? formatCurrency(parseFloat(sellingPrice) || 0) : '';

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add Sale</h1>
                </div>

                {step === 'product' ? (
                    <>
                        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                            <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search product to sell..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 2.5rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--color-primary)',
                                    boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.1)',
                                    backgroundColor: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => {
                                        setSelectedProductId(product.id);
                                        setStep('details');
                                    }}
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0.75rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: product.stockQuantity === 0 ? '#ef4444' : 'var(--color-text-muted)' }}>
                                            Stock: <strong>{product.stockQuantity || 0}</strong>
                                        </div>
                                    </div>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{formatCurrency(product.sellingPrice)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{
                            marginBottom: '2rem',
                            padding: '1rem',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Selling</span>
                                <h3 style={{ fontWeight: 'bold' }}>{selectedProduct?.name}</h3>
                                <div style={{ fontSize: '0.75rem', color: (selectedProduct?.stockQuantity || 0) === 0 ? '#ef4444' : 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Available Stock: <strong>{selectedProduct?.stockQuantity || 0}</strong>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep('product')}
                                style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none' }}
                            >Change</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Selling Price (Unit)"
                                    type="text"
                                    inputMode="numeric"
                                    value={formattedPrice}
                                    onChange={handlePriceChange}
                                    style={{ fontSize: '1.25rem', padding: '1rem' }}
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            // quantityInputRef.current?.focus();
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input
                                    // ref={quantityInputRef}
                                    label="Quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    style={{ fontSize: '1.25rem', padding: '1rem' }}
                                    enterKeyHint="done"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Input
                                    label="Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ fontSize: '1.25rem', padding: '1rem' }}
                                    enterKeyHint="done"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                            handleSave();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Calculation Preview */}
                        <div style={{
                            backgroundColor: '#F0FDFA', // Light green bg
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
                                <span>Cost</span>
                                <span>{formatCurrency(calculations.cost)}</span>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0.5rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                                <span>Profit</span>
                                <span>+{formatCurrency(calculations.profit)}</span>
                            </div>
                        </div>

                        <Button onClick={handleSave} style={{ padding: '1rem', fontSize: '1.125rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <Check size={20} /> Confirm Sale
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
