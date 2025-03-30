// HabitProgressDatabase.test.ts
import * as DB from '../src/backend/databases/HabitProgressDatabase';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
    const mockSet = jest.fn();
    const mockGetString = jest.fn();
    const mockGetAllKeys = jest.fn();
    const mockDelete = jest.fn();
    const mockClearAll = jest.fn();
    const mockContains = jest.fn();

    return {
        MMKV: jest.fn(() => ({
            set: mockSet,
            getString: mockGetString,
            getAllKeys: mockGetAllKeys,
            delete: mockDelete,
            clearAll: mockClearAll,
            contains: mockContains,
        })),
        mockSet,
        mockGetString,
        mockGetAllKeys,
        mockDelete,
        mockClearAll,
        mockContains,
    };
});

// Mock HabitDatabase
jest.mock('../src/backend/databases/HabitDatabase', () => ({
    getHabitTableDataById: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test Habit',
        mode: 1,
        target: 5,
    }),
}));

describe('HabitProgressDatabase', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('initHabitTrackingTable initializes tracking for a habit', async () => {
        const { mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table doesn't exist yet
        mockContains.mockReturnValueOnce(false);

        await DB.initHabitTrackingTable(1);

        expect(mockSet).toHaveBeenCalledWith('habit_tracking_1', '[]');
    });

    test('updateHabitTrackingTable updates progress for a habit on a date', async () => {
        const { mockGetString, mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table exists
        mockContains.mockReturnValueOnce(true);
        mockGetString.mockReturnValueOnce('[]');

        await DB.updateHabitTrackingTable(1, '01-01-2023', 5, false);

        expect(mockSet).toHaveBeenCalled();
        const savedData = JSON.parse(mockSet.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0]).toMatchObject({
            date: '01-01-2023',
            progress: 5,
            completed: 1,
        });
    });

    test('updateHabitTrackingTable updates existing progress for a date', async () => {
        const { mockGetString, mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table exists
        mockContains.mockReturnValueOnce(true);

        const existingData = [
            {
                id: 1,
                date: '01-01-2023',
                progress: 3,
                completed: 0,
            },
            {
                id: 2,
                date: '02-01-2023',
                progress: 2,
                completed: 0,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(existingData));

        await DB.updateHabitTrackingTable(1, '01-01-2023', 5, false);

        expect(mockSet).toHaveBeenCalled();
        const savedData = JSON.parse(mockSet.mock.calls[0][1]);
        expect(savedData).toHaveLength(2);
        expect(savedData[0]).toMatchObject({
            id: 1,
            date: '01-01-2023',
            progress: 5,
            completed: 1,
        });
        expect(savedData[1]).toMatchObject({
            id: 2,
            date: '02-01-2023',
            progress: 2,
            completed: 0,
        });
    });

    test('getHabitTrackingTableDataByDate returns progress for a date', async () => {
        const { mockGetString, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table exists
        mockContains.mockReturnValueOnce(true);

        const existingData = [
            {
                id: 1,
                date: '01-01-2023',
                progress: 3,
                completed: 0,
            },
            {
                id: 2,
                date: '02-01-2023',
                progress: 2,
                completed: 0,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(existingData));

        const result = await DB.getHabitTrackingTableDataByDate(1, '01-01-2023');

        expect(result).toEqual({
            id: 1,
            date: '01-01-2023',
            progress: 3,
            completed: 0,
        });
    });

    test('getHabitTrackingTableDataByDate throws error for invalid date format', async () => {
        await expect(DB.getHabitTrackingTableDataByDate(1, 'invalid-date'))
            .rejects
            .toThrow('Invalid date format. Please use DD-MM-YYYY.');
    });

    test('deleteHabitTrackingTableDataByDate deletes tracking data for a specific date', async () => {
        const { mockGetString, mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table exists
        mockContains.mockReturnValueOnce(true);

        const existingData = [
            {
                id: 1,
                date: '01-01-2023',
                progress: 3,
                completed: 0,
            },
            {
                id: 2,
                date: '02-01-2023',
                progress: 2,
                completed: 0,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(existingData));

        await DB.deleteHabitTrackingTableDataByDate(1, '01-01-2023');

        expect(mockSet).toHaveBeenCalled();
        const savedData = JSON.parse(mockSet.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0]).toMatchObject({
            id: 2,
            date: '02-01-2023',
            progress: 2,
            completed: 0,
        });
    });

    test('deleteAllHabitTrackingTableData deletes all tracking data for a habit', async () => {
        const { mockDelete, mockContains } = require('react-native-mmkv');

        // Mock that the tracking table exists
        mockContains.mockReturnValueOnce(true);

        await DB.deleteAllHabitTrackingTableData(1);

        expect(mockDelete).toHaveBeenCalledWith('habit_tracking_1');
    });
});
