import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/layout/Layout';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import type { SignInWithAppleResponse, SignInWithAppleOptions } from '@capacitor-community/apple-sign-in';
import { Capacitor } from '@capacitor/core';


export function Login() {
    const { googleLogin, appleLogin, currentUser } = useAuth();
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
            await GoogleAuth.signOut(); // FORCE: Clear cached session to get fresh token
            const user = await GoogleAuth.signIn();
            if (user.authentication.idToken) {
                await googleLogin(user.authentication.idToken, user.authentication.accessToken);
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

    const handleAppleLogin = async () => {
        try {
            const options: SignInWithAppleOptions = {
                clientId: 'com.brimarcglobal.dailyprofit', // Bundle ID
                redirectURI: 'https://dailyprofit.app/', // Not used for native but required by type sometimes
                scopes: 'name email',
                state: '12345',
                nonce: 'nonce',
            };

            const result: SignInWithAppleResponse = await SignInWithApple.authorize(options);

            if (result.response && result.response.identityToken) {
                await appleLogin(result.response.identityToken, result.response.givenName, result.response.familyName);
                navigate(from, { replace: true });
            }
        } catch (error: any) {
            console.error("Apple Sign In Failed:", error);
            if (error.code !== '1001') { // Canceled
                showToast(`Apple Sign-in Failed: ${error.message}`, "error");
            }
        }
    };

    // Server Config Handlers Removed (Cleanup)



    if (currentUser) {
        return null;
    }

    return (
        <Layout ignoreLock={true}>
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
                    {/* ... rest of UI ... */}
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
                            <div className="w-full flex justify-center relative">
                                <GoogleLogin
                                    onSuccess={response => {
                                        setIsGoogleLoading(false);
                                        if (response.credential) {
                                            googleLogin(response.credential).then(() => {
                                                navigate(from, { replace: true });
                                            }).catch(err => {
                                                setError('Google Sync failed: ' + (err.response?.data?.error || err.message));
                                            });
                                        }
                                    }}
                                    onError={() => {
                                        console.log('Login Failed');
                                        setIsGoogleLoading(false);
                                    }}
                                    useOneTap={false}
                                    type="standard"
                                    theme="filled_blue"
                                    size="large"
                                    width="280"
                                    shape="rectangular"
                                />
                                {isGoogleLoading && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        fontSize: '0.875rem', color: '#9ca3af', pointerEvents: 'none'
                                    }}>
                                        Loading...
                                    </div>
                                )}
                            </div>
                        )}

                        {isNative && (
                            <button
                                onClick={handleAppleLogin}
                                style={{
                                    width: '100%',
                                    maxWidth: '280px',
                                    height: '44px',
                                    backgroundColor: 'black',
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
                                    marginTop: '1rem',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 384 512" style={{ fill: 'white' }}>
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                                </svg>
                                Sign in with Apple
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </Layout>
    );
}
