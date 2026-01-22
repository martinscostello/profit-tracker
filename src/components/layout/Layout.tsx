import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { OnboardingGuide } from '../ui/OnboardingGuide';
import { usePermissions } from '../../hooks/usePermissions';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { SwipeBackHandler } from '../logic/SwipeBackHandler';

export function Layout({ children, showNav = true, disablePadding = false, ignoreLock = false }: { children: ReactNode; showNav?: boolean; disablePadding?: boolean; ignoreLock?: boolean }) {
    const { role } = usePermissions();
    const navigate = useNavigate();

    // Manager Lockout for Offline Access
    if (role === 'LOCKED' && !ignoreLock) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--color-bg)',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
                    padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem'
                }}>
                    <Lock size={48} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Access Locked</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    You need to be logged in to access this business.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        backgroundColor: '#2563eb', // Blue
                        color: 'white',
                        padding: '0.875rem 2rem',
                        borderRadius: '0.75rem',
                        fontWeight: '600',
                        fontSize: '1rem',
                        border: 'none',
                        width: '100%',
                        maxWidth: '300px',
                        marginBottom: '1rem'
                    }}
                >
                    Log In to Access
                </button>
                <div
                    onClick={() => {
                        localStorage.removeItem('active_business_id');
                        window.location.reload();
                    }}
                    style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '0.9rem',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    Switch to another business
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100%', // Full native height
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-bg)',
            overflow: 'hidden' // No outer scroll
        }}>
            <SwipeBackHandler />
            {/* Scrollable Content Area */}
            <main style={{
                flex: 1,
                overflowY: disablePadding ? 'hidden' : 'auto', // Dashboard handles its own scroll, others scroll here
                overflowX: 'hidden',
                position: 'relative', // Context for sticky headers
                paddingBottom: showNav && !disablePadding ? '5rem' : '0',
                overscrollBehaviorY: 'none' // Prevent bounce on list end
            }}>
                {children}
            </main>

            {showNav && <BottomNav />}
            <OnboardingGuide />
        </div>
    );
}
