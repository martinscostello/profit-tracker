import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../context/ToastContext';
import { useDialog } from '../context/DialogContext';
import { Layout } from '../components/layout/Layout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
    ArrowLeft, Building2, Store, ShoppingBasket, Pill,
    UtensilsCrossed, Scissors, Smartphone, Wrench, Briefcase, ChevronDown,
    Pencil, Trash2, AlertTriangle, Users, LogOut, LogIn
} from 'lucide-react';
import { BusinessSwitcher } from '../components/ui/BusinessSwitcher';
import { PinModal } from '../components/ui/PinModal';
import { ClearSalesModal } from '../components/ui/ClearSalesModal';

const BUSINESS_TYPES = [
    'Retail Shop', 'Supermarket', 'Pharmacy', 'Restaurant/Chop Bar',
    'Fashion/Tailoring', 'Electronics', 'Service', 'Other'
] as const;

const CATEGORY_ICONS: Record<string, any> = {
    'Retail Shop': Store,
    'Supermarket': ShoppingBasket,
    'Pharmacy': Pill,
    'Restaurant/Chop Bar': UtensilsCrossed,
    'Fashion/Tailoring': Scissors,
    'Electronics': Smartphone,
    'Service': Wrench,
    'Other': Briefcase
};

const CATEGORY_COLORS: Record<string, string> = {
    'Retail Shop': '#3b82f6', // Blue
    'Supermarket': '#10b981', // Green
    'Pharmacy': '#ef4444',    // Red
    'Restaurant/Chop Bar': '#f97316', // Orange
    'Fashion/Tailoring': '#ec4899', // Pink
    'Electronics': '#8b5cf6', // Violet
    'Service': '#6366f1',     // Indigo
    'Other': '#64748b'        // Slate
};

export function CompanyProfile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { business, updateBusiness, deleteBusiness, leaveBusiness } = useData();
    const { showToast } = useToast();
    const { confirm } = useDialog();
    const { currentUser, logout } = useAuth();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    // Edit Mode State - Default to false (View Mode)
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState(business.name);
    const [type, setType] = useState(business.type || 'Other');

    // Sync state when business changes (e.g. after switch)
    useEffect(() => {
        setName(business.name);
        setType(business.type || 'Other');
    }, [business]);

    // Deletion State
    const [showDeletePin, setShowDeletePin] = useState(false);
    const [showClearSales, setShowClearSales] = useState(false);

    const { role, can } = usePermissions();

    const handleSave = () => {
        if (!name.trim()) return showToast('Business Name is required', 'error');

        updateBusiness({
            name,
            type
        });
        setIsEditing(false); // Switch back to view mode
    };

    const confirmDelete = () => {
        deleteBusiness(business.id);
        navigate('/');
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to logout', error);
        }
    };

    const SelectedIcon = CATEGORY_ICONS[type] || Building2;
    const activeColor = CATEGORY_COLORS[type] || '#3b82f6';
    const isOwner = role === 'OWNER';

    return (
        <Layout disablePadding>
            <div style={{
                padding: 0,
                height: '100vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                paddingTop: 'calc(0.5rem + env(safe-area-inset-top))'
            }}>
                {/* Fixed Header */}
                <div style={{
                    padding: '1.5rem',
                    paddingBottom: '1rem',
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => navigate(-1)}
                                style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem', color: 'var(--color-text)' }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Company Profile</h1>
                        </div>

                        <button
                            onClick={() => setIsSwitcherOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: '#f1f5f9', border: 'none', padding: '0.5rem 0.75rem',
                                borderRadius: '0.75rem', color: '#64748b', fontWeight: '600',
                                fontSize: '0.875rem', cursor: 'pointer'
                            }}
                        >
                            <Store size={18} />
                            Switch
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0 1.5rem 6rem 1.5rem',
                    display: 'flex', flexDirection: 'column', gap: '1.5rem'
                }}>

                    {/* Authentication Status Card */}
                    <div style={{
                        padding: '1rem',
                        backgroundColor: currentUser ? '#eff6ff' : '#fefce8',
                        borderRadius: '1rem',
                        border: `1px solid ${currentUser ? '#dbeafe' : '#fef9c3'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                {currentUser ? 'Signed in as' : 'Not Syncing'}
                            </span>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)' }}>
                                {currentUser ? currentUser.displayName || currentUser.email : 'Guest Mode'}
                            </span>
                        </div>
                        {currentUser ? (
                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 0.75rem', backgroundColor: 'white',
                                    border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                    color: '#dc2626', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login', { state: { from: location } })}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 0.75rem', backgroundColor: '#3b82f6',
                                    border: 'none', borderRadius: '0.5rem',
                                    color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                <LogIn size={16} /> Sign In
                            </button>
                        )}
                    </div>


                    {/* Main Profile Card */}
                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '1rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        {/* Dynamic Icon Header */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '6rem', height: '6rem',
                                borderRadius: '50%',
                                backgroundColor: `${activeColor}15`, // 10% opacity
                                color: activeColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 4px 6px -1px ${activeColor}30`,
                                transition: 'all 0.3s ease'
                            }}>
                                <SelectedIcon size={48} />
                            </div>
                        </div>

                        {/* Business Name Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)' }}>
                                    Business Name
                                </label>
                                {!isEditing && can('canEditCompanyProfile') && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Mama Put"
                                    autoFocus
                                />
                            ) : (
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)', wordBreak: 'break-word' }}>
                                    {name}
                                </div>
                            )}
                        </div>

                        {/* Business Type Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>
                                Business Type
                            </label>

                            {isEditing ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.5rem'
                                }}>
                                    {BUSINESS_TYPES.map((t) => {
                                        const TypeIcon = CATEGORY_ICONS[t];
                                        const tColor = CATEGORY_COLORS[t];
                                        const isSelected = type === t;
                                        return (
                                            <button
                                                key={t}
                                                onClick={() => setType(t)}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '0.5rem',
                                                    border: isSelected ? `2px solid ${tColor}` : '1px solid var(--color-border)',
                                                    backgroundColor: isSelected ? `${tColor}10` : 'transparent',
                                                    color: isSelected ? tColor : 'var(--color-text)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <TypeIcon size={20} />
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '1rem', backgroundColor: '#f8fafc',
                                    borderRadius: '0.75rem', border: '1px solid #e2e8f0'
                                }}>
                                    <SelectedIcon size={24} color={activeColor} />
                                    <span style={{ fontSize: '1.125rem', fontWeight: '500' }}>{type}</span>
                                </div>
                            )}
                        </div>

                        {/* Show Save Button ONLY when Editing */}
                        {isEditing && (
                            <Button
                                onClick={handleSave}
                                style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
                            >
                                Save Changes
                            </Button>
                        )}
                    </div>

                    {/* Company Managers - Only Visible for OWNER */}
                    {currentUser && isOwner && (
                        <button
                            onClick={() => navigate('/collaborators')}
                            style={{
                                width: '100%',
                                padding: '1.25rem',
                                backgroundColor: 'white',
                                borderRadius: '1rem',
                                border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                color: 'var(--color-text)',
                                fontSize: '1rem', fontWeight: '600'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                                    backgroundColor: '#ecfdf5', color: '#059669',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Users size={20} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div>Company Managers</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '400' }}>
                                        Manage partners and permissions
                                    </div>
                                </div>
                            </div>
                            <ChevronDown size={20} style={{ transform: 'rotate(-90deg)', color: 'var(--color-text-muted)' }} />
                        </button>
                    )}

                    {/* Danger Zone - Delete Business: Only for OWNER */}
                    {isOwner ? (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#FEF2F2',
                            borderRadius: '1rem',
                            border: '1px solid #FECACA'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#DC2626' }}>
                                <AlertTriangle size={24} />
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Danger Zone</h3>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#991B1B', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Deleting this business will remove all sales history, products, and expenses permanently.
                                <br /><strong>This action cannot be undone.</strong>
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowClearSales(true)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        backgroundColor: '#fff',
                                        border: '1px solid #DC2626',
                                        borderRadius: '0.75rem',
                                        color: '#DC2626',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                    Clear Sales
                                </button>
                                <button
                                    onClick={async () => {
                                        if (business.pin) {
                                            setShowDeletePin(true);
                                        } else {
                                            if (await confirm({
                                                title: 'Delete Business',
                                                message: `Are you sure you want to delete ${business.name}? This action is permanent.`,
                                                type: 'danger',
                                                confirmText: 'Delete Forever'
                                            })) {
                                                confirmDelete();
                                            }
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#DC2626', // Solid red for delete
                                        border: 'none',
                                        borderRadius: '0.75rem',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <AlertTriangle size={18} />
                                    Delete Biz
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#fff7ed',
                            borderRadius: '1rem',
                            border: '1px solid #fed7aa'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#c2410c' }}>
                                <LogOut size={24} />
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Leave Business</h3>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#9a3412', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                You will lose access to this business and its data. You can only rejoin if invited again.
                            </p>
                            <button
                                onClick={async () => {
                                    if (await confirm({
                                        title: 'Leave Business',
                                        message: `Are you sure you want to leave ${business.name}? You will lose access to all data.`,
                                        type: 'danger',
                                        confirmText: 'Leave Business'
                                    })) {
                                        try {
                                            await leaveBusiness(business.id);
                                            showToast('You have left the business', 'info');
                                            navigate('/');
                                        } catch (e) {
                                            showToast('Failed to leave business', 'error');
                                        }
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    backgroundColor: '#fff',
                                    border: '1px solid #c2410c',
                                    borderRadius: '0.75rem',
                                    color: '#c2410c',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <LogOut size={20} />
                                Leave Business
                            </button>
                        </div>
                    )}
                </div>

                <BusinessSwitcher
                    isOpen={isSwitcherOpen}
                    onClose={() => setIsSwitcherOpen(false)}
                    onUpgrade={() => navigate('/upgrade')}
                />

                <PinModal
                    isOpen={showDeletePin}
                    onClose={() => setShowDeletePin(false)}
                    onSuccess={confirmDelete}
                    mode="verify"
                />

                <ClearSalesModal
                    isOpen={showClearSales}
                    onClose={() => setShowClearSales(false)}
                />
            </div>
        </Layout>
    );
}
