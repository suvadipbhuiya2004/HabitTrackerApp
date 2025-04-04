import { MMKV } from 'react-native-mmkv';
import { Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
    getAllHabitsTableData,
    deleteAllHabitTableData,
    addHabitTableData,
    deleteAllHabitTrackingTables,
    initHabitTable,
} from '../../backend/databases/HabitDatabase';

// Initialize MMKV storage
const storage = new MMKV();

// Keys for different data types
const HABIT_TRACKING_PREFIX = 'habit_tracking_';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Interface for exported data

interface ExportedData {
    habits: any[];
    habitTracking: Record<string, any[]>;
    notificationSettings: any;
    exportDate: string;
    appVersion: string;
}


export const getAllDataForExport = async (): Promise<ExportedData> => {
    try {
        // Get all habits
        const habits = getAllHabitsTableData();

        // Get all tracking data
        const habitTracking: Record<string, any[]> = {};
        const allKeys = storage.getAllKeys();
        const trackingKeys = allKeys.filter(key => key.startsWith(HABIT_TRACKING_PREFIX));

        trackingKeys.forEach(key => {
            const trackingData = JSON.parse(storage.getString(key) || '[]');
            habitTracking[key] = trackingData;
        });

        // Get notification settings
        const notificationSettingsJson = storage.getString(NOTIFICATION_SETTINGS_KEY);
        const notificationSettings = notificationSettingsJson ? JSON.parse(notificationSettingsJson) : null;

        return {
            habits,
            habitTracking,
            notificationSettings,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0', // This should ideally come from your app config
        };
    } catch (error) {
        console.error('Error getting data for export:', error);
        throw error;
    }
};

export const exportAllData = async (): Promise<void> => {
    try {
        // Get all data
        const exportData = await getAllDataForExport();

        // Convert to JSON
        const jsonData = JSON.stringify(exportData, null, 2);

        // Copy to clipboard
        Clipboard.setString(jsonData);

        console.log('Data copied to clipboard successfully');
        // Optionally show an alert to the user
        Alert.alert('Export Successful', 'All habit data has been copied to your clipboard.');

    } catch (error: any) { // Added type annotation for error
        console.error('Error exporting data to clipboard:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert('Export Failed', `Failed to copy data to clipboard: ${errorMessage}`);
        throw error;
    }
};

export const importData = async (jsonData: string): Promise<void> => {
    try {
        // Validate input
        if (!jsonData || typeof jsonData !== 'string' || jsonData.trim() === '') {
            throw new Error('No data provided for import.');
        }

        // Parse the JSON data
        let importedData: ExportedData;
        try {
            importedData = JSON.parse(jsonData);
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            throw new Error('Invalid JSON format. Please ensure the pasted data is correct.');
        }


        // Validate the imported data structure
        if (!importedData || typeof importedData !== 'object' || !importedData.habits || !importedData.habitTracking) {
            throw new Error('Invalid import file format');
        }

        // Clear existing data
        await deleteAllHabitTableData();
        await deleteAllHabitTrackingTables();

        // Initialize habit table
        await initHabitTable();

        // Import habits
        for (const habit of importedData.habits) {
            await addHabitTableData(
                habit.name,
                habit.mode,
                habit.target,
                habit.startDate,
                habit.endDate,
                habit.time,
                habit.sun,
                habit.mon,
                habit.tue,
                habit.wed,
                habit.thu,
                habit.fri,
                habit.sat,
            );
        }

        // Import tracking data
        Object.entries(importedData.habitTracking).forEach(([key, value]) => {
            storage.set(key, JSON.stringify(value));
        });

        // Import notification settings
        if (importedData.notificationSettings) {
            storage.set(NOTIFICATION_SETTINGS_KEY, JSON.stringify(importedData.notificationSettings));
        }

        console.log('Data imported successfully');
        // Optionally show success alert
        Alert.alert('Import Successful', 'Data has been imported successfully.');
    } catch (error: any) { // Added type annotation for error
        console.error('Error importing data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Show error alert to the user
        Alert.alert('Import Failed', `Failed to import data: ${errorMessage}`);
        throw error;
    }
};
