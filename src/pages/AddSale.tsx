import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft, Search, Check, Calculator, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export function AddSale() {
    const navigate = useNavigate();
    const { business, products, addSale, addToBucket, salesBucket, removeFromBucket, checkoutBucket } = useData();
    const [step, setStep] = useState<'product' | 'details' | 'bucket'>('product');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [sellingPrice, setSellingPrice] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const quantityInputRef = useRef<HTMLInputElement>(null);

    // ... (rest of code)

    // Inside render, Selling Price Input


    const selectedProduct = products.find(p => p.id === selectedProductId);

    const filteredProducts = useMemo(() =>
        products.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
        [products, searchTerm]
    );

    // Update selling price when product changes
    useEffect(() => {
        if (selectedProduct) {
            setSellingPrice((selectedProduct.sellingPrice || 0).toString());
        }
    }, [selectedProduct]);

    const calculations = useMemo(() => {
        if (!selectedProduct) return { revenue: 0, cost: 0, profit: 0 };
        const qty = parseInt(quantity) || 0;
        const price = parseFloat(sellingPrice) || 0;
        const revenue = price * qty;
        const cost = (selectedProduct.costPrice || 0) * qty;
        return {
            revenue,
            cost,
            profit: revenue - cost
        };
    }, [selectedProduct, quantity, sellingPrice]);


    const handleAddToBucket = () => {
        if (!selectedProduct) return;

        addToBucket({
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: parseInt(quantity) || 1,
            sellingPrice: parseFloat(sellingPrice) || 0,
            costPrice: selectedProduct.costPrice || 0
        });

        // Reset and go back to product list to add more
        setQuantity('1');
        setSelectedProductId(null);
        setStep('product');
    };

    const handleQuickSell = async () => {
        if (!selectedProduct || isSubmitting) return;

        try {
            setIsSubmitting(true);
            // Date Logic vs Sorting (Same as standard addSale logic)
            const todayLocal = new Date().toLocaleDateString('en-CA');
            let finalDate = date;

            if (date === todayLocal) {
                const now = new Date();
                const offsetMs = now.getTimezoneOffset() * 60000;
                const localDate = new Date(now.getTime() - offsetMs);
                finalDate = localDate.toISOString().slice(0, 19);
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
            }).catch(e => {
                console.error("Background Add Sale Failed", e);
                // Optionally show error toast here using a global toaster reference if possible, 
                // but component is likely unmounted.
            });

            navigate('/');
        } catch (error) {
            console.error("Quick Sell Failed", error);
            setIsSubmitting(false); // Only re-enable on error, otherwise we navigate away
        }
    };

    const handleCheckout = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            // Use today's date logic from before or just simple local ISO
            // If user wants custom date for the whole batch, we can add a date picker in bucket view
            // For now, let's assume "Today" or use the date from the last added item? 
            // Better: Allow date selection in Bucket Review.

            let finalDate = date; // Default to state date (initially today)
            const todayLocal = new Date().toLocaleDateString('en-CA');

            if (finalDate === todayLocal) {
                const now = new Date();
                const offsetMs = now.getTimezoneOffset() * 60000;
                const localDate = new Date(now.getTime() - offsetMs);
                finalDate = localDate.toISOString().slice(0, 19);
            }

            checkoutBucket(finalDate).catch(e => console.error("Background Checkout Failed", e));
            navigate('/');
        } catch (error) {
            console.error("Bucket Checkout Failed", error);
            setIsSubmitting(false);
        }
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
                paddingTop: 'calc(3.5rem + env(safe-area-inset-top))'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Add Sale</h1>
                    </div>
                    {step === 'product' && (
                        <button
                            onClick={() => navigate('/custom-sale')}
                            style={{
                                backgroundColor: '#15803d', // green-700
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Custom Sale
                        </button>
                    )}
                </div>

                {step === 'bucket' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingBag size={24} color="var(--color-primary)" />
                            Review Items ({salesBucket.length})
                        </h2>

                        {salesBucket.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                <ShoppingBag size={48} />
                                <p style={{ marginTop: '1rem' }}>Bucket is empty</p>
                                <Button onClick={() => setStep('product')} style={{ marginTop: '1rem' }} variant="secondary">
                                    Add Items
                                </Button>
                            </div>
                        ) : (
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {salesBucket.map((item, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {item.quantity} x {formatCurrency(item.sellingPrice)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                {formatCurrency(item.quantity * item.sellingPrice)}
                                            </div>
                                            <button
                                                onClick={() => removeFromBucket(idx)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', padding: '0.5rem' }}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '0.5rem', color: 'var(--color-primary)' }}>
                                        <span>Total</span>
                                        <span>{formatCurrency(salesBucket.reduce((acc, i) => acc + (i.quantity * i.sellingPrice), 0))}</span>
                                    </div>

                                    {/* Optional: Date Picker for the whole batch */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Sale Date</label>
                                        <Input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            style={{ padding: '0.75rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Button onClick={() => setStep('product')} variant="secondary" style={{ flex: 1 }}>
                                            Add More
                                        </Button>
                                        <Button onClick={handleCheckout} style={{ flex: 2 }} disabled={isSubmitting}>
                                            <Check size={20} style={{ marginRight: '0.5rem' }} />
                                            {isSubmitting ? 'Processing...' : 'Confirm All'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : step === 'product' ? (
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
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text)',
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

                        {/* Bucket FAB */}
                        {salesBucket.length > 0 && (
                            <button
                                onClick={() => setStep('bucket')}
                                style={{
                                    position: 'fixed',
                                    bottom: '2rem',
                                    right: '2rem',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '2rem',
                                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontWeight: 'bold',
                                    zIndex: 50,
                                    border: 'none'
                                }}
                            >
                                <ShoppingBag size={24} />
                                <span>{salesBucket.length} Items</span>
                                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                    {formatCurrency(salesBucket.reduce((acc, i) => acc + (i.quantity * i.sellingPrice), 0))}
                                </span>
                            </button>
                        )}
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
                        </div>
                        {/* Date moved to bucket review for bulk, or keep here for single item? 
                                Let's remove date from single item view to simplify, 
                                and strictly use "Add to Bucket" flow. 
                                Or keep it but it applies if we do single add? 
                                Let's hide date here to reduce cognitive load, defaulting to today for the item, 
                                and allow override in review. 
                            */}

                        {/* Calculation Preview */}
                        <div style={{
                            backgroundColor: 'var(--color-bg-subtle)', // Light green bg
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

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button onClick={handleAddToBucket} variant="secondary" style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                <ShoppingBag size={20} /> Add to Bucket
                            </Button>
                            <Button onClick={handleQuickSell} disabled={isSubmitting} style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#9333ea', color: 'white', border: 'none', opacity: isSubmitting ? 0.7 : 1 }}>
                                <Check size={20} /> {isSubmitting ? 'Processing...' : 'Quick Sell'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
