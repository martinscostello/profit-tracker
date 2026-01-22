import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { NotificationService } from '../services/NotificationService';
import { StorageService } from '../services/StorageService';
import { SALE_REMINDERS, EXPENSE_REMINDERS } from '../utils/notificationMessages';

export function NotificationSettings() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Settings State
    const [enabled, setEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedTone, setSelectedTone] = useState<{ id: string, name: string }>({ id: 'default', name: 'System Default' });
    const [showTonePicker, setShowTonePicker] = useState(false);

    const TONES = [
        { id: 'default', name: 'System Default' },
        { id: 'silent', name: 'Silent' },
        { id: 'cash', name: 'Cash Register 💰' },
        { id: 'chime', name: 'Success Chime ✨' },
        { id: 'alert', name: 'Gentle Alert 🔔' },
        { id: 'spaceship', name: 'Spaceship 🚀' },
    ];

    // Reminders
    const [saleReminder, setSaleReminder] = useState({
        enabled: false,
        interval: 60, // minutes
        startTime: '08:00',
        endTime: '17:00'
    });

    const [expenseReminder, setExpenseReminder] = useState({
        enabled: false,
        interval: 120, // minutes
        startTime: '08:00',
        endTime: '17:00'
    });

    // Alerts
    const [lowStockAlert, setLowStockAlert] = useState(true);
    const [outOfStockAlert, setOutOfStockAlert] = useState(true);
    const [highExpenseAlert, setHighExpenseAlert] = useState(true);

    // Load Settings
    useEffect(() => {
        const load = async () => {
            const stored = StorageService.load('notification_settings', null);
            if (stored) {
                setEnabled(stored.enabled);
                setSoundEnabled(stored.soundEnabled);
                if (stored.selectedTone) setSelectedTone(stored.selectedTone);
                setSaleReminder(stored.saleReminder);
                setExpenseReminder(stored.expenseReminder);
                setLowStockAlert(stored.lowStockAlert);
                setOutOfStockAlert(stored.outOfStockAlert);
                setHighExpenseAlert(stored.highExpenseAlert);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save to Storage
            const settings = {
                enabled, soundEnabled, selectedTone, saleReminder, expenseReminder,
                lowStockAlert, outOfStockAlert, highExpenseAlert
            };
            StorageService.save('notification_settings', settings);

            // Re-schedule Notifications
            await NotificationService.cancel([...Array(100).keys()].map(i => i + 1000)); // Clear IDs 1000-1100 (Safe range for reminders)

            if (!enabled) {
                showToast('Notifications Disabled', 'info');
                return;
            }

            const notificationsToSchedule = [];

            // 1. Sale Reminders
            if (saleReminder.enabled) {
                const [sH, sM] = saleReminder.startTime.split(':').map(Number);
                const [eH, eM] = saleReminder.endTime.split(':').map(Number);
                const startMins = sH * 60 + sM;
                const endMins = eH * 60 + eM;

                let idCounter = 1000;
                const interval = saleReminder.interval > 0 ? saleReminder.interval : 60;

                for (let m = startMins; m < endMins; m += interval) {
                    const hour = Math.floor(m / 60);
                    const minute = m % 60;

                    // Pick Random Message
                    const msg = SALE_REMINDERS[Math.floor(Math.random() * SALE_REMINDERS.length)];

                    notificationsToSchedule.push({
                        id: idCounter++,
                        title: 'Track Your Sales 📈',
                        body: msg,
                        schedule: { on: { hour, minute }, allowWhileIdle: true },
                        channelId: soundEnabled && selectedTone.id !== 'silent' && selectedTone.id !== 'default' ? selectedTone.id : 'default'
                    });
                }
            }

            // 2. Expense Reminders
            if (expenseReminder.enabled) {
                const [sH, sM] = expenseReminder.startTime.split(':').map(Number);
                const [eH, eM] = expenseReminder.endTime.split(':').map(Number);
                const startMins = sH * 60 + sM;
                const endMins = eH * 60 + eM;

                let idCounter = 2000; // New range for expenses
                const interval = expenseReminder.interval > 0 ? expenseReminder.interval : 120;

                // Offset expenses by 5 mins if colliding? Random variation? 
                // Let's just follow the schedule.
                for (let m = startMins; m < endMins; m += interval) {
                    const hour = Math.floor(m / 60);
                    const minute = m % 60;

                    const msg = EXPENSE_REMINDERS[Math.floor(Math.random() * EXPENSE_REMINDERS.length)];

                    notificationsToSchedule.push({
                        id: idCounter++,
                        title: 'Track Expenses 📝',
                        body: msg,
                        schedule: { on: { hour, minute }, allowWhileIdle: true },
                        channelId: soundEnabled && selectedTone.id !== 'silent' && selectedTone.id !== 'default' ? selectedTone.id : 'default'
                    });
                }
            }

            if (notificationsToSchedule.length > 0) {
                await NotificationService.schedule({ notifications: notificationsToSchedule });
                console.log(`Scheduled ${notificationsToSchedule.length} notifications`);
            }

            showToast('Settings Saved & Reminders Scheduled!', 'success');
            navigate(-1);

        } catch (e) {
            console.error(e);
            showToast('Failed to save settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: '3rem', height: '1.75rem',
                backgroundColor: checked ? 'var(--color-primary)' : '#e2e8f0',
                borderRadius: '999px', position: 'relative', transition: 'background-color 0.2s'
            }}
        >
            <div style={{
                width: '1.25rem', height: '1.25rem', backgroundColor: 'white', borderRadius: '50%',
                position: 'absolute', top: '0.25rem', left: checked ? '1.5rem' : '0.25rem',
                transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }} />
        </button>
    );

    return (
        <Layout showNav={false}>
            <div style={{
                position: 'sticky', top: 0, backgroundColor: 'var(--color-bg)', zIndex: 20,
                paddingTop: 'calc(3rem + env(safe-area-inset-top))', paddingBottom: '1rem',
                paddingLeft: '1.5rem', paddingRight: '1.5rem', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0 }}>
                    <ArrowLeft size={24} color="var(--color-text)" />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Notification Settings</h1>
            </div>

            <div style={{ padding: '1.5rem', paddingBottom: '3rem' }}>
                <Card padding="1rem" className="mb-6" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bell size={20} className="text-gray-500" />
                            <span style={{ fontWeight: '500' }}>Enable Notifications</span>
                        </div>
                        <Toggle checked={enabled} onChange={setEnabled} />
                    </div>
                </Card>

                {enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Sale Reminders */}
                        <section>
                            <Card padding="1rem">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '500' }}>Remind me to add sales</span>
                                    <Toggle checked={saleReminder.enabled} onChange={v => setSaleReminder(prev => ({ ...prev, enabled: v }))} />
                                </div>
                                {saleReminder.enabled && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid #f0fdf4' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Frequency</label>
                                            <select
                                                value={[10, 60, 120, 180].includes(saleReminder.interval) ? saleReminder.interval : 'custom'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === 'custom') {
                                                        // Keep current interval but switch UI to show input
                                                        // Actually, just switching the select value isn't enough if state is bound to number.
                                                        // We force a re-render where we show input.
                                                        // Let's set interval to a non-standard value or handle the UI logic.
                                                        setSaleReminder(prev => ({ ...prev, interval: 30 })); // Default custom
                                                    } else {
                                                        setSaleReminder(prev => ({ ...prev, interval: parseInt(val) }));
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginTop: '0.25rem' }}
                                            >
                                                <option value={10}>Every 10 mins (Intense)</option>
                                                <option value={60}>Every Hour</option>
                                                <option value={120}>Every 2 Hours</option>
                                                <option value={180}>Every 3 Hours</option>
                                                <option value="custom">Custom (Timer)</option>
                                            </select>
                                            {/* Custom Input */}
                                            {![10, 60, 120, 180].includes(saleReminder.interval) && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Every (minutes)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={saleReminder.interval}
                                                        onChange={e => setSaleReminder(prev => ({ ...prev, interval: parseInt(e.target.value) || 0 }))}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>From</label>
                                                <input type="time" value={saleReminder.startTime} onChange={e => setSaleReminder(prev => ({ ...prev, startTime: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Until</label>
                                                <input type="time" value={saleReminder.endTime} onChange={e => setSaleReminder(prev => ({ ...prev, endTime: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </section>

                        {/* Expense Reminders */}
                        <section>
                            <Card padding="1rem">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '500' }}>Remind me to log expenses</span>
                                    <Toggle checked={expenseReminder.enabled} onChange={v => setExpenseReminder(prev => ({ ...prev, enabled: v }))} />
                                </div>
                                {expenseReminder.enabled && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.5rem', borderLeft: '2px solid #fff7ed' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Frequency</label>
                                            <select
                                                value={[10, 60, 120, 180].includes(expenseReminder.interval) ? expenseReminder.interval : 'custom'}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val === 'custom') {
                                                        setExpenseReminder(prev => ({ ...prev, interval: 30 }));
                                                    } else {
                                                        setExpenseReminder(prev => ({ ...prev, interval: parseInt(val) }));
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginTop: '0.25rem' }}
                                            >
                                                <option value={10}>Every 10 mins (Intense)</option>
                                                <option value={60}>Every Hour</option>
                                                <option value={120}>Every 2 Hours</option>
                                                <option value={180}>Every 3 Hours</option>
                                                <option value="custom">Custom (Timer)</option>
                                            </select>
                                            {/* Custom Input */}
                                            {![10, 60, 120, 180].includes(expenseReminder.interval) && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Every (minutes)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={expenseReminder.interval}
                                                        onChange={e => setExpenseReminder(prev => ({ ...prev, interval: parseInt(e.target.value) || 0 }))}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>From</label>
                                                <input type="time" value={expenseReminder.startTime} onChange={e => setExpenseReminder(prev => ({ ...prev, startTime: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Until</label>
                                                <input type="time" value={expenseReminder.endTime} onChange={e => setExpenseReminder(prev => ({ ...prev, endTime: e.target.value }))}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </section>

                        {/* Alerts */}
                        <section>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Smart Alerts
                            </h3>
                            <Card padding="0" className="overflow-hidden">
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>Low Stock Warning</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Notify when stock &le; 5</p>
                                    </div>
                                    <Toggle checked={lowStockAlert} onChange={setLowStockAlert} />
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>Out of Stock Alert</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Notify when stock is 0</p>
                                    </div>
                                    <Toggle checked={outOfStockAlert} onChange={setOutOfStockAlert} />
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>Expense Reduction</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Warn if expenses &gt; 80%</p>
                                    </div>
                                    <Toggle checked={highExpenseAlert} onChange={setHighExpenseAlert} />
                                </div>
                            </Card>
                        </section>

                        {/* General */}
                        <section>
                            <Card padding="1rem">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontWeight: '500' }}>Notification Sound</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Play sound for alerts</p>
                                        </div>
                                        <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
                                    </div>

                                    {soundEnabled && (
                                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>Tone Preference</p>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '0.25rem' }}>
                                                        {selectedTone.name}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowTonePicker(true)}
                                                    style={{
                                                        color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '500',
                                                        padding: '0.5rem 1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem'
                                                    }}
                                                >
                                                    Tap to change
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </section>

                        <Button onClick={handleSave} disabled={loading} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.125rem' }}>
                            {loading ? 'Saving...' : 'Save Preferences'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Tone Picker Modal */}
            {showTonePicker && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                }} onClick={() => setShowTonePicker(false)}>
                    <div style={{
                        backgroundColor: 'var(--color-surface)',
                        borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem',
                        padding: '1.5rem', paddingBottom: '3rem',
                        animation: 'slide-up 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Select Tone</h3>
                            <button onClick={() => setShowTonePicker(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: '600' }}>Done</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {TONES.map(tone => (
                                <button
                                    key={tone.id}
                                    onClick={() => {
                                        setSelectedTone(tone);
                                        // Play preview
                                        if (tone.id !== 'default' && tone.id !== 'silent') {
                                            new Audio(`/assets/sounds/${tone.id}.wav`).play().catch(e => console.log('Audio play failed', e));
                                        }
                                    }}
                                    style={{
                                        padding: '1rem',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: selectedTone.id === tone.id ? '#f0fdf4' : 'var(--color-surface)',
                                        color: selectedTone.id === tone.id ? '#166534' : 'inherit',
                                        borderRadius: '0.75rem',
                                        marginBottom: '0.5rem',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {/* Simple icon based on type */}
                                        {tone.id === 'silent' ? <span>🔕</span> : tone.id === 'default' ? <span>📱</span> : <span>🔊</span>}
                                        <span style={{ fontWeight: selectedTone.id === tone.id ? '600' : '400' }}>{tone.name}</span>
                                    </div>
                                    {selectedTone.id === tone.id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#16a34a' }}>Active</span>
                                            <span>✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>
                                Tap to select & preview.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
