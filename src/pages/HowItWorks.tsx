import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HowItWorks() {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const steps = [
        { title: 'Add Your Products', desc: 'Go to the Products tab and add your inventory. Set Cost Price and Selling Price to track margins.' },
        { title: 'Record Sales', desc: 'Use the big Green + button to record sales quickly. You can adjust the selling price during negotiation.' },
        { title: 'Track Profits', desc: 'The Dashboard shows your daily profit instantly. Use History to see weekly and monthly trends.' },
        { title: 'Secure Your Data', desc: 'Set a Transaction PIN in Settings to prevent unauthorized editing or deleting of sales.' }
    ];

    const faqs = [
        { q: 'Is my data safe?', a: 'Yes! Your data is stored locally on your device. We recommend downloading backups regularly from Settings.' },
        { q: 'Can I use this offline?', a: 'Absolutely. The app works 100% offline. You only need internet for updates or backing up to cloud (Pro).' },
        { q: 'How do I edit a sale?', a: 'Go to the History tab, tap on a sale card, and enter your PIN to make changes.' },
        { q: 'Can I change my currency?', a: 'Yes, go to Settings > Currency to switch between Naira, Dollar, and others.' },
        { q: 'What happens if I delete a product?', a: 'Deleting a product will not remove past sales records, but it will remove it from your inventory list.' }
    ];

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>How it Works</h1>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Quick Guide</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {steps.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    flexShrink: 0
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
                                    width: '100%',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontWeight: '500',
                                    color: 'var(--color-text)'
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
