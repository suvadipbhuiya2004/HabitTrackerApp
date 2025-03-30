import {
    addHabitTableData,
    getAllHabitsTableData,
    getHabitTableDataById,
    getHabitTableDataByDate,
    deleteHabitTableDataById,
    deleteAllHabitTableData,
    resetHabitTable,
} from '../../backend/databases/HabitDatabase';

import {
    initHabitTrackingTable,
    getHabitTrackingTableDataByDate,
    updateHabitTrackingTable,
    deleteHabitTrackingTableDataByDate,
    deleteAllHabitTrackingTableData,
} from '../../backend/databases/HabitProgressDatabase';

import { HabitProps } from '../../backend/props/HabitProps';
import { format } from 'date-fns';

// Habit interface matching the database structure
export interface Habit {
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
export interface TrackingData {
    id: number;
    date: string;
    progress: number;
    completed: number;
}

// Extended habit interface with progress information
export interface HabitWithProgress extends Habit {
    progress: number;
    completed: number;
}

// Format date to DD-MM-YYYY for database operations (HabitProgressDatabase expects this format)
export const formatDateForDB = (date: Date): string => {
    return format(date, 'dd-MM-yyyy');
};

// Format date to YYYY-MM-DD for HabitDatabase operations
export const formatDateForHabitDB = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Convert day names to day flags for database
export const getDayFlags = (selectedDays: string[]): { [key: string]: number } => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const flags: { [key: string]: number } = {};

    // If no days selected, default to all days
    if (selectedDays.length === 0) {
        days.forEach(day => {
            flags[day] = 1;
        });
    } else {
        // Initialize all days to 0
        days.forEach(day => {
            flags[day] = 0;
        });

        // Set selected days to 1
        selectedDays.forEach(day => {
            // Convert day names like 'Mon', 'Tue' to lowercase 'mon', 'tue'
            const dayLower = day.toLowerCase();
            // Check if this is a valid day key
            if (days.includes(dayLower)) {
                flags[dayLower] = 1;
            } else if (days.includes(dayLower.substring(0, 3))) {
                // Handle case where day might be full name like 'Monday'
                flags[dayLower.substring(0, 3)] = 1;
            }
        });
    }

    return flags;
};

// Create a new habit
export const createHabit = async (
    name: string,
    mode: HabitProps,
    target: number,
    startDate: string,
    endDate: string | null = null,
    time: string | null = null,
    selectedDays: string[] = []
): Promise<number> => {
    try {
        // Validate inputs
        if (!name || name.trim() === '') {
            throw new Error('Name cannot be empty');
        }

        if (![HabitProps.with_yes_or_no, HabitProps.with_number, HabitProps.with_time].includes(mode)) {
            throw new Error('Invalid habit mode');
        }

        if (target <= 0) {
            throw new Error('Target must be greater than 0');
        }

        // Get day flags
        const dayFlags = getDayFlags(selectedDays);

        // Add habit to database
        await addHabitTableData(
            name,
            mode,
            target,
            startDate,
            endDate,
            time,
            dayFlags.sun,
            dayFlags.mon,
            dayFlags.tue,
            dayFlags.wed,
            dayFlags.thu,
            dayFlags.fri,
            dayFlags.sat
        );

        // Get all habits to find the newly created one
        const habits = await getAllHabitsTableData();
        const newHabit = habits.find(h => h.name === name);

        if (newHabit && newHabit.id) {
            // Initialize tracking table for the new habit
            await initHabitTrackingTable(newHabit.id);
            return newHabit.id;
        }

        throw new Error('Failed to create habit');
    } catch (error) {
        console.error('Error creating habit:', error);
        throw error;
    }
};

// Get all habits
export const getAllHabits = async (): Promise<Habit[]> => {
    try {
        return await getAllHabitsTableData();
    } catch (error) {
        console.error('Error getting all habits:', error);
        return [];
    }
};

// Get habit by ID
export const getHabitById = async (id: number): Promise<Habit | null> => {
    try {
        return await getHabitTableDataById(id);
    } catch (error) {
        console.error(`Error getting habit with ID ${id}:`, error);
        return null;
    }
};

// Get habits for a specific date
export const getHabitsForDate = async (date: Date): Promise<HabitWithProgress[]> => {
    try {
        // Use YYYY-MM-DD format for HabitDatabase
        const formattedDateForHabitDB = formatDateForHabitDB(date);
        // Get habits for the date
        const habits = await getHabitTableDataByDate(formattedDateForHabitDB);
        // Use DD-MM-YYYY format for HabitProgressDatabase
        const formattedDateForProgressDB = formatDateForDB(date);
        // Get progress data for each habit
        const habitsWithProgress = await Promise.all(
            habits.map(async (habit) => {
                try {
                    const progressData = await getHabitTrackingTableDataByDate(habit.id, formattedDateForProgressDB);
                    return {
                        ...habit,
                        progress: progressData ? progressData.progress : 0,
                        completed: progressData ? progressData.completed : 0,
                    };
                } catch (error) {
                    console.error(`Error fetching progress for habit ${habit.id}:`, error);
                    return {
                        ...habit,
                        progress: 0,
                        completed: 0,
                    };
                }
            })
        );

        return habitsWithProgress;
    } catch (error) {
        console.error('Error getting habits for date:', error);
        return [];
    }
};

// Update habit progress
export const updateHabitProgress = async (
    habitId: number,
    date: Date,
    progress: number,
    skip: boolean = false
): Promise<void> => {
    try {
        // Use DD-MM-YYYY format for HabitProgressDatabase
        const formattedDate = formatDateForDB(date);
        await updateHabitTrackingTable(habitId, formattedDate, progress, skip);
    } catch (error) {
        console.error(`Error updating progress for habit ${habitId}:`, error);
        throw error;
    }
};

// Delete habit
export const deleteHabit = async (habitId: number): Promise<void> => {
    try {
        await deleteHabitTableDataById(habitId);
    } catch (error) {
        console.error(`Error deleting habit ${habitId}:`, error);
        throw error;
    }
};

// Delete all habits
export const deleteAllHabits = async (): Promise<void> => {
    try {
        await deleteAllHabitTableData();
    } catch (error) {
        console.error('Error deleting all habits:', error);
        throw error;
    }
};

// Reset habit database
export const resetHabitDatabase = async (): Promise<void> => {
    try {
        await resetHabitTable();
    } catch (error) {
        console.error('Error resetting habit database:', error);
        throw error;
    }
};

// Delete habit progress for a specific date
export const deleteHabitProgressForDate = async (habitId: number, date: Date): Promise<void> => {
    try {
        // Use DD-MM-YYYY format for HabitProgressDatabase
        const formattedDate = formatDateForDB(date);
        await deleteHabitTrackingTableDataByDate(habitId, formattedDate);
    } catch (error) {
        console.error(`Error deleting progress for habit ${habitId} on ${date}:`, error);
        throw error;
    }
};

// Delete all progress for a habit
export const deleteAllHabitProgress = async (habitId: number): Promise<void> => {
    try {
        await deleteAllHabitTrackingTableData(habitId);
    } catch (error) {
        console.error(`Error deleting all progress for habit ${habitId}:`, error);
        throw error;
    }
};

// Calculate the current streak for a habit
export const getHabitStreak = async (habitId: number): Promise<number> => {
    try {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);

        // Check up to 100 days back (to avoid infinite loop)
        for (let i = 0; i < 100; i++) {
            const formattedDate = formatDateForDB(currentDate);
            const progressData = await getHabitTrackingTableDataByDate(habitId, formattedDate);

            // If no data or not completed, break the streak
            if (!progressData || progressData.completed === 0) {
                break;
            }

            streak++;
            // Move to previous day
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    } catch (error) {
        console.error(`Error calculating streak for habit ${habitId}:`, error);
        return 0;
    }
};

// Get the total number of days a habit has been tracked
export const getTotalDays = async (habitId: number): Promise<number> => {
    try {
        const habit = await getHabitTableDataById(habitId);
        if (!habit) {
            return 0;
        }

        const startDate = new Date(habit.startDate);
        const today = new Date();

        // Calculate days between start date and today
        const diffTime = Math.abs(today.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include today

        return diffDays;
    } catch (error) {
        console.error(`Error calculating total days for habit ${habitId}:`, error);
        return 0;
    }
};

// Get the number of days a habit was completed
export const getCompletedDays = async (habitId: number): Promise<number> => {
    try {
        const habit = await getHabitTableDataById(habitId);
        if (!habit) {
            return 0;
        }

        const startDate = new Date(habit.startDate);
        const today = new Date();
        let completedCount = 0;
        let currentDate = new Date(startDate);

        // Check each day from start date to today
        while (currentDate <= today) {
            const formattedDate = formatDateForDB(currentDate);
            const progressData = await getHabitTrackingTableDataByDate(habitId, formattedDate);

            if (progressData && progressData.completed === 1) {
                completedCount++;
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return completedCount;
    } catch (error) {
        console.error(`Error calculating completed days for habit ${habitId}:`, error);
        return 0;
    }
};

// Get weekly progress data for a habit
export const getWeeklyProgress = async (habitId: number): Promise<{ day: string; progress: number }[]> => {
    try {
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const result = [];

        // Get data for the past 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = dayNames[date.getDay()];
            const formattedDate = formatDateForDB(date);

            const progressData = await getHabitTrackingTableDataByDate(habitId, formattedDate);
            const progress = progressData ? progressData.progress : 0;

            result.push({ day: dayName, progress });
        }

        return result;
    } catch (error) {
        console.error(`Error getting weekly progress for habit ${habitId}:`, error);
        return [];
    }
};
