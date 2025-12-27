import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useData } from '../context/DataContext';
import { ChevronLeft, Cloud, Download, RefreshCcw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BackupSettings() {
    const navigate = useNavigate();
    const { products, sales, business, syncStatus, syncDataNow } = useData();
    const [backupFreq, setBackupFreq] = useState('daily');

    const handleDownload = () => {
        const data = {
            products,
            sales,
            business,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Layout showNav={false}>
            <div style={{
                padding: '1.5rem',
                paddingTop: 'calc(3rem + env(safe-area-inset-top))',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, marginRight: '1rem' }}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Backup Settings</h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Local Backup Section */}
                    <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                                <Save size={20} />
                            </div>
                            <h3 style={{ fontWeight: '600' }}>Local Backup</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Save your data to this device.
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Backup Frequency</label>
                            <select
                                value={backupFreq}
                                onChange={(e) => setBackupFreq(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'white',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="manual">Manual Only</option>
                                <option value="daily">Daily (Automatic)</option>
                                <option value="weekly">Weekly (Automatic)</option>
                                <option value="monthly">Monthly (Automatic)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleDownload}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontWeight: '600'
                            }}
                        >
                            <Download size={20} />
                            Download Data
                        </button>
                    </div>

                    {/* Cloud Backup Section (Locked) */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', opacity: 0.7 }}>
                            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                                <Cloud size={20} />
                            </div>
                            <h3 style={{ fontWeight: '600' }}>Cloud Backup</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Automatically sync your data to the cloud and restore on any device.
                        </p>

                        {/* Lock Removed for Manual Sync Access */}

                        <button
                            onClick={syncDataNow}
                            disabled={syncStatus === 'syncing'}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontWeight: '600',
                                opacity: syncStatus === 'syncing' ? 0.7 : 1,
                                cursor: syncStatus === 'syncing' ? 'wait' : 'pointer'
                            }}
                        >
                            <RefreshCcw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Cloud Now'}
                        </button>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
