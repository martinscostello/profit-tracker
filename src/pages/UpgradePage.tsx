import { useState, useEffect } from 'react';
import { subscriptionService } from '../services/SubscriptionService';
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

    const [offerings, setOfferings] = useState<any[]>([]);

    useEffect(() => {
        const loadOfferings = async () => {
            try {
                // Initialize service if not done (can be done in App.tsx too, but safe here)
                // await subscriptionService.initialize(business.id); // Ideally done earlier with user ID

                const currentOfferings = await subscriptionService.getOfferings();
                if (currentOfferings && currentOfferings.current) {
                    // Map RevenueCat Packages to our UI format
                    // Expecting Offering 'default' with packages: 'lite_monthly', 'entrepreneur_monthly'
                    // Or packages named by tier. 
                    const availablePackages = currentOfferings.current.availablePackages;
                    setOfferings(availablePackages);
                }
            } catch (e) {
                console.error("Failed to load offerings", e);
            }
        };
        loadOfferings();
    }, []);

    const handlePurchase = async (pkg: any) => {
        setLoading(true);
        try {
            const { isPro } = await subscriptionService.purchasePackage(pkg);
            if (isPro) {
                // Update local business state to reflect Pro immediately
                // (Though SubscriptionService might need to tell DataContext to fetch latest status)
                // Or we blindly trust:

                // Determine plan from package identifier or metadata if possible
                // Determine plan from package identifier or metadata if possible
                const pkgId = pkg.identifier.toLowerCase();
                let newPlan: 'LITE' | 'ENTREPRENEUR' | 'UNLIMITED' = 'LITE';
                if (pkgId.includes('entrepreneur')) newPlan = 'ENTREPRENEUR';
                if (pkgId.includes('unlimited')) newPlan = 'UNLIMITED';

                await updateBusiness({ isPro: true, plan: newPlan });
                setSuccess(true);
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                alert("Purchase failed: " + e.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const { isPro, message } = await subscriptionService.restorePurchases();
            alert(message);
            if (isPro) {
                // We need to know WHICH plan, but checkSubscriptionStatus would tell us.
                // Re-fetch status:
                const status = await subscriptionService.checkSubscriptionStatus();
                if (status.activePlan) {
                    await updateBusiness({ isPro: true, plan: status.activePlan });
                    setSuccess(true);
                }
            }
        } catch (e) {
            alert("Restore failed");
        } finally {
            setLoading(false);
        }
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

                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '1rem' }}>
                        You're now using DailyProfit Pro 🎉
                    </h1>

                    <div style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto 2rem auto', color: 'var(--color-text-muted)' }}>
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

                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Thank you for upgrading.</p>

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
                paddingTop: 'calc(var(--header-top-spacing) + env(safe-area-inset-top))', paddingBottom: '1rem',
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
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>Free vs Pro Comparison</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>Feature</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--color-text-muted)' }}>Free</th>
                                <th style={{ textAlign: 'center', padding: '0.75rem', color: '#9333ea', fontWeight: 'bold' }}>Pro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: idx === comparison.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text)' }}>{row.feature}</td>
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
                    <p style={{ color: 'var(--color-text-muted)' }}>Current Plan: <strong>{business.plan || 'FREE'}</strong></p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

                    {/* Native Offerings from RevenueCat */}
                    {offerings.length > 0 ? (
                        offerings.map((pkg: any) => {
                            const product = pkg.product; // Native product details
                            const priceString = product.priceString;
                            const title = product.title; // e.g. "Pro Lite (Profit Tracker)"

                            // Map package identifier back to our styling config
                            // Assuming package identifiers: 'lite_monthly', 'entrepreneur_monthly'
                            const pkgId = pkg.identifier.toLowerCase();
                            let styleConfig = { name: title, color: 'var(--color-text)', bg: 'var(--color-surface)', border: 'var(--color-border)', features: [] as string[], popular: false, planId: 'LITE' };

                            if (pkgId.includes('entrepreneur')) {
                                styleConfig = {
                                    name: 'Entrepreneur',
                                    color: '#9333ea',
                                    bg: 'var(--color-bg-subtle)',
                                    border: '#9333ea',
                                    popular: true,
                                    planId: 'ENTREPRENEUR',
                                    features: ['5 Businesses', '3 Managers per Business', 'Priority Support', 'All Lite Features']
                                };
                            } else {
                                // Default Lite
                                styleConfig = {
                                    name: 'Pro Lite',
                                    color: 'var(--color-text)',
                                    bg: 'var(--color-surface)',
                                    border: 'var(--color-border)',
                                    popular: false,
                                    planId: 'LITE',
                                    features: ['All Free Features', 'Automatic Tax Estimates', 'Avoid Tax Surprises', '+3 Businesses', 'Full History']
                                };
                            }

                            const isActive = business.isPro && business.plan === styleConfig.planId;

                            return (
                                <div
                                    key={pkg.identifier}
                                    style={{
                                        border: `2px solid ${isActive ? '#16a34a' : styleConfig.border}`,
                                        borderRadius: '1rem', padding: '1.5rem',
                                        backgroundColor: styleConfig.bg, position: 'relative',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {styleConfig.popular && !isActive && (
                                        <div style={{
                                            position: 'absolute', top: -12, right: 20,
                                            backgroundColor: '#9333ea', color: 'white', fontWeight: 'bold',
                                            fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem'
                                        }}>
                                            POPULAR
                                        </div>
                                    )}

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: styleConfig.color }}>{styleConfig.name}</h3>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text)', marginBottom: '1rem' }}>
                                        {priceString} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/mo</span>
                                    </div>

                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {styleConfig.features.map((f: string, i: number) => (
                                            <li key={i} style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#16a34a" /> {f}</li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handlePurchase(pkg)}
                                        disabled={loading || isActive}
                                        style={{
                                            width: '100%',
                                            backgroundColor: styleConfig.color === '#9333ea' ? '#9333ea' : '#0f172a',
                                            padding: '1.25rem',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {loading ? 'Processing...' : isActive ? 'Current Plan' : `Subscribe ${priceString}`}
                                    </Button>

                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                        Recurring billing. Cancel anytime.
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // FALLBACK / MOCK for when Native Offerings are not yet configured or on Web
                        ([
                            { id: 'LITE', name: 'Pro Lite', price: '₦1,900', color: 'var(--color-text)', bg: 'var(--color-surface)', border: 'var(--color-border)', features: ['All Free Features', 'Automatic Tax Estimates', 'Avoid Tax Surprises', '+3 Businesses', '+1 Manager per Business', 'Full History', 'Export Reports'] },
                            { id: 'ENTREPRENEUR', name: 'Entrepreneur', price: '₦3,900', color: '#9333ea', bg: 'var(--color-bg-subtle)', border: '#9333ea', popular: true, features: ['5 Businesses', '3 Managers per Business', 'Priority Support', 'All Lite Features', 'All Tax Features'] },
                            { id: 'UNLIMITED', name: 'Unlimited', price: '₦7,900', color: 'var(--color-text)', bg: 'var(--color-surface)', border: 'var(--color-border)', features: ['Unlimited Businesses', 'Unlimited Managers', 'Dedicated Agent', 'All Entrepreneur Features'] }
                        ] as any[]).map((plan) => (
                            <div
                                key={plan.id}
                                style={{
                                    border: `2px solid ${plan.border}`,
                                    borderRadius: '1rem', padding: '1.5rem',
                                    backgroundColor: plan.bg, position: 'relative'
                                }}
                            >
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: plan.color }}>{plan.name}</h3>
                                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text)', marginBottom: '1rem' }}>
                                    {plan.price} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/mo</span>
                                </div>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {plan.features.map((f: string, i: number) => (
                                        <li key={i} style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#16a34a" /> {f}</li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={() => alert("Subscription products are still loading from the App Store. Please ensure you have a stable internet connection and try restarting the app. If you are a tester, ensure the config is propagated.")}
                                    style={{
                                        width: '100%',
                                        backgroundColor: plan.color === '#9333ea' ? '#9333ea' : '#0f172a',
                                        padding: '1.25rem',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Subscribe {plan.price}
                                </Button>
                            </div>
                        ))
                    )}

                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                        <Loader2 className="animate-spin mx-auto" color="#9333ea" />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>Processing...</p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <button onClick={handleRestore} style={{ textDecoration: 'underline', color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: '0.5rem' }}>
                            Restore Purchases
                        </button>
                        <br />
                        No ads • Cancel anytime • Secure payments
                    </div>
                )}
            </div>
        </Layout>
    );
}
