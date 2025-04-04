import { getHabitTableDataByDate, getHabitTrackingTableDataByDate } from '../../backend/databases/HabitDatabase';
import notifee, {
    TriggerType,
    AndroidImportance,
    TimestampTrigger,
    EventType,
} from '@notifee/react-native';

export async function getTodayUncompletedHabits() {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Get all habits scheduled for today
        const todayHabits = await getHabitTableDataByDate(today);

        // Check completion status for each habit
        const incompleteHabits = [];

        for (const habit of todayHabits) {
            // Get tracking data for this habit today
            const trackingData = await getHabitTrackingTableDataByDate(habit.id, today);

            // Consider habit incomplete if: no tracking data, or completed status is 0
            if (!trackingData || trackingData.completed === 0) {
                incompleteHabits.push(habit);
            }
        }

        return incompleteHabits;
    } catch (error) {
        console.error('Error fetching incomplete habits:', error);
        return [];
    }
}

/**
 * Schedules hourly notifications for incomplete habits
 */
export async function scheduleHourlyHabitReminders() {
    try {
        // Request permission
        await notifee.requestPermission();

        // Create notification channel
        await notifee.createChannel({
            id: 'habit-reminders',
            name: 'Habit Reminders',
            importance: AndroidImportance.DEFAULT,
        });

        // Clear any existing hourly reminders
        await clearHourlyHabitReminders();

        // Schedule the first check to run immediately
        await checkAndNotifyHabits();

        // Schedule the hourly checks (starting from the next hour)
        const now = new Date();
        const nextHour = new Date();
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);

        // Create trigger for hourly notifications (8 AM to 10 PM)
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: nextHour.getTime(),
            repeatFrequency: TriggerType.INTERVAL,
            interval: 60 * 60 * 1000, // 1 hour in milliseconds
        };

        // Create the trigger notification
        await notifee.createTriggerNotification(
            {
                id: 'hourly-habit-check',
                title: 'Habit Check',
                body: 'Checking your habits for today...',
                data: {
                    type: 'hourly-habit-check',
                },
                android: {
                    channelId: 'habit-reminders',
                    pressAction: {
                        id: 'default',
                    },
                },
            },
            trigger
        );

        console.log('Hourly habit reminders scheduled');
    } catch (error) {
        console.error('Error scheduling hourly reminders:', error);
    }
}

export async function clearHourlyHabitReminders() {
    try {
        // Get all pending trigger notifications
        const triggers = await notifee.getTriggerNotifications();

        // Find and cancel hourly habit check notifications
        for (const trigger of triggers) {
            if (trigger.notification.id === 'hourly-habit-check') {
                await notifee.cancelTriggerNotification(trigger.notification.id);
            }
        }
    } catch (error) {
        console.error('Error clearing hourly reminders:', error);
    }
}


export async function checkAndNotifyHabits() {
    try {
        // Get current hour
        const currentHour = new Date().getHours();

        // Only show notifications between 8 AM and 10 PM
        if (currentHour < 8 || currentHour > 22) {
            return;
        }

        // Get incomplete habits
        const incompleteHabits = await getTodayUncompletedHabits();

        // If there are incomplete habits, send a notification
        if (incompleteHabits.length > 0) {
            await notifee.requestPermission();

            // Create the notification channel if it doesn't exist
            await notifee.createChannel({
                id: 'habit-reminders',
                name: 'Habit Reminders',
                importance: AndroidImportance.DEFAULT,
            });

            // Format notification message
            let body = '';
            if (incompleteHabits.length === 1) {
                body = `You have 1 habit left to complete today: ${incompleteHabits[0].name}`;
            } else {
                const habitNames = incompleteHabits.map(h => h.name).join(', ');
                body = `You have ${incompleteHabits.length} habits left to complete: ${habitNames}`;
            }

            // Display the notification
            await notifee.displayNotification({
                title: 'Habits Reminder',
                body,
                android: {
                    channelId: 'habit-reminders',
                    pressAction: {
                        id: 'default',
                    },
                    actions: [
                        {
                            title: '✅ View Habits',
                            pressAction: {
                                id: 'view-habits',
                                launchActivity: 'default',
                            },
                        },
                        {
                            title: '⏱️ Later',
                            pressAction: {
                                id: 'remind-later',
                            },
                        },
                    ],
                },
            });
        }
    } catch (error) {
        console.error('Error checking and notifying habits:', error);
    }
}

export function startHabitReminderSystem() {
    // Schedule the hourly reminders
    scheduleHourlyHabitReminders();

    // Set up the foreground event handler for notification actions
    notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
            if (detail.pressAction?.id === 'view-habits') {
                console.log('User wants to view habits');
            } else if (detail.pressAction?.id === 'remind-later') {
                setTimeout(() => {
                    checkAndNotifyHabits();
                }, 30 * 60 * 1000); // 30 minutes
            }
        }
    });

    // Set up background event handler (optional)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) { // Use EventType directly here too
            // Handle background actions here
            return Promise.resolve();
        }
    });
}
