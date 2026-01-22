
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';

const CATEGORIES = [
    'Food and Groceries',
    'Fashion and Apparel',
    'Electronics and Gadgets',
    'Beauty and Personal Care',
    'Home and Living',
    'Health & Wellness',
    'Building Materials',
    'Automobile',
    'Others'
];

export function AddEditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { business, products, addProduct, updateProduct, deleteProduct } = useData();
    const { showToast } = useToast();
    const { confirm } = useDialog();

    const isEdit = Boolean(id);
    const existingProduct = products.find(p => p.id === id);

    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [stockQuantity, setStockQuantity] = useState('');
    const [unit, setUnit] = useState('');

    useEffect(() => {
        // Security Check: If editing, require verified state
        if (isEdit) {
            const state = location.state as { verified?: boolean } | null;
            if (!state?.verified) {
                // If bypassed security, force go back
                navigate('/products', { replace: true });
                return;
            }
        }

        if (isEdit && existingProduct) {
            setName(existingProduct.name);
            setCost(existingProduct.costPrice.toLocaleString());
            setPrice(existingProduct.sellingPrice.toLocaleString());
            setCategory(existingProduct.category || '');
            setIsActive(existingProduct.isActive);
            setStockQuantity(existingProduct.stockQuantity?.toString() || '');

            setUnit(existingProduct.unit || '');
        }
    }, [isEdit, existingProduct, location, navigate]);

    const handlePriceChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (!raw) {
            setter('');
            return;
        }
        const val = parseInt(raw, 10);
        setter(val.toLocaleString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        if (e) e.preventDefault();

        try {
            // Strip commas for validation and storage
            const rawCost = cost.toString().replace(/,/g, '');
            const rawPrice = price.toString().replace(/,/g, '');

            if (!name.trim()) {
                showToast('Please enter a product name', 'error');
                return;
            }

            const costNum = parseFloat(rawCost);
            const priceNum = parseFloat(rawPrice);

            if (isNaN(costNum)) {
                showToast('Invalid Cost Price', 'error');
                return;
            }
            if (isNaN(priceNum)) {
                showToast('Invalid Selling Price', 'error');
                return;
            }

            const productData = {
                businessId: business.id,
                name,
                costPrice: costNum,
                sellingPrice: priceNum,
                category,
                isActive,
                unit: unit || undefined,
                stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
                totalSold: isEdit ? existingProduct?.totalSold : 0
            };

            if (isEdit && id) {
                updateProduct(id, productData);
                showToast('Product updated successfully', 'success');
            } else {
                addProduct(productData);
                showToast('Product added successfully', 'success');
            }
            navigate('/products');

        } catch (error: any) {
            showToast('Error saving: ' + error.message, 'error');
            console.error(error);
        }
    };

    const handleDelete = async () => {
        const isConfirmed = await confirm({
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });

        if (isConfirmed) {
            if (id) deleteProduct(id);
            showToast('Product deleted', 'success');
            navigate('/products');
        }
    };

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' // Safe area fix
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {isEdit ? 'Edit Product' : 'Add Product'}
                    </h1>
                </div>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                    <Input label="Product Name" placeholder="Enter product name" value={name} onChange={e => setName(e.target.value)} required enterKeyHint="next" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Cost Price"
                            inputMode="numeric"
                            placeholder="0"
                            value={cost}
                            onChange={handlePriceChange(setCost)}
                            required
                            helperText="Cost"
                            enterKeyHint="next"
                        />
                        <Input
                            label="Selling Price"
                            inputMode="numeric"
                            placeholder="0"
                            value={price}
                            onChange={handlePriceChange(setPrice)}
                            required
                            helperText="Price"
                            enterKeyHint="next"
                        />
                    </div>

                    <Input
                        label="Stock Quantity (Items in store)"
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={stockQuantity}
                        onChange={e => setStockQuantity(e.target.value)}
                        enterKeyHint="next"
                    />

                    <Input
                        label="Unit of Measure (Size/Weight)"
                        placeholder="e.g. 10kg, 1L, Paint Rubber"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        enterKeyHint="next"
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)' }}>Category (optional)</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-surface)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        >
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div>
                            <div style={{ fontWeight: '500' }}>Active Status</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Inactive products won't appear in sales</div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '3.5rem', height: '1.75rem' }}>
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: isActive ? 'var(--color-primary)' : '#ccc',
                                borderRadius: '1.75rem', transition: '.4s'
                            }}></span>
                            <span style={{
                                position: 'absolute', content: '""', height: '1.25rem', width: '1.25rem',
                                left: isActive ? '1.9rem' : '0.25rem', bottom: '0.25rem',
                                backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
                            }}></span>
                        </label>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Button
                            type="button"
                            onClick={(e) => handleSubmit(e as any)}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
                        >
                            Save Product
                        </Button>
                        {isEdit && (
                            <Button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1.125rem',
                                    backgroundColor: '#EF4444', // Red
                                    color: 'white'
                                }}
                            >
                                Delete Product
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Layout>
    );
}
