import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Mail, Send, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export function ContactPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Contact Form Submitted:', formData);
            setLoading(false);
            showToast('Message sent! We will get back to you shortly.', 'success');
            navigate(-1);
        }, 1500);
    };

    return (
        <Layout showNav={false}>
            <div style={{
                paddingTop: 'calc(3rem + env(safe-area-inset-top))',
                paddingBottom: '2rem',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} color="var(--color-text)" />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Contact Support</h1>
                </div>

                <div style={{ padding: '0 1.5rem', flex: 1 }}>
                    <div style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p>Have questions or need help?</p>
                        <p>Fill out the form below and we'll respond within 24 hours.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Card className="mb-6">
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Your Name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Subject</label>
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'
                                    }}
                                >
                                    <option value="">Select a topic</option>
                                    <option value="General">General Inquiry</option>
                                    <option value="Billing">Billing / Subscription</option>
                                    <option value="Bug">Report a Bug</option>
                                    <option value="Feature">Feature Request</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="How can we help you?"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-bg)', color: 'var(--color-text)',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        Send Message <Send size={18} />
                                    </>
                                )}
                            </Button>
                        </Card>
                    </form>

                    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <a href="mailto:support@dailyprofit.app" style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', backgroundColor: 'white', borderRadius: '1rem',
                            border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text)'
                        }}>
                            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Email Support</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>support@dailyprofit.app</div>
                            </div>
                        </a>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem', backgroundColor: 'white', borderRadius: '1rem',
                            border: '1px solid var(--color-border)', color: 'var(--color-text)'
                        }}>
                            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                                <Phone size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Call Us</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>+234 800 PROFIT</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
