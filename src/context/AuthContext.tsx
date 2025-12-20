import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useToast } from "./ToastContext";
import api from "../utils/api";

import { StorageService } from '../services/StorageService';
import { SyncConflictModal } from '../components/auth/SyncConflictModal';
import { type BusinessProfile } from '../types';

interface User {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    googleLogin: (credential: string) => Promise<void>;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();


    const [syncConflict, setSyncConflict] = useState<{
        isOpen: boolean;
        type: 'PLAN_LIMIT_EXCEEDED' | 'NAME_COLLISION';
        limit?: number;
        businesses?: BusinessProfile[];
        cloudBusinesses?: BusinessProfile[]; // Added
        conflicts?: { local: BusinessProfile; cloud: BusinessProfile }[];
        localData: any;
        idToken?: string;
    }>({ isOpen: false, type: 'PLAN_LIMIT_EXCEEDED', localData: {} });

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                setCurrentUser(res.data);
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const harvestLocalData = () => {
        const businesses = StorageService.load('businesses', []);
        let products: any[] = [];
        let sales: any[] = [];
        let expenses: any[] = [];

        businesses.forEach((b: any) => {
            products = [...products, ...StorageService.load(`products_${b.id}`, [])];
            sales = [...sales, ...StorageService.load(`sales_${b.id}`, [])];
            expenses = [...expenses, ...StorageService.load(`expenses_${b.id}`, [])];
        });

        return { localBusinesses: businesses, products, sales, expenses };
    };



    const performSync = async (idToken: string, resolutions?: any, subsetIds?: string[]) => {
        let data = harvestLocalData();
        console.log("Harvesting Local Data for Sync:", data);
        const originalLocalCount = data.localBusinesses.length;

        // Filter if subset selected (Plan Limit Resolution)
        if (subsetIds) {
            data.localBusinesses = data.localBusinesses.filter((b: any) => subsetIds.includes(b.id));
            data.products = data.products.filter((p: any) => subsetIds.includes(p.businessId));
            data.sales = data.sales.filter((s: any) => subsetIds.includes(s.businessId));
            data.expenses = data.expenses.filter((e: any) => subsetIds.includes(e.businessId));

            // Explicitly tell server to prune unselected businesses
            (data as any).allowedIds = subsetIds;
        }

        // Add resolutions (Name Collision Resolution)
        if (resolutions) {
            (data as any).resolutions = resolutions;
        }

        if (data.localBusinesses.length === 0 && originalLocalCount === 0) return true;

        try {
            const res = await api.post('/auth/sync', data);
            console.log("Sync Response:", res.data);

            // Success: Data is safe in cloud.
            // Do NOT clear local data. Let DataContext merge it.
            return true;
        } catch (syncErr: any) {
            if (syncErr.response && syncErr.response.status === 409) {
                const { error, limit, conflicts } = syncErr.response.data;

                if (error === 'NAME_COLLISION') {
                    setSyncConflict({
                        isOpen: true,
                        type: 'NAME_COLLISION',
                        conflicts,
                        localData: harvestLocalData(),
                        idToken
                    });
                } else {
                    // PLAN_LIMIT_EXCEEDED
                    setSyncConflict({
                        isOpen: true,
                        type: 'PLAN_LIMIT_EXCEEDED',
                        limit,
                        businesses: harvestLocalData().localBusinesses,
                        cloudBusinesses: syncErr.response.data.existingBusinesses,
                        localData: harvestLocalData(),
                        idToken
                    });
                }

                return false; // Sync paused/failed
            }
            console.error("Non-blocking sync error:", syncErr);
            throw new Error("Sync failed.");
        }
    };

    const googleLogin = async (idToken: string) => {
        try {
            // 1. Authenticate & Get JWT
            const loginRes = await api.post('/auth/google', { idToken });
            const { token, user } = loginRes.data;

            // Temporarily set token for API calls
            localStorage.setItem('auth_token', token);

            // 2. Sync
            const success = await performSync(idToken);
            if (!success) return; // Conflict modal is open

            // 3. Finalize Login
            setCurrentUser(user);
            showToast("Signed in with Google", "success");
        } catch (error: any) {
            console.error("Google Login Failed:", error);
            if (!syncConflict.isOpen) {
                localStorage.removeItem('auth_token');
                showToast("Google Sign-in Failed", "error");
            }
            throw error;
        }
    };

    const resolveSyncConflict = async (resolutionData: any) => {
        try {
            if (!syncConflict.idToken) return;

            let success = false;

            if (syncConflict.type === 'PLAN_LIMIT_EXCEEDED') {
                // resolutionData is string[] (subsetIds)
                success = await performSync(syncConflict.idToken, undefined, resolutionData);
            } else {
                // resolutionData is Record<string, 'MERGE'...> (resolutions)
                success = await performSync(syncConflict.idToken, resolutionData);
            }

            if (success) {
                // If we limited the businesses, we must purge the unselected ones locally
                if (syncConflict.type === 'PLAN_LIMIT_EXCEEDED' && Array.isArray(resolutionData)) {
                    const allLocal = StorageService.load('businesses', []);
                    const keptLocal = allLocal.filter((b: any) => resolutionData.includes(b.id));
                    const removedLocal = allLocal.filter((b: any) => !resolutionData.includes(b.id));

                    if (removedLocal.length > 0) {
                        console.log("Purging unselected businesses:", removedLocal.map((b: any) => b.name));
                        StorageService.save('businesses', keptLocal);
                        removedLocal.forEach((b: any) => {
                            StorageService.remove(`products_${b.id}`);
                            StorageService.remove(`sales_${b.id}`);
                            StorageService.remove(`expenses_${b.id}`);
                            StorageService.remove(`expenseCategories_${b.id}`);
                        });
                        // If active business was removed, clear it
                        const activeId = StorageService.load('active_business_id', '');
                        if (activeId && !resolutionData.includes(activeId)) {
                            StorageService.remove('active_business_id');
                        }
                    }
                }

                setSyncConflict(prev => ({ ...prev, isOpen: false }));
                const res = await api.get('/auth/me');
                setCurrentUser(res.data);
                showToast("Sync complete!", "success");
            }

        } catch (error) {
            console.error("Conflict resolution failed", error);
            showToast("Sync failed", "error");
        }
    };

    const signInAsGuest = async () => {
        try {
            const res = await api.post('/auth/guest');
            localStorage.setItem('auth_token', res.data.token);
            setCurrentUser(res.data.user);
        } catch (error: any) {
            showToast("Guest Login Failed", "error");
            throw error;
        }
    };

    const logout = async () => {
        // Offline-First Philosophy:
        // Logout simply disconnects the cloud account. Local data REMAINS on the device.
        // User continues as "Offline/Guest" owner of the local data.
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
        showToast("Logged out. You are now working offline.", "info");
        // We reload to reset running state/contexts to "Guest" mode properly
        window.location.reload();
    };

    const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
        try {
            // await api.patch('/auth/profile', data);
            setCurrentUser(prev => prev ? { ...prev, ...data } : null);
        } catch (error) {
            console.error("Update Profile Failed:", error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1rem'
            }}>
                <div className="spinner" style={{
                    width: '2rem', height: '2rem',
                    border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <div>Loading DailyProfit...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ currentUser, loading, googleLogin, signInAsGuest, logout, updateProfile: updateUserProfile }}>
            {children}
            <SyncConflictModal
                isOpen={syncConflict.isOpen}
                onClose={() => {
                    setSyncConflict({ ...syncConflict, isOpen: false });
                    localStorage.removeItem('auth_token'); // Cancel login
                }}
                type={syncConflict.type}
                limit={syncConflict.limit}
                businesses={syncConflict.businesses}
                cloudBusinesses={syncConflict.cloudBusinesses}
                conflicts={syncConflict.conflicts}
                onResolve={resolveSyncConflict}
                onUpgrade={() => {
                    window.location.href = '/subscription'; // Or hash router
                }}
            />
        </AuthContext.Provider>
    );
}
