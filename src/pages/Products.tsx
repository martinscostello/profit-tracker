
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Plus, Search, Tag, Upload } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { PinModal } from '../components/ui/PinModal';

export function Products() {
    const { products, business, addProduct, updateProduct } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    // Security Logic
    const { can } = usePermissions();

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pinMode, setPinMode] = useState<'setup' | 'verify'>('verify');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleProductClick = (productId: string) => {
        // Guard: Check if user can edit products
        if (!can('canEditProducts')) return; // Or show toast "Access Denied"

        setSelectedProductId(productId);
        if (business.pin) {
            setPinMode('verify');
            setIsPinModalOpen(true);
        } else {
            // Only allow setup if user has permission to manage settings
            if (can('canManageSettings')) {
                setPinMode('setup');
                setIsPinModalOpen(true);
            } else {
                // If no PIN is set and user can't set it, allow access (Basic security)
                navigate(`/products/edit/${productId}`);
            }
        }
    };

    const handlePinSuccess = () => {
        setIsPinModalOpen(false);
        if (selectedProductId) {
            navigate(`/products/edit/${selectedProductId}`, { state: { verified: true } });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            let addedCount = 0;
            let updatedCount = 0;

            // Helper to clean keys for matching
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Helper to parsing numbers from "₦2,000" or "$ 50.00"
            const parseNum = (val: any) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;
                const str = val.toString().replace(/[^0-9.]/g, ''); // Keep only digits and dot
                return parseFloat(str) || 0;
            };

            data.forEach((row: any) => {
                // normalize header keys for this row
                const safeRow: any = {};
                Object.keys(row).forEach(k => {
                    safeRow[normalize(k)] = row[k];
                });

                // Match variations
                // product name
                const name = safeRow['productname'] || safeRow['name'] || safeRow['item'] || safeRow['product'];
                if (!name) return;

                // cost price
                const costPrice = parseNum(safeRow['costprice'] || safeRow['cost'] || safeRow['buyingprice'] || safeRow['purchaseprice']);

                // selling price
                const sellingPrice = parseNum(safeRow['sellingprice'] || safeRow['price'] || safeRow['salesprice'] || safeRow['selling']);

                // stock quantity
                const stockVal = safeRow['stockquantity'] || safeRow['quantity'] || safeRow['qty'] || safeRow['noinstock'] || safeRow['numberinstock'] || safeRow['stock'];
                const stockQuantity = parseNum(stockVal);

                // unit of measure
                const unit = safeRow['unitofmeasure'] || safeRow['unit'] || safeRow['measure'] || safeRow['uom'] || safeRow['size'] || safeRow['weight'];

                // category
                const rawCategory = safeRow['category'] || safeRow['cat'] || safeRow['group'] || safeRow['type'];

                // status
                const rawStatus = safeRow['status'] || safeRow['active'];

                const category = ['Retail', 'Food & Beverage', 'Fashion', 'Electronics', 'Beauty & Personal Care', 'Home & Garden'].includes(rawCategory)
                    ? rawCategory
                    : 'Others';

                const isActive = typeof rawStatus === 'string'
                    ? rawStatus.toLowerCase() === 'active' || rawStatus.toLowerCase() === 'true' || rawStatus.toLowerCase() === 'yes'
                    : Boolean(rawStatus);

                const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());

                if (existingProduct) {
                    updateProduct(existingProduct.id, {
                        costPrice,
                        sellingPrice,
                        stockQuantity, // Overwrite stock, or should we add? Usually overwrite in imports.
                        category,
                        isActive,
                        unit
                    });
                    updatedCount++;
                } else {
                    addProduct({
                        businessId: business.id,
                        name,
                        costPrice,
                        sellingPrice,
                        stockQuantity,
                        category,
                        isActive,
                        unit,
                        totalSold: 0
                    });
                    addedCount++;
                }
            });

            if (addedCount > 0 || updatedCount > 0) {
                showToast(`Import Complete: ${addedCount} Added, ${updatedCount} Updated`, 'success');
            } else {
                showToast('No valid products found in sheet. Please check headers.', 'error');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Layout disablePadding>
            <div style={{
                padding: 0,
                height: '100vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                paddingTop: 'calc(env(safe-area-inset-top))'
            }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls, .csv, .ods"
                    style={{ display: 'none' }}
                />

                {/* Fixed Header */}
                <div style={{
                    padding: '1.5rem',
                    paddingBottom: '1rem',
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Products</h1>
                        {can('canAddProducts') && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={handleImportClick}
                                    style={{
                                        backgroundColor: 'white',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    <Upload size={16} /> Import
                                </button>
                                <button
                                    onClick={() => navigate('/products/add')}
                                    style={{
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 1.5rem 6rem 1.5rem',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Search - placed inside scrollable area or fixed? User said "Title, import and add buttons" stationary. 
                        Usually search allows scrolling away. I will keep it in scrollable area for now. */}
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={20} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Product List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredProducts.length === 0 ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4rem 2rem',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)'
                            }}>
                                <div style={{
                                    width: '4rem', height: '4rem',
                                    borderRadius: '50%', backgroundColor: 'var(--color-surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <Tag size={32} style={{ opacity: 0.5 }} />
                                </div>
                                <p style={{ marginBottom: '1rem' }}>No products yet. Add your first product.</p>
                                <button
                                    onClick={() => navigate('/products/add')}
                                    style={{
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: '600',
                                        border: 'none'
                                    }}
                                >
                                    Add Product
                                </button>
                            </div>
                        ) : (
                            filteredProducts.map(product => (
                                <Card
                                    key={product.id}
                                    padding="1rem"
                                    className="flex flex-col relative"
                                    onClick={() => handleProductClick(product.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                        <div>
                                            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{product.name}</h3>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {formatCurrency(product.sellingPrice)}
                                                {product.unit && <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>/ {product.unit}</span>}
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div style={{ paddingLeft: '0.5rem' }}>
                                            <div style={{
                                                width: '0.75rem',
                                                height: '0.75rem',
                                                borderRadius: '50%',
                                                backgroundColor: product.stockQuantity === 0 ? '#ef4444' : (product.isActive ? '#22c55e' : '#94a3b8'),
                                                animation: product.stockQuantity === 0 ? 'breatheRed 2s infinite ease-in-out' : (product.isActive ? 'breathe 2s infinite ease-in-out' : 'none'),
                                                boxShadow: product.stockQuantity === 0 ? '0 0 8px rgba(239, 68, 68, 0.4)' : (product.isActive ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none')
                                            }} />
                                        </div>
                                    </div>

                                    {/* Inventory Stats */}
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
                                        <span style={{ color: product.stockQuantity && product.stockQuantity < 5 ? 'red' : 'inherit' }}>
                                            Available: <strong>{product.stockQuantity ?? 0}</strong>
                                        </span>
                                        <span>
                                            Sold: <strong>{product.totalSold ?? 0}</strong>
                                        </span>
                                    </div>
                                    {!product.isActive && (
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>Currently Inactive</div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <PinModal
                    isOpen={isPinModalOpen}
                    onClose={() => setIsPinModalOpen(false)}
                    mode={pinMode}
                    onSuccess={handlePinSuccess}
                />
            </div >
        </Layout >
    );
}
