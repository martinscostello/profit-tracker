
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { formatCurrency, formatDate } from '../utils/format';
import { Filter, Calendar, Edit2, Lock, FileText, ChevronDown } from 'lucide-react';
import { PinModal } from '../components/ui/PinModal';
import { EditSaleModal } from '../components/ui/EditSaleModal';
import { ReportsModal } from '../components/ui/ReportsModal';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { DateRangeModal } from '../components/ui/DateRangeModal';
import type { Sale } from '../types';

import { usePermissions } from '../hooks/usePermissions';

export function SalesHistory() {
    const { sales, business } = useData();
    const { can } = usePermissions();
    const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

    // Edit Logic
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pinMode] = useState<'setup' | 'verify'>('verify');

    // Modal States
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

    // ...

    // Filter Logic
    const filteredSales = useMemo(() => {
        const now = new Date();
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            if (filter === 'today') {
                const saleDateObj = new Date(sale.date);
                const now = new Date();
                return saleDateObj.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                return saleDate >= weekAgo;
            } else if (filter === 'month') {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            } else if (filter === 'custom' && dateRange.start && dateRange.end) {
                const start = new Date(dateRange.start);
                const end = new Date(dateRange.end);
                return saleDate >= start && saleDate <= end;
            }
            return true;
        }).sort((a, b) => {
            // 1. Sort by Date (Desc)
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;

            // 2. Sort by CreatedAt (Desc) if available
            const createdDiff = (b.createdAt || 0) - (a.createdAt || 0);
            if (createdDiff !== 0) return createdDiff;

            // 3. Stable Fallback by ID
            return b.id.localeCompare(a.id);
        });
    }, [sales, filter, dateRange]);

    // ... (Stats Logic unchanged)

    // ... (Access Check unchanged)

    const handleDateRangeClick = () => setIsDateRangeOpen(true);
    const handleFilterChange = (f: 'today' | 'week' | 'month') => setFilter(f);
    const handleEditClick = (sale: Sale) => {
        setSelectedSale(sale);
        if (business.pin) {
            setIsPinModalOpen(true);
        } else {
            setIsEditModalOpen(true);
        }
    };
    const handlePinSuccess = () => {
        setIsPinModalOpen(false);
        setIsEditModalOpen(true);
    };
    const handleDateRangeApply = (start: string, end: string) => {
        setDateRange({ start, end });
        setFilter('custom');
        setIsDateRangeOpen(false);
    };

    // Calculate stats based on filtered sales
    const stats = useMemo(() => {
        return filteredSales.reduce((acc, sale) => ({
            profit: acc.profit + sale.profit,
            revenue: acc.revenue + sale.revenue,
            cost: acc.cost + sale.cost
        }), { profit: 0, revenue: 0, cost: 0 });
    }, [filteredSales]);

    return (
        <Layout disablePadding>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden'
            }}>
                {/* Fixed Header Section */}
                <div style={{
                    paddingTop: 'calc(1.5rem + env(safe-area-inset-top))',
                    padding: '1.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 10,
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>History</h1>
                        <button
                            onClick={handleDateRangeClick}
                            style={{
                                padding: '0.5rem 0.75rem',
                                backgroundColor: filter === 'custom' ? '#f3e8ff' : 'white',
                                border: `1px solid ${filter === 'custom' ? '#9333ea' : 'var(--color-border)'}`,
                                borderRadius: '0.5rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.875rem', fontWeight: '500',
                                color: filter === 'custom' ? '#9333ea' : 'var(--color-text)'
                            }}
                        >
                            {filter === 'custom' ? `${dateRange.start.slice(5)} - ${dateRange.end.slice(5)}` : 'Date'}
                            {!business.isPro && <Lock size={12} color="#EAB308" />}
                            <ChevronDown size={14} />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.25rem', backgroundColor: 'var(--color-surface)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                        {(['today', 'week', 'month'] as const).map(f => {
                            const isLocked = !business.isPro && f === 'month';
                            return (
                                <button
                                    key={f}
                                    onClick={() => handleFilterChange(f)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        backgroundColor: filter === f ? 'var(--color-primary)' : 'transparent',
                                        color: filter === f ? 'white' : 'var(--color-text-muted)',
                                        border: 'none',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                                    }}
                                >
                                    {isLocked && <Lock size={12} color="#EAB308" />}
                                    {f}
                                </button>
                            );
                        })}
                    </div>

                    {/* Summary Card */}
                    <div style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                                <Calendar size={16} />
                                <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{filter} Stats</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (!business.isPro) {
                                        setIsUpgradeOpen(true);
                                    } else {
                                        setIsReportsOpen(true);
                                    }
                                }}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    borderRadius: '1rem',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                {!business.isPro && <Lock size={12} color="#EAB308" />}
                                <FileText size={12} />
                                Reports
                            </button>
                        </div>

                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {formatCurrency(stats.profit)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Sales</div>
                                <div style={{ fontWeight: '600' }}>{formatCurrency(stats.revenue)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Cost</div>
                                <div style={{ fontWeight: '600' }}>{formatCurrency(stats.cost)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable List Section */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    paddingTop: '1rem',
                    paddingBottom: '6rem' // Space for BottomNav
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 'bold' }}>History ({filteredSales.length})</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredSales.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                <Filter size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                <p>No sales found for this period.</p>
                            </div>
                        ) : (
                            filteredSales.map(sale => (
                                <Card key={sale.id} padding="1rem" className="flex justify-between items-center" style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{sale.productName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                {formatDate(sale.date)} • Qty: {sale.quantity}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ color: 'var(--color-primary)', fontWeight: '600' }}>+{formatCurrency(sale.profit)}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatCurrency(sale.revenue)}</div>
                                            </div>
                                            {can('canEditSales') && (
                                                <button
                                                    onClick={() => handleEditClick(sale)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        background: 'var(--color-bg)',
                                                        borderRadius: '50%',
                                                        border: 'none',
                                                        color: 'var(--color-text-muted)'
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>      <PinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                mode={pinMode}
                onSuccess={handlePinSuccess}
            />

            <EditSaleModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                sale={selectedSale}
            />

            <ReportsModal
                isOpen={isReportsOpen}
                onClose={() => setIsReportsOpen(false)}
                onUpgrade={() => setIsUpgradeOpen(true)}
            />

            <DateRangeModal
                isOpen={isDateRangeOpen}
                onClose={() => setIsDateRangeOpen(false)}
                onApply={handleDateRangeApply}
            />

            <UpgradeModal
                isOpen={isUpgradeOpen}
                onClose={() => setIsUpgradeOpen(false)}
            />
        </Layout>
    );
}
