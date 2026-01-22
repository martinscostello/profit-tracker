import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { ChevronRight, Check, Moon, Sun, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function AppearanceSettings() {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const options = [
        {
            id: 'system',
            label: 'System Default',
            icon: Smartphone,
            description: 'Match your device appearance'
        },
        {
            id: 'light',
            label: 'Light Mode',
            icon: Sun,
            description: 'Always use light appearance'
        },
        {
            id: 'dark',
            label: 'Dark Mode',
            icon: Moon,
            description: 'Always use dark appearance'
        }
    ] as const;

    return (
        <Layout>
            <div style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--color-bg)',
                zIndex: 20,
                paddingTop: 'calc(var(--header-top-spacing) + env(safe-area-inset-top))',
                paddingBottom: '1rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none', border: 'none', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-text)'
                    }}
                >
                    <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Appearance</h1>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <h3 style={{
                    fontSize: '0.875rem', fontWeight: '500',
                    color: 'var(--color-text-muted)', marginBottom: '0.75rem', marginLeft: '0.5rem'
                }}>
                    THEME
                </h3>
                <Card padding="0" className="overflow-hidden">
                    {options.map((option, idx) => (
                        <div
                            key={option.id}
                            onClick={() => setTheme(option.id)}
                            style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: idx !== options.length - 1 ? '1px solid var(--color-border)' : 'none',
                                cursor: 'pointer',
                                backgroundColor: theme === option.id ? 'var(--color-bg-subtle)' : 'transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    backgroundColor: 'var(--color-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--color-text)'
                                }}>
                                    <option.icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500', color: 'var(--color-text)' }}>{option.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{option.description}</div>
                                </div>
                            </div>

                            {theme === option.id && (
                                <div style={{
                                    color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center'
                                }}>
                                    <Check size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                </Card>
            </div>
        </Layout>
    );
}
