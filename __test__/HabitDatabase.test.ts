// HabitDatabase.test.ts
import * as DB from '../src/backend/databases/HabitDatabase';

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

describe('HabitDatabase', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('initHabitTable initializes storage', async () => {
        const { mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the habits table doesn't exist yet
        mockContains.mockReturnValueOnce(false);

        await DB.initHabitTable();

        expect(mockSet).toHaveBeenCalledWith('habits', '[]');
    });

    test('addHabitTableData adds a new habit', async () => {
        const { mockGetString, mockSet, mockContains } = require('react-native-mmkv');

        // Mock that the habits table exists
        mockContains.mockReturnValue(true);

        // Mock an empty habits array
        mockGetString.mockReturnValue('[]');

        // Create the expected habit object
        const expectedHabit = {
            id: 1,
            name: 'Test Habit',
            mode: 1,
            target: 5,
            startDate: '2023-01-01',
            endDate: null,
            time: null,
            sun: 1,
            mon: 1,
            tue: 1,
            wed: 1,
            thu: 1,
            fri: 1,
            sat: 1,
        };

        await DB.addHabitTableData(
            'Test Habit',  // name
            1,            // mode
            5,            // target
            '2023-01-01', // start_date
            null,         // end_date
            null,         // time
            1,            // sun
            1,            // mon
            1,            // tue
            1,            // wed
            1,            // thu
            1,            // fri
            1             // sat
        );

        // Verify that storage.set was called with the correct arguments
        expect(mockSet).toHaveBeenCalled();
        expect(mockSet.mock.calls[0][0]).toBe('habits');

        // Parse the JSON string that was passed to set
        const savedData = JSON.parse(mockSet.mock.calls[0][1]);

        // Verify the saved data
        expect(Array.isArray(savedData)).toBe(true);
        expect(savedData.length).toBe(1);
        expect(savedData[0]).toEqual(expect.objectContaining(expectedHabit));
    });

    test('getAllHabitsTableData returns all habits', async () => {
        const { mockGetString, mockContains } = require('react-native-mmkv');

        // Mock that the habits table exists
        mockContains.mockReturnValueOnce(true);

        const mockHabits = [
            {
                id: 1,
                name: 'Test Habit 1',
                mode: 1,
                target: 5,
                startDate: '2023-01-01',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
            {
                id: 2,
                name: 'Test Habit 2',
                mode: 2,
                target: 1,
                startDate: '2023-01-02',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(mockHabits));

        const result = DB.getAllHabitsTableData();

        expect(result).toEqual(mockHabits);
    });

    test('getHabitTableDataById returns a specific habit', async () => {
        const { mockGetString, mockContains } = require('react-native-mmkv');

        // Mock that the habits table exists
        mockContains.mockReturnValueOnce(true);

        const mockHabits = [
            {
                id: 1,
                name: 'Test Habit 1',
                mode: 1,
                target: 5,
                startDate: '2023-01-01',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
            {
                id: 2,
                name: 'Test Habit 2',
                mode: 2,
                target: 1,
                startDate: '2023-01-02',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(mockHabits));

        const result = await DB.getHabitTableDataById(2);

        expect(result).toEqual(mockHabits[1]);
    });

    test('deleteHabitTableDataById deletes a habit', async () => {
        const { mockGetString, mockSet, mockDelete, mockContains } = require('react-native-mmkv');

        // Mock that the habits table exists
        mockContains.mockReturnValueOnce(true);

        const mockHabits = [
            {
                id: 1,
                name: 'Test Habit 1',
                mode: 1,
                target: 5,
                startDate: '2023-01-01',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
            {
                id: 2,
                name: 'Test Habit 2',
                mode: 2,
                target: 1,
                startDate: '2023-01-02',
                endDate: null,
                time: null,
                mon: 1,
                tue: 1,
                wed: 1,
                thu: 1,
                fri: 1,
                sat: 1,
                sun: 1,
            },
        ];

        mockGetString.mockReturnValueOnce(JSON.stringify(mockHabits));

        await DB.deleteHabitTableDataById(1);

        expect(mockSet).toHaveBeenCalled();
        const savedData = JSON.parse(mockSet.mock.calls[0][1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe(2);
        expect(mockDelete).toHaveBeenCalledWith('habit_tracking_1');
    });

    test('deleteAllHabitTableData deletes all habits', async () => {
        const { mockSet, mockGetAllKeys, mockDelete } = require('react-native-mmkv');

        mockGetAllKeys.mockReturnValueOnce(['habit_tracking_1', 'habit_tracking_2', 'other_key']);

        await DB.deleteAllHabitTableData();

        expect(mockSet).toHaveBeenCalledWith('habits', '[]');
        expect(mockDelete).toHaveBeenCalledWith('habit_tracking_1');
        expect(mockDelete).toHaveBeenCalledWith('habit_tracking_2');
        expect(mockDelete).not.toHaveBeenCalledWith('other_key');
    });

    test('resetHabitTable clears all storage', async () => {
        const { mockClearAll } = require('react-native-mmkv');

        await DB.resetHabitTable();

        expect(mockClearAll).toHaveBeenCalled();
    });
});
