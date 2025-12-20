
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../components/ui/Button';

interface DialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
}

interface DialogContextType {
    confirm: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<DialogOptions>({ title: '', message: '' });
    const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => { });

    const confirm = (opts: DialogOptions): Promise<boolean> => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise((resolve) => {
            setResolveRef(() => resolve);
        });
    };

    const handleClose = (result: boolean) => {
        setIsOpen(false);
        resolveRef(result);
    };

    return (
        <DialogContext.Provider value={{ confirm }}>
            {children}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1.5rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '320px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                            {options.title}
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            {options.message}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button
                                variant="secondary"
                                onClick={() => handleClose(false)}
                                style={{ flex: 1 }}
                            >
                                {options.cancelText || 'Cancel'}
                            </Button>
                            <Button
                                onClick={() => handleClose(true)}
                                style={{
                                    flex: 1,
                                    backgroundColor: options.type === 'danger' ? '#EF4444' : 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                {options.confirmText || 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </DialogContext.Provider>
    );
}
