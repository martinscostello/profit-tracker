import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

export function ExpenseCategories() {
    const navigate = useNavigate();
    const { expenseCategories, updateExpenseCategories } = useData();
    const { showToast } = useToast();
    const { confirm } = useDialog();
    const [newCategory, setNewCategory] = useState('');

    const handleAdd = () => {
        if (!newCategory.trim()) return;
        if (expenseCategories.includes(newCategory.trim())) {
            showToast('Category already exists', 'error');
            return;
        }

        updateExpenseCategories([...expenseCategories, newCategory.trim()]);
        setNewCategory('');
    };

    const handleDelete = async (category: string) => {
        if (expenseCategories.length <= 1) {
            showToast('You must have at least one category.', 'error');
            return;
        }
        if (await confirm({ title: 'Delete Category', message: `Delete category "${category}"?`, type: 'danger' })) {
            updateExpenseCategories(expenseCategories.filter(c => c !== category));
            showToast('Category deleted', 'success');
        }
    };

    return (
        <Layout showNav={false}>
            <div style={{
                paddingBottom: '2rem',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 20,
                    paddingTop: 'calc(3rem + env(safe-area-inset-top))',
                    paddingBottom: '1rem',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
                        <ArrowLeft size={24} color="var(--color-text)" />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Expense Categories</h1>
                </div>

                <div style={{ padding: '0 1.5rem', flex: 1 }}>
                    <Card padding="1.5rem" className="mb-6">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    placeholder="New Category Name"
                                    value={newCategory}
                                    onChange={e => setNewCategory(e.target.value)}
                                    // Make sure input is clean
                                    containerStyle={{ marginBottom: 0 }}
                                />
                            </div>
                            <Button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Add
                            </Button>
                        </div>
                    </Card>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {expenseCategories.map(cat => (
                            <Card key={cat} padding="1rem">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '500' }}>{cat}</span>
                                    <button
                                        onClick={() => handleDelete(cat)}
                                        style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.5rem' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
