import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { Plus, Check, Store, X, LogOut } from 'lucide-react';

interface BusinessSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export function BusinessSwitcher({ isOpen, onClose }: BusinessSwitcherProps) {
    const navigate = useNavigate();
    const { businesses, activeBusinessId, switchBusiness, leaveBusiness } = useData();
    const { currentUser } = useAuth();
    const { confirm } = useDialog();

    if (!isOpen) return null;

    const handleSwitch = (id: string) => {
        switchBusiness(id);
        onClose();
    };

    const handleAddClick = () => {
        onClose();
        navigate('/add-business');
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)', width: '100%', maxWidth: '500px',
                borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                padding: '1.5rem', paddingBottom: '7rem',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                        Switch Business
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '0.5rem' }}>
                        <X size={24} color="#64748b" />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {businesses.map((b) => {
                        const isShared = b.ownerId && currentUser && b.ownerId !== currentUser.id;

                        return (
                            <div key={b.id} style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleSwitch(b.id)}
                                    style={{
                                        flex: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1rem', borderRadius: '1rem',
                                        backgroundColor: b.id === activeBusinessId ? '#f3e8ff' : 'var(--color-bg-subtle)',
                                        border: b.id === activeBusinessId ? '2px solid #9333ea' : '1px solid #e2e8f0',
                                        color: b.id === activeBusinessId ? '#1e293b' : 'var(--color-text-muted)',
                                        cursor: 'pointer', textAlign: 'left'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            backgroundColor: b.id === activeBusinessId ? '#9333ea' : '#cbd5e1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{b.name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{b.currency} Currency</div>
                                        </div>
                                    </div>
                                    {b.id === activeBusinessId && <Check size={20} color="#9333ea" />}
                                </button>

                                {isShared && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (await confirm({
                                                title: 'Leave Business',
                                                message: `Are you sure you want to leave "${b.name}"? You will lose access.`,
                                                type: 'danger',
                                                confirmText: 'Leave'
                                            })) {
                                                leaveBusiness(b.id);
                                            }
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0 1rem', borderRadius: '1rem',
                                            backgroundColor: '#fee2e2', border: '1px solid #fecaca',
                                            color: '#ef4444', cursor: 'pointer'
                                        }}
                                        title="Leave Business"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                        <button
                            onClick={handleAddClick}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '1rem', borderRadius: '1rem',
                                border: '2px dashed var(--color-primary)',
                                backgroundColor: '#f3e8ff',
                                color: 'var(--color-primary)',
                                fontWeight: 'bold', fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={20} />
                            Add New
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/join-business');
                            }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '1rem', borderRadius: '1rem',
                                border: '2px dashed #3b82f6',
                                backgroundColor: '#eff6ff',
                                color: '#2563eb',
                                fontWeight: 'bold', fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <img
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cline x1='19' y1='8' x2='19' y2='14'/%3E%3Cline x1='22' y1='11' x2='16' y2='11'/%3E%3C/svg%3E"
                                width={20} height={20}
                                alt="Join"
                            />
                            Join Team
                        </button>
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
    );
}
