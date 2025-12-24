
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/format';
import { TrendingUp, Package, ShoppingBag, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../components/ui/NotificationBell';
import { BusinessSwitcher } from '../components/ui/BusinessSwitcher';
import { useState } from 'react';

export function Dashboard() {
    const navigate = useNavigate();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const { getTodayStats, business, products, sales, dashboardStats } = useData();

    // Fallback stats for guest/local mode
    const localToday = getTodayStats();

    // Today's Metrics
    const todayMetrics = dashboardStats?.today || {
        netProfit: localToday.netProfit,
        grossProfit: localToday.grossProfit,
        expenses: localToday.expenses,
        itemsSold: localToday.itemsSold
    };

    // Sales History Metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const historyMetrics = dashboardStats?.history || {
        weekSales: sales.filter(s => new Date(s.date) >= oneWeekAgo).reduce((sum, s) => sum + s.revenue, 0),
        monthSales: sales.filter(s => new Date(s.date) >= startOfMonth).reduce((sum, s) => sum + s.revenue, 0)
    };

    // Inventory Metrics
    const inventoryMetrics = dashboardStats?.inventory || {
        active: products.filter(p => p.isActive).length,
        restock: products.filter(p => (p.stockQuantity ?? 0) <= 0).length
    };

    const inactiveProducts = products.length - inventoryMetrics.active;
    const totalItemsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

    // Recent Sales (Today's Sales)
    const todaySales = sales
        .filter(s => {
            const saleDate = new Date(s.date);
            return saleDate.toDateString() === now.toDateString();
        })
        .sort((a, b) => {
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

    // Pull to Refresh State
    const [pullStart, setPullStart] = useState<number | 0>(0);
    const [pullChange, setPullChange] = useState<number | 0>(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { syncDataNow } = useData();

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.currentTarget.scrollTop === 0) {
            setPullStart(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!pullStart) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - pullStart;
        if (diff > 0 && e.currentTarget.scrollTop === 0) {
            setPullChange(diff);
            // Prevent default only if needed, but tough with passive listeners in React
        }
    };

    const handleTouchEnd = async () => {
        if (pullChange > 80) { // Threshold to trigger refresh
            setIsRefreshing(true);
            setPullChange(60); // Snap to loading position
            await syncDataNow();
            setTimeout(() => {
                setIsRefreshing(false);
                setPullChange(0);
                setPullStart(0);
            }, 500);
        } else {
            setPullChange(0);
            setPullStart(0);
        }
    };

    return (
        <Layout disablePadding>
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))',
                paddingBottom: 0,
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                {/* Fixed Upper Section */}
                <div style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h1>
                        </div>
                        <NotificationBell />
                    </div>

                    {/* Main Profit Card */}
                    <div style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        marginBottom: '1rem',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* ... (Existing Profit Card Content) ... */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    padding: '0.25rem',
                                    borderRadius: '0.5rem',
                                    display: 'flex'
                                }}>
                                    <TrendingUp size={20} />
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: 0.9 }}>Net Profit</span>
                            </div>

                            <div
                                onClick={() => setIsSwitcherOpen(true)}
                                style={{
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    opacity: 0.9,
                                    textAlign: 'right',
                                    maxWidth: '40%',
                                    lineHeight: '1.2',
                                    wordBreak: 'break-word',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '4px'
                                }}>
                                {business.name || 'My Business'}
                                <ChevronDown size={14} />
                            </div>
                        </div>

                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            {formatCurrency(todayMetrics.netProfit)}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.125rem' }}>Gross Profit</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>{formatCurrency(todayMetrics.grossProfit)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.125rem' }}>Expenses</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fca5a5' }}>
                                    {todayMetrics.expenses > 0 ? '-' : ''}{formatCurrency(todayMetrics.expenses)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content with Pull to Refresh */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        marginRight: '-1.5rem',
                        paddingRight: '1.5rem',
                        marginLeft: '-1.5rem',
                        paddingLeft: '1.5rem',
                        paddingBottom: '6rem',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative' // For refresh indicator
                    }}
                >
                    {/* Refresh Indicator */}
                    <div style={{
                        height: pullChange > 0 ? `${Math.min(pullChange, 80)}px` : '0px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: isRefreshing ? 'height 0.2s' : 'none',
                        width: '100%',
                        opacity: Math.min(pullChange / 60, 1)
                    }}>
                        <div style={{
                            width: '24px', height: '24px',
                            border: '2px solid var(--color-primary)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                    {useData().businesses.length === 0 ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem',
                            textAlign: 'center',
                            gap: '1.5rem'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '24px',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b'
                            }}>
                                <ShoppingBag size={40} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No active business</h2>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                                    You haven't joined or created any businesses yet.
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                                <button
                                    onClick={() => navigate('/join-business')}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    Join a Business
                                </button>
                                <button
                                    onClick={() => navigate('/add-business')}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: 'white',
                                        color: 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0.75rem',
                                        fontWeight: '600',
                                        fontSize: '1rem'
                                    }}
                                >
                                    Create New Business
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid: Inventory & Sales History */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* Inventory Status (Combined) */}
                                <Card padding="1rem" className="flex flex-col gap-3">
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-primary)' }}>
                                        <Package size={20} />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Inventory Status</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{todayMetrics.itemsSold}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Sold Today</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{inventoryMetrics.active}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Active</p>
                                        </div>
                                        <div style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{inactiveProducts}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Inactive</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ef4444' }}>{inventoryMetrics.restock}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Restock</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Sales History */}
                                <Card padding="1rem" className="flex flex-col gap-3">
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-primary)' }}>
                                        <ShoppingBag size={20} />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Sales History</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatCurrency(historyMetrics.weekSales)}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>This Week</p>
                                        </div>
                                        <div style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{formatCurrency(historyMetrics.monthSales)}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>This Month</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalItemsSold}</span>
                                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Total Sales</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>



                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                position: 'sticky',
                                top: 0,
                                backgroundColor: 'var(--color-bg)',
                                paddingBottom: '0.5rem',
                                paddingTop: '0.5rem',
                                zIndex: 10
                            }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>Recent Sales</h2>
                                <button
                                    onClick={() => navigate('/history')}
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'white',
                                        backgroundColor: '#16a34a',
                                        border: 'none',
                                        fontWeight: '600',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Full History
                                </button>
                            </div>

                            {todaySales.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem 1rem',
                                    backgroundColor: 'var(--color-bg)',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: '1rem'
                                }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        No sales recorded today. <br /> Tap the <strong style={{ color: 'var(--color-primary)' }}>+</strong> button to add a sale.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {todaySales.slice(0, 5).map(sale => (
                                        <Card key={sale.id} padding="1rem" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: '600' }}>{sale.productName}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {sale.quantity} x {formatCurrency(sale.revenue / sale.quantity)}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                    +{formatCurrency(sale.revenue)}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <BusinessSwitcher
                isOpen={isSwitcherOpen}
                onClose={() => setIsSwitcherOpen(false)}
                onUpgrade={() => navigate('/upgrade')}
            />
        </Layout>
    );
}
