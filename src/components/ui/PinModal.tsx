import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Lock, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mode: 'setup' | 'verify' | 'reset';
}

export function PinModal({ isOpen, onClose, onSuccess, mode }: PinModalProps) {
    const { business, updateBusiness } = useData();
    const { showToast } = useToast();
    const [pin, setPin] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'input' | 'otp'>(mode === 'reset' ? 'input' : 'input');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            setPhoneNumber('');
            setOtp('');
            setStep(mode === 'reset' ? 'input' : 'input');
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const handleSetup = () => {
        if (pin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }
        updateBusiness({ pin });
        onSuccess();
    };

    const handleVerify = () => {
        if (pin === business.pin) {
            onSuccess();
        } else {
            setError('Incorrect PIN');
        }
    };

    const handleRequestOtp = () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Invalid phone number');
            return;
        }
        // SIMULATE OTP
        showToast(`Your OTP code is: 1234`, 'info');
        updateBusiness({ phoneNumber }); // Save phone for future?
        setStep('otp');
        setError('');
    };

    const handleVerifyOtp = () => {
        if (otp === '1234') {
            // OTP Correct - Reset PIN
            updateBusiness({ pin: undefined }); // Clear PIN
            onSuccess(); // Triggers "Reset" success (usually asking caller to switch to setup)
        } else {
            setError('Invalid OTP');
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'setup': return 'Set Transaction PIN';
            case 'verify': return 'Enter Security PIN';
            case 'reset': return step === 'input' ? 'Reset PIN' : 'Enter OTP';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '18rem', padding: '1.25rem', position: 'relative', borderRadius: '1rem' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', color: 'var(--color-text-muted)' }}
                >
                    <X size={20} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.5rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
                        <Lock size={20} color="var(--color-primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{getTitle()}</h2>
                </div>

                {mode === 'reset' && step === 'input' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>
                            Enter your phone number to receive a verification code.
                        </p>
                        <Input
                            placeholder="Phone Number"
                            type="tel"
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            style={{ fontSize: '0.9rem', padding: '0.6rem' }}
                        />
                        {error && <p style={{ color: 'red', fontSize: '0.75rem', textAlign: 'center' }}>{error}</p>}
                        <Button onClick={handleRequestOtp} style={{ padding: '0.6rem' }}>Send OTP</Button>
                    </div>
                ) : mode === 'reset' && step === 'otp' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>
                            Enter the code sent to your phone.
                        </p>
                        <Input
                            placeholder="Enter OTP (1234)"
                            type="number"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            style={{ fontSize: '0.9rem', padding: '0.6rem', textAlign: 'center', letterSpacing: '0.25em' }}
                        />
                        {error && <p style={{ color: 'red', fontSize: '0.75rem', textAlign: 'center' }}>{error}</p>}
                        <Button onClick={handleVerifyOtp} style={{ padding: '0.6rem' }}>Verify & Reset</Button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {mode === 'setup' && (
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>
                                Create a 4-digit PIN to secure your sales history.
                            </p>
                        )}
                        <Input
                            placeholder="○ ○ ○ ○"
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pin}
                            onChange={e => {
                                const newPin = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                setPin(newPin);
                                setError(''); // Clear error on new input

                                // Auto-verify if correct
                                if (mode === 'verify' && newPin.length === 4) {
                                    if (newPin === business.pin) {
                                        onSuccess();
                                    }
                                    // If wrong, do nothing (wait for button click)
                                }
                            }}
                            style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem', padding: '0.6rem', fontWeight: 'bold' }}
                        />
                        {error && <p style={{ color: 'red', fontSize: '0.75rem', textAlign: 'center' }}>{error}</p>}
                        <Button onClick={mode === 'setup' ? handleSetup : handleVerify} style={{ padding: '0.6rem' }}>
                            {mode === 'setup' ? 'Set PIN' : 'Verify'}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
