import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useData } from '../context/DataContext';
import { Confetti } from '../components/ui/Confetti';

export function UpgradePage() {
    const navigate = useNavigate();
    const { business, updateBusiness } = useData();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = (plan: 'LITE' | 'ENTREPRENEUR' | 'UNLIMITED') => {
        setLoading(true);
        // Simulate payment
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            updateBusiness({ isPro: true, plan: plan });
        }, 2000);
    };

    if (success) {
        return (
            <Layout showNav={false}>
                <Confetti />
                <div style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                        border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}>
                        <Check size={40} color="#16a34a" strokeWidth={4} />
                    </div>

                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                        You're now using DailyProfit Pro 🎉
                    </h1>

                    <div style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto 2rem auto', color: '#475569' }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>You can now:</p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="#16a34a" /> View full profit history
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="#16a34a" /> Export reports
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={16} color="#16a34a" /> Track multiple businesses
                            </li>
                        </ul>
                    </div>

                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Thank you for upgrading.</p>

                    <Button onClick={() => navigate('/')} style={{ width: '100%', maxWidth: '300px', padding: '1rem' }}>
                        Go to Dashboard
                    </Button>
                </div>
            </Layout>
        );
    }

    const comparison = [
        { feature: 'Daily profit', free: true, pro: true },
        { feature: '7-day history', free: true, pro: true },
        { feature: 'Full history', free: false, pro: true },
        { feature: 'Monthly summary', free: false, pro: true },
        { feature: 'Export reports', free: false, pro: true },
        { feature: 'Multiple businesses', free: false, pro: true },
        { feature: 'Cloud backup', free: false, pro: true },
        { feature: 'Ads', free: true, pro: false }, // Ads: Free has check (active), Pro has X (no ads)? Or reverse logic?
        // User table: "ads" -> Free: Check, Pro: X. "No ads" is usually a feature. 
        // Table implies "Has Ads". Free=Yes, Pro=No.
    ];

    return (
        <Layout showNav={false}>
            <div style={{
                position: 'sticky', top: 0, backgroundColor: 'var(--color-bg)', zIndex: 20,
                paddingTop: 'calc(3rem + env(safe-area-inset-top))', paddingBottom: '1rem',
                paddingLeft: '1.5rem', paddingRight: '1.5rem', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
                    <ArrowLeft size={24} color="var(--color-text)" />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '2rem', height: '2rem', borderRadius: '50%', background: 'linear-gradient(135deg, #FDB931 0%, #FFD700 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '0.75rem'
                    }}>
                        VIP
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Upgrade to Pro</h1>
                </div>
            </div>

            <div style={{ padding: '1.5rem', paddingBottom: '3rem' }}>
                <Card padding="0" className="mb-6 overflow-hidden">
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>Free vs Pro Comparison</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b' }}>Feature</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', color: '#64748b' }}>Free</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', color: '#9333ea', fontWeight: 'bold' }}>Pro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === comparison.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{row.feature}</td>
                                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                        {row.free ? <Check size={16} color="#16a34a" /> : <X size={16} color="#ef4444" />}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                                        {row.pro ? <Check size={16} color="#16a34a" /> : <X size={16} color="#ef4444" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Manage Subscription</h2>
                    <p style={{ color: '#64748b' }}>Current Plan: <strong>{business.plan || 'FREE'}</strong></p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

                    {[
                        { id: 'LITE', name: 'Pro Lite', price: 2000, color: '#1e293b', bg: 'white', border: '#e2e8f0', features: ['All Free Features', 'Automatic Tax Estimates', 'Avoid Tax Surprises', '+3 Businesses', '+1 Manager per Business', 'Full History', 'Export Reports'] },
                        { id: 'ENTREPRENEUR', name: 'Entrepreneur', price: 5000, color: '#9333ea', bg: '#faf5ff', border: '#9333ea', popular: true, features: ['5 Businesses', '3 Managers per Business', 'Priority Support', 'All Lite Features', 'All Tax Features'] },
                        { id: 'UNLIMITED', name: 'Unlimited', price: 25000, color: '#1e293b', bg: 'white', border: '#e2e8f0', features: ['Unlimited Businesses', 'Unlimited Managers', 'Dedicated Agent', 'All Entrepreneur Features'] }
                    ].map((plan) => {
                        const isActive = business.isPro && business.plan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    border: `2px solid ${isActive ? '#16a34a' : plan.border}`,
                                    borderRadius: '1rem', padding: '1.5rem',
                                    backgroundColor: plan.bg, position: 'relative',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', top: -12, right: 20,
                                        backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold',
                                        fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem'
                                    }}>
                                        ACTIVE PLAN
                                    </div>
                                )}
                                {plan.popular && !isActive && (
                                    <div style={{
                                        position: 'absolute', top: -12, right: 20,
                                        backgroundColor: '#9333ea', color: 'white', fontWeight: 'bold',
                                        fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem'
                                    }}>
                                        POPULAR
                                    </div>
                                )}

                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: plan.color }}>{plan.name}</h3>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '1rem' }}>
                                    {business.currency}{plan.price.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#64748b' }}>/mo</span>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#334155' }}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#16a34a" /> {f}</li>
                                    ))}
                                </ul>

                                {isActive ? (
                                    <Button
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to cancel your subscription? You will lose Pro features.")) {
                                                updateBusiness({ isPro: false, plan: 'FREE' });
                                                navigate('/');
                                            }
                                        }}
                                        style={{ width: '100%', backgroundColor: '#ef4444', border: 'none' }}
                                    >
                                        Cancel Subscription
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handlePayment(plan.id as any)}
                                        style={{ width: '100%', backgroundColor: plan.color === '#9333ea' ? '#9333ea' : '#0f172a' }}
                                    >
                                        {loading ? 'Processing...' : `Switch to ${plan.name}`}
                                    </Button>
                                )}
                            </div>
                        );
                    })}

                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <Loader2 className="animate-spin mx-auto" color="#9333ea" />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>Processing...</p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                        No ads • Cancel anytime • Secure payments
                    </div>
                )}
            </div>
        </Layout>
    );
}
