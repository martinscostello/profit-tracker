import { Purchases, LOG_LEVEL, type PurchasesOfferings, type PurchasesPackage, type CustomerInfo } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// --- CONFIGURATION ---
// REPLACE THESE with your actual keys from RevenueCat Dashboard
const REVENUECAT_API_KEY_IOS = 'appl_CogAsuPLBgRGpVwWkCYSkPiwTQF';
const REVENUECAT_API_KEY_ANDROID = 'goog_placeholder_key_android';

export interface SubscriptionStatus {
    isPro: boolean;
    activePlan: 'FREE' | 'LITE' | 'ENTREPRENEUR' | 'UNLIMITED' | null;
    managementURL?: string; // URL to manage subscription (App Store / Play Store)
}

class SubscriptionService {
    private static instance: SubscriptionService;
    private initialized = false;

    private constructor() { }

    public static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    public async initialize(userId?: string): Promise<void> {
        if (this.initialized) return;

        if (Capacitor.isNativePlatform()) {
            await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

            const apiKey = Capacitor.getPlatform() === 'ios'
                ? REVENUECAT_API_KEY_IOS
                : REVENUECAT_API_KEY_ANDROID;

            await Purchases.configure({
                apiKey,
                appUserID: userId || undefined
            });

            this.initialized = true;
            console.log('[SubscriptionService] Initialized');
        } else {
            console.log('[SubscriptionService] Web detected - Mocking initialization');
        }
    }

    public async logIn(userId: string) {
        if (!Capacitor.isNativePlatform()) return;
        return Purchases.logIn({ appUserID: userId });
    }

    public async logOut() {
        if (!Capacitor.isNativePlatform()) return;
        return Purchases.logOut();
    }

    public async getOfferings(): Promise<PurchasesOfferings | null> {
        if (!Capacitor.isNativePlatform()) {
            // Mock Data for Web Testing
            return null;
            // In a real web app, we might return mock offerings or use Stripe
        }

        try {
            const offerings = await Purchases.getOfferings();
            return offerings || null;
        } catch (error) {
            console.error('[SubscriptionService] Error fetching offerings', error);
            throw error;
        }
    }

    public async purchasePackage(pack: PurchasesPackage): Promise<{ isPro: boolean }> {
        if (!Capacitor.isNativePlatform()) {
            console.error("Cannot purchase on web");
            return { isPro: false };
        }

        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: pack });
            return this.checkEntitlements(customerInfo);
        } catch (error: any) {
            if (error.userCancelled) {
                console.log('[SubscriptionService] User cancelled purchase');
            } else {
                console.error('[SubscriptionService] Purchase failed', error);
            }
            throw error;
        }
    }

    public async restorePurchases(): Promise<{ isPro: boolean, message: string }> {
        if (!Capacitor.isNativePlatform()) return { isPro: false, message: 'Not available on web' };

        try {
            const { customerInfo } = await Purchases.restorePurchases();
            const status = this.checkEntitlements(customerInfo);

            if (status.isPro) {
                return { isPro: true, message: 'Purchases restored successfully!' };
            } else {
                return { isPro: false, message: 'No active subscriptions found to restore.' };
            }
        } catch (error) {
            console.error('[SubscriptionService] Restore failed', error);
            throw error;
        }
    }

    public async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
        if (!Capacitor.isNativePlatform()) {
            return { isPro: false, activePlan: null }; // Default for web
        }

        try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            const { isPro, activePlan } = this.checkEntitlements(customerInfo);

            let managementURL = '';
            // if (customerInfo.managementURL) managementURL = customerInfo.managementURL; 

            return { isPro, activePlan, managementURL };
        } catch (error) {
            console.error('[SubscriptionService] Failed to check status', error);
            return { isPro: false, activePlan: null };
        }
    }

    private checkEntitlements(customerInfo: CustomerInfo): { isPro: boolean, activePlan: SubscriptionStatus['activePlan'] } {
        // Define your Entitlement Identifiers from RevenueCat Dashboard here
        const ENTITLE_LITE = 'daily_profit_lite_monthly';
        const ENTITLE_ENTREPRENEUR = 'daily_profit_Entrepreneur_monthly';
        const ENTITLE_UNLIMITED = 'daily_profit_unlimited_monthly';

        // Logic: Check highest tier first
        if (customerInfo.entitlements.active[ENTITLE_UNLIMITED]) {
            return { isPro: true, activePlan: 'UNLIMITED' };
        }

        if (customerInfo.entitlements.active[ENTITLE_ENTREPRENEUR]) {
            return { isPro: true, activePlan: 'ENTREPRENEUR' };
        }

        if (customerInfo.entitlements.active[ENTITLE_LITE]) {
            return { isPro: true, activePlan: 'LITE' };
        }

        // Generic 'pro' entitlement fallback
        if (customerInfo.entitlements.active['pro']) {
            return { isPro: true, activePlan: 'LITE' }; // Or default
        }

        return { isPro: false, activePlan: null };
    }
}

export const subscriptionService = SubscriptionService.getInstance();
