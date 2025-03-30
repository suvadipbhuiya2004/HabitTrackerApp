import { MMKV } from 'react-native-mmkv';
import { isValidDate } from '../props/DateProps';

// Initialize MMKV storage
const storage = new MMKV();

// Prefix keys for different data types
const HABITS_KEY = 'habits';
const HABIT_TRACKING_PREFIX = 'habit_tracking_';

// Habit interface
interface Habit {
    id: number;
    name: string;
    mode: number;
    target: number;
    startDate: string;
    endDate: string | null;
    time: string | null;
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
}

// Tracking data interface
interface TrackingData {
    id: number;
    date: string;
    progress: number;
    completed: number;
}

// Helper function to get next ID for habits
const getNextHabitId = (): number => {
    const habits = getAllHabitsTableData();
    if (habits.length === 0) { return 1; }
    return Math.max(...habits.map(habit => habit.id)) + 1;
};

// Helper function to get next ID for tracking data
const getNextTrackingId = (habitId: number): number => {
    const trackingKey = `${HABIT_TRACKING_PREFIX}${habitId}`;
    const trackingData = JSON.parse(storage.getString(trackingKey) || '[]') as TrackingData[];
    if (trackingData.length === 0) { return 1; }
    return Math.max(...trackingData.map(data => data.id)) + 1;
};

// Create initial storage - equivalent to initHabitTable
export const initHabitTable = async () => {
    if (!storage.contains(HABITS_KEY)) {
        storage.set(HABITS_KEY, JSON.stringify([]));
        console.log('Habit storage initialized successfully');
    }
    return Promise.resolve();
};

// Add a new habit
export const addHabitTableData = async (
    name: string,
    mode: number,
    target: number,
    start_date: string | null,
    end_date: string | null,
    time: string | null,
    sun: number,
    mon: number,
    tue: number,
    wed: number,
    thu: number,
    fri: number,
    sat: number
) => {
    // Validate all inputs
    if (!name || name.trim() === '') {
        throw new Error('Name cannot be empty');
    }

    if (![1, 2, 3].includes(mode)) {
        throw new Error('Mode must be 1, 2, or 3');
    }

    if (target < 0) {
        throw new Error('Target must be greater than 0');
    }

    if (start_date && !isValidDate(start_date, 'YYYY-MM-DD')) {
        throw new Error('Invalid start date format. Please use YYYY-MM-DD.');
    }

    if (end_date && !isValidDate(end_date, 'YYYY-MM-DD')) {
        throw new Error('Invalid end date format. Please use YYYY-MM-DD.');
    }

    // Ensure binary values are actually 0 or 1
    const validateBinary = (val: number) => val === 0 || val === 1 ? val : 1;

    try {
        // Get existing habits
        const habits = getAllHabitsTableData();

        // Create new habit object
        const newHabit: Habit = {
            id: getNextHabitId(),
            name: name.trim(),
            mode,
            target,
            startDate: start_date || (new Date()).toISOString().split('T')[0],
            endDate: end_date,
            time,
            sun: validateBinary(sun),
            mon: validateBinary(mon),
            tue: validateBinary(tue),
            wed: validateBinary(wed),
            thu: validateBinary(thu),
            fri: validateBinary(fri),
            sat: validateBinary(sat),
        };

        // Add to habits array
        habits.push(newHabit);

        // Save updated habits array
        storage.set(HABITS_KEY, JSON.stringify(habits));

        console.log('Data added successfully');
        return Promise.resolve();
    } catch (error) {
        console.error('Error adding habit:', error);
        return Promise.reject(error);
    }
};

// Get all habits
export const getAllHabitsTableData = (): Habit[] => {
    try {
        const habitsJson = storage.getString(HABITS_KEY);
        if (!habitsJson) {
            storage.set(HABITS_KEY, JSON.stringify([]));
            return [];
        }
        return JSON.parse(habitsJson) as Habit[];
    } catch (error) {
        console.error('Error fetching habits:', error);
        return [];
    }
};

// Get habit by ID
export const getHabitTableDataById = async (id: number): Promise<Habit | null> => {
    try {
        const habits = getAllHabitsTableData();
        const habit = habits.find(h => h.id === id);
        return habit || null;
    } catch (error) {
        console.error('Error fetching habit by ID:', error);
        return null;
    }
};

// Get habits by date
export const getHabitTableDataByDate = async (date: string): Promise<Habit[]> => {
    // Validate date format
    if (!isValidDate(date, 'YYYY-MM-DD')) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
    }

    try {
        const habits = getAllHabitsTableData();

        // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = new Date(date).getDay();
        const dayProperties = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayProperty = dayProperties[dayOfWeek];

        // Filter habits based on start and end dates and day of week
        return habits.filter(habit => {
            const startDateValid = habit.startDate <= date;
            const endDateValid = !habit.endDate || habit.endDate >= date;
            const dayValid = habit[dayProperty as keyof Habit] === 1;
            return startDateValid && endDateValid && dayValid;
        });
    } catch (error) {
        console.error('Error fetching habits by date:', error);
        return [];
    }
};

// Delete habit by ID
export const deleteHabitTableDataById = async (id: number): Promise<void> => {
    try {
        // Check if habit exists
        const habits = getAllHabitsTableData();
        const habitIndex = habits.findIndex(h => h.id === id);

        if (habitIndex === -1) {
            throw new Error(`Habit with ID ${id} not found`);
        }

        // Remove habit from array
        habits.splice(habitIndex, 1);

        // Save updated habits array
        storage.set(HABITS_KEY, JSON.stringify(habits));

        // Delete tracking data for the habit
        const trackingKey = `${HABIT_TRACKING_PREFIX}${id}`;
        if (storage.contains(trackingKey)) {
            storage.delete(trackingKey);
        }

        console.log(`Habit with ID ${id} deleted successfully`);
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting habit:', error);
        return Promise.reject(error);
    }
};

// Delete all habits
export const deleteAllHabitTableData = async () => {
    try {
        // Clear habits
        storage.set(HABITS_KEY, JSON.stringify([]));

        // Delete all tracking data
        await deleteAllHabitTrackingTables();

        console.log('All habit data deleted successfully');
        return Promise.resolve();
    } catch (error) {
        console.error('Error deleting all habits:', error);
        return Promise.reject(error);
    }
};

// Reset habit table (same as clear all in MMKV)
export const resetHabitTable = async () => {
    storage.clearAll();
    return Promise.resolve();
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
    if (!isValidDate(date, 'YYYY-MM-DD')) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
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
    if (!isValidDate(date, 'YYYY-MM-DD')) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
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
    if (!isValidDate(date, 'YYYY-MM-DD')) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD.');
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
        const allKeys = storage.getAllKeys() || [];

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
