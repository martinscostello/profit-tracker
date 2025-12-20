import { useState, useEffect } from 'react';
import { X, Lock, Share2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';
import { DateRangeModal } from './DateRangeModal';

// Export Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun } from 'docx';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface ReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

type ExportFormat = 'PDF' | 'EXCEL' | 'WORD';

import { usePermissions } from '../../hooks/usePermissions';

export function ReportsModal({ isOpen, onClose, onUpgrade }: ReportsModalProps) {
    const { sales, expenses, business } = useData();
    const { can } = usePermissions();
    const { showToast } = useToast();
    const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('PDF');

    // Date Range
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            // Default date range for 'custom' could be today
            const today = new Date().toISOString().split('T')[0];
            setDateRange({ start: today, end: today });
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    if (!can('canViewReports')) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10001, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <Lock size={48} color="#94a3b8" style={{ margin: '0 auto', marginBottom: '1rem' }} />
                    <h3>Access Denied</h3>
                    <p style={{ color: '#64748b', marginBottom: '1rem' }}>You do not have permission to view reports.</p>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '0.5rem' }}>Close</button>
                </div>
            </div>
        )
    }

    // Filter Logic
    const filteredSales = sales.filter(sale => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const saleDateStr = sale.date.split('T')[0];
        const saleDate = new Date(sale.date);

        if (reportType === 'daily') return sale.date.startsWith(today);

        if (reportType === 'weekly') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return saleDate >= oneWeekAgo;
        }
        if (reportType === 'monthly') {
            return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        }
        if (reportType === 'custom' && dateRange.start && dateRange.end) {
            return saleDateStr >= dateRange.start && saleDateStr <= dateRange.end;
        }
        return true;
    });

    const filteredExpenses = expenses.filter(expense => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const expenseDateStr = expense.date.split('T')[0];
        const expenseDate = new Date(expense.date);

        if (reportType === 'daily') return expense.date.startsWith(today);

        if (reportType === 'weekly') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return expenseDate >= oneWeekAgo;
        }
        if (reportType === 'monthly') {
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        }
        if (reportType === 'custom' && dateRange.start && dateRange.end) {
            return expenseDateStr >= dateRange.start && expenseDateStr <= dateRange.end;
        }
        return true;
    });

    const stats = filteredSales.reduce((acc, sale) => ({
        revenue: acc.revenue + sale.revenue,
        cost: acc.cost + sale.cost,
        grossProfit: acc.grossProfit + sale.profit
    }), { revenue: 0, cost: 0, grossProfit: 0 });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = stats.grossProfit - totalExpenses;

    const handleLockedFeature = () => {
        if (!business.isPro) {
            onClose();
            onUpgrade();
        }
    };

    const handleReportTypeChange = (type: 'daily' | 'weekly' | 'monthly' | 'custom') => {
        if (type !== 'daily' && !business.isPro) {
            handleLockedFeature();
            return;
        }

        if (type === 'custom') {
            setIsDateModalOpen(true);
        }
        setReportType(type);
    };

    // Unified Data (Sales + Expenses)
    const unifiedData = [
        ...filteredSales.map(s => ({
            date: s.date,
            type: 'Sale',
            description: `${s.productName} (x${s.quantity})`,
            amount: s.revenue,
            profit: s.profit,
            isExpense: false
        })),
        ...filteredExpenses.map(e => ({
            date: e.date,
            type: 'Expense',
            description: `${e.category}${e.description ? ` - ${e.description}` : ''}`,
            amount: e.amount,
            profit: -e.amount, // Expense reduces profit
            isExpense: true
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    // --- Generation Functions ---
    const getCurrency = () => {
        let code = business.currency || 'NGN';
        if (code === '₦') code = 'NGN';
        if (code === '$') code = 'USD';
        if (code === '€') code = 'EUR';
        if (code === '£') code = 'GBP';
        return code;
    };
    const formatMoney = (amount: number) => formatCurrency(amount, getCurrency(), 'en-NG', 2);

    // PDF specific formatter to handle font limitations
    const formatMoneyPdf = (amount: number) => {
        const formatted = formatMoney(amount);
        return formatted.replace(/₦/g, 'N').replace(/€/g, 'EUR').replace(/£/g, 'GBP');
    };

    const generatePDF = async () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(business.name || "Profit Report", 14, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Period: ${reportType.toUpperCase()}`, 14, 33);
        if (reportType === 'custom') {
            doc.text(`Range: ${dateRange.start} to ${dateRange.end}`, 14, 38);
        }

        // Stats Summary
        const startY = reportType === 'custom' ? 45 : 40;
        doc.setFontSize(12);
        doc.text(`Total Revenue: ${formatMoneyPdf(stats.revenue)}`, 14, startY);
        doc.text(`Total Cost: ${formatMoneyPdf(stats.cost)}`, 14, startY + 5);
        doc.text(`Gross Profit: ${formatMoneyPdf(stats.grossProfit)}`, 14, startY + 10);
        doc.text(`Total Expenses: ${formatMoneyPdf(totalExpenses)}`, 14, startY + 15);
        doc.text(`Net Profit: ${formatMoneyPdf(netProfit)}`, 14, startY + 20);

        // Unified Table
        const tableData = unifiedData.map(item => [
            formatDate(item.date),
            item.type.toUpperCase(),
            item.description,
            formatMoneyPdf(item.amount),
            formatMoneyPdf(item.profit)
        ]);

        autoTable(doc, {
            startY: startY + 25,
            head: [['Date', 'Type', 'Description', 'Amount', 'Profit Impact']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] }, // Dark Gray
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 1) {
                    if (data.cell.raw === 'EXPENSE') {
                        data.cell.styles.textColor = [220, 38, 38]; // Red
                    } else {
                        data.cell.styles.textColor = [22, 163, 74]; // Green
                    }
                }
            }
        });

        const output = doc.output('datauristring');
        return output.split(',')[1];
    };

    const generateExcel = async () => {
        const wb = XLSX.utils.book_new();

        // Data for sheet
        const data = [
            ['Business Name', business.name],
            ['Report Date', new Date().toLocaleString()],
            ['Period', reportType],
            [''],
            ['Summary'],
            ['Total Revenue', formatMoney(stats.revenue)],
            ['Total Cost', formatMoney(stats.cost)],
            ['Gross Profit', formatMoney(stats.grossProfit)],
            ['Total Expenses', formatMoney(totalExpenses)],
            ['Net Profit', formatMoney(netProfit)],
            [''],
            ['Transactions (Merged)'],
            ['Date', 'Type', 'Description', 'Amount', 'Profit Impact'],
            ...unifiedData.map(item => [
                formatDate(item.date),
                item.type.toUpperCase(),
                item.description,
                formatMoney(item.amount),
                formatMoney(item.profit)
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Report");

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        return wbout;
    };

    const generateWord = async () => {
        // Table Rows
        const tableRows = [
            new TableRow({
                children: ['Date', 'Type', 'Description', 'Amount', 'Impact'].map(text =>
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })] })
                )
            }),
            ...unifiedData.map(item =>
                new TableRow({
                    children: [
                        formatDate(item.date),
                        item.type.toUpperCase(),
                        item.description,
                        formatMoney(item.amount),
                        formatMoney(item.profit)
                    ].map(text => new TableCell({ children: [new Paragraph(text)] }))
                })
            )
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: business.name || "Profit Report", heading: "Heading1" }),
                    new Paragraph(`Generated: ${new Date().toLocaleString()}`),
                    new Paragraph(`Period: ${reportType.toUpperCase()}`),
                    new Paragraph(""),
                    new Paragraph({ text: "Summary", heading: "Heading2" }),
                    new Paragraph(`Total Revenue: ${formatMoney(stats.revenue)}`),
                    new Paragraph(`Total Cost: ${formatMoney(stats.cost)}`),
                    new Paragraph(`Gross Profit: ${formatMoney(stats.grossProfit)}`),
                    new Paragraph(`Total Expenses: ${formatMoney(totalExpenses)}`),
                    new Paragraph(`Net Profit: ${formatMoney(netProfit)}`),
                    new Paragraph(""),
                    new Paragraph({ text: "Transaction History", heading: "Heading2" }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const b64 = await Packer.toBase64String(doc);
        return b64;
    };

    const handleExport = async () => {
        if (!business.isPro) {
            handleLockedFeature();
            return;
        }

        setIsGenerating(true);
        try {
            let dataBase64 = '';
            let fileName = `report_${reportType}_${new Date().getTime()}`;

            if (exportFormat === 'PDF') {
                dataBase64 = await generatePDF();
                fileName += '.pdf';
            } else if (exportFormat === 'EXCEL') {
                dataBase64 = await generateExcel();
                fileName += '.xlsx';
            } else if (exportFormat === 'WORD') {
                dataBase64 = await generateWord();
                fileName += '.docx';
            }

            // Save to Filesystem
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: dataBase64,
                directory: Directory.Cache // Use Cache for temporary share files
            });

            // Share
            await Share.share({
                title: 'Profit Report',
                text: `Here is the ${reportType} report for ${business.name}`,
                url: savedFile.uri,
                dialogTitle: 'Share Report'
            });

        } catch (error: any) {
            console.error('Export failed', error);
            showToast(`Export Error: ${error.message || JSON.stringify(error)}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 10001,
                display: 'flex', alignItems: 'end', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    backgroundColor: 'white', width: '100%', maxWidth: '600px',
                    borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                    maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Fixed Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.5rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid #f1f5f9'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Reports Center</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none' }}>
                            <X size={24} color="#64748b" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{
                        overflowY: 'auto',
                        padding: '1.5rem',
                        paddingTop: '1rem'
                    }}>

                        {/* Report Type Selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {(['daily', 'weekly', 'monthly', 'custom'] as const).map(type => {
                                const isLocked = !business.isPro && type !== 'daily';
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleReportTypeChange(type)}
                                        style={{
                                            flex: '0 0 auto', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                                            backgroundColor: reportType === type ? 'var(--color-primary)' : '#f1f5f9',
                                            color: reportType === type ? 'white' : '#64748b',
                                            border: 'none', fontWeight: '600', textTransform: 'capitalize',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            opacity: isLocked ? 0.7 : 1
                                        }}
                                    >
                                        {isLocked && <Lock size={12} />}
                                        {type}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Stats Card */}
                        <div style={{
                            backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem',
                            marginBottom: '1.5rem', border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                    Net Profit
                                    {reportType === 'custom' && <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>({dateRange.start} - {dateRange.end})</div>}
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    {formatCurrency(netProfit)}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                                    Gross: {formatCurrency(stats.grossProfit)}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Revenue</div>
                                    <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{formatCurrency(stats.revenue)}</div>
                                </div>
                                <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Expenses</div>
                                    <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{formatCurrency(totalExpenses)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Export Section */}
                        <div style={{
                            border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem',
                            backgroundColor: !business.isPro ? '#f8fafc' : 'white',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {!business.isPro && (
                                <div
                                    onClick={handleLockedFeature}
                                    style={{
                                        position: 'absolute', inset: 0, zIndex: 10,
                                        backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Lock size={32} color="#EAB308" style={{ marginBottom: '0.5rem' }} />
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Upgrade to Export Reports</span>
                                </div>
                            )}

                            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Export & Share</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Select Format</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                        {(['PDF', 'EXCEL', 'WORD'] as const).map(fmt => (
                                            <button
                                                key={fmt}
                                                onClick={() => setExportFormat(fmt)}
                                                style={{
                                                    padding: '0.75rem', borderRadius: '0.75rem',
                                                    border: exportFormat === fmt ? '2px solid var(--color-primary)' : '1px solid #e2e8f0',
                                                    backgroundColor: exportFormat === fmt ? '#f3e8ff' : 'white',
                                                    color: exportFormat === fmt ? 'var(--color-primary)' : '#64748b',
                                                    fontWeight: '600', fontSize: '0.875rem'
                                                }}
                                            >
                                                {fmt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleExport}
                                    disabled={isGenerating}
                                    style={{
                                        width: '100%', padding: '1rem',
                                        backgroundColor: 'var(--color-primary)', color: 'white',
                                        fontWeight: 'bold', fontSize: '1rem', borderRadius: '1rem',
                                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                        opacity: isGenerating ? 0.7 : 1, cursor: 'pointer'
                                    }}
                                >
                                    {isGenerating ? (
                                        'Generating...'
                                    ) : (
                                        <>
                                            <Share2 size={20} />
                                            Download & Share
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                    @keyframes slideUp {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                `}</style>
            </div>

            <DateRangeModal
                isOpen={isDateModalOpen}
                onClose={() => setIsDateModalOpen(false)}
                onApply={(start, end) => {
                    setDateRange({ start, end });
                }}
            />
        </>
    );
}
