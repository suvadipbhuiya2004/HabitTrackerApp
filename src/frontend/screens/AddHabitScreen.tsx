import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddHabitPage1 from './AddHabitPage1';
import AddHabitPage2 from './AddHabitPage2';
import AddHabitPage3 from './AddHabitPage3';
import AddHabitReview from './AddHabitReview';
import { HabitProps } from '../../backend/props/HabitProps';
import { colors } from '../theme/theme';

// Define the types for our navigation parameters
export type AddHabitStackParamList = {
    Page1: undefined;
    Page2: { evaluationType: HabitProps };
    Page3: { evaluationType: HabitProps, habitName: string };
    Review: {
        evaluationType: HabitProps,
        habitName: string,
        target?: number,
        frequency: string[],
        startDate: string,
        endDate?: string,
        goal?: number,
        timeInSeconds?: number,
        reminderEnabled?: boolean,
        reminderTime?: string
    };
};

// Define the type for habit data
export type HabitData = {
    evaluationType: HabitProps | null;
    habitName: string;
    target: number;
    frequency: string[];
    startDate: string;
    endDate?: string;
    goal?: number;
    timeInSeconds?: number;
    reminderEnabled?: boolean;
    reminderTime?: string;
};

// Create a stack navigator
const Stack = createNativeStackNavigator<AddHabitStackParamList>();

const AddHabitScreen = () => {
    // State to track the habit creation progress
    const [habitData, setHabitData] = useState<HabitData>({
        evaluationType: null,
        habitName: '',
        target: 0,
        frequency: [],
        startDate: new Date().toISOString().split('T')[0], // Default to today
        endDate: undefined,
        goal: undefined,
        timeInSeconds: undefined,
        reminderEnabled: false,
        reminderTime: '',
    });

    // Function to update habit data as user progresses through screens
    const updateHabitData = (newData: Partial<HabitData>) => {
        setHabitData(prevData => ({ ...prevData, ...newData }));
    };

    return (
        <Stack.Navigator
            initialRouteName="Page1"
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: 'white',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen
                name="Page1"
                options={{ title: 'Step 1: Evaluation Type' }}
            >
                {props => <AddHabitPage1 {...props} updateHabitData={updateHabitData} />}
            </Stack.Screen>
            <Stack.Screen
                name="Page2"
                options={{ title: 'Step 2: Define Your Habit' }}
            >
                {props => <AddHabitPage2 {...props} updateHabitData={updateHabitData} />}
            </Stack.Screen>
            <Stack.Screen
                name="Page3"
                options={{ title: 'Step 3: Set Details' }}
            >
                {props => <AddHabitPage3 {...props} updateHabitData={updateHabitData} />}
            </Stack.Screen>
            <Stack.Screen
                name="Review"
                options={{ title: 'Review & Create' }}
            >
                {props => <AddHabitReview {...props} habitData={habitData} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default AddHabitScreen;
