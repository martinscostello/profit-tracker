import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { useData } from './DataContext';

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    date: string;
    read: boolean;
    type: 'alert' | 'reminder' | 'info';
    actionLink?: string; // Optional deep link or route
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    pushNotification: (title: string, body: string, type?: AppNotification['type'], link?: string) => void;
    scheduleReminders: (settings: any) => void; // Define settings type later
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { products, getTodayStats } = useData();
    const [notifications, setNotifications] = useState<AppNotification[]>(() =>
        StorageService.load('notifications', [])
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        StorageService.save('notifications', notifications);
    }, [notifications]);

    // Track alerted products to prevent spam on every render
    const [alertedProducts, setAlertedProducts] = useState<Set<string>>(new Set());

    const pushNotification = async (title: string, body: string, type: AppNotification['type'] = 'info', link?: string) => {
        const newNotif: AppNotification = {
            id: Date.now().toString(),
            title,
            body,
            date: new Date().toISOString(),
            read: false,
            type,
            actionLink: link
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Get settings for sound preference
        const settings = StorageService.load('notification_settings', null);
        let channelId = 'default';

        if (settings?.soundEnabled && settings?.selectedTone?.id !== 'silent') {
            if (settings.selectedTone.id !== 'default') {
                channelId = settings.selectedTone.id; // 'cash', 'chime', 'alert'
            }
        }

        // Also trigger system notification if allowed
        await NotificationService.schedule({
            notifications: [{
                id: Math.floor(Math.random() * 100000),
                title,
                body,
                extra: { link },
                schedule: { at: new Date(Date.now() + 100) }, // Immediate
                channelId: channelId
            }]
        });
    };

    // Immediate Check on Product Updates
    useEffect(() => {
        // Initialize Channels (Android)
        NotificationService.createChannels();

        const checkBusinessHealth = async () => {
            const currentAlerted = new Set(alertedProducts);
            let hasNewAlerts = false;

            // 1. Check Out of Stock (Immediate)
            const outOfStock = products.filter(p => (p.stockQuantity || 0) === 0);
            outOfStock.forEach(p => {
                if (!currentAlerted.has(p.id)) {
                    pushNotification(
                        'Out of Stock Alert ⚠️',
                        `Product "${p.name}" is now out of stock!`,
                        'alert',
                        '/products'
                    );
                    currentAlerted.add(p.id);
                    hasNewAlerts = true;
                }
            });

            // 2. Check Low Stock (<= 5)
            const lowStock = products.filter(p => (p.stockQuantity || 0) <= 5 && (p.stockQuantity || 0) > 0);
            lowStock.forEach(p => {
                if (!currentAlerted.has(`low_${p.id}`)) {
                    pushNotification(
                        'Low Stock Warning 📉',
                        `Product "${p.name}" is running low (${p.stockQuantity} left).`,
                        'alert',
                        '/products'
                    );
                    currentAlerted.add(`low_${p.id}`);
                    hasNewAlerts = true;
                }
            });

            // 3. High Expense Logic
            const stats = getTodayStats();
            if (stats.grossProfit > 0 && stats.expenses > (stats.grossProfit * 0.8)) {
                const today = new Date().toISOString().split('T')[0];
                const expenseAlertKey = `high_expense_${today}`;

                if (!currentAlerted.has(expenseAlertKey)) {
                    pushNotification(
                        'High Expenses Warning',
                        'Your expenses are very high relative to your profit today.',
                        'alert',
                        '/advice/expense-reduction'
                    );
                    currentAlerted.add(expenseAlertKey);
                    hasNewAlerts = true;
                }
            }

            if (hasNewAlerts) {
                setAlertedProducts(currentAlerted);
            }
        };

        checkBusinessHealth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, notifications.length]); // Dependencies managed carefully


    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const scheduleReminders = async (settings: any) => {
        // To be implemented with NotificationSettings page
        console.log('Scheduling reminders...', settings);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearAll,
            pushNotification,
            scheduleReminders
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};
