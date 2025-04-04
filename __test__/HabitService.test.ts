import {
    createHabit,
    getAllHabits,
    getHabitById,
    getHabitsForDate,
    updateHabitProgress,
    deleteHabit,
    deleteAllHabits,
    resetHabitDatabase,
    deleteHabitProgressForDate,
    deleteAllHabitProgress,
    getHabitStreak,
    getTotalDays,
    getCompletedDays,
    getWeeklyProgress,
    formatDateForDB,
    formatDateForHabitDB,
    getDayFlags,
} from '../src/frontend/services/HabitService';

import { HabitProps } from '../src/backend/props/HabitProps';

// Mock all the imported database functions
jest.mock('../src/backend/databases/HabitDatabase', () => ({
    addHabitTableData: jest.fn(),
    getAllHabitsTableData: jest.fn(),
    getHabitTableDataById: jest.fn(),
    getHabitTableDataByDate: jest.fn(),
    deleteHabitTableDataById: jest.fn(),
    deleteAllHabitTableData: jest.fn(),
    resetHabitTable: jest.fn(),
}));

jest.mock('../src/backend/databases/HabitProgressDatabase', () => ({
    initHabitTrackingTable: jest.fn(),
    getHabitTrackingTableDataByDate: jest.fn(),
    updateHabitTrackingTable: jest.fn(),
    deleteHabitTrackingTableDataByDate: jest.fn(),
    deleteAllHabitTrackingTableData: jest.fn(),
}));

// Import the mocked functions for assertions
import {
    addHabitTableData,
    getAllHabitsTableData,
    getHabitTableDataById,
    getHabitTableDataByDate,
    deleteHabitTableDataById,
    deleteAllHabitTableData,
    resetHabitTable,
} from '../src/backend/databases/HabitDatabase';

import {
    initHabitTrackingTable,
    getHabitTrackingTableDataByDate,
    updateHabitTrackingTable,
    deleteHabitTrackingTableDataByDate,
    deleteAllHabitTrackingTableData,
} from '../src/backend/databases/HabitProgressDatabase';

describe('HabitService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatDateForDB', () => {
        it('should format date to DD-MM-YYYY', () => {
            const date = new Date('2025-04-03');
            expect(formatDateForDB(date)).toBe('03-04-2025');
        });
    });

    describe('formatDateForHabitDB', () => {
        it('should format date to YYYY-MM-DD', () => {
            const date = new Date('2025-04-03');
            expect(formatDateForHabitDB(date)).toBe('2025-04-03');
        });
    });

    describe('getDayFlags', () => {
        it('should return all days as 1 when no days are selected', () => {
            const result = getDayFlags([]);
            expect(result).toEqual({
                sun: 1,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
            });
        });

        it('should set selected days to 1 and others to 0', () => {
            const result = getDayFlags(['Mon', 'Wed', 'Fri']);
            expect(result).toEqual({
                sun: 0,
                mon: 1,
                tue: 0,
                wed: 1,
                thu: 0,
                fri: 1,
                sat: 0,
            });
        });

        it('should handle full day names', () => {
            const result = getDayFlags(['Monday', 'Wednesday', 'Friday']);
            expect(result).toEqual({
                sun: 0,
                mon: 1,
                tue: 0,
                wed: 1,
                thu: 0,
                fri: 1,
                sat: 0,
            });
        });
    });

    describe('createHabit', () => {
        const mockHabits = [{ id: 1, name: 'Test Habit' }];

        beforeEach(() => {
            (getAllHabitsTableData as jest.Mock).mockResolvedValue(mockHabits);
        });

        it('should create a habit successfully', async () => {
            const name = 'Test Habit';
            const mode = HabitProps.with_yes_or_no;
            const target = 1;
            const startDate = '2025-04-03';
            const selectedDays = ['Mon', 'Wed', 'Fri'];

            await createHabit(name, mode, target, startDate, null, null, selectedDays);

            expect(addHabitTableData).toHaveBeenCalledWith(
                name,
                mode,
                target,
                startDate,
                null,
                null,
                0,
                1,
                0,
                1,
                0,
                1,
                0,
            );
            expect(initHabitTrackingTable).toHaveBeenCalledWith(1);
        });

        it('should throw error when name is empty', async () => {
            await expect(createHabit('', HabitProps.with_yes_or_no, 1, '2025-04-03'))
                .rejects.toThrow('Name cannot be empty');
        });

        it('should throw error when mode is invalid', async () => {
            await expect(createHabit('Test', 999 as HabitProps, 1, '2025-04-03'))
                .rejects.toThrow('Invalid habit mode');
        });

        it('should throw error when target is <= 0', async () => {
            await expect(createHabit('Test', HabitProps.with_yes_or_no, 0, '2025-04-03'))
                .rejects.toThrow('Target must be greater than 0');
        });
    });

    describe('getAllHabits', () => {
        it('should return all habits', async () => {
            const mockHabits = [
                { id: 1, name: 'Habit 1' },
                { id: 2, name: 'Habit 2' },
            ];
            (getAllHabitsTableData as jest.Mock).mockResolvedValue(mockHabits);

            const result = await getAllHabits();
            expect(result).toEqual(mockHabits);
            expect(getAllHabitsTableData).toHaveBeenCalled();
        });

        it('should return empty array on error', async () => {
            (getAllHabitsTableData as jest.Mock).mockRejectedValue(new Error('Database error'));

            const result = await getAllHabits();
            expect(result).toEqual([]);
        });
    });

    describe('getHabitById', () => {
        it('should return habit by id', async () => {
            const mockHabit = { id: 1, name: 'Habit 1' };
            (getHabitTableDataById as jest.Mock).mockResolvedValue(mockHabit);

            const result = await getHabitById(1);
            expect(result).toEqual(mockHabit);
            expect(getHabitTableDataById).toHaveBeenCalledWith(1);
        });

        it('should return null on error', async () => {
            (getHabitTableDataById as jest.Mock).mockRejectedValue(new Error('Database error'));

            const result = await getHabitById(1);
            expect(result).toBeNull();
        });
    });

    describe('getHabitsForDate', () => {
        it('should return habits with progress for a specific date', async () => {
            const mockHabits = [
                { id: 1, name: 'Habit 1' },
                { id: 2, name: 'Habit 2' },
            ];
            const mockProgress = { progress: 5, completed: 1 };

            (getHabitTableDataByDate as jest.Mock).mockResolvedValue(mockHabits);
            (getHabitTrackingTableDataByDate as jest.Mock).mockResolvedValue(mockProgress);

            const date = new Date('2025-04-03');
            const result = await getHabitsForDate(date);

            expect(getHabitTableDataByDate).toHaveBeenCalledWith('2025-04-03');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(1, '03-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(2, '03-04-2025');

            expect(result).toEqual([
                { ...mockHabits[0], progress: 5, completed: 1 },
                { ...mockHabits[1], progress: 5, completed: 1 },
            ]);
        });

        it('should handle errors when fetching progress', async () => {
            const mockHabits = [{ id: 1, name: 'Habit 1' }];

            (getHabitTableDataByDate as jest.Mock).mockResolvedValue(mockHabits);
            (getHabitTrackingTableDataByDate as jest.Mock).mockRejectedValue(new Error('Progress error'));

            const date = new Date('2025-04-03');
            const result = await getHabitsForDate(date);

            expect(result).toEqual([
                { ...mockHabits[0], progress: 0, completed: 0 },
            ]);
        });
    });

    describe('updateHabitProgress', () => {
        it('should update habit progress', async () => {
            const habitId = 1;
            const date = new Date('2025-04-03');
            const progress = 5;

            await updateHabitProgress(habitId, date, progress);

            expect(updateHabitTrackingTable).toHaveBeenCalledWith(habitId, '03-04-2025', progress, false);
        });

        it('should update habit progress with skip flag', async () => {
            const habitId = 1;
            const date = new Date('2025-04-03');
            const progress = 0;
            const skip = true;

            await updateHabitProgress(habitId, date, progress, skip);

            expect(updateHabitTrackingTable).toHaveBeenCalledWith(habitId, '03-04-2025', progress, skip);
        });
    });

    describe('deleteHabit', () => {
        it('should delete a habit', async () => {
            await deleteHabit(1);
            expect(deleteHabitTableDataById).toHaveBeenCalledWith(1);
        });
    });

    describe('deleteAllHabits', () => {
        it('should delete all habits', async () => {
            await deleteAllHabits();
            expect(deleteAllHabitTableData).toHaveBeenCalled();
        });
    });

    describe('resetHabitDatabase', () => {
        it('should reset habit database', async () => {
            await resetHabitDatabase();
            expect(resetHabitTable).toHaveBeenCalled();
        });
    });

    describe('deleteHabitProgressForDate', () => {
        it('should delete habit progress for a specific date', async () => {
            const habitId = 1;
            const date = new Date('2025-04-03');

            await deleteHabitProgressForDate(habitId, date);

            expect(deleteHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '03-04-2025');
        });
    });

    describe('deleteAllHabitProgress', () => {
        it('should delete all progress for a habit', async () => {
            await deleteAllHabitProgress(1);
            expect(deleteAllHabitTrackingTableData).toHaveBeenCalledWith(1);
        });
    });

    describe('getHabitStreak', () => {
        const habitId = 1;
        const mockToday = new Date('2025-04-03T00:00:00.000Z'); // Thursday, use UTC for consistency

        // Mock habit scheduled for all days
        const mockHabitAllDays = {
            id: habitId,
            name: 'Test Streak Habit',
            startDate: '2025-03-01',
            sun: 1, mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 1,
        };

        beforeEach(() => {
            // Use fake timers
            jest.useFakeTimers().setSystemTime(mockToday);
            // Mock the habit lookup
            (getHabitTableDataById as jest.Mock).mockResolvedValue(mockHabitAllDays);
        });

        afterEach(() => {
            // Restore real timers
            jest.useRealTimers();
        });


        it('should calculate habit streak correctly when scheduled all days', async () => {
            // Mock progress: Completed today, yesterday, day before; missed 2 days ago
            (getHabitTrackingTableDataByDate as jest.Mock)
                .mockResolvedValueOnce({ completed: 1 })
                .mockResolvedValueOnce({ completed: 1 })
                .mockResolvedValueOnce({ completed: 1 })
                .mockResolvedValueOnce({ completed: 0 });

            const result = await getHabitStreak(habitId);

            expect(result).toBe(3);
            expect(getHabitTableDataById).toHaveBeenCalledWith(habitId);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(4);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '03-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '02-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '01-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '31-03-2025');
        });

        it('should return 0 when streak is broken today', async () => {
            // Mock implementation to return completed: 0 only for today's date
            (getHabitTrackingTableDataByDate as jest.Mock).mockImplementation(async (id, dateStr) => {
                if (id === habitId && dateStr === '03-04-2025') {
                    return { completed: 0 };
                }
                return null;
            });

            const result = await getHabitStreak(habitId);

            expect(result).toBe(0);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(1);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '03-04-2025');
        });

        it('should return 0 when habit not found', async () => {
            (getHabitTableDataById as jest.Mock).mockResolvedValue(null);
            const result = await getHabitStreak(habitId);
            expect(result).toBe(0);
            expect(getHabitTrackingTableDataByDate).not.toHaveBeenCalled();
        });

        it('should skip non-scheduled days', async () => {
            // Mock habit scheduled only Mon, Wed, Fri
            const mockHabitMWF = {
                id: habitId, name: 'Test Streak Habit MWF', startDate: '2025-03-01',
                sun: 0, mon: 1, tue: 0, wed: 1, thu: 0, fri: 1, sat: 0,
            };
            (getHabitTableDataById as jest.Mock).mockResolvedValue(mockHabitMWF);

            (getHabitTrackingTableDataByDate as jest.Mock).mockImplementation(async (id, dateStr) => {
                if (id !== habitId) {return null;}
                if (dateStr === '02-04-2025') {return { completed: 1 };}
                if (dateStr === '31-03-2025') {return { completed: 1 };}
                if (dateStr === '28-03-2025') {return { completed: 0 };}
                return null;
            });


            const result = await getHabitStreak(habitId);

            expect(result).toBe(2);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(3);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '02-04-2025'); // Wed
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '31-03-2025'); // Mon
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '28-03-2025'); // Fri (Break)
        });
    });

    describe('getTotalDays', () => {
        const habitId = 1;
        const mockToday = new Date('2025-04-03T00:00:00.000Z'); // Thursday

        beforeEach(() => {
            // Use fake timers
            jest.useFakeTimers().setSystemTime(mockToday);
        });

        afterEach(() => {
            // Restore real timers
            jest.useRealTimers();
        });


        it('should calculate total scheduled days correctly (all days)', async () => {
            // Habit started Apr 1 (Tue), Today is Apr 3 (Thu) -> Tue, Wed, Thu = 3 days
            (getHabitTableDataById as jest.Mock).mockResolvedValue({
                id: habitId, startDate: '2025-04-01',
                sun: 1, mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 1, // Scheduled all days
            });

            const result = await getTotalDays(habitId);

            expect(result).toBe(3); // Tue, Wed, Thu
        });

        it('should calculate total scheduled days correctly (specific days)', async () => {
            // Habit started Apr 1 (Tue), Today is Apr 3 (Thu)
            // Scheduled Mon, Wed, Fri
            // Days between Apr 1 and Apr 3 are Tue, Wed, Thu
            // Only Wed is scheduled.
            (getHabitTableDataById as jest.Mock).mockResolvedValue({
                id: habitId, startDate: '2025-04-01',
                sun: 0, mon: 1, tue: 0, wed: 1, thu: 0, fri: 1, sat: 0, // Scheduled MWF
            });

            const result = await getTotalDays(habitId);

            expect(result).toBe(1); // Only Wednesday
        });

        it('should return 0 when habit is not found', async () => {
            const habitId = 1;
            (getHabitTableDataById as jest.Mock).mockResolvedValue(null);

            const result = await getTotalDays(habitId);

            expect(result).toBe(0);
        });
    });

    describe('getCompletedDays', () => {
        const habitId = 1;
        const mockToday = new Date('2025-04-03T00:00:00.000Z'); // Thursday

        beforeEach(() => {
            // Use fake timers
            jest.useFakeTimers().setSystemTime(mockToday);
        });

        afterEach(() => {
            // Restore real timers
            jest.useRealTimers();
        });


        it('should calculate completed scheduled days correctly (all days)', async () => {
            // Habit started Apr 1 (Tue), Today is Apr 3 (Thu) -> Tue, Wed, Thu
            (getHabitTableDataById as jest.Mock).mockResolvedValue({
                id: habitId, startDate: '2025-04-01',
                sun: 1, mon: 1, tue: 1, wed: 1, thu: 1, fri: 1, sat: 1, // Scheduled all days
            });

            // Mock progress data for the 3 days (Tue, Wed, Thu)
            (getHabitTrackingTableDataByDate as jest.Mock).mockImplementation(async (id, dateStr) => {
                if (id !== habitId) return null;
                if (dateStr === '01-04-2025') return { completed: 1 }; // Tue
                if (dateStr === '02-04-2025') return { completed: 0 }; // Wed
                if (dateStr === '03-04-2025') return { completed: 1 }; // Thu
                return null; // Default
            });


            const result = await getCompletedDays(habitId);

            expect(result).toBe(2); // Completed Tue and Thu
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(3);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '01-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '02-04-2025');
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '03-04-2025');
        });

        it('should calculate completed scheduled days correctly (specific days)', async () => {
            // Habit started Apr 1 (Tue), Today is Apr 3 (Thu)
            // Scheduled Mon, Wed, Fri
            // Days between Apr 1 and Apr 3 are Tue, Wed, Thu
            // Only Wed is scheduled.
            (getHabitTableDataById as jest.Mock).mockResolvedValue({
                id: habitId, startDate: '2025-04-01',
                sun: 0, mon: 1, tue: 0, wed: 1, thu: 0, fri: 1, sat: 0, // Scheduled MWF
            });

            // Mock progress data only for the scheduled day (Wed)
            (getHabitTrackingTableDataByDate as jest.Mock).mockImplementation(async (id, dateStr) => {
                if (id === habitId && dateStr === '02-04-2025') { // Wed
                    return { completed: 1 };
                }
                return null; // Default
            });


            const result = await getCompletedDays(habitId);

            expect(result).toBe(1); // Only Wednesday was scheduled and completed
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(1); // Only called for Wed
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledWith(habitId, '02-04-2025');
        });


        it('should return 0 when habit is not found', async () => {
            const habitId = 1;
            (getHabitTableDataById as jest.Mock).mockResolvedValue(null);

            const result = await getCompletedDays(habitId);

            expect(result).toBe(0);
        });
    });

    describe('getWeeklyProgress', () => {
        const habitId = 1;
        const mockToday = new Date('2025-04-03T00:00:00.000Z'); // Thursday

        beforeEach(() => {
            // Use fake timers
            jest.useFakeTimers().setSystemTime(mockToday);
        });

        afterEach(() => {
            // Restore real timers
            jest.useRealTimers();
        });


        it('should return weekly progress data', async () => {
            // Mock progress data for the past 7 days (Fri Mar 28 to Thu Apr 3)
            // The service calls getHabitTrackingTableDataByDate for each day in this range.
            // We need to mock the return value based on the date requested.
            const mockProgressData: { [date: string]: number | null } = {
                '28-03-2025': 10, // Fri
                '29-03-2025': 5,  // Sat
                '30-03-2025': 8,  // Sun
                '31-03-2025': 0,  // Mon
                '01-04-2025': 7,  // Tue
                '02-04-2025': 3,  // Wed
                '03-04-2025': 9,  // Thu (Today)
            };

            (getHabitTrackingTableDataByDate as jest.Mock).mockImplementation(async (id, dateStr) => {
                const progress = mockProgressData[dateStr];
                return progress !== undefined && progress !== null ? { progress } : null;
            });


            const result = await getWeeklyProgress(habitId);

            // Expected order: Fri, Sat, Sun, Mon, Tue, Wed, Thu
            expect(result).toEqual([
                { day: 'Fri', progress: 10 }, // Mar 28
                { day: 'Sat', progress: 5 },  // Mar 29
                { day: 'Sun', progress: 8 },  // Mar 30
                { day: 'Mon', progress: 0 },  // Mar 31
                { day: 'Tue', progress: 7 },  // Apr 1
                { day: 'Wed', progress: 3 },  // Apr 2
                { day: 'Thu', progress: 9 },  // Apr 3 (Today)
            ]);
            expect(getHabitTrackingTableDataByDate).toHaveBeenCalledTimes(7);
        });

        it('should handle missing progress data', async () => {
            const habitId = 1;
            // No need to set time here again as it's handled by beforeEach

            // Mock null progress data for any date requested
            (getHabitTrackingTableDataByDate as jest.Mock).mockResolvedValue(null);

            const result = await getWeeklyProgress(habitId);

            // Should return days with 0 progress
            expect(result).toHaveLength(7);
            expect(result.every(day => day.progress === 0)).toBe(true);
        });
    });
});
