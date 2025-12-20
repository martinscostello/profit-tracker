import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { ArrowLeft, TrendingDown, Lightbulb, DollarSign, ShoppingBag } from 'lucide-react';

export function ExpenseAdvice() {
    const navigate = useNavigate();

    const tips = [
        {
            icon: ShoppingBag,
            title: "Optimize Inventory",
            body: "Avoid overstocking perishable items. Audit your inventory weekly to identify slow-moving goods."
        },
        {
            icon: DollarSign,
            title: "Negotiate with Suppliers",
            body: "Ask for discounts on bulk purchases or look for alternative suppliers with better rates."
        },
        {
            icon: TrendingDown,
            title: "Cut Unnecessary Costs",
            body: "Review recurring expenses like subscriptions or high utility bills. Turn off equipment when not in use."
        },
        {
            icon: Lightbulb,
            title: "Track Small Expenses",
            body: "Small daily expenses add up. Ensure every transport fare and airtime purchase is recorded."
        }
    ];

    return (
        <Layout showNav={false}>
            <div style={{
                position: 'sticky', top: 0, backgroundColor: 'var(--color-bg)', zIndex: 20,
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))', paddingBottom: '1rem',
                paddingLeft: '1.5rem', paddingRight: '1.5rem', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
                    <ArrowLeft size={24} color="var(--color-text)" />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Expense Reduction Tips</h1>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Card padding="1.5rem" className="bg-orange-50 border-orange-100">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#c2410c', marginBottom: '0.5rem' }}>
                        Your Profit Margins are Low
                    </h2>
                    <p style={{ color: '#9a3412', lineHeight: '1.5' }}>
                        We detected that your expenses are currently very high compared to your gross profit. Here are some strategies to improve your bottom line.
                    </p>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tips.map((tip, index) => (
                        <Card key={index} padding="1.25rem">
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                    backgroundColor: '#f0fdf4', color: '#16a34a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <tip.icon size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{tip.title}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                        {tip.body}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
