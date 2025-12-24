import { useState } from 'react';
import { X, FileSpreadsheet, HardDrive, Link as LinkIcon } from 'lucide-react';
import { GoogleSheetsService } from '../../services/GoogleSheetsService';
import { useToast } from '../../context/ToastContext';

interface SheetLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportProducts: (products: any[]) => void;
    onLocalImport: () => void; // New prop for legacy import
    currentSheetName?: string | null;
    businessId?: string;
}

export function SheetLinkModal({ isOpen, onClose, onImportProducts, onLocalImport, currentSheetName, businessId }: SheetLinkModalProps) {
    const { showToast } = useToast();
    const [mode, setMode] = useState<'SELECT' | 'SHEET' | 'FILE'>('SELECT');
    const [sheetUrl, setSheetUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleLocal = () => {
        onLocalImport();
        onClose();
    };

    const handleSheetLink = async () => {
        const sheetId = GoogleSheetsService.extractSheetId(sheetUrl);
        if (!sheetId) {
            showToast("Invalid Google Sheet Link", "error");
            return;
        }

        const accessToken = localStorage.getItem('google_access_token');
        if (!accessToken) {
            showToast("Please Log Out and Log In with Google to enable Sheets access.", "error");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Fetch Metadata (Name)
            let sheetName = "Google Sheet";
            try {
                const meta = await GoogleSheetsService.fetchSheetMetadata(accessToken, sheetId);
                if (meta.properties && meta.properties.title) {
                    sheetName = meta.properties.title;
                }
            } catch (ignored) {
                console.warn("Could not fetch sheet metadata", ignored);
            }

            // 2. Fetch Data
            const rows = await GoogleSheetsService.fetchSheetData(accessToken, sheetId);
            const products = GoogleSheetsService.parseProducts(rows);

            if (products.length === 0) {
                showToast("No products found. Check your columns (Name, Price)", "error");
            } else {
                onImportProducts(products);
                showToast(`Synced with "${sheetName}"! Found ${products.length} items.`, "success");

                // Save details for auto-sync (Scoped to business)
                if (businessId) {
                    localStorage.setItem(`linked_sheet_id_${businessId}`, sheetId);
                    localStorage.setItem(`linked_sheet_name_${businessId}`, sheetName);
                } else {
                    // Fallback for legacy/global (should generally be avoided now)
                    localStorage.setItem('linked_sheet_id', sheetId);
                    localStorage.setItem('linked_sheet_name', sheetName);
                }

                onClose();
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message || "Unknown error";
            if (msg.includes('403')) {
                showToast("Access Denied (403). Enable Sheets API in Cloud Console.", "error");
            } else if (msg.includes('401')) {
                showToast("Unauthorized (401). Please re-login.", "error");
            } else {
                showToast(`Failed: ${msg}`, "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '100%', maxWidth: '400px',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Import Products
                </h2>

                {mode === 'SELECT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => setMode('SHEET')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', borderRadius: '0.75rem',
                                border: `1px solid ${currentSheetName ? '#22c55e' : 'var(--color-border)'}`,
                                backgroundColor: currentSheetName ? '#f0fdf4' : 'var(--color-bg)',
                                cursor: 'pointer', textAlign: 'left'
                            }}
                        >
                            <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem', color: '#16a34a' }}>
                                <FileSpreadsheet size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {currentSheetName ? 'Change Linked Sheet' : 'Link Google Sheet'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {currentSheetName ? (
                                        <span>Current: <strong>{currentSheetName}</strong></span>
                                    ) : (
                                        'Auto-syncs prices & stock from Sheet'
                                    )}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleLocal}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                padding: '1rem', borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg)',
                                cursor: 'pointer', textAlign: 'left'
                            }}
                        >
                            <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', color: '#0284c7' }}>
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Local Backup</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Import JSON backup from device</div>
                            </div>
                        </button>
                    </div>
                )}

                {mode === 'SHEET' && (
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Paste the link to your Google Sheet. We'll look for columns like <b>Name</b>, <b>Price</b>, and <b>Stock</b>.
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Google Sheet Link</label>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.75rem', gap: '0.5rem' }}>
                                <LinkIcon size={16} color="var(--color-text-muted)" />
                                <input
                                    type="text"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={sheetUrl}
                                    onChange={(e) => setSheetUrl(e.target.value)}
                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', background: 'transparent', color: 'var(--color-text)' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setMode('SELECT')}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', fontWeight: '600' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSheetLink}
                                disabled={isLoading}
                                style={{
                                    flex: 2, padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
                                    backgroundColor: '#16a34a', color: 'white', fontWeight: '600',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                {isLoading ? 'Linking...' : 'Link Sheet'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
