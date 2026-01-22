import { CheckCircle2, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { calculateTax } from '../../utils/taxLogic';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/format';
import { useState, useEffect } from 'react';


export function Screen3_Summary() {
    const { sales, expenses, business } = useData();

    // Calculate Annual Turnover (YTD)
    const currentYear = new Date().getFullYear();
    const annualTurnover = sales
        .filter(s => new Date(s.date).getFullYear() === currentYear)
        .reduce((sum, s) => sum + s.revenue, 0);

    // Use All Data for Maximum Detail as requested
    // Pass annualTurnover for threshold logic
    const result = calculateTax(sales, expenses, business.taxSettings, annualTurnover);

    const [period, setPeriod] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [showDetails, setShowDetails] = useState(false);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [showDetails]);

    if (showDetails) {
        return (
            <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
                <button
                    onClick={() => setShowDetails(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: '600', color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={20} />
                    Back to Summary
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Detailed Breakdown</h2>

                {/* Taxable Items */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#16a34a', borderRadius: '50%' }} />
                        Taxable Items
                    </h3>
                    <Card padding="0">
                        {result.taxableItems.length > 0 ? result.taxableItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.reason}</div>
                                </div>
                                <div style={{ fontWeight: '600' }}>{formatCurrency(item.amount)}</div>
                            </div>
                        )) : (
                            <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No taxable items found</div>
                        )}
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Total Taxable</span>
                            <span>{formatCurrency(result.taxableSales)}</span>
                        </div>
                    </Card>
                </div>

                {/* Exempt Items */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#f97316', borderRadius: '50%' }} />
                        Tax-Exempt Items
                    </h3>
                    <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '0.75rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '0.5rem' }}>
                        Running a grocery or pharmacy? Items like food and medicine are exempt from VAT under Nigerian law.
                    </div>
                    <Card padding="0">
                        {result.exemptItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.reason}</div>
                                </div>
                                <div style={{ fontWeight: '600' }}>{formatCurrency(item.amount)}</div>
                            </div>
                        ))}
                        {result.exemptItems.length === 0 && (
                            <div style={{ padding: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No exempt items found</div>
                        )}
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Total Exempt</span>
                            <span>{formatCurrency(result.exemptSales)}</span>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>

            {/* Toggle (Visual only since data is All Time, but good for future) */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setPeriod('MONTH')}
                    style={{
                        flex: 1, padding: '0.6rem', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '600',
                        backgroundColor: period === 'MONTH' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                        color: period === 'MONTH' ? 'white' : 'var(--color-text-muted)'
                    }}
                >
                    All Time
                </button>
            </div>

            {/* Turnover Status Badge */}
            <div style={{ marginBottom: '1.5rem' }}>
                {result.turnoverStatus === 'MICRO' && (
                    <div style={{ padding: '1rem', backgroundColor: '#ecfccb', color: '#365314', borderRadius: '1rem', border: '1px solid #d9f99d' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={18} /> Small Company Status
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                            Your estimated annual turnover is below ₦25M.
                            <strong> VAT & CIT are likely ₦0.</strong>
                        </div>
                    </div>
                )}
                {result.turnoverStatus === 'SMALL' && (
                    <div style={{ padding: '1rem', backgroundColor: '#fff7ed', color: '#9a3412', borderRadius: '1rem', border: '1px solid #ffedd5' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚠️ VAT-Active Business
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                            Turnover exceeds ₦25M. VAT filing is required, but CIT is still 0% (below ₦50M).
                        </div>
                    </div>
                )}
                {result.turnoverStatus === 'MEDIUM' && (
                    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '1rem', border: '1px solid #fecaca' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚠️ Standard Tax Regime
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                            Turnover exceeds ₦50M. Both VAT and CIT likely apply.
                        </div>
                    </div>
                )}
            </div>

            {/* Blue Estimate Card: PAYABLE NOW (VAT) */}
            <div style={{
                backgroundColor: result.vatAmount > 0 ? '#3b82f6' : '#eff6ff', // Blue if active, light if 0
                color: result.vatAmount > 0 ? 'white' : '#1e3a8a',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                textAlign: 'center',
                marginBottom: '1rem',
                border: result.vatAmount > 0 ? 'none' : '1px solid #dbeafe',
                boxShadow: result.vatAmount > 0 ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                    <Calendar size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Due Monthly</span>
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem', lineHeight: '1' }}>
                    {formatCurrency(result.vatAmount)}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>VAT Payable</div>

                {result.isVatExemptByTurnover && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem', color: 'inherit' }}>
                        Small Business Exception Active
                    </div>
                )}
            </div>

            {/* Orange/Slate Estimate Card: ACCUMULATED (Income Tax) */}
            <div style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', color: '#ea580c' }}>
                        <div style={{ fontWeight: 'bold' }}>{result.taxType}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>Accumulated Tax Estimate</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Not due immediately</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                            {formatCurrency(result.incomeTaxAmount)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {result.taxType === 'CIT' ? 'Company Income Tax' : 'Personal Income Tax'}
                        </div>
                    </div>

                    {result.incomeTaxAmount === 0 && result.isCitExemptByTurnover && (
                        <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '500', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>
                            Exempt
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    {result.message}
                </div>
            </div>

            {/* VAT Filing Notice */}
            {result.isVatExemptByTurnover && (
                <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '0.5rem' }}>
                        ℹ️ Filing Requirement
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
                        Even if you pay <strong>₦0 VAT</strong>, you typically must still file "Zero Returns" monthly with FIRS to stay compliant.
                    </p>
                </div>
            )}

            {/* Expenses Superpower */}
            {result.taxSavings > 0 && (
                <Card padding="1.5rem" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #ecfdf5, #fff)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#047857' }}>
                        💡 Smart Savings (Tax Shield)
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#065f46', marginBottom: '0.5rem' }}>
                        Your <strong>{formatCurrency(result.totalExpenses)}</strong> in expenses reduced your taxable profit.
                    </p>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                        -{formatCurrency(result.taxSavings)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#064e3b', marginTop: '0.25rem' }}>
                        Est. Tax Bill Reduced (~20% of expenses)
                    </p>
                </Card>
            )}

            {/* Revenue Breakdown */}
            <Card padding="1.5rem" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Revenue Breakdown</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    All Time Data — {sales.length} Sales & {expenses.length} Expenses
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Sales Revenue</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(result.totalRevenue)}</span>
                </div>

                {/* Visual Formula */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--color-border)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>➖ Exempt Sales (No VAT)</span>
                        <span style={{ color: '#f97316' }}>{formatCurrency(result.exemptSales)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>= Taxable Sales Base</span>
                        <span style={{ fontWeight: '600' }}>{formatCurrency(result.taxableSales)}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Cost</span>
                    <span style={{ fontWeight: '600', color: '#ef4444' }}>-{formatCurrency(result.totalExpenses)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ color: '#166534', fontWeight: '600' }}>Net Profit</div>
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#16a34a' }}>{formatCurrency(result.netProfit)}</span>
                </div>

                {/* View More Button */}
                <button
                    onClick={() => setShowDetails(true)}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem',
                        color: 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
                    }}
                >
                    View Details <ChevronRight size={16} />
                </button>
            </Card>

            {/* When to Pay */}
            <Card padding="1.5rem" style={{ marginBottom: '2rem', backgroundColor: '#fdf4ff', border: '1px solid #fae8ff' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#86198f' }}>When to Pay</h3>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: '#fae8ff', borderRadius: '0.5rem', color: '#c026d3' }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: '#86198f' }}>VAT</div>
                        <div style={{ fontSize: '0.85rem', color: '#a21caf' }}>File monthly by the 21st (even if ₦0)</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: '#fae8ff', borderRadius: '0.5rem', color: '#c026d3' }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '600', color: '#86198f' }}>Income Tax</div>
                        <div style={{ fontSize: '0.85rem', color: '#a21caf' }}>File annually (Projections in Jan)</div>
                    </div>
                </div>
            </Card>

            <div style={{
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '1rem',
                borderRadius: '1rem',
                marginBottom: '1rem',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    This is an estimate for guidance. For official filing and payment, please consult a tax professional or contact FIRS.
                </p>
            </div>

        </div>
    );
}
