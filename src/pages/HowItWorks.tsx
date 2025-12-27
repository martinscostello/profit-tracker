import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HowItWorks() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const guideSections = [
        {
            title: 'Getting Started',
            steps: [
                { title: 'Add Inventory', desc: 'Go to Products tab -> Add Product. Set your Cost Price to calculate profits accurately.' },
                { title: 'Record Sales', desc: 'Tap the Green (+) button. Select products or enter a Quick Sale amount.' },
                { title: 'Track Expenses', desc: 'Tap "Expenses" to log costs like Fuel, Transport, or Rent. This gives you your Net Profit.' }
            ]
        },
        {
            title: 'New Features',
            steps: [
                { title: 'Tax Insight 2026', desc: 'Estimate your VAT & Income Tax. We auto-detect exempt items (Food, Meds) so you don\'t overpay.' },
                { title: 'Smart Reminders', desc: 'Set reminders every 10, 30, or 60 mins. We\'ll send you motivational nudges to keep you on track.' },
                { title: 'Custom Tones', desc: 'Go to Notification Settings to choose your alert sound: Cash Register, Chime, or Gentle Alert.' }
            ]
        }
    ];

    const faqs = [
        { q: 'Is my data safe?', a: 'Yes! Your data is stored locally on your device. We recommend downloading backups regularly from Settings.' },
        { q: 'What is Tax Insight?', a: 'It helps you estimate taxes under the 2026 Finance Act. It is NOT a filing tool, but it helps you prepare by separating Taxable vs Exempt sales.' },
        { q: 'How do I stop notifications?', a: 'Go to Settings > Notifications to change frequency or turn them off completely during off-hours.' },
        { q: 'Can I use this offline?', a: 'Absolutely. The app works 100% offline. You only need internet for updates or backing up to cloud (Pro).' },
        { q: 'How do I edit a sale?', a: 'Go to the History tab, tap on a sale card, and enter your PIN to make changes.' },
        { q: 'What are Exempt Items?', a: 'Basic food items (Rice, Bread, Yam), Medical Supplies, and Books are exempt from VAT. We handle this logic for you.' }
    ];

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                paddingTop: 'calc(3rem + env(safe-area-inset-top))',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} color="var(--color-text)" />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>How it Works</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '3rem' }}>
                    {guideSections.map((section, sIdx) => (
                        <div key={sIdx}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>{section.title}</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {section.steps.map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '2rem', height: '2rem', borderRadius: '50%',
                                            backgroundColor: sIdx === 0 ? 'var(--color-primary)' : '#9333ea',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', flexShrink: 0
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{step.title}</h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    overflow: 'hidden'
                                }}
                            >
                                <button style={{
                                    width: '100%', padding: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'none', border: 'none', textAlign: 'left',
                                    fontWeight: '500', color: 'var(--color-text)'
                                }}>
                                    {faq.q}
                                    {openFaq === idx ? <ChevronUp size={20} color="var(--color-text-muted)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
                                </button>
                                {openFaq === idx && (
                                    <div style={{ padding: '0 1rem 1rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
