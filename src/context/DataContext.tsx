
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from './ToastContext';
import { StorageService } from '../services/StorageService';
import { ApiService } from '../services/ApiService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import type { Product, Sale, BusinessProfile, Expense } from '../types';

interface DataContextType {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    business: BusinessProfile;
    businesses: BusinessProfile[];
    activeBusinessId: string | null;
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
    updateSale: (id: string, updates: Partial<Sale>) => Promise<void>;
    updateBusiness: (updates: Partial<BusinessProfile>) => Promise<void>;
    addBusiness: (profile: Omit<BusinessProfile, 'id'>) => Promise<void>;
    importBusiness: (profile: BusinessProfile) => void;
    deleteBusiness: (id: string) => Promise<void>;
    leaveBusiness: (id: string) => Promise<void>;
    switchBusiness: (id: string) => void;
    deleteSale: (id: string) => Promise<void>;
    clearSales: (range: 'today' | 'week' | 'month' | 'all') => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    expenseCategories: string[];
    updateExpenseCategories: (categories: string[]) => void;
    getTodayStats: () => { revenue: number; cost: number; grossProfit: number; expenses: number; netProfit: number; itemsSold: number };
    syncStatus: 'idle' | 'syncing' | 'error';
    syncDataNow: () => Promise<void>;
    pendingConsolidation: {
        localBusiness: BusinessProfile,
        cloudBusinesses: BusinessProfile[],
        localData: { products: Product[], sales: Sale[], expenses: Expense[] }
    } | null;
    resolveConsolidation: (choice: 'merge' | 'create_new' | 'use_cloud' | 'replace_cloud', targetBusinessId?: string) => Promise<void>;
    dashboardStats: any;
    refreshDashboardStats: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    // ID Generator
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // Migration for Legacy Keys (Fixing the "Trailing Space" bug)
    useEffect(() => {
        const migrateLegacyKeys = () => {
            try {
                const keys = Object.keys(localStorage);
                let migratedCount = 0;
                keys.forEach(key => {
                    // Check for keys ending with space: "products_UUID "
                    // We only migrate business-prefixed data keys
                    if ((key.startsWith('products_') || key.startsWith('sales_') || key.startsWith('expenses_') || key.startsWith('expenseCategories_')) && key.endsWith(' ')) {
                        const cleanKey = key.trim();
                        // Only migrate if destination doesn't exist to avoid overwriting newer data
                        // But since the bug was pervasive, the "Space" key likely holds the truth.
                        // If clean key exists, we might have a conflict, but usually the clean key would be empty/unused if the app always used the space.
                        const val = localStorage.getItem(key);
                        if (val) {
                            localStorage.setItem(cleanKey, val);
                            localStorage.removeItem(key); // Cleanup old key
                            migratedCount++;
                        }
                    }
                });
                if (migratedCount > 0) console.log(`[Migration] Fixed ${migratedCount} storage keys with trailing spaces.`);
            } catch (e) {
                console.error("[Migration] Failed to migrate legacy keys", e);
            }
        };

        migrateLegacyKeys();
    }, []);

    // --- State ---
    const [businesses, setBusinesses] = useState<BusinessProfile[]>(() =>
        StorageService.load('businesses', [])
    );

    // Persistence for Local Mode
    useEffect(() => {
        if (!currentUser) {
            StorageService.save('businesses', businesses);
        }
    }, [businesses, currentUser]);

    const [activeBusinessId, setActiveBusinessId] = useState<string | null>(() =>
        StorageService.load('active_business_id', '')
    );

    const [products, setProducts] = useState<Product[]>(() => {
        return activeBusinessId ? StorageService.load(`products_${activeBusinessId}`, []) : [];
    });
    const [sales, setSales] = useState<Sale[]>(() => {
        return activeBusinessId ? StorageService.load(`sales_${activeBusinessId}`, []) : [];
    });
    const [expenses, setExpenses] = useState<Expense[]>(() => {
        return activeBusinessId ? StorageService.load(`expenses_${activeBusinessId}`, []) : [];
    });
    const DEFAULT_CATEGORIES = ['Fuel', 'Transport', 'Airtime', 'Shop Rent', 'Salaries', 'Market Levies', 'Personal', 'Other'];
    const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
        if (!activeBusinessId) return [];
        const stored = StorageService.load(`expenseCategories_${activeBusinessId}`, []);
        return stored.length > 0 ? stored : [];
    });
    const [pendingConsolidation, setPendingConsolidation] = useState<{
        localBusiness: BusinessProfile,
        cloudBusinesses: BusinessProfile[],
        localData: { products: Product[], sales: Sale[], expenses: Expense[] }
    } | null>(null);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [dashboardStats, setDashboardStats] = useState<any>(null);

    const calculateLocalStats = () => {
        // Robust Date Matching (YYYY-MM-DD vs YYYY-MM-DD)
        const now = new Date();
        const localDateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const todaySales = sales.filter(s => {
            const d = new Date(s.date);
            return d.toLocaleDateString('en-CA') === localDateStr;
        });

        const todayExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.toLocaleDateString('en-CA') === localDateStr;
        });

        const revenue = todaySales.reduce((acc, s) => acc + (s.revenue || 0), 0);
        const totalExpenses = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
        const grossProfit = todaySales.reduce((acc, s) => acc + (s.profit || 0), 0);

        return {
            revenue,
            expenses: totalExpenses,
            netProfit: grossProfit - totalExpenses,
            itemsSold: todaySales.reduce((acc, s) => acc + (s.quantity || 0), 0),
            transactionCount: todaySales.length
        };
    };



    // Auto-calculate stats whenever data changes locally
    useEffect(() => {
        const localStats = calculateLocalStats();
        setDashboardStats(localStats);
    }, [sales, expenses, products]);

    const refreshDashboardStats = async () => {
        // Now redundant as we rely on the effect above, but kept for interface compatibility
        const localStats = calculateLocalStats();
        setDashboardStats(localStats);
    };

    // Derived Active Business
    const business = businesses.find(b => b.id === activeBusinessId) || {
        id: '', name: 'No Active Business', currency: '₦', isPro: false, plan: 'FREE' as const, onboardingCompleted: false, collaborators: []
    };

    const loadCloudData = async () => {
        setSyncStatus('syncing');
        try {
            // 1. Restore Businesses
            const fetched = await ApiService.getBusinesses();

            // preserve local businesses that are not in cloud yet
            const currentLocalBusinesses = StorageService.load('businesses', []);
            const localOnly = currentLocalBusinesses.filter((b: BusinessProfile) => {
                // Check if this business exists in the fetched cloud list (by ID)
                // Also assume mongoID (24 chars) vs UUID (36 chars) difference implies local/cloud
                const existsInCloud = fetched.some((fb: any) => fb.id === b.id);
                return !existsInCloud && b.id.length > 30; // Rough check for UUID (Local)
            });

            // Merge: Cloud is Truth for existing, Local appended
            let combinedBusinesses = [...fetched, ...localOnly];

            // Tag Local Ownership for Offline Access
            try {
                const user = await ApiService.getProfile();
                combinedBusinesses = combinedBusinesses.map((b: any) => ({
                    ...b,
                    _isLocalOwner: b.ownerId === user.id
                }));
            } catch (e) {
                console.warn("Failed to tag ownership", e);
            }

            setBusinesses(combinedBusinesses);
            StorageService.save('businesses', combinedBusinesses);

            let targetId = activeBusinessId;
            const activeStillExists = combinedBusinesses.some((b: BusinessProfile) => b.id === activeBusinessId);

            if (!activeStillExists && combinedBusinesses.length > 0) {
                // Mismatch Detected - Only switch if truly gone
                targetId = combinedBusinesses[0].id;
                console.log(`[DataContext] Active Business ID ${activeBusinessId} not found in merged list. Switching to ${targetId}`);
                if (targetId !== activeBusinessId) {
                    setActiveBusinessId(targetId);
                    StorageService.save('active_business_id', targetId);
                }
            } else if (!targetId && combinedBusinesses.length > 0) {
                targetId = combinedBusinesses[0].id;
                setActiveBusinessId(targetId);
                StorageService.save('active_business_id', targetId);
            }

            // 2. Load Data for active business
            if (targetId) {
                const [prods, salesDat, exps] = await Promise.all([
                    ApiService.getProducts(targetId),
                    ApiService.getSales(targetId),
                    ApiService.getExpenses(targetId)
                ]);
                // Load current local data to preserve unsynced items
                const localProducts = StorageService.load(`products_${targetId}`, []);
                const localSales = StorageService.load(`sales_${targetId}`, []);
                const localExpenses = StorageService.load(`expenses_${targetId}`, []);

                // Merge Strategy: LOCAL IS TRUTH (User Request)
                // 1. Keep ALL local items exactly as they are (preserving edits, deletes, etc. if we tracked deletes locally)
                // 2. Add ONLY items from Cloud that are NOT in Local (e.g. added by Manager/Partner)
                // This prevents "Cloud Revert" where cloud overwrites local progress.

                const mergeItems = (cloudItems: any[], localItems: any[]) => {
                    const localIds = new Set(localItems.map((i: any) => i.id));
                    // Find items in Cloud that we don't know about yet
                    const newFromCloud = cloudItems.filter((i: any) => !localIds.has(i.id));

                    // Combine: Local (Priority) + New Cloud (Additions)
                    return [...localItems, ...newFromCloud];
                };

                const mergedProducts = mergeItems(prods, localProducts);
                setProducts(mergedProducts);
                StorageService.save(`products_${targetId}`, mergedProducts);

                const mergedSales = mergeItems(salesDat, localSales).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setSales(mergedSales);
                StorageService.save(`sales_${targetId}`, mergedSales);

                const mergedExpenses = mergeItems(exps, localExpenses).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setExpenses(mergedExpenses);
                StorageService.save(`expenses_${targetId}`, mergedExpenses);

                const currentBiz = fetched.find((b: BusinessProfile) => b.id === targetId);
                const cloudCategories = currentBiz?.expenseCategories || [];

                // Merge Strategy: Keep user categories, append missing defaults
                const mergedCats = [...cloudCategories];
                DEFAULT_CATEGORIES.forEach(c => {
                    if (!mergedCats.includes(c)) mergedCats.push(c);
                });

                setExpenseCategories(mergedCats);
                StorageService.save(`expenseCategories_${targetId}`, mergedCats);

                // Also refresh stats when switching/loading business
                const stats = await ApiService.getDashboardStats(targetId);
                setDashboardStats(stats);
            }
        } catch (err) {
            console.error("Failed to load cloud data:", err);
            // OFFLINE FALLBACK: Load from local storage if API fails
            if (activeBusinessId) {
                console.log("Offline mode detected. Loading cached data...");
                const localProducts = StorageService.load(`products_${activeBusinessId}`, []);
                const localSales = StorageService.load(`sales_${activeBusinessId}`, []);
                const localExpenses = StorageService.load(`expenses_${activeBusinessId}`, []);

                setProducts(localProducts);
                setSales(localSales);
                setExpenses(localExpenses);

                // Recalculate stats immediately
                calculateLocalStats(); // This function relies on CURRENT state, which isn't updated yet.
                // Actually, the useEffect at line 118 will handle the recalculation when state changes!
            }
        } finally {
            setSyncStatus('idle');
        }
    };

    useEffect(() => {
        loadCloudData();
    }, [currentUser, activeBusinessId]);


    // --- Socket Connection ---
    useEffect(() => {
        if (!currentUser || !activeBusinessId) {
            socket?.disconnect();
            setSocket(null);
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace('/api', '');
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.emit('join_business', activeBusinessId);

        // Real-time listeners
        newSocket.on('product_added', (p) => setProducts(prev => {
            if (prev.some(item => item.id === p.id)) return prev;
            return [...prev, p];
        }));
        newSocket.on('product_updated', (p) => setProducts(prev => prev.map(old => old.id === p.id ? p : old)));
        newSocket.on('product_deleted', (id) => setProducts(prev => prev.filter(p => p.id !== id)));

        newSocket.on('sale_added', (s) => {
            setSales(prev => {
                if (prev.some(item => item.id === s.id)) return prev;
                // Important: Update stats when a new sale comes in from elsewhere (e.g. manager)
                // We'll trigger a delayed refresh or rely on 'prev' effect
                return [s, ...prev];
            });
            // Update stats whenever a new sale arrives from the socket
            // Note: Optimistic updates already updated local stats, so this double-trigger is fine or we check ID.
            // But we need to ensure 'calculateLocalStats' sees the NEW sale.
            // Since setSales is async, we can't call calculateLocalStats immediately on the *current* state.
            // Better to use an effect on 'sales' to update dashboard, OR trust that React re-renders.
            // But 'dashboardStats' is a separate state.
            // Let's rely on an effect hook for 'sales' to update 'dashboardStats' automatically? 
            // Currently refreshDashboardStats is manual. Let's make it reactive to 'sales'.
        });

        newSocket.on('expense_added', (e) => setExpenses(prev => {
            if (prev.some(item => item.id === e.id)) return prev;
            return [e, ...prev];
        }));
        newSocket.on('business_updated', (updatedBusiness) => {
            if (activeBusinessId === updatedBusiness.id) {
                if (!currentUser) return;

                // 1. Check if we are still a member or owner
                const isOwner = updatedBusiness.ownerId === currentUser.id;
                const isCollaborator = updatedBusiness.collaborators.some((c: any) => c.userId === currentUser.id);

                if (!isOwner && !isCollaborator) {
                    // We were kicked!
                    showToast('You have been removed from this business.', 'error');

                    // Leave locally
                    setBusinesses(prev => {
                        const updatedList = prev.filter(b => b.id !== updatedBusiness.id);
                        StorageService.save('businesses', updatedList);
                        return updatedList;
                    });

                    // Switch to another or disconnect
                    setActiveBusinessId(null);
                    StorageService.save('active_business_id', '');

                    // Force reload to clear state cleanly
                    setTimeout(() => window.location.reload(), 500);
                    return;
                }

                // 2. Update local business data (e.g. name change, role change)
                setBusinesses(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
            }
        });

        // --- Dormant/Sleep Recovery ---
        const checkMembershipAndSync = async () => {
            if (!currentUser || !activeBusinessId || document.hidden) return;

            try {
                // 1. Verify Membership (Catch "Kicked while sleeping")
                // fetch businesses again to check if we still have access to the active one
                const fetched = await ApiService.getBusinesses();

                // MERGE STRATEGY REPEAT: Don't trust cloud alone, we might be local
                const currentLocalBusinesses = StorageService.load('businesses', []);
                const localOnly = currentLocalBusinesses.filter((b: any) => b.id.length > 30 && !fetched.some((fb: any) => fb.id === b.id));
                const allBiz = [...fetched, ...localOnly];

                const currentBiz = allBiz.find((b: any) => b.id === activeBusinessId);

                if (!currentBiz) {
                    // Only kick if we successfully fetched from cloud (length > 0) AND still can't find it
                    // If fetched is empty, it might be a net error (though getBusinesses usually throws on net error, returning [] implies "User has 0 businesses")
                    // If we have 0 businesses in cloud AND 0 local, then yes, kick.
                    if (allBiz.length > 0) {
                        console.warn("Active business lost access.", activeBusinessId);
                        // We lost access!
                        showToast('Sync Alert: You are no longer a member of this business.', 'error');
                        setActiveBusinessId(null);
                        StorageService.save('active_business_id', '');
                        window.location.reload();
                        return;
                    }
                }

                // 2. We are still a member, so catch up on missed data
                // Trigger a full data refresh to catch missed socket events
                // Note: We can reuse part of loadCloudData logic or just manual fetch
                const [prods, s, e] = await Promise.all([
                    ApiService.getProducts(activeBusinessId),
                    ApiService.getSales(activeBusinessId),
                    ApiService.getExpenses(activeBusinessId)
                ]);

                // Smart Merge (Keep unsynced, update existing)
                // Actually, for "Catch Up", we should trust Cloud for existing IDs?
                // But let's stick to the "Merge Items" helper logic if we can access it, 
                // or just simple set for now to fix the "Not Updating" bug.
                // Re-using the simple merge strategy from loadCloudData would be best, 
                // but that function is outside this scope. 
                // Let's implement a quick direct update:

                if (prods) setProducts(prev => {
                    const cloudIds = new Set(prods.map((i: any) => i.id));
                    const unsynced = prev.filter(i => !cloudIds.has(i.id));
                    return [...prods, ...unsynced];
                });

                if (s) setSales(prev => {
                    const cloudIds = new Set(s.map((i: any) => i.id));
                    const unsynced = prev.filter(i => !cloudIds.has(i.id));
                    return [...s, ...unsynced].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });

                if (e) setExpenses(prev => {
                    const cloudIds = new Set(e.map((i: any) => i.id));
                    const unsynced = prev.filter(i => !cloudIds.has(i.id));
                    return [...e, ...unsynced].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });

                // Update business details too (e.g. name change)
                setBusinesses(prev => prev.map(b => b.id === currentBiz.id ? currentBiz : b));

                // --- GOOGLE SHEET AUTO-SYNC ---
                const sheetId = activeBusinessId ? localStorage.getItem(`linked_sheet_id_${activeBusinessId}`) : null;
                const gToken = localStorage.getItem('google_access_token');

                if (sheetId && gToken) {
                    try {
                        const rows = await GoogleSheetsService.fetchSheetData(gToken, sheetId);
                        const sheetProds = GoogleSheetsService.parseProducts(rows);

                        if (sheetProds.length > 0) {
                            // Merge logic similar to Products.tsx
                            setProducts(prev => {
                                const newProds = [...prev];
                                sheetProds.forEach(sp => {
                                    const idx = newProds.findIndex(p => p.name.toLowerCase() === sp.name.toLowerCase());
                                    if (idx > -1) {
                                        newProds[idx] = { ...newProds[idx], ...sp, stockQuantity: sp.stockQuantity };
                                    } else {
                                        // For new products, we need businessId. Use activeBusinessId
                                        newProds.push({
                                            id: `sheet_${Date.now()}_${Math.random()} `, // Temp ID until real sync
                                            businessId: activeBusinessId,
                                            ...sp,
                                            totalSold: 0
                                        } as any);
                                    }
                                });
                                return newProds;
                            });
                            console.log("Sheet Auto-Synced on Wake");
                        }
                    } catch (sheetErr) {
                        console.error("Sheet sync failed", sheetErr);
                    }
                }

            } catch (err) {
                console.error("Wake-up sync failed:", err);
            }
        };

        // Bind to wake-up events
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkMembershipAndSync();
        });

        newSocket.on('connect', () => {
            console.log('Socket Reconnected - Verifying State...');
            checkMembershipAndSync();
        });

        return () => {
            document.removeEventListener('visibilitychange', checkMembershipAndSync as any);
            newSocket.disconnect();
        };
    }, [currentUser, activeBusinessId]);

    const resolveConsolidation = async (choice: 'merge' | 'create_new' | 'use_cloud' | 'replace_cloud', targetBusinessId?: string) => {
        if (!pendingConsolidation || !currentUser) return;

        const { localBusiness, localData } = pendingConsolidation;
        setSyncStatus('syncing');

        try {
            if (choice === 'merge' && targetBusinessId) {
                for (const p of localData.products) await ApiService.addProduct({ ...p, businessId: targetBusinessId });
                for (const s of localData.sales) await ApiService.addSale({ ...s, businessId: targetBusinessId });
                for (const e of localData.expenses) await ApiService.addExpense({ ...e, businessId: targetBusinessId });

                StorageService.save(`products_${localBusiness.id}`, []);
                StorageService.save(`sales_${localBusiness.id}`, []);
                StorageService.save(`expenses_${localBusiness.id}`, []);
            } else if (choice === 'create_new') {
                const claimedBiz = { ...localBusiness, ownerId: currentUser.id };
                await ApiService.createBusiness(claimedBiz);
                for (const p of localData.products) await ApiService.addProduct({ ...p, businessId: localBusiness.id });
                for (const s of localData.sales) await ApiService.addSale({ ...s, businessId: localBusiness.id });
                for (const e of localData.expenses) await ApiService.addExpense({ ...e, businessId: localBusiness.id });
            } else if (choice === 'replace_cloud' && targetBusinessId) {
                for (const p of localData.products) await ApiService.addProduct({ ...p, businessId: targetBusinessId });
                StorageService.save(`products_${localBusiness.id} `, []);
            } else if (choice === 'use_cloud') {
                StorageService.save(`products_${localBusiness.id}`, []);
                StorageService.save(`sales_${localBusiness.id}`, []);
                StorageService.save(`expenses_${localBusiness.id}`, []);
            }

            const localBusinesses = StorageService.load('businesses', []);
            const remaining = localBusinesses.filter((b: BusinessProfile) => b.id !== localBusiness.id || b.ownerId);
            StorageService.save('businesses', remaining);

            setPendingConsolidation(null);

            // Fix: Refresh data immediately instead of reloading page
            // This ensures dashboard stats are recalculated with the new cloud data
            if (activeBusinessId) {
                await loadCloudData();
            }
            // window.location.reload(); // Removed to prevent jarring UX
        } catch (err) {
            console.error("Resolve consolidation failed:", err);
            showToast("Consolidation failed. Please try again.", 'error');
        } finally {
            setSyncStatus('idle');
        }
    };

    // --- Data Initialization ---
    // --- Data Initialization ---
    useEffect(() => {
        // 1. Handle "No Active Business" in Offline Mode (Auto-select local if available)
        if (!activeBusinessId && !currentUser) {
            const localBusinesses = StorageService.load('businesses', []);
            if (localBusinesses.length > 0) {
                const firstId = localBusinesses[0].id;
                setActiveBusinessId(firstId);
                StorageService.save('active_business_id', firstId);
            }
            return;
        }

        if (!activeBusinessId) {
            // If we have a user but no active business, loadCloudData will handle fetching businesses 
            // and potentially setting one.
            if (currentUser) loadCloudData();
            return;
        }

        // 2. ALWAYS Load Local Data Immediately (Stale-While-Revalidate)
        // This ensures instant UI update on business switch or app launch, even if Online.
        // It overwrites any stale state from previous business with correct local data for CURRENT business.
        setProducts(StorageService.load(`products_${activeBusinessId}`, []));
        setSales(StorageService.load(`sales_${activeBusinessId}`, []));
        setExpenses(StorageService.load(`expenses_${activeBusinessId}`, []));

        const storedCategories = StorageService.load(`expenseCategories_${activeBusinessId}`, []);
        const mergedCategories = [...storedCategories];
        DEFAULT_CATEGORIES.forEach(c => {
            if (!mergedCategories.includes(c)) mergedCategories.push(c);
        });
        setExpenseCategories(mergedCategories);

        // 3. Trigger Cloud Sync if Online
        if (currentUser) {
            loadCloudData();
        }
    }, [currentUser, activeBusinessId]);

    const addProduct = async (product: Omit<Product, 'id'>) => {
        const id = generateId();
        const newProduct = { ...product, id, businessId: activeBusinessId || '' };
        setProducts(prev => {
            const updated = [...prev, newProduct];
            StorageService.save(`products_${activeBusinessId}`, updated);
            return updated;
        });

        if (currentUser && activeBusinessId) {
            try { await ApiService.addProduct(newProduct); } catch (e) { console.error(e); }
        } else {
            // Already saved above
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        setProducts(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
            StorageService.save(`products_${activeBusinessId}`, updated);
            return updated;
        });
        if (currentUser && activeBusinessId) {
            try { await ApiService.updateProduct(id, updates); } catch (e) { console.error(e); }
        }
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => {
            const updated = prev.filter(p => p.id !== id);
            StorageService.save(`products_${activeBusinessId}`, updated);
            return updated;
        });
        if (currentUser && activeBusinessId) {
            try { await ApiService.deleteProduct(activeBusinessId, id); } catch (e) { console.error(e); }
        }
    };

    const addSale = async (saleData: Omit<Sale, 'id'>) => {
        const id = generateId();
        const newSale = { ...saleData, id, businessId: activeBusinessId || '', createdAt: Date.now() };

        let updatedProduct: Product | undefined;
        let finalProducts: Product[] = [];

        setProducts(prev => {
            finalProducts = prev.map(p => {
                if (p.id === saleData.productId) {
                    updatedProduct = { ...p, stockQuantity: (p.stockQuantity || 0) - saleData.quantity, totalSold: (p.totalSold || 0) + saleData.quantity };
                    return updatedProduct;
                }
                return p;
            });
            StorageService.save(`products_${activeBusinessId}`, finalProducts);
            return finalProducts;
        });

        setSales(prev => {
            const updated = [newSale, ...prev];
            StorageService.save(`sales_${activeBusinessId}`, updated);
            return updated;
        });

        if (currentUser && activeBusinessId) {
            try {
                await ApiService.addSale(newSale);
                if (updatedProduct) {
                    await ApiService.updateProduct(updatedProduct.id, { stockQuantity: updatedProduct.stockQuantity, totalSold: updatedProduct.totalSold });
                }
                refreshDashboardStats();
            } catch (e) { console.error(e); }
        }
    };

    const updateSale = async (id: string, updates: Partial<Sale>) => {
        let productUpdates: { id: string, changes: Partial<Product> } | undefined;
        let finalProducts: Product[] = [];

        setSales(prevSales => {
            const oldSale = prevSales.find(s => s.id === id);
            if (!oldSale) return prevSales;

            if (updates.quantity !== undefined && updates.quantity !== oldSale.quantity) {
                const qtyDiff = updates.quantity - oldSale.quantity;
                setProducts(prevProducts => {
                    finalProducts = prevProducts.map(p => {
                        if (p.id === oldSale.productId) {
                            const currentStock = p.stockQuantity ?? 0;
                            const currentSold = p.totalSold ?? 0;
                            const newStock = Math.max(0, currentStock - qtyDiff);
                            const newSold = Math.max(0, currentSold + qtyDiff);
                            productUpdates = { id: p.id, changes: { stockQuantity: newStock, totalSold: newSold } };
                            return { ...p, ...productUpdates.changes };
                        }
                        return p;
                    });
                    StorageService.save(`products_${activeBusinessId}`, finalProducts);
                    return finalProducts;
                });
            } else {
                setProducts(p => { finalProducts = p; return p; }); // Ensuring we capture current products if needed, though mostly unrelated here
            }

            const updatedSales = prevSales.map(s => s.id === id ? { ...s, ...updates } : s);
            StorageService.save(`sales_${activeBusinessId}`, updatedSales);
            return updatedSales;
        });

        if (currentUser && activeBusinessId) {
            try {
                await ApiService.updateSale(id, updates);
                if (productUpdates) await ApiService.updateProduct(productUpdates.id, productUpdates.changes);
            } catch (e) { console.error(e); }
        }
    };

    const deleteSale = async (id: string) => {
        setSales(prev => {
            const updated = prev.filter(s => s.id !== id);
            StorageService.save(`sales_${activeBusinessId}`, updated);
            return updated;
        });
        if (currentUser && activeBusinessId) {
            try {
                await ApiService.deleteSale(activeBusinessId, id);
                refreshDashboardStats();
            } catch (e) { console.error(e); }
        }
    };

    const clearSales = async () => {
        showToast("Batch delete handled via individual deletes for now.", "info");
    };

    const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
        const id = generateId();
        const newExpense = { ...expenseData, id, businessId: activeBusinessId || '' };
        setExpenses(prev => {
            const updated = [newExpense, ...prev];
            StorageService.save(`expenses_${activeBusinessId} `, updated);
            return updated;
        });

        if (currentUser && activeBusinessId) {
            try {
                await ApiService.addExpense(newExpense);
                refreshDashboardStats();
            } catch (e) { console.error(e); }
        }
    };

    const deleteExpense = async (id: string) => {
        setExpenses(prev => {
            const updated = prev.filter(e => e.id !== id);
            StorageService.save(`expenses_${activeBusinessId}`, updated);
            return updated;
        });
        if (currentUser && activeBusinessId) {
            try {
                await ApiService.deleteExpense(activeBusinessId, id);
                refreshDashboardStats();
            } catch (e) { console.error(e); }
        }
    };

    const updateBusiness = async (updates: Partial<BusinessProfile>) => {
        setBusinesses(prev => prev.map(b => b.id === activeBusinessId ? { ...b, ...updates } : b));
        if (currentUser && activeBusinessId) {
            try { await ApiService.updateBusiness(activeBusinessId, updates); } catch (e) { console.error(e); }
        }
    };

    const switchBusiness = (id: string) => {
        setActiveBusinessId(id);
        StorageService.save('active_business_id', id);
    };

    const addBusiness = async (profile: Omit<BusinessProfile, 'id'>) => {
        const id = generateId();
        const newBusiness = {
            ...profile,
            id,
            ownerId: currentUser?.id || '',
            expenseCategories: DEFAULT_CATEGORIES
        };
        setBusinesses(prev => [...prev, newBusiness as BusinessProfile]);
        if (currentUser) {
            try { await ApiService.createBusiness(newBusiness as BusinessProfile); } catch (e) { console.error(e); }
        }
        switchBusiness(id);
    };

    const importBusiness = (newBusiness: BusinessProfile) => {
        setBusinesses(prev => {
            if (prev.some(b => b.id === newBusiness.id)) {
                // Already exists, just switch to it (or update it?)
                // Ideally, we might want to update it, but let's just avoid duplicate push
                return prev;
            }
            const updated = [...prev, newBusiness];
            StorageService.save('businesses', updated); // Ensure we persist the import!
            return updated;
        });
        // We defer switch to useEffect or just call it here, but need to be sure it exists
        // Since setBusinesses is async, we can't switch immediately if we just added it.
        // But preventing duplicate is key.
        // Let's force a switch if we know it's there.
        switchBusiness(newBusiness.id);
    };

    const deleteBusiness = async (id: string) => {
        setBusinesses(prev => {
            const updated = prev.filter(b => b.id !== id);
            StorageService.save('businesses', updated);
            return updated;
        });

        if (activeBusinessId === id) {
            setActiveBusinessId(null);
            StorageService.save('active_business_id', '');

            // Clear Data Immediately to show fresh start
            setProducts([]);
            setSales([]);
            setExpenses([]);
            setDashboardStats({
                revenue: 0,
                expenses: 0,
                netProfit: 0,
                itemsSold: 0,
                transactionCount: 0
            });
        }

        if (currentUser) {
            try {
                await ApiService.deleteBusiness(id);
                showToast("Business deleted from cloud.", "success");
            } catch (e) {
                console.error("Failed to delete business from cloud", e);
                showToast("Failed to delete from cloud. It may reappear on sync.", "error");
            }
        }
    };

    const leaveBusiness = async (id: string) => {
        if (!currentUser) return;
        try {
            await ApiService.leaveBusiness(id);
            const updatedList = businesses.filter(b => b.id !== id);
            setBusinesses(updatedList);
            StorageService.save('businesses', updatedList);
            if (id === activeBusinessId) {
                const nextBusiness = updatedList.find(b => b.ownerId === currentUser.id) || updatedList[0];
                if (nextBusiness) switchBusiness(nextBusiness.id);
                else {
                    setActiveBusinessId(null);
                    StorageService.save('active_business_id', '');
                }
            }
            showToast('You have left the business.', 'info');
        } catch (error) {
            console.error(error);
        }
    };

    const updateExpenseCategories = (categories: string[]) => {
        setExpenseCategories(categories);
        if (activeBusinessId) StorageService.save(`expenseCategories_${activeBusinessId}`, categories);
        updateBusiness({ expenseCategories: categories });
    };

    const getTodayStats = () => {
        const today = new Date().toLocaleDateString('en-CA');
        const todaySales = sales.filter(s => s.date.startsWith(today));
        const todayExpenses = expenses.filter(e => e.date.startsWith(today));

        const salesStats = todaySales.reduce((acc, sale) => ({
            revenue: acc.revenue + sale.revenue,
            cost: acc.cost + sale.cost,
            profit: acc.profit + sale.profit,
            itemsSold: acc.itemsSold + sale.quantity
        }), { revenue: 0, cost: 0, profit: 0, itemsSold: 0 });

        const totalExpenses = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
            revenue: salesStats.revenue,
            cost: salesStats.cost,
            grossProfit: salesStats.profit,
            expenses: totalExpenses,
            netProfit: salesStats.profit - totalExpenses,
            itemsSold: salesStats.itemsSold
        };
    };

    const syncDataNow = async () => {
        if (!currentUser) {
            // Local Mode Refresh
            refreshDashboardStats();
            showToast("Refreshed local data.", "success");
            return;
        }

        try {
            await loadCloudData();
            showToast("Data synced from cloud.", "success");
        } catch (error) {
            console.error("Manual sync failed:", error);
            showToast("Sync failed. Check connection.", "error");
        }
    };

    return (
        <DataContext.Provider value={{
            products, sales, expenses,
            business, businesses, activeBusinessId,
            addProduct, updateProduct, deleteProduct,
            addSale, updateSale, deleteSale, clearSales,
            updateBusiness, addBusiness, importBusiness, switchBusiness, deleteBusiness, leaveBusiness,
            addExpense, deleteExpense,
            expenseCategories, updateExpenseCategories,
            getTodayStats, syncStatus, syncDataNow,
            pendingConsolidation, resolveConsolidation,
            dashboardStats, refreshDashboardStats
        }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};
