import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { scheduleDailyNotification } from './Notification';

function handleNotificationActions() {
    notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
            switch (detail.pressAction?.id) {
                case 'done':
                    console.log('✅ Task marked as Done');
                    break;
                case 'cancel':
                    console.log('❌ Task Cancelled');
                    break;
                case 'postpone':
                    console.log('⏳ Task Postponed');
                    scheduleDailyNotification(); // Re-schedule for next day
                    break;
            }
        }
    });
}

export function useNotification() {
    useEffect(() => {
        handleNotificationActions();
    }, []);
}
