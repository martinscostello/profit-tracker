import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Screen1_Entry } from './Screen1_Entry';
import { Screen2_Setup } from './Screen2_Setup';
import { Screen3_Summary } from './Screen3_Summary';
import { Layout } from '../../components/layout/Layout';
import { ArrowLeft, Settings, Share2, FileText, FileSpreadsheet, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { shareTaxReportPDF, shareTaxReportExcel } from '../../utils/taxExport';
import { calculateTax } from '../../utils/taxLogic';
import { Share } from '@capacitor/share';

/**
 * Share Menu Component
 */
const ShareMenu = ({ onClose, onSharePDF, onShareExcel, onShareText }: any) => {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                padding: '1.5rem', paddingBottom: '3rem',
                animation: 'slide-up 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Share Tax Report</h3>
                    <button onClick={onClose} style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={onSharePDF} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        backgroundColor: '#eff6ff', borderRadius: '1rem', textAlign: 'left'
                    }}>
                        <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.75rem', color: '#2563eb' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', color: '#1e40af' }}>Share PDF Report</div>
                            <div style={{ fontSize: '0.85rem', color: '#60a5fa' }}>Detailed formatted document</div>
                        </div>
                    </button>

                    <button onClick={onShareExcel} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        backgroundColor: '#f0fdf4', borderRadius: '1rem', textAlign: 'left'
                    }}>
                        <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.75rem', color: '#16a34a' }}>
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', color: '#166534' }}>Share Excel Report</div>
                            <div style={{ fontSize: '0.85rem', color: '#4ade80' }}>Spreadsheet for analysis</div>
                        </div>
                    </button>

                    <button onClick={onShareText} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                        backgroundColor: '#f8fafc', borderRadius: '1rem', textAlign: 'left'
                    }}>
                        <div style={{ padding: '0.75rem', backgroundColor: '#e2e8f0', borderRadius: '0.75rem', color: '#64748b' }}>
                            <Share2 size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', color: '#475569' }}>Share Summary</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Simple text summary</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export function TaxInsight() {
    const { business, sales, expenses } = useData();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive step from URL, default to 1 (String handling for safety)
    const stepParam = searchParams.get('step');
    const step = stepParam ? parseInt(stepParam) : 1;

    const [showShareMenu, setShowShareMenu] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    // Pro Check
    useEffect(() => {
        if (!business.isPro) {
            navigate('/settings');
        }
    }, [business.isPro, navigate]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    const handleBack = () => {
        // If Share Menu is open, just close it? 
        // No, back button usually handled share menu in hardware listener.
        // For software back button, we usually expect standard nav.
        if (step > 1) {
            navigate(-1); // Pop history
        } else {
            navigate('/settings');
        }
    };

    const handleSharePDF = async () => {
        setIsSharing(true);
        try {
            // Calculate Annual Turnover
            const currentYear = new Date().getFullYear();
            const annualTurnover = sales
                .filter(s => new Date(s.date).getFullYear() === currentYear)
                .reduce((sum, s) => sum + s.revenue, 0);

            // Export ALL data as requested
            const result = calculateTax(sales, expenses, business.taxSettings, annualTurnover);
            await shareTaxReportPDF(result, business, 'All Time', sales, expenses);
        } catch (e) {
            alert('Failed to share PDF');
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    const handleShareExcel = async () => {
        setIsSharing(true);
        try {
            // Calculate Annual Turnover
            const currentYear = new Date().getFullYear();
            const annualTurnover = sales
                .filter(s => new Date(s.date).getFullYear() === currentYear)
                .reduce((sum, s) => sum + s.revenue, 0);

            // Export ALL data as requested
            const result = calculateTax(sales, expenses, business.taxSettings, annualTurnover);
            await shareTaxReportExcel(result, business, sales, expenses);
        } catch (e) {
            alert('Failed to share Excel');
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    const handleShareText = async () => {
        setIsSharing(true);
        try {
            const currentYear = new Date().getFullYear();
            const annualTurnover = sales
                .filter(s => new Date(s.date).getFullYear() === currentYear)
                .reduce((sum, s) => sum + s.revenue, 0);

            const result = calculateTax(sales, expenses, business.taxSettings, annualTurnover);
            const periodText = 'All Time';
            const text = `Tax Insight Estimate for ${business.name}\nPeriod: ${periodText}\n\nEst. VAT: ₦${result.vatAmount.toLocaleString()}\nEst. Income Tax: ₦${result.incomeTaxAmount.toLocaleString()}\nTotal Estimate: ₦${(result.vatAmount + result.incomeTaxAmount).toLocaleString()}\n\nNote: This is an estimate for guidance.`;

            await Share.share({
                title: 'Tax Estimate',
                text: text,
                dialogTitle: 'Share Summary'
            });
        } catch (e) {
            console.log('Share canceled');
        } finally {
            setIsSharing(false);
            setShowShareMenu(false);
        }
    };

    return (
        <Layout disablePadding showNav={false}>
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'var(--color-bg)',
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        paddingTop: 'calc(3rem + env(safe-area-inset-top))',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: 'white',
                        position: 'sticky', top: 0, zIndex: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    padding: '0.5rem', marginLeft: '-0.5rem', borderRadius: '50%',
                                    backgroundColor: 'transparent', color: 'var(--color-text)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                {step === 1 ? 'Tax Insights' : step === 2 ? 'Tax Setup' : 'Tax Summary'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Share/Download Button (Only on Summary) */}
                            {step === 3 && (
                                <button
                                    onClick={() => setShowShareMenu(true)}
                                    style={{
                                        padding: '0.5rem', borderRadius: '50%',
                                        backgroundColor: '#eff6ff', color: '#2563eb', // Blue theme
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Share2 size={20} />
                                </button>
                            )}

                            {(step === 3 || step === 2) && (
                                <button
                                    onClick={() => setSearchParams({ step: '2' })}
                                    style={{
                                        padding: '0.5rem', borderRadius: '50%',
                                        backgroundColor: '#f1f5f9', color: 'var(--color-text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Settings size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {step === 1 && <Screen1_Entry onNext={() => setSearchParams({ step: '2' })} />}
                        {step === 2 && <Screen2_Setup onNext={() => setSearchParams({ step: '3' })} />}
                        {step === 3 && <Screen3_Summary />}
                    </div>

                    {/* Share Menu Modal */}
                    {showShareMenu && (
                        <ShareMenu
                            onClose={() => setShowShareMenu(false)}
                            onSharePDF={handleSharePDF}
                            onShareExcel={handleShareExcel}
                            onShareText={handleShareText}
                        />
                    )}

                    {/* Loading Overlay */}
                    {isSharing && (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{ fontWeight: '600' }}>Preparing Export...</div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
