import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Check, X, Calculator, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useDialog } from '../../context/DialogContext';
import type { Sale } from '../../types';
import { formatCurrency } from '../../utils/format';

interface EditSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
}

export function EditSaleModal({ isOpen, onClose, sale }: EditSaleModalProps) {
    const { updateSale, deleteSale, products } = useData();
    const { showToast } = useToast();
    const { confirm } = useDialog();
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState(''); // Unit price

    useEffect(() => {
        if (isOpen && sale) {
            setQuantity(sale.quantity.toString());
            // Calculate unit price from revenue
            const unitPrice = sale.revenue / sale.quantity;
            setPrice(unitPrice.toString());
        }
    }, [isOpen, sale]);

    if (!isOpen || !sale) return null;

    const product = products.find(p => p.id === sale.productId);
    const costPrice = product ? product.costPrice : sale.cost / sale.quantity; // Fallback to historical cost if product deleted

    const qtyNum = parseFloat(quantity) || 0;
    const priceNum = parseFloat(price) || 0;

    // Recalculate
    const newRevenue = qtyNum * priceNum;
    const newCost = qtyNum * costPrice;
    const newProfit = newRevenue - newCost;

    const handleSave = () => {
        if (qtyNum <= 0) {
            showToast("Quantity must be greater than 0", 'error');
            return;
        }

        updateSale(sale.id, {
            quantity: qtyNum,
            revenue: newRevenue,
            cost: newCost,
            profit: newProfit
        });
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '24rem', padding: '1.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit Sale</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Product</p>
                    <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{sale.productName}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            enterKeyHint="next"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Unit Price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
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

                {/* Summary */}
                <div style={{
                    backgroundColor: 'var(--color-bg)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                        <Calculator size={16} />
                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>New Totals</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        <span>Revenue</span>
                        <span>{formatCurrency(newRevenue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        <span>Profit</span>
                        <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(newProfit)}</span>
                    </div>
                </div>

                <Button onClick={handleSave} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Check size={20} /> Save Changes
                </Button>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>Danger Zone</h4>
                    <Button
                        onClick={async () => {
                            if (await confirm({
                                title: 'Delete Sale',
                                message: 'Are you sure you want to delete this sale? This action cannot be undone and stock will not be automatically restored.',
                                type: 'danger',
                                confirmText: 'Delete Sale'
                            } as any)) {
                                deleteSale(sale.id);
                                onClose();
                                showToast('Sale deleted', 'success');
                            }
                        }}
                        style={{
                            width: '100%',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            border: '1px solid #fee2e2',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={20} /> Delete Sale
                    </Button>
                </div>
            </Card>
        </div>
    );
}
