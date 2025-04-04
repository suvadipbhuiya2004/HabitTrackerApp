import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MMKV } from 'react-native-mmkv';
import notifee, { TimestampTrigger, TriggerType, AndroidImportance, RepeatFrequency } from '@notifee/react-native';
import { exportAllData, importData } from '../services/DataExportService';
import { colors, spacing } from '../theme/theme';
import { deleteAllHabitTableData } from '../../backend/databases/HabitDatabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Portal, Dialog, Button as PaperButton, TextInput as PaperTextInput } from 'react-native-paper';

// Initialize MMKV storage
const storage = new MMKV();

// Key for storing notification settings
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const DAILY_REMINDER_NOTIFICATION_ID = 'daily-reminder';

// Define types for notification settings
interface NotificationSettings {
    enabled: boolean;
    time: number;
}

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    time: new Date().setHours(8, 0, 0, 0),
};

const SettingsScreen = () => {
    // State for notification settings - Initialize directly with 8 AM default
    const [notificationsEnabled, setNotificationsEnabled] = useState(DEFAULT_NOTIFICATION_SETTINGS.enabled);
    const [notificationTime, setNotificationTime] = useState(new Date(DEFAULT_NOTIFICATION_SETTINGS.time));
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // State for data export/import
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importDialogVisible, setImportDialogVisible] = useState(false);
    const [importJsonText, setImportJsonText] = useState('');

    // --- Define saveNotificationSettings function BEFORE useEffect ---
    const saveNotificationSettings = (settings: NotificationSettings) => {
        storage.set(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    };

    useEffect(() => {
        storage.delete(NOTIFICATION_SETTINGS_KEY);

        const defaultTime = new Date(DEFAULT_NOTIFICATION_SETTINGS.time);
        const defaultEnabled = DEFAULT_NOTIFICATION_SETTINGS.enabled;
        setNotificationsEnabled(defaultEnabled);
        setNotificationTime(defaultTime);

        saveNotificationSettings({
            enabled: defaultEnabled,
            time: defaultTime.getTime(),
        });

        // Indicate loading is complete
        setIsLoadingSettings(false);

    }, []);

    // Handle toggle of notifications
    const handleToggleNotifications = (value: boolean) => {
        setNotificationsEnabled(value);
        saveNotificationSettings({
            enabled: value,
            time: notificationTime.getTime(),
        });

        // Schedule or cancel notifications based on the new state
        if (value) {
            scheduleDailyNotification(notificationTime);
        } else {
            cancelScheduledNotifications();
        }
    };

    // Handle time change
    const handleTimeChange = (event: any, selectedTime?: Date) => {
        const currentDate = selectedTime || notificationTime;
        setShowTimePicker(Platform.OS === 'ios');

        if (selectedTime) {
            setNotificationTime(currentDate);
            saveNotificationSettings({
                enabled: notificationsEnabled,
                time: currentDate.getTime(),
            });

            if (notificationsEnabled) {
                scheduleDailyNotification(currentDate);
            }
        }
    };

    // Function to schedule the daily notification
    const scheduleDailyNotification = async (time: Date) => {
        try {
            await notifee.requestPermission();

            const channelId = await notifee.createChannel({
                id: 'reminders',
                name: 'Daily Reminders',
                importance: AndroidImportance.DEFAULT,
            });

            // Create a timestamp trigger for the selected time today
            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: time.getTime(),
                repeatFrequency: RepeatFrequency.DAILY,
            };

            // Create the notification
            await notifee.createTriggerNotification(
                {
                    id: DAILY_REMINDER_NOTIFICATION_ID,
                    title: 'Habit Reminder',
                    body: 'Don\'t forget to update your habits today!',
                    android: {
                        channelId,
                        pressAction: {
                            id: 'default', // Opens the app
                        },
                    },
                    ios: {
                        sound: 'default',
                    },
                },
                trigger,
            );

            console.log(`Daily notification scheduled for ${formatTime(time)} with ID ${DAILY_REMINDER_NOTIFICATION_ID}`);
        } catch (error) {
            console.error('Error scheduling daily notification:', error);
            Alert.alert('Error', 'Could not schedule daily reminder.');
        }
    };

    // Function to cancel scheduled notifications
    const cancelScheduledNotifications = async () => {
        try {
            await notifee.cancelNotification(DAILY_REMINDER_NOTIFICATION_ID);
            console.log(`Cancelled scheduled notification with ID ${DAILY_REMINDER_NOTIFICATION_ID}`);
        } catch (error) {
            console.error('Error cancelling notifications:', error);
        }
    };

    // Format time for display
    const formatTime = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const minutesStr = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutesStr} ${ampm}`;
    };

    // Send a test notification
    const sendTestNotification = async () => {
        try {
            // Create a channel (required for Android)
            const channelId = await notifee.createChannel({
                id: 'default',
                name: 'Default Channel',
                importance: AndroidImportance.HIGH,
            });

            // Create a time-based trigger (5 seconds from now)
            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: Date.now() + 5000,
            };

            await notifee.createTriggerNotification(
                {
                    // Use a different ID for test notifications
                    id: 'test-notification',
                    title: 'Test Notification',
                    body: 'This is a test notification from Habit Tracker!',
                    android: {
                        channelId,
                        importance: AndroidImportance.HIGH, // Use HIGH for testing visibility
                        pressAction: {
                            id: 'default',
                        },
                    },
                    ios: {
                        sound: 'default',
                    },
                },
                trigger,
            );

            Alert.alert('Test Notification Sent', 'You should receive a notification in 5 seconds.');
        } catch (error) {
            console.error('Error sending test notification:', error);
            Alert.alert('Error', 'Failed to send test notification.');
        }
    };

    // Handle data export (copy to clipboard)
    const handleExportData = async () => {
        setIsExporting(true);
        try {
            await exportAllData(); // Service function now handles clipboard and alert
        } catch (error) {
            // Error alert is handled within exportAllData, but log here too
            console.error('Export error in SettingsScreen:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Show the import dialog
    const showImportDialog = () => {
        setImportJsonText(''); // Clear previous text
        setImportDialogVisible(true);
    };

    // Hide the import dialog
    const hideImportDialog = () => {
        setImportDialogVisible(false);
        setImportJsonText(''); // Clear text on close
    };

    // Handle the actual import process after user confirms in dialog
    const handleConfirmImport = async () => {
        hideImportDialog(); // Close dialog first

        if (!importJsonText.trim()) {
            Alert.alert('Import Failed', 'No data pasted to import.');
            return;
        }

        // Confirmation before overwriting data
        Alert.alert(
            'Confirm Import',
            'This will replace all your current habits and tracking data. This action cannot be undone. Are you sure you want to continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Import',
                    style: 'destructive',
                    onPress: async () => {
                        setIsImporting(true);
                        try {
                            await importData(importJsonText); // Pass pasted text to service
                            // Success alert is handled within importData
                            // TODO: Add logic to refresh the app state after import if necessary (e.g., navigate away and back, or use a state management solution)
                        } catch (error) {
                            // Error alert is handled within importData, but log here too
                            console.error('Import error in SettingsScreen:', error);
                        } finally {
                            setIsImporting(false);
                        }
                    },
                },
            ]
        );
    };


    return (
        <>
            <ScrollView style={styles.container}>
                {/* Notifications Section ... */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Enable Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={notificationsEnabled ? '#2196F3' : '#f4f3f4'}
                        />
                    </View>

                    {/* Conditionally render time settings based on loading state */}
                    {!isLoadingSettings && (
                        <>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Default Reminder Time</Text>
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    style={styles.timeButton}
                                    disabled={!notificationsEnabled}
                                >
                                    <Text style={[
                                        styles.timeButtonText,
                                        !notificationsEnabled && styles.disabledText,
                                    ]}>
                                        {formatTime(notificationTime)}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={notificationTime}
                                    mode="time"
                                    is24Hour={false}
                                    display="default"
                                    onChange={handleTimeChange}
                                />
                            )}
                        </>
                    )}

                    <TouchableOpacity
                        style={[styles.button, !notificationsEnabled && styles.disabled]}
                        onPress={sendTestNotification}
                        disabled={!notificationsEnabled}
                    >
                        <Text style={styles.buttonText}>Send Test Notification</Text>
                    </TouchableOpacity>
                </View>

                {/* Data Management Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <Text style={styles.infoText}>
                        Export your habits and tracking data to the clipboard, or import data by pasting it from the clipboard.
                    </Text>

                    <TouchableOpacity
                        style={[styles.button, styles.exportButton, isExporting && styles.disabled]}
                        onPress={handleExportData}
                        disabled={isExporting}
                    >
                        <Icon name="content-copy" size={20} color="white" style={styles.mr} />
                        <Text style={styles.buttonText}>
                            {isExporting ? 'Copying...' : 'Copy Data to Clipboard'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.importButton, isImporting && styles.disabled]}
                        onPress={showImportDialog} // Show dialog instead of direct import
                        disabled={isImporting}
                    >
                        <Icon name="content-paste" size={20} color="white" style={styles.mr} />
                        <Text style={styles.buttonText}>
                            {isImporting ? 'Importing...' : 'Import Data from Clipboard'}
                        </Text>
                    </TouchableOpacity>

                    {/* Delete All Data Button */}
                    <TouchableOpacity
                        style={[styles.button, styles.deleteAllButton]} // Use common button style + specific delete style
                        onPress={() => {
                            Alert.alert(
                                'Delete All Data',
                                'Are you sure you want to delete all habits and tracking data? This action cannot be undone.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                // Consider moving deleteAllHabitTableData to HabitService for consistency
                                                await deleteAllHabitTableData();
                                                Alert.alert('Success', 'All habit data has been deleted.');
                                                // Optionally navigate away or refresh state if needed
                                            } catch (error) {
                                                console.error('Error deleting all data:', error);
                                                Alert.alert('Error', 'Failed to delete all habit data.');
                                            }
                                        },
                                    },
                                ],
                            );
                        }}
                    >
                        <Icon name="delete-sweep" size={20} color="white" style={styles.mr} />
                        <Text style={styles.buttonText}>Delete All Data</Text> {/* Use common buttonText style */}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Import Dialog */}
            <Portal>
                <Dialog visible={importDialogVisible} onDismiss={hideImportDialog}>
                    <Dialog.Title>Import Data</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogInfoText}>
                            Paste the previously exported JSON data into the text box below.
                        </Text>
                        <PaperTextInput
                            label="Pasted JSON Data"
                            value={importJsonText}
                            onChangeText={setImportJsonText}
                            multiline
                            numberOfLines={8} // Adjust height as needed
                            style={styles.textInput}
                            mode="outlined"
                            disabled={isImporting}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <PaperButton onPress={hideImportDialog} disabled={isImporting}>Cancel</PaperButton>
                        <PaperButton onPress={handleConfirmImport} disabled={isImporting || !importJsonText.trim()} loading={isImporting}>
                            Import
                        </PaperButton>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: 'white',
        margin: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
    },
    timeButton: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 5,
    },
    timeButtonText: {
        fontSize: 16,
        color: '#2196F3',
    },
    disabledText: {
        color: '#aaa',
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 4,
    },
    disabled: {
        opacity: 0.6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        lineHeight: 20,
    },
    exportButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    importButton: {
        backgroundColor: '#FF9800',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteAllButton: {
        backgroundColor: colors.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dialogInfoText: {
        marginBottom: spacing.md,
        fontSize: 15,
        color: colors.textSecondary,
    },
    textInput: {
        maxHeight: 200,
        marginBottom: spacing.md,
    },
    mr: {
        marginRight: spacing.sm,
    },
});

export default SettingsScreen;
