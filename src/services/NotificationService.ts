import { LocalNotifications, type ScheduleOptions, type ScheduleResult } from '@capacitor/local-notifications';

export const NotificationService = {
    async requestPermissions(): Promise<boolean> {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error('Error requesting notification permissions:', e);
            return false;
        }
    },

    async checkPermissions(): Promise<boolean> {
        try {
            const result = await LocalNotifications.checkPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error('Error checking notification permissions:', e);
            return false;
        }
    },

    async schedule(options: ScheduleOptions): Promise<ScheduleResult | undefined> {
        if (!await this.checkPermissions()) {
            if (!await this.requestPermissions()) return;
        }

        try {
            return await LocalNotifications.schedule(options);
        } catch (e) {
            console.error('Error scheduling notification:', e);
        }
    },

    async cancel(ids: number[]) {
        try {
            await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
        } catch (e) {
            console.error('Error cancelling notifications:', e);
        }
    },

    async getPending() {
        try {
            return await LocalNotifications.getPending();
        } catch (e) {
            console.error('Error getting pending notifications:', e);
            return { notifications: [] };
        }
    },

    async areEnabled() {
        return await LocalNotifications.areEnabled();
    },

    async createChannels() {
        try {
            // Android 8+ requires channels for sounds
            await LocalNotifications.createChannel({
                id: 'default',
                name: 'Default',
                importance: 5,
                visibility: 1
            });

            const tones = ['cash', 'chime', 'alert', 'spaceship'];
            for (const tone of tones) {
                await LocalNotifications.createChannel({
                    id: tone,
                    name: tone.charAt(0).toUpperCase() + tone.slice(1),
                    importance: 5,
                    sound: `${tone}.wav`, // e.g. 'cash.wav'
                    visibility: 1
                });
            }
            console.log('Notification channels created');
        } catch (e) {
            console.error('Error creating notification channels:', e);
        }
    }
};
