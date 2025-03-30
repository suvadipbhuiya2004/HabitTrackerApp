import notifee, { TriggerType, RepeatFrequency, AndroidImportance, TimestampTrigger } from '@notifee/react-native';

// Function to show an instant notification (for testing)
async function showInstantNotification() {
    // Request permissions (iOS)
    await notifee.requestPermission();

    // Create a notification channel (Android)
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });

    // Show the notification instantly
    await notifee.displayNotification({
        title: 'Test Notification',
        body: 'This is an instant notification!',
        android: {
            channelId: 'default',
            actions: [
                { title: '✅ Done', pressAction: { id: 'done' } },
                { title: '❌ Cancel', pressAction: { id: 'cancel' } },
                { title: '⏳ Postpone', pressAction: { id: 'postpone' } },
            ],
        },
    });
}

// Function to schedule a daily notification
async function scheduleDailyNotification() {
    await notifee.requestPermission();

    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });

    // Set the time for the notification (e.g., 8:00 AM daily)
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    if (date.getTime() < Date.now()) {
        date.setDate(date.getDate() + 1); // If time has passed, schedule for next day
    }

    // Create a repeating trigger
    const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
    };

    // Schedule the notification
    await notifee.createTriggerNotification(
        {
            title: 'Daily Reminder',
            body: 'It’s time to complete your habit!',
            android: {
                channelId: 'default',
                actions: [
                    { title: '✅ Done', pressAction: { id: 'done' } },
                    { title: '❌ Cancel', pressAction: { id: 'cancel' } },
                    { title: '⏳ Postpone', pressAction: { id: 'postpone' } },
                ],
            },
        },
        trigger as TimestampTrigger
    );
}

export { showInstantNotification, scheduleDailyNotification };
