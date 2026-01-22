import { useState } from 'react';
import { Home, Package, Plus, Wallet, Settings, X, TrendingUp, Receipt } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isFabOpen, setIsFabOpen] = useState(false);

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Plus, label: '', path: '/add-sale', isFab: true },
        { icon: Wallet, label: 'Expenses', path: '/expenses' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <>
            {/* Backdrop for FAB Menu */}
            {isFabOpen && (
                <div
                    onClick={() => setIsFabOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 9998,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                maxWidth: '100vw',
                margin: 0,
                padding: '0.5rem 0', // Grid handles internal spacing
                paddingBottom: '10px', // Lifted 10px from bottom for safety/aesthetics
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                alignItems: 'end', // Align to bottom to handle FAB popping up
                zIndex: 9999,
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    if (item.isFab) {
                        return (
                            <div key={item.path} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                {/* Speed Dial Menu */}
                                {isFabOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '5.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        width: 'max-content'
                                    }}>
                                        {/* Add Expense Option */}
                                        <div
                                            className="animate-bubble-1"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                opacity: 0 // Start hidden
                                            }}
                                        >
                                            <span style={{
                                                color: 'white',
                                                fontWeight: '600',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.875rem',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }}>
                                                Add Expense
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigate('/expenses?mode=add');
                                                    setIsFabOpen(false);
                                                }}
                                                style={{
                                                    width: '3.5rem',
                                                    height: '3.5rem',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#f97316',
                                                    color: 'white',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Receipt size={24} />
                                            </button>
                                        </div>

                                        {/* Add Sale Option */}
                                        <div
                                            className="animate-bubble-2"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                opacity: 0
                                            }}
                                        >
                                            <span style={{
                                                color: 'white',
                                                fontWeight: '600',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.875rem',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                            }}>
                                                Add Sale
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigate('/add-sale');
                                                    setIsFabOpen(false);
                                                }}
                                                style={{
                                                    width: '3.5rem',
                                                    height: '3.5rem',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--color-primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <TrendingUp size={24} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Main FAB Button */}
                                <button
                                    className="fab-add-sale"
                                    onClick={() => setIsFabOpen(!isFabOpen)}
                                    style={{
                                        backgroundColor: isFabOpen ? '#ef4444' : 'var(--color-primary)', // Red when open
                                        width: '4.5rem',
                                        height: '4.5rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'absolute',
                                        bottom: '0.5rem', // Lift it up
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        color: 'white',
                                        border: '4px solid var(--color-surface)',
                                        zIndex: 10,
                                        transition: 'background-color 0.2s, transform 0.2s',
                                        transform: isFabOpen ? 'rotate(90deg)' : 'none'
                                    }}
                                >
                                    {isFabOpen ? <X size={32} strokeWidth={2.5} /> : <Plus size={32} strokeWidth={2.5} />}
                                </button>
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.path}
                            onClick={() => {
                                setIsFabOpen(false); // Close if clicking other tabs
                                navigate(item.path);
                            }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'none',
                                border: 'none',
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                fontSize: '0.75rem',
                                gap: '0.25rem',
                                marginTop: '0.25rem',
                                width: '100%',
                                padding: '0.5rem 0' // Balanced padding
                            }}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%'
                            }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}
