import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    ActivityIndicator,
    Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MMKV } from 'react-native-mmkv';
import Share from 'react-native-share';
import { FileSystem as FileAccess, Dirs } from 'react-native-file-access';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAllHabitsTableData, deleteAllHabitTableData, resetHabitTable } from '../../backend/databases/HabitDatabase';
import { deleteAllHabitTrackingTables } from '../../backend/databases/HabitProgressDatabase';

// Import notification services
import {
    DEFAULT_NOTIFICATION_SETTINGS,
    NotificationSettings,
    initializeNotifications,
    scheduleAllHabitReminders,
    cancelAllHabitReminders,
    checkNotificationPermission,
} from '../services/NotificationService';

// Storage for settings
const storage = new MMKV();
const SETTINGS_KEY = 'app_settings';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Default settings
const DEFAULT_SETTINGS = {
    sleepTime: '22:00',
    wakeupTime: '06:00',
};

interface Settings {
    sleepTime: string;
    wakeupTime: string;
}

const SettingsScreen: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [showSleepPicker, setShowSleepPicker] = useState(false);
    const [showWakeupPicker, setShowWakeupPicker] = useState(false);
    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Load settings on component mount
    useEffect(() => {
        loadSettings();
        loadNotificationSettings();
    }, []);

    const loadSettings = () => {
        try {
            const settingsJson = storage.getString(SETTINGS_KEY);
            if (settingsJson) {
                setSettings(JSON.parse(settingsJson));
            } else {
                // Initialize with default settings if none exist
                storage.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert('Error', 'Failed to load settings');
        }
    };

    const loadNotificationSettings = () => {
        try {
            const notificationSettingsJson = storage.getString(NOTIFICATION_SETTINGS_KEY);
            if (notificationSettingsJson) {
                setNotificationSettings(JSON.parse(notificationSettingsJson));
            } else {
                // Initialize with default notification settings if none exist
                storage.set(NOTIFICATION_SETTINGS_KEY, JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
            }
        } catch (error) {
            console.error('Error loading notification settings:', error);
            Alert.alert('Error', 'Failed to load notification settings');
        }
    };

    const saveSettings = (newSettings: Settings) => {
        try {
            storage.set(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        }
    };

    const saveNotificationSettings = (newNotificationSettings: NotificationSettings) => {
        try {
            storage.set(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newNotificationSettings));
            setNotificationSettings(newNotificationSettings);
        } catch (error) {
            console.error('Error saving notification settings:', error);
            Alert.alert('Error', 'Failed to save notification settings');
        }
    };

    const handleSleepTimeChange = (event: any, selectedDate?: Date) => {
        setShowSleepPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const newTime = `${hours}:${minutes}`;
            saveSettings({ ...settings, sleepTime: newTime });
        }
    };

    const handleWakeupTimeChange = (event: any, selectedDate?: Date) => {
        setShowWakeupPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const newTime = `${hours}:${minutes}`;
            saveSettings({ ...settings, wakeupTime: newTime });
        }
    };

    const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
        setShowReminderPicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, '0');
            const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
            const newTime = `${hours}:${minutes}`;
            const newSettings = { ...notificationSettings, reminderTime: newTime };
            saveNotificationSettings(newSettings);
            updateNotifications(newSettings);
        }
    };

    const toggleNotifications = (value: boolean) => {
        const newSettings = { ...notificationSettings, enabled: value };
        saveNotificationSettings(newSettings);
        updateNotifications(newSettings);
    };

    const updateNotifications = async (newSettings: NotificationSettings) => {
        try {
            if (newSettings.enabled) {
                // Request permission if not already granted
                const hasPermission = await checkNotificationPermission();
                if (!hasPermission) {
                    const granted = await initializeNotifications();
                    setPermissionGranted(granted);
                    if (!granted) {
                        Alert.alert(
                            'Permission Required',
                            'Notifications require permission. Please enable notifications in your device settings.',
                            [{ text: 'OK' }]
                        );
                        // Disable notifications if permission was denied
                        saveNotificationSettings({ ...newSettings, enabled: false });
                        return;
                    }
                }

                // Schedule notifications for all habits
                const habits = getAllHabitsTableData();
                await scheduleAllHabitReminders(habits, newSettings.reminderTime);
            } else {
                // Cancel all notifications if disabled
                await cancelAllHabitReminders();
            }
        } catch (error) {
            console.error('Error updating notifications:', error);
            Alert.alert('Error', 'Failed to update notification settings');
        }
    };

    const clearDatabase = () => {
        Alert.alert(
            'Clear Database',
            'Are you sure you want to clear all habit data? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await deleteAllHabitTableData();
                            await deleteAllHabitTrackingTables();
                            await resetHabitTable();
                            setIsLoading(false);
                            Alert.alert('Success', 'Database cleared successfully');
                        } catch (error) {
                            setIsLoading(false);
                            console.error('Error clearing database:', error);
                            Alert.alert('Error', 'Failed to clear database');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const exportData = async () => {
        try {
            setIsLoading(true);

            // Get all habits data
            const habits = getAllHabitsTableData();

            // Get all tracking data for each habit
            const trackingData: { [key: string]: any } = {};
            for (const habit of habits) {
                const trackingKey = `habit_tracking_${habit.id}`;
                const habitTrackingJson = storage.getString(trackingKey);
                if (habitTrackingJson) {
                    trackingData[trackingKey] = JSON.parse(habitTrackingJson);
                }
            }

            // Create export object with all data
            const exportObject = {
                habits,
                trackingData,
                settings,
                notificationSettings,
                exportDate: new Date().toISOString(),
            };

            // Convert to JSON string
            const jsonData = JSON.stringify(exportObject, null, 2);

            // Create file with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `habit_tracker_export_${timestamp}.json`;
            const filePath = `${Dirs.DocumentDir}/${fileName}`;

            // Write data to file
            await FileAccess.writeFile(filePath, jsonData, 'utf8');

            // Share the file
            await Share.open({
                title: 'Export Habit Tracker Data',
                message: 'Here is your exported habit tracker data',
                url: `file://${filePath}`,
                type: 'application/json',
            });

            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('Error exporting data:', error);
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const importData = async () => {
        try {
            Alert.alert(
                'Import Data',
                'To import data, please place your JSON file in the Documents folder of your device and name it "habit_tracker_import.json"',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Check for File',
                        onPress: async () => {
                            try {
                                setIsLoading(true);
                                const importPath = `${Dirs.DocumentDir}/habit_tracker_import.json`;

                                // Check if file exists
                                const exists = await FileAccess.exists(importPath);
                                if (!exists) {
                                    setIsLoading(false);
                                    Alert.alert('Error', 'Import file not found. Please make sure you have placed habit_tracker_import.json in your Documents folder.');
                                    return;
                                }

                                // Read file content
                                const fileContent = await FileAccess.readFile(importPath, 'utf8');
                                const importedData = JSON.parse(fileContent);

                                // Validate imported data structure
                                if (!importedData.habits || !importedData.trackingData) {
                                    throw new Error('Invalid import file format');
                                }

                                // Confirm import
                                Alert.alert(
                                    'Confirm Import',
                                    'Importing data will replace all current habits and settings. Continue?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Import',
                                            onPress: async () => {
                                                try {
                                                    // Clear existing data
                                                    await deleteAllHabitTableData();
                                                    await deleteAllHabitTrackingTables();
                                                    await resetHabitTable();

                                                    // Import habits
                                                    storage.set('habits', JSON.stringify(importedData.habits));

                                                    // Import tracking data
                                                    for (const [key, value] of Object.entries(importedData.trackingData)) {
                                                        storage.set(key, JSON.stringify(value));
                                                    }

                                                    // Import settings if available
                                                    if (importedData.settings) {
                                                        saveSettings(importedData.settings);
                                                    }

                                                    // Import notification settings if available
                                                    if (importedData.notificationSettings) {
                                                        saveNotificationSettings(importedData.notificationSettings);
                                                    }

                                                    setIsLoading(false);
                                                    Alert.alert('Success', 'Data imported successfully');
                                                } catch (error) {
                                                    setIsLoading(false);
                                                    console.error('Error importing data:', error);
                                                    Alert.alert('Error', 'Failed to import data');
                                                }
                                            },
                                        },
                                    ],
                                    { cancelable: true }
                                );
                            } catch (error) {
                                setIsLoading(false);
                                console.error('Error reading import file:', error);
                                Alert.alert('Error', 'Failed to read import file. Make sure it is a valid JSON file.');
                            }
                        },
                    },
                ],
                { cancelable: true }
            );
        } catch (error) {
            console.error('Error with import process:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };

    // Initialize notifications on component mount
    useEffect(() => {
        const initNotifications = async () => {
            const hasPermission = await checkNotificationPermission();
            setPermissionGranted(hasPermission);
            if (notificationSettings.enabled && hasPermission) {
                const habits = getAllHabitsTableData();
                await scheduleAllHabitReminders(habits, notificationSettings.reminderTime);
            }
        };

        initNotifications();
    }, [notificationSettings.enabled, notificationSettings.reminderTime]);

    // Format time for display
    const formatTimeForDisplay = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${period}`;
    };

    // Convert string time to Date object for picker
    const timeStringToDate = (timeString: string) => {
        const date = new Date();
        const [hours, minutes] = timeString.split(':');
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date;
    };

    return (
        <ScrollView style={styles.container}>
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4A6FFF" />
                    <Text style={styles.loadingText}>Processing...</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sleep Schedule</Text>
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Sleep Time</Text>
                    <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowSleepPicker(true)}
                    >
                        <Text style={styles.timeText}>{formatTimeForDisplay(settings.sleepTime)}</Text>
                        <Icon name="clock-outline" size={20} color="#4A6FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Wake-up Time</Text>
                    <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowWakeupPicker(true)}
                    >
                        <Text style={styles.timeText}>{formatTimeForDisplay(settings.wakeupTime)}</Text>
                        <Icon name="clock-outline" size={20} color="#4A6FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Reminder Time</Text>
                    <TouchableOpacity
                        style={styles.timeSelector}
                        onPress={() => setShowReminderPicker(true)}
                    >
                        <Text style={styles.timeText}>{formatTimeForDisplay(notificationSettings.reminderTime)}</Text>
                        <Icon name="clock-outline" size={20} color="#4A6FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Enable Notifications</Text>
                    <Switch
                        value={notificationSettings.enabled}
                        onValueChange={toggleNotifications}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>

                <TouchableOpacity style={styles.button} onPress={exportData}>
                    <Icon name="export" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Export Data</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={importData}>
                    <Icon name="import" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Import Data</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearDatabase}>
                    <Icon name="delete" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Clear Database</Text>
                </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            {showSleepPicker && (
                <DateTimePicker
                    value={timeStringToDate(settings.sleepTime)}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleSleepTimeChange}
                />
            )}

            {showWakeupPicker && (
                <DateTimePicker
                    value={timeStringToDate(settings.wakeupTime)}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleWakeupTimeChange}
                />
            )}

            {showReminderPicker && (
                <DateTimePicker
                    value={timeStringToDate(notificationSettings.reminderTime)}
                    mode="time"
                    is24Hour={false}
                    display="default"
                    onChange={handleReminderTimeChange}
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333333',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    settingLabel: {
        fontSize: 16,
        color: '#333333',
    },
    timeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 16,
        marginRight: 8,
        color: '#333333',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A6FFF',
        borderRadius: 8,
        paddingVertical: 12,
        marginVertical: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    dangerButton: {
        backgroundColor: '#E53935',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 16,
    },
});

export default SettingsScreen;
