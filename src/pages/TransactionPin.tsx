import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PinModal } from '../components/ui/PinModal';
import { ArrowLeft, Lock, Trash2, RotateCcw, Plus } from 'lucide-react';

export function TransactionPin() {
    const navigate = useNavigate();
    const { business, updateBusiness } = useData();
    const { showToast } = useToast();
    const [modalMode, setModalMode] = useState<'setup' | 'verify' | 'reset'>('setup');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'create' | 'remove' | 'reset' | null>(null);

    const handleAction = (action: 'create' | 'remove' | 'reset') => {
        setPendingAction(action);
        if (action === 'create') {
            setModalMode('setup');
            setIsModalOpen(true);
        } else if (action === 'remove' || action === 'reset') {
            setModalMode('verify');
            setIsModalOpen(true);
        }
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        if (pendingAction === 'remove') {
            updateBusiness({ pin: undefined });
            showToast('PIN removed successfully', 'success');
        } else if (pendingAction === 'reset') {
            setModalMode('setup');
            setIsModalOpen(true);
            setPendingAction('create'); // After verifying current, move to setup new
        } else if (pendingAction === 'create') {
            showToast('PIN set successfully', 'success');
        }
        setPendingAction(null);
    };

    return (
        <Layout disablePadding>
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                paddingTop: 'calc(0.5rem + env(safe-area-inset-top))'
            }}>
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg)', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Transaction PIN</h1>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Protect your sales history and sensitive settings with a 4-digit security PIN.
                    </p>

                    <Card padding="1rem" style={{ border: business.pin ? '1px solid #dcfce7' : '1px solid #fee2e2', backgroundColor: business.pin ? '#f0fdf4' : '#fef2f2' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '3rem', height: '3rem', borderRadius: '50%',
                                backgroundColor: business.pin ? '#16a34a' : '#dc2626',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Lock size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                                    {business.pin ? 'PIN is Active' : 'No PIN Set'}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    {business.pin ? 'Your transactions are secured.' : 'Anyone can edit your sales.'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Button
                            disabled={!!business.pin}
                            onClick={() => handleAction('create')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-start',
                                padding: '1.25rem', backgroundColor: business.pin ? '#f1f5f9' : 'var(--color-primary)',
                                color: business.pin ? '#94a3b8' : 'white', cursor: business.pin ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <Plus size={20} /> Create New PIN
                        </Button>

                        {business.pin && (
                            <>
                                <Button
                                    onClick={() => handleAction('reset')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-start',
                                        padding: '1.25rem', backgroundColor: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)'
                                    }}
                                >
                                    <RotateCcw size={20} /> Reset PIN
                                </Button>

                                <Button
                                    onClick={() => handleAction('remove')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-start',
                                        padding: '1.25rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2'
                                    }}
                                >
                                    <Trash2 size={20} /> Remove PIN
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <PinModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    onSuccess={handleSuccess}
                />
            </div>
        </Layout>
    );
}
