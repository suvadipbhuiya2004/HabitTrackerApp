import { MMKV } from 'react-native-mmkv';
import { isValidDate } from '../props/DateProps';
import { getHabitTableDataById } from './HabitDatabase';

// Initialize MMKV storage - using same instance as HabitDatabase
const storage = new MMKV();

// Prefix key for tracking data
const HABIT_TRACKING_PREFIX = 'habit_tracking_';

// Tracking data interface
interface TrackingData {
    id: number;
    date: string;
    progress: number;
    completed: number;
}

// Helper function to get next ID for tracking data
const getNextTrackingId = (habitId: number): number => {
    const trackingKey = `${HABIT_TRACKING_PREFIX}${habitId}`;
    const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];
    if (trackingData.length === 0) {return 1;}
    return Math.max(...trackingData.map(data => data.id)) + 1;
};

// Initialize tracking for a habit
export const initHabitTrackingTable = async (ID: number) => {
    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;

        // Create tracking array if doesn't exist
        if (!storage.contains(trackingKey)) {
            storage.set(trackingKey, JSON.stringify([]));
            console.log(`Tracking table for habit ID ${ID} created successfully`);
        }

        return Promise.resolve();
    } catch (error) {
        console.error(`Error initializing tracking for habit ID ${ID}:`, error);
        return Promise.reject(error);
    }
};

// Get tracking data by date
export const getHabitTrackingTableDataByDate = async (ID: number, date: string): Promise<TrackingData | null> => {
    if (!isValidDate(date)) {
        throw new Error('Invalid date format. Please use DD-MM-YYYY.');
    }

    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;

        if (!storage.contains(trackingKey)) {
            await initHabitTrackingTable(ID);
            return null;
        }

        const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];
        const entry = trackingData.find(data => data.date === date);

        return entry || null;
    } catch (error) {
        console.error('Error fetching tracking data:', error);
        return null;
    }
};

// Update habit tracking data
export const updateHabitTrackingTable = async (ID: number, date: string, progress: number, skip: boolean) => {
    if (!isValidDate(date)) {
        throw new Error('Invalid date format. Please use DD-MM-YYYY.');
    }

    try {
        // Verify that the habit exists
        const habitData = await getHabitTableDataById(ID);
        if (!habitData) {
            throw new Error(`Habit with ID ${ID} not found`);
        }

        // Calculate completion status
        let completed = 0;
        if (habitData.target === progress) {
            completed = 1;
        } else if (habitData.target > progress) {
            completed = 0;
        } else if (skip) {
            completed = 2;
        }

        // Initialize tracking table if needed
        await initHabitTrackingTable(ID);

        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;
        const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];

        // Check if entry exists for this date
        const existingEntryIndex = trackingData.findIndex(data => data.date === date);

        if (existingEntryIndex >= 0) {
            // Update existing entry
            trackingData[existingEntryIndex].progress = progress;
            trackingData[existingEntryIndex].completed = completed;
        } else {
            // Create new entry
            trackingData.push({
                id: getNextTrackingId(ID),
                date,
                progress,
                completed,
            });
        }

        // Save updated tracking data
        storage.set(trackingKey, JSON.stringify(trackingData));
        console.log('Tracking data updated successfully');
        return Promise.resolve();
    } catch (error) {
        console.error(`Error updating tracking data for habit ID ${ID}:`, error);
        return Promise.reject(error);
    }
};

// Update progress for all entries of a habit
export const updateHabitProgress = async (ID: number, progress: number, completed: number) => {
    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;

        // Check if tracking data exists
        if (!storage.contains(trackingKey)) {
            throw new Error(`Tracking data for habit ID ${ID} not found`);
        }

        const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];

        // Update all entries
        const updatedData = trackingData.map(entry => ({
            ...entry,
            progress,
            completed,
        }));

        // Save updated tracking data
        storage.set(trackingKey, JSON.stringify(updatedData));
        console.log('Progress updated for all entries successfully');
        return Promise.resolve();
    } catch (error) {
        console.error(`Error updating progress for habit ID ${ID}:`, error);
        return Promise.reject(error);
    }
};

// Delete tracking data entry by ID
export const deleteHabitTrackingTableDataById = async (ID_habit: number, ID: number) => {
    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID_habit}`;

        // Check if tracking data exists
        if (!storage.contains(trackingKey)) {
            throw new Error(`Tracking data for habit ID ${ID_habit} not found`);
        }

        const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];

        // Check if the entry exists
        const entryIndex = trackingData.findIndex(data => data.id === ID);
        if (entryIndex === -1) {
            throw new Error(`No record found with ID ${ID} in tracking data for habit ID ${ID_habit}`);
        }

        // Remove the entry
        trackingData.splice(entryIndex, 1);

        // Save updated tracking data
        storage.set(trackingKey, JSON.stringify(trackingData));
        console.log('Tracking data entry deleted successfully');
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting tracking data entry:', error);
        return Promise.reject(error);
    }
};

// Delete tracking data by date
export const deleteHabitTrackingTableDataByDate = async (ID: number, date: string): Promise<void> => {
    if (!isValidDate(date)) {
        throw new Error('Invalid date format. Please use DD-MM-YYYY.');
    }

    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;

        // Check if tracking data exists
        if (!storage.contains(trackingKey)) {
            throw new Error(`Tracking data for habit ID ${ID} not found`);
        }

        const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];

        // Check if any entry exists for the date
        const entryIndex = trackingData.findIndex(data => data.date === date);
        if (entryIndex === -1) {
            throw new Error(`No data found for date ${date} in tracking data for habit ID ${ID}`);
        }

        // Remove the entry
        trackingData.splice(entryIndex, 1);

        // Save updated tracking data
        storage.set(trackingKey, JSON.stringify(trackingData));
        console.log(`Tracking data for date ${date} deleted successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting tracking data by date:', error);
        return Promise.reject(error);
    }
};

// Delete all tracking data for a habit
export const deleteAllHabitTrackingTableData = async (ID: number) => {
    try {
        const trackingKey = `${HABIT_TRACKING_PREFIX}${ID}`;

        // Check if tracking data exists
        if (!storage.contains(trackingKey)) {
            throw new Error(`Tracking data for habit ID ${ID} not found`);
        }

        // Delete tracking data
        storage.delete(trackingKey);
        console.log(`All tracking data for habit ID ${ID} deleted successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting all tracking data for habit:', error);
        return Promise.reject(error);
    }
};

// Delete all habit tracking data
export const deleteAllHabitTrackingTables = async () => {
    try {
        // Get all keys in storage
        const allKeys = storage.getAllKeys();

        // Filter tracking keys
        const trackingKeys = allKeys.filter(key => key.startsWith(HABIT_TRACKING_PREFIX));

        if (trackingKeys.length === 0) {
            console.log('No habit tracking data found.');
            return Promise.resolve();
        }

        // Delete all tracking data
        trackingKeys.forEach(key => {
            storage.delete(key);
            console.log(`Deleted tracking data: ${key}`);
        });

        console.log('All habit tracking data deleted successfully');
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting all habit tracking data:', error);
        return Promise.reject(error);
    }
};
