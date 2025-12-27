import { useNotifications } from '../context/NotificationContext';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
    const navigate = useNavigate();
    const { notifications, markAsRead, clearAll } = useNotifications();

    return (
        <Layout showNav={false}>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: '2rem'
            }}>
                <div style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--color-bg)',
                    zIndex: 20,
                    paddingTop: 'calc(2rem + env(safe-area-inset-top))',
                    paddingBottom: '1rem',
                    paddingLeft: '1.5rem',
                    paddingRight: '1.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
                            <ArrowLeft size={24} color="var(--color-text)" />
                        </button>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Notifications</h1>
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', fontWeight: '500' }}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <div style={{ padding: '0 1.5rem', flex: 1 }}>
                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-muted)' }}>
                            <Bell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {notifications.map(n => (
                                <Card
                                    key={n.id}
                                    padding="1rem"
                                    onClick={() => {
                                        markAsRead(n.id);
                                        if (n.actionLink) navigate(n.actionLink);
                                    }}
                                    className={n.read ? 'bg-white' : 'bg-blue-50 border-blue-100'}
                                >
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                            backgroundColor: n.type === 'alert' ? '#fee2e2' : n.type === 'reminder' ? '#e0f2fe' : '#f1f5f9',
                                            color: n.type === 'alert' ? '#ef4444' : n.type === 'reminder' ? '#0284c7' : '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Bell size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <h3 style={{ fontWeight: !n.read ? '700' : '500', fontSize: '0.95rem' }}>{n.title}</h3>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                                                {n.body}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: '0.5rem' }} />
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
