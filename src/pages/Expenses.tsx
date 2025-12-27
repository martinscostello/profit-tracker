import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { usePermissions } from '../hooks/usePermissions';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Plus, ArrowLeft, Trash2, Calendar, Receipt, ChevronDown } from 'lucide-react';
import { NotificationBell } from '../components/ui/NotificationBell';
import { formatCurrency, formatDate } from '../utils/format';

export function Expenses() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { business, expenses, addExpense, deleteExpense, expenseCategories } = useData();
    const { can } = usePermissions();
    const { showToast } = useToast();
    const { confirm } = useDialog();

    // Auto-open add mode if query param is set
    const [isAdding, setIsAdding] = useState(() => searchParams.get('mode') === 'add');

    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<string>('Other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        // Strip commas for calculation
        const cleanAmount = amount.replace(/,/g, '');
        if (!cleanAmount || parseFloat(cleanAmount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        addExpense({
            businessId: business.id,
            amount: parseFloat(cleanAmount),
            description: description || category,
            category: category,
            date: date
        });

        setIsAdding(false);
        // Reset form
        setAmount('');
        setDescription('');
        setCategory('Other');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleDelete = async (id: string) => {
        if (await confirm({ title: 'Delete Expense', message: 'Are you sure you want to delete this expense?', type: 'danger' })) {
            deleteExpense(id);
            showToast('Expense deleted', 'success');
        }
    };

    // Group expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Layout showNav={!isAdding} disablePadding={true}>
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'calc(2rem + env(safe-area-inset-top))',
                paddingBottom: isAdding ? '0' : '5rem' // Nav height is handled by Layout but we need space for content
            }}>
                {/* Fixed Header Section */}
                <div style={{ padding: '0 1.5rem 1rem 1.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <button
                            onClick={() => {
                                if (isAdding) {
                                    setIsAdding(false);
                                    // Clear query param without refreshing
                                    navigate('/expenses', { replace: true });
                                } else {
                                    navigate('/settings');
                                }
                            }}
                            style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', flex: 1 }}>
                            {isAdding ? 'Add Expense' : 'Expenses'}
                        </h1>
                        <NotificationBell />
                    </div>

                    {!isAdding && (
                        <Card padding="1.5rem" className="bg-orange-50 border-orange-100">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#ea580c' }}>
                                <Receipt size={20} />
                                <span style={{ fontWeight: '600' }}>Total Expenses</span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2410c' }}>
                                {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#9a3412', marginTop: '0.25rem' }}>
                                Tracked across {expenses.length} items
                            </p>
                        </Card>
                    )}
                </div>

                {/* Scrollable Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 2rem 1.5rem' }}>
                    {isAdding ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Card padding="1.5rem">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount</label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => {
                                            // Handle currency formatting
                                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                                            // Prevent multiple decimals
                                            if ((raw.match(/\./g) || []).length > 1) return;

                                            // Format for display (add commas)
                                            // Note: simpler to just store raw in state for logic, but user wants to see formatted while typing
                                            // Ideally we store separate states or just format on render. 
                                            // For this quick fix, let's keep it simple: strict numeric input for value, formatted visual?
                                            // Actually, user specifically asked "appear in decimals while typing; 2,000"

                                            // Let's formatting logic:
                                            const parts = raw.split('.');
                                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                            setAmount(parts.join('.'));
                                        }}
                                        style={{ fontSize: '1.5rem', padding: '1rem' }}
                                        autoFocus
                                        enterKeyHint="done"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // Simple scroll into view delay to ensure keyboard is up
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 300);
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                borderRadius: '0.75rem',
                                                border: '1px solid var(--color-border)',
                                                backgroundColor: 'white',
                                                fontSize: '1rem',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {expenseCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={20}
                                            style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none',
                                                color: 'var(--color-text-muted)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <Input
                                        label="Description (Optional)"
                                        placeholder="e.g. 5 Liters Fuel"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        enterKeyHint="done"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        onFocus={(e) => {
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 300);
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <Input
                                        label="Date"
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        enterKeyHint="done"
                                    />
                                </div>

                                <Button onClick={handleSave} style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>
                                    Save Expense
                                </Button>
                            </Card>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sortedExpenses.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                                    <p>No expenses recorded yet.</p>
                                </div>
                            ) : (
                                sortedExpenses.map(expense => (
                                    <Card key={expense.id} padding="1rem">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <div style={{
                                                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                                    backgroundColor: '#fff7ed', color: '#f97316',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.25rem'
                                                }}>
                                                    {expense.category === 'Fuel' ? '⛽' :
                                                        expense.category === 'Transport' ? '🚕' :
                                                            expense.category === 'Airtime' ? '📱' :
                                                                expense.category === 'Shop Rent' ? '🏠' :
                                                                    expense.category === 'Salaries' ? '👥' :
                                                                        expense.category === 'Market Levies' ? '🎫' :
                                                                            expense.category === 'Personal' ? '👤' : '📝'}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontWeight: '600', color: 'var(--color-text)' }}>{expense.category}</h3>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{expense.description}</p>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Calendar size={12} /> {formatDate(expense.date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                                                    -{formatCurrency(expense.amount)}
                                                </div>
                                                {can('canDeleteExpenses') && (
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        style={{ background: 'none', border: 'none', padding: '0.5rem', color: '#94a3b8', marginTop: '0.25rem' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* FAB - Adjusted position */}
                {!isAdding && can('canAddExpenses') && (
                    <button
                        onClick={() => setIsAdding(true)}
                        style={{
                            position: 'fixed',
                            bottom: '8rem', // Moved up higher to avoid clipping/overlap
                            right: '1.5rem',
                            width: '3.5rem',
                            height: '3.5rem',
                            borderRadius: '50%',
                            backgroundColor: '#f97316', // Orange
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.4)',
                            border: 'none',
                            cursor: 'pointer',
                            zIndex: 100
                        }}
                    >
                        <Plus size={24} />
                    </button>
                )}
            </div>
        </Layout>
    );
}
