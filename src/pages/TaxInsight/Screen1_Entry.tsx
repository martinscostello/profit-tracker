import { CheckCircle2, Calculator, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface Props {
    onNext: () => void;
}

export function Screen1_Entry({ onNext }: Props) {
    return (
        <div style={{ padding: '1.5rem', paddingTop: '1rem', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', minHeight: '100vh', boxSizing: 'border-box' }}>
            {/* Header / Icon */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
                <div style={{
                    width: '5rem', height: '5rem',
                    backgroundColor: '#eff6ff', // blue-50
                    color: '#2563eb', // blue-600
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto',
                }}>
                    <Calculator size={40} />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text)', marginBottom: '0.75rem', lineHeight: '1.2' }}>
                    Understand Your Tax<br />Obligations
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto' }}>
                    We'll help you estimate your tax based on Nigeria's tax laws. Simple. Clear. No confusion.
                </p>
            </div>

            {/* Checklist Card */}
            <Card padding="1.5rem" style={{ marginBottom: '2rem', flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>What We Calculate</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Item 1 */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#dcfce7', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a'
                        }}>
                            <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>VAT (Value Added Tax)</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>7.5% on taxable sales only</div>
                        </div>
                    </div>

                    {/* Item 2 */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#dcfce7', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a'
                        }}>
                            <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Income Tax</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Based on your net profit</div>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#dcfce7', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a'
                        }}>
                            <CheckCircle2 size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Tax-Exempt Items</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Food staples & medicines excluded</div>
                        </div>
                    </div>

                </div>
            </Card>

            {/* Disclaimer Alert */}
            <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #dbeafe',
                borderRadius: '1rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex', gap: '0.75rem',
                alignItems: 'flex-start'
            }}>
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: '1.4' }}>
                    This is an estimate to guide you. For official tax filing, please consult a tax professional or FIRS.
                </p>
            </div>

            {/* Action Button */}
            <button
                onClick={onNext}
                style={{
                    width: '100%',
                    padding: '1.125rem',
                    backgroundColor: '#2563eb', // Using Blue to match inspiration, or keep Green? Toggling to Blue for this feature might denote "Official/Financial"
                    color: 'white',
                    borderRadius: '0.875rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                }}
            >
                View My Tax Summary
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                Tax estimates are for guidance only
            </p>
        </div>
    );
}
