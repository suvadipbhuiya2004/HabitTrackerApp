import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddHabitStackParamList, HabitData } from './AddHabitScreen';
import { HabitProps } from '../../backend/props/HabitProps';
import { convertToDisplayDate } from '../../backend/props/DateProps';
import { createHabit } from '../services/HabitService';

type AddHabitReviewProps = {
    route: RouteProp<AddHabitStackParamList, 'Review'>;
    navigation: NativeStackNavigationProp<AddHabitStackParamList, 'Review'>;
    habitData: HabitData;
};

const AddHabitReview = ({ route, navigation, habitData }: AddHabitReviewProps) => {
    const { evaluationType, habitName } = route.params;
    const [isLoading, setIsLoading] = useState(false);

    const getEvaluationTypeText = () => {
        switch (evaluationType) {
            case HabitProps.with_yes_or_no:
                return 'Yes/No completion';
            case HabitProps.with_number:
                return `Number (Target: ${habitData.target})`;
            case HabitProps.with_time:
                return `Timer (Target: ${habitData.target} minutes)`;
            default:
                return 'Unknown';
        }
    };

    const handleCreateHabit = async () => {
        try {
            setIsLoading(true);

            // Format time for database if it's a timer-based habit
            let timeString = null;
            if (evaluationType === HabitProps.with_time && habitData.timeInSeconds) {
                const hours = Math.floor(habitData.timeInSeconds / 3600);
                const minutes = Math.floor((habitData.timeInSeconds % 3600) / 60);
                const seconds = habitData.timeInSeconds % 60;
                timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            // Ensure target is a number
            const targetValue = parseInt(habitData.target?.toString() || '1', 10);

            console.log('Adding habit with data:', {
                name: habitName,
                evaluationType,
                target: targetValue,
                startDate: habitData.startDate,
                endDate: habitData.endDate || null,
                timeString,
                selectedDays: habitData.frequency,
            });

            // Create habit using the service
            await createHabit(
                habitName,
                evaluationType,
                targetValue,
                habitData.startDate,
                habitData.endDate || null,
                timeString,
                habitData.frequency
            );

            // Show success message
            Alert.alert(
                'Success',
                'Your habit has been created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navigate back to the main habits screen or wherever appropriate
                            navigation.popToTop();
                        },
                    },
                ],
            );
        } catch (error) {
            console.error('Error creating habit:', error);
            Alert.alert(
                'Error',
                'Failed to create habit. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Format dates for display
    const displayStartDate = habitData.startDate ? convertToDisplayDate(habitData.startDate) : '';
    const displayEndDate = habitData.endDate ? convertToDisplayDate(habitData.endDate) : '';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Review Your Habit</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{habitName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Type:</Text>
                        <Text style={styles.value}>{getEvaluationTypeText()}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Days:</Text>
                        <Text style={styles.value}>
                            {habitData.frequency.length > 0
                                ? habitData.frequency.join(', ')
                                : 'Every day'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Start Date:</Text>
                        <Text style={styles.value}>{displayStartDate}</Text>
                    </View>

                    {displayEndDate && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>End Date:</Text>
                            <Text style={styles.value}>{displayEndDate}</Text>
                        </View>
                    )}

                    {evaluationType === HabitProps.with_time && habitData.timeInSeconds && (
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Time:</Text>
                            <Text style={styles.value}>
                                {Math.floor(habitData.timeInSeconds / 3600)}h {Math.floor((habitData.timeInSeconds % 3600) / 60)}m
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateHabit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Habit</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingBottom: 80,
    },
    scrollContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    label: {
        flex: 1,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    value: {
        flex: 2,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddHabitReview;
