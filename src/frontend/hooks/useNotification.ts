import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { updateHabitProgress, getHabitById } from '../services/HabitService';
import { HabitProps } from '../../backend/props/HabitProps';


// Hook to handle notification events

export function useNotification() {
    useEffect(() => {
        // Set up the notification listener
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            switch (type) {
                case EventType.DISMISSED:
                    console.log('User dismissed notification', detail.notification);
                    break;
                case EventType.PRESS:
                    console.log('User pressed notification', detail.notification);
                    break;
                case EventType.ACTION_PRESS:
                    console.log('User pressed action', detail.pressAction, detail.notification);
                    // Handle action press (e.g., marking a habit as complete)
                    if (detail.pressAction?.id === 'complete' && detail.notification?.id) {
                        const habitIdString = detail.notification.id.replace('habit-', '');
                        const habitId = parseInt(habitIdString, 10);

                        if (!isNaN(habitId)) {
                            console.log(`Processing 'complete' action for habit ID: ${habitId}`);
                            // Call async function to handle the update
                            handleCompleteAction(habitId).catch(error => {
                                console.error(`Error handling complete action for habit ${habitId}:`, error);
                            });
                        } else {
                            console.warn(`Could not parse habit ID from notification ID: ${detail.notification.id}`);
                        }
                    }
                    break;
            }
        });
        return () => unsubscribe();
    }, []);

    // Async function to handle the habit completion logic
    const handleCompleteAction = async (habitId: number) => {
        try {
            const habit = await getHabitById(habitId);
            if (!habit) {
                console.error(`Habit with ID ${habitId} not found.`);
                return;
            }

            let progressToSet = 0;
            if (habit.mode === HabitProps.with_yes_or_no) {
                progressToSet = 1; // Mark as done
            } else {
                progressToSet = habit.target;
            }

            const today = new Date();
            await updateHabitProgress(habitId, today, progressToSet);
            console.log(`Habit ${habitId} marked as complete via notification action.`);
        } catch (error) {
            console.error(`Failed to update habit ${habitId} progress via notification:`, error);
        }
    };

    return null;
}
