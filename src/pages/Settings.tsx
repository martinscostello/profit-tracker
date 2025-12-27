
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { User, Crown, HelpCircle, FileText, Database, ChevronRight, Lock, DollarSign, Calculator, Receipt, Building2, Bell, LogOut } from 'lucide-react';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { CurrencyModal } from '../components/ui/CurrencyModal';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../constants/currencies';
import { NotificationBell } from '../components/ui/NotificationBell';

interface SettingItem {
    icon: any;
    label: string;
    sub?: string;
    value?: string | React.ReactNode;
    color?: string;
    iconColor?: string;
    action?: boolean;
    onClick?: () => void;
}

export function Settings() {
    const { business, updateBusiness } = useData();
    const { currentUser, updateProfile, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

    // Profile State
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [loadingName, setLoadingName] = useState(false);

    const handleUpdateName = async () => {
        if (!displayName.trim()) return;
        setLoadingName(true);
        try {
            await updateProfile({ displayName });
            setIsEditingName(false);
        } catch (error) {
            console.error(error);
            showToast('Failed to update name', 'error');
        } finally {
            setLoadingName(false);
        }
    };

    const currentFlag = CURRENCIES.find(c => c.symbol === business.currency)?.flag || business.currency;

    const { can } = usePermissions();

    // ... (rest of state)

    const getPlanDetails = () => {
        if (!business.isPro) return { label: 'Free Plan', color: '#3b82f6' }; // Blue
        switch (business.plan) {
            case 'LITE': return { label: 'Lite Plan', color: '#16a34a' }; // Green
            case 'ENTREPRENEUR': return { label: 'Entrepreneur', color: '#9333ea' }; // Purple
            case 'UNLIMITED': return { label: 'Unlimited', color: '#eab308' }; // Gold
            default: return { label: 'Pro Plan', color: '#9333ea' };
        }
    };
    const planDetails = getPlanDetails();

    const sections: { title: string; items: SettingItem[] }[] = [
        {
            title: 'Account',
            items: [
                {
                    icon: Crown,
                    label: 'Subscription Status',
                    value: planDetails.label,
                    color: planDetails.color,
                    iconColor: planDetails.color
                },
                {
                    icon: User,
                    label: business.isPro ? 'Manage Plans' : 'Upgrade to Pro',
                    sub: business.isPro ? 'View subscription details' : 'Unlock advanced features',
                    action: true,
                    iconColor: '#9333ea',
                    onClick: () => {
                        if (business.isPro) navigate('/upgrade');
                        else setIsUpgradeOpen(true);
                    }
                }
            ]
        },
        {
            title: 'Business',
            items: [
                can('canManageSettings') && {
                    icon: Building2,
                    label: 'Company Profile',
                    sub: 'Edit Name & Business Type',
                    action: true,
                    iconColor: '#3b82f6', // Blue
                    onClick: () => navigate('/settings/company-profile')
                },
                can('canManageSettings') && {
                    icon: DollarSign,
                    label: 'Currency',
                    value: currentFlag,
                    action: true,
                    iconColor: '#3b82f6', // Blue
                    onClick: () => setIsCurrencyOpen(true)
                },
                can('canManageSettings') && {
                    icon: Database, // Backup
                    label: 'Backup Settings',
                    sub: 'Local & Cloud Backup',
                    action: true,
                    iconColor: '#3b82f6', // Blue
                    onClick: () => navigate('/settings/backup')
                }
            ].filter(Boolean) as SettingItem[]
        },
        {
            title: 'Preferences',
            items: [
                {
                    icon: Bell,
                    label: 'Notifications',
                    sub: 'Reminders & Alerts',
                    action: true,
                    iconColor: '#F97316',
                    onClick: () => navigate('/notifications/settings')
                }
            ]
        },
        {
            title: 'Tools',
            items: [
                {
                    icon: Calculator,
                    label: 'Tax Insight ⭐️',
                    sub: 'New 2026 Law Estimates',
                    iconColor: '#F97316', // Orange
                    action: true,
                    value: !business.isPro ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Lock size={16} color="#eab308" fill="#eab308" />
                        </div>
                    ) : undefined,
                    onClick: () => {
                        if (business.isPro) navigate('/tax-insight');
                        else setIsUpgradeOpen(true);
                    }
                },
                can('canManageSettings') && {
                    icon: Receipt,
                    label: 'Expense Categories',
                    iconColor: '#F97316', // Orange
                    action: true,
                    onClick: () => navigate('/settings/expense-categories')
                }
            ].filter(Boolean) as SettingItem[]
        },
        {
            title: 'Security',
            items: [
                can('canManageSettings') && {
                    icon: Lock,
                    label: 'Transaction PIN',
                    sub: 'Secure your sales history',
                    action: true,
                    iconColor: '#eab308', // Gold
                    onClick: () => navigate('/settings/transaction-pin')
                }
            ].filter(Boolean) as SettingItem[]
        },
        {
            title: 'Help',
            items: [
                {
                    icon: HelpCircle,
                    label: 'How it Works',
                    action: true,
                    onClick: () => navigate('/settings/guide')
                },
                {
                    icon: FileText,
                    label: 'Contact Support',
                    action: true,
                    onClick: () => navigate('/settings/contact')
                }
            ]
        },
        // Developer option - Only for Owners/Devs really, keep for testing but maybe restrict too?
        // User didn't ask to restrict this specifically but good practice.
        {
            title: 'Development (Testing)',
            items: [
                can('canManageSettings') && {
                    icon: Lock,
                    label: 'Reset Pro Status',
                    sub: 'Downgrade to Free for testing',
                    action: true,
                    iconColor: '#ef4444',
                    onClick: () => {
                        updateBusiness({ isPro: false });
                        showToast('Downgraded to Free Plan', 'success');
                    }
                }
            ].filter(Boolean) as SettingItem[]
        }
    ].filter(section => section.items.length > 0);

    return (
        <Layout>
            <div style={{
                paddingBottom: '6rem',
                // Remove top padding from container, move to header
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
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Settings</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{business.name || 'My Business'}</p>
                    </div>
                    <NotificationBell />
                </div>

                {/* Profile Section */}
                <div style={{ marginBottom: '2rem', padding: '0 1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '0.75rem', marginLeft: '0.5rem' }}>
                        PROFILE
                    </h3>
                    <Card padding="1rem" className="overflow-hidden">
                        {isEditingName ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text)'
                                    }}
                                />
                                <button
                                    onClick={handleUpdateName}
                                    disabled={loadingName}
                                    style={{
                                        padding: '0 1rem', borderRadius: '0.5rem',
                                        backgroundColor: 'var(--color-primary)', color: 'white', border: 'none',
                                        cursor: loadingName ? 'not-allowed' : 'pointer',
                                        opacity: loadingName ? 0.7 : 1
                                    }}
                                >
                                    {loadingName ? '...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '3rem', height: '3rem', borderRadius: '50%',
                                        backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.25rem'
                                    }}>
                                        {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User size={20} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{currentUser?.displayName || 'Guest User'}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{currentUser?.email || 'No Email'}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    style={{ color: 'var(--color-primary)', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' }}
                                >
                                    Edit
                                </button>
                            </div>
                        )}
                        {!currentUser?.displayName && !isEditingName && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}>
                                * Set a name so teammates know who you are.
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0 1.5rem' }}>
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '0.75rem', marginLeft: '0.5rem' }}>
                                {section.title}
                            </h3>
                            <Card padding="0" className="overflow-hidden">
                                {section.items.map((item, itemIdx) => (
                                    <div
                                        key={itemIdx}
                                        onClick={item.onClick}
                                        style={{
                                            padding: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottom: itemIdx !== section.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            cursor: item.action ? 'pointer' : 'default'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                padding: '0.5rem',
                                                backgroundColor: `${item.iconColor}15` || 'var(--color-surface)', // 15 = roughly 10% opacity hex
                                                borderRadius: '0.5rem',
                                                color: item.iconColor || 'var(--color-primary)'
                                            }}>
                                                <item.icon size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{item.label}</div>
                                                {item.sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.sub}</div>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {item.value && (
                                                <span style={{ fontSize: '0.875rem', color: item.color || 'var(--color-text-muted)', fontWeight: '500' }}>{item.value}</span>
                                            )}
                                            {item.action && (
                                                <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                    <button
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to log out? You will be disconnected from the cloud, but your local data will remain on this device.')) {
                                await logout();
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '0.75rem',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        <LogOut size={20} />
                        Log Out
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    <p>ProfitTrack v1.1.0</p>
                    <p>Built for small business owners</p>
                </div>

                <UpgradeModal
                    isOpen={isUpgradeOpen}
                    onClose={() => setIsUpgradeOpen(false)}
                />

                <CurrencyModal
                    isOpen={isCurrencyOpen}
                    onClose={() => setIsCurrencyOpen(false)}
                    currentCurrency={business.currency}
                    onSelect={(curr) => {
                        updateBusiness({ currency: curr });
                        setIsCurrencyOpen(false);
                    }}
                />
            </div>
        </Layout>
    );
}
