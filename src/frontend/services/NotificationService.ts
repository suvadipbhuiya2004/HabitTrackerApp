import notifee, { AndroidImportance, TimestampTrigger, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { Habit } from './HabitService';

export interface NotificationSettings {
    enabled: boolean;
    reminderTime: string; // Format: 'HH:MM'
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    reminderTime: '20:00', // 8:00 PM by default
};

/**
 * Create a notification channel for Android devices
 */
export async function createNotificationChannel() {
    // Create a channel (required for Android)
    await notifee.createChannel({
        id: 'habit-reminders',
        name: 'Habit Reminders',
        lights: true,
        vibration: true,
        importance: AndroidImportance.HIGH,
    });
}

/**
 * Schedule a notification for a specific habit
 */
export async function scheduleHabitReminder(habit: Habit, reminderTime: string) {
    try {
        // Cancel any existing notifications for this habit
        await cancelHabitReminder(habit.id);

        // Parse the reminder time
        const [hours, minutes] = reminderTime.split(':').map(Number);

        // Create a date for today at the reminder time
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        // If the time has already passed today, schedule for tomorrow
        if (date.getTime() < Date.now()) {
            date.setDate(date.getDate() + 1);
        }

        // Create a time-based trigger
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: date.getTime(),
            repeatFrequency: RepeatFrequency.DAILY,
        };

        // Create the notification content
        await notifee.createTriggerNotification(
            {
                id: `habit-${habit.id}`,
                title: 'Habit Reminder',
                body: `Time to track your habit: ${habit.name}`,
                android: {
                    channelId: 'habit-reminders',
                    pressAction: {
                        id: 'default',
                    },
                    actions: [
                        {
                            title: 'Complete',
                            pressAction: {
                                id: 'complete',
                            },
                        },
                        {
                            title: 'Dismiss',
                            pressAction: {
                                id: 'dismiss',
                            },
                        },
                    ],
                },
                ios: {
                    categoryId: 'habit-reminder',
                },
            },
            trigger,
        );

        return true;
    } catch (error) {
        console.error('Failed to schedule notification:', error);
        return false;
    }
}

/**
 * Schedule reminders for all habits
 */
export async function scheduleAllHabitReminders(habits: Habit[], reminderTime: string) {
    try {
        // Cancel all existing notifications first
        await cancelAllHabitReminders();

        // Schedule a notification for each habit
        for (const habit of habits) {
            await scheduleHabitReminder(habit, reminderTime);
        }

        return true;
    } catch (error) {
        console.error('Failed to schedule all notifications:', error);
        return false;
    }
}

/**
 * Cancel a specific habit reminder
 */
export async function cancelHabitReminder(habitId: number) {
    try {
        await notifee.cancelNotification(`habit-${habitId}`);
        return true;
    } catch (error) {
        console.error(`Failed to cancel notification for habit ${habitId}:`, error);
        return false;
    }
}

/**
 * Cancel all habit reminders
 */
export async function cancelAllHabitReminders() {
    try {
        const notifications = await notifee.getTriggerNotifications();
        for (const notification of notifications) {
            if (notification.notification.id?.startsWith('habit-')) {
                await notifee.cancelTriggerNotification(notification.notification.id);
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to cancel all notifications:', error);
        return false;
    }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
}

/**
 * Check if notifications are permitted
 */
export async function checkNotificationPermission() {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
}

/**
 * Initialize the notification service
 */
export async function initializeNotifications() {
    // Create the notification channel for Android
    await createNotificationChannel();

    // Request permission to send notifications
    return await requestNotificationPermission();
}
