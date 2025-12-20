import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Calculator, ArrowRightCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useData } from '../context/DataContext';

export function TaxCalculator() {
    const navigate = useNavigate();
    const { business } = useData();
    const [mode, setMode] = useState<'add' | 'extract'>('add');
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('7.5');

    const [result, setResult] = useState({
        net: 0,
        tax: 0,
        gross: 0
    });

    useEffect(() => {
        const val = parseFloat(amount);
        const taxRate = parseFloat(rate);

        if (isNaN(val) || isNaN(taxRate)) {
            setResult({ net: 0, tax: 0, gross: 0 });
            return;
        }

        if (mode === 'add') {
            // Add Tax (Exclusive)
            // Net = Input
            // Tax = Net * Rate
            // Gross = Net + Tax
            const tax = val * (taxRate / 100);
            setResult({
                net: val,
                tax: tax,
                gross: val + tax
            });
        } else {
            // Extract Tax (Inclusive)
            // Gross = Input
            // Net = Gross / (1 + Rate)
            // Tax = Gross - Net
            const net = val / (1 + (taxRate / 100));
            setResult({
                net: net,
                tax: val - net,
                gross: val
            });
        }
    }, [amount, rate, mode]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'calc(1.5rem + env(safe-area-inset-top))'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        Tax Calculator
                    </h1>
                </div>

                {/* Mode Switcher */}
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '0.75rem', padding: '0.25rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setMode('add')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.5rem',
                            border: 'none', fontWeight: '600', fontSize: '0.875rem',
                            backgroundColor: mode === 'add' ? 'white' : 'transparent',
                            color: mode === 'add' ? 'var(--color-primary)' : '#64748b',
                            boxShadow: mode === 'add' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <ArrowRightCircle size={16} />
                        Add Tax
                    </button>
                    <button
                        onClick={() => setMode('extract')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.5rem',
                            border: 'none', fontWeight: '600', fontSize: '0.875rem',
                            backgroundColor: mode === 'extract' ? 'white' : 'transparent',
                            color: mode === 'extract' ? 'var(--color-primary)' : '#64748b',
                            boxShadow: mode === 'extract' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        <ArrowDownCircle size={16} />
                        Extract Tax
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                    <Card padding="1.5rem">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <Input
                                    label={mode === 'add' ? "Base Amount" : "Total Amount"}
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    style={{ fontSize: '1.25rem', padding: '1rem' }}
                                    autoFocus
                                    inputMode="decimal"
                                    enterKeyHint="next"
                                />
                            </div>
                            <div>
                                <Input
                                    label="Tax Rate %"
                                    type="number"
                                    value={rate}
                                    onChange={e => setRate(e.target.value)}
                                    style={{ fontSize: '1.25rem', padding: '1rem', textAlign: 'center' }}
                                    inputMode="decimal"
                                    enterKeyHint="done"
                                />
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem',
                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>
                            {/* Result Display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Net Amount</span>
                                <span style={{ fontWeight: '600' }}>{formatCurrency(result.net, business.currency)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Tax ({rate}%)</span>
                                <span style={{ fontWeight: '600', color: '#ef4444' }}>{formatCurrency(result.tax, business.currency)}</span>
                            </div>
                            <div style={{
                                borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.25rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ fontWeight: '600', fontSize: '1rem' }}>Total Gross</span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                                    {formatCurrency(result.gross, business.currency)}
                                </span>
                            </div>
                        </div>

                        {/* Explanation */}
                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.75rem', border: '1px solid #ffedd5' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <Calculator size={16} color="#c2410c" style={{ marginTop: '0.25rem' }} />
                                <p style={{ fontSize: '0.75rem', color: '#9a3412', lineHeight: '1.4' }}>
                                    {mode === 'add'
                                        ? `Adding ${rate}% tax to the base amount.`
                                        : `Extracting ${rate}% tax included in the total.`
                                    }
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
