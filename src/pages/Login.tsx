import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/layout/Layout';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '../utils/api';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export function Login() {
    const { googleLogin, signInAsGuest, currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(true);

    const isNative = Capacitor.isNativePlatform();

    console.log("Current API URL:", import.meta.env.VITE_API_URL || "Using dynamic fallback");
    console.log("Current Origin:", window.location.origin);
    console.log("Is Native:", isNative);

    useEffect(() => {
        // Init Google Auth for native
        if (isNative) {
            GoogleAuth.initialize();
        }
    }, [isNative]);

    useEffect(() => {
        // Fallback for loading state - check if SDK is already there
        if (!isNative && typeof window !== 'undefined' && (window as any).google) {
            setIsGoogleLoading(false);
            return;
        }

        const checkSdk = setInterval(() => {
            if (!isNative && typeof window !== 'undefined' && (window as any).google) {
                setIsGoogleLoading(false);
                clearInterval(checkSdk);
            }
        }, 500);

        const timer = setTimeout(() => {
            setIsGoogleLoading(false);
            clearInterval(checkSdk);
        }, 10000); // 10s fallback

        return () => {
            clearInterval(checkSdk);
            clearTimeout(timer);
        };
    }, [isNative]);

    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        if (currentUser) {
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, from]);

    const handleNativeGoogleLogin = async () => {
        try {
            const user = await GoogleAuth.signIn();
            if (user.authentication.idToken) {
                await googleLogin(user.authentication.idToken);
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            console.error("Native Google Login Failed:", err);
            // Don't show technical error if user cancelled
            if (err.message !== 'CHOSEN_ACCOUNT_CANCELLED') {
                const errorDetail = err.message || JSON.stringify(err);
                setError('Google Login Failed: ' + errorDetail);
                showToast(`Google Sign-in Failed: ${errorDetail}`, "error");
            }
        }
    };

    if (currentUser) {
        return null;
    }

    return (
        <Layout>
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '80vh', padding: '2rem', textAlign: 'center'
            }}>
                <div style={{
                    backgroundColor: 'var(--color-surface)',
                    padding: '2rem', borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    maxWidth: '400px', width: '100%'
                }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Welcome to DailyProfit
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Sign in to sync your data and manage your business from anywhere.
                    </p>

                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2', color: '#dc2626',
                            padding: '0.75rem', borderRadius: '0.5rem',
                            marginBottom: '1rem', fontSize: '0.875rem',
                            textAlign: 'left'
                        }}>
                            <div style={{ fontWeight: 'bold' }}>{error}</div>
                        </div>
                    )}

                    {!isNative && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', textAlign: 'left', opacity: 0.6 }}>
                            <div>API: {import.meta.env.VITE_API_URL || "Dynamic"}</div>
                            <div>Origin: {window.location.origin}</div>
                            <div>Google SDK: {((window as any).googleLoadError) ? 'Blocked/Error' : ((window as any).google ? 'Loaded' : 'Waiting...')} (Secure: {window.isSecureContext ? 'Yes' : 'No'})</div>
                        </div>
                    )}

                    <div style={{
                        marginBottom: '1rem',
                        width: '100%',
                        minHeight: '44px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative' // For relative positioning of fallback/loading
                    }}>
                        {isNative ? (
                            <button
                                onClick={handleNativeGoogleLogin}
                                style={{
                                    width: '100%',
                                    maxWidth: '280px',
                                    height: '44px',
                                    backgroundColor: '#4285F4',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18">
                                    <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.701-1.566 2.684-3.874 2.684-6.615z" />
                                    <path fill="#fff" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                                    <path fill="#fff" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
                                    <path fill="#fff" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.483 0 2.443 2.043.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
                                </svg>
                                Continue with Google
                            </button>
                        ) : (
                            <>
                                <GoogleLogin
                                    onSuccess={(credentialResponse: CredentialResponse) => {
                                        setIsGoogleLoading(false);
                                        if (credentialResponse.credential) {
                                            googleLogin(credentialResponse.credential).then(() => {
                                                navigate(from, { replace: true });
                                            }).catch(err => {
                                                setError('Google Sync failed: ' + (err.response?.data?.error || err.message));
                                            });
                                        }
                                    }}
                                    onError={() => {
                                        console.error('Google Login Error');
                                        setError('Google Sign-In failed to load. Check console/network.');
                                        setIsGoogleLoading(false);
                                    }}
                                    theme="filled_blue"
                                    size="large"
                                    width="280" // Slightly smaller for better mobile fit
                                    shape="rectangular"
                                />
                                {isGoogleLoading && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        fontSize: '0.875rem',
                                        color: 'var(--color-text-muted)',
                                        pointerEvents: 'none'
                                    }}>
                                        Loading Google Sign-In...
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        onClick={async () => {
                            try {
                                await signInAsGuest();
                                navigate(from, { replace: true });
                            } catch (err: any) {
                                console.error("Guest login error:", err);
                                const msg = err.response?.data?.details || err.message || 'Unknown error';
                                setError(`Guest Login Failed: ${msg}. (Target: ${api.defaults.baseURL})`);
                                showToast(`Login Error: ${msg}`, 'error');
                            }
                        }}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: 'white',
                            color: '#64748b',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.5rem',
                            fontSize: '1rem', fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </Layout>
    );
}
