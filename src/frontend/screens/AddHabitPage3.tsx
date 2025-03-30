import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddHabitStackParamList, HabitData } from './AddHabitScreen';
import { HabitProps } from '../../backend/props/HabitProps';
import TimeInput from '../components/TimeInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, shadows, borderRadius, typography } from '../theme/theme';

type AddHabitPage3Props = {
    route: RouteProp<AddHabitStackParamList, 'Page3'>;
    navigation: NativeStackNavigationProp<AddHabitStackParamList, 'Page3'>;
    updateHabitData: (data: Partial<HabitData>) => void;
};

const AddHabitPage3 = ({ route, navigation, updateHabitData }: AddHabitPage3Props) => {
    const { evaluationType, habitName } = route.params;
    const [target, setTarget] = useState('1');
    const [goal, setGoal] = useState('');
    const [targetError, setTargetError] = useState('');
    const [goalError, setGoalError] = useState('');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [timeInSeconds, setTimeInSeconds] = useState(0);
    const [timeError, setTimeError] = useState('');
    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [reminderTime, setReminderTime] = useState(new Date());
    const [reminderTimeDisplay, setReminderTimeDisplay] = useState('9:00 AM');

    const handleTimeChange = (seconds: number) => {
        setTimeInSeconds(seconds);
        if (seconds > 0) {
            setTimeError('');
        }
    };

    const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
        setShowReminderPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setReminderTime(selectedDate);
            const hours = selectedDate.getHours();
            const minutes = selectedDate.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes.toString().padStart(2, '0');
            setReminderTimeDisplay(`${formattedHours}:${formattedMinutes} ${ampm}`);
        }
    };

    const validateInputs = (): boolean => {
        let isValid = true;

        // Validate based on habit type
        if (evaluationType === HabitProps.with_number) {
            if (!target || parseInt(target, 10) <= 0) {
                setTargetError('Please enter a valid target number');
                isValid = false;
            }

            if (goal && parseInt(goal, 10) <= 0) {
                setGoalError('Please enter a valid goal number');
                isValid = false;
            }
        } else if (evaluationType === HabitProps.with_time) {
            if (timeInSeconds <= 0) {
                setTimeError('Please set a time target');
                isValid = false;
            }
        }

        return isValid;
    };

    const handleContinue = () => {
        if (!validateInputs()) {
            return;
        }

        // Prepare data based on habit type
        const data: Partial<HabitData> = {};

        if (evaluationType === HabitProps.with_yes_or_no) {
            data.target = 1;
        } else if (evaluationType === HabitProps.with_number) {
            data.target = parseInt(target, 10);
            if (goal) {
                data.goal = parseInt(goal, 10);
            }
        } else if (evaluationType === HabitProps.with_time) {
            data.target = Math.ceil(timeInSeconds / 60); // Convert to minutes for display
            data.timeInSeconds = timeInSeconds;
        }

        // Add reminder settings if enabled
        if (reminderEnabled) {
            data.reminderEnabled = true;
            data.reminderTime = reminderTime.toISOString();
        } else {
            data.reminderEnabled = false;
        }

        // Update habit data in parent component
        updateHabitData(data);

        // Navigate to the review page
        navigation.navigate('Review', {
            evaluationType,
            habitName,
            target: data.target || 0,
            frequency: [], // This will be filled from the parent state
            startDate: '', // This will be filled from the parent state
            goal: data.goal,
            timeInSeconds: data.timeInSeconds,
            reminderEnabled: data.reminderEnabled,
            reminderTime: data.reminderTime,
        });
    };

    const renderTargetInput = () => {
        switch (evaluationType) {
            case HabitProps.with_yes_or_no:
                return (
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Icon name="check-circle-outline" size={24} color={colors.info} style={styles.infoIcon} />
                            <Text style={styles.infoTitle}>Simple Completion Tracking</Text>
                        </View>
                        <Text style={styles.infoText}>
                            This habit will be tracked with a simple yes/no completion status.
                            Just mark it as done each time you complete it!
                        </Text>
                    </View>
                );

            case HabitProps.with_number:
                return (
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Icon name="numeric" size={24} color={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Number Target</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                Daily target <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter target (e.g. 10)"
                                placeholderTextColor={colors.textTertiary}
                                value={target}
                                onChangeText={(text) => {
                                    // Only allow numbers
                                    if (/^\d*$/.test(text)) {
                                        setTarget(text);
                                        if (text && parseInt(text, 10) > 0) {
                                            setTargetError('');
                                        }
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={5}
                            />
                            {targetError ? <Text style={styles.errorText}>{targetError}</Text> : null}
                            <Text style={styles.helperText}>
                                How many times you want to complete this habit each day
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                Goal
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter goal (e.g. 100)"
                                placeholderTextColor={colors.textTertiary}
                                value={goal}
                                onChangeText={(text) => {
                                    // Only allow numbers
                                    if (/^\d*$/.test(text)) {
                                        setGoal(text);
                                        if (!text || parseInt(text, 10) > 0) {
                                            setGoalError('');
                                        }
                                    }
                                }}
                                keyboardType="numeric"
                                maxLength={6}
                            />
                            {goalError ? <Text style={styles.errorText}>{goalError}</Text> : null}
                            <Text style={styles.helperText}>
                                Set a long-term goal to track your progress (optional)
                            </Text>
                        </View>
                    </View>
                );

            case HabitProps.with_time:
                return (
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Icon name="clock-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Time Target</Text>
                        </View>

                        <TimeInput
                            label="Daily time target"
                            onTimeChange={handleTimeChange}
                            required
                        />
                        {timeError ? <Text style={styles.errorText}>{timeError}</Text> : null}
                        <Text style={styles.helperText}>
                            How much time you want to spend on this habit each day
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        {renderTargetInput()}

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="bell-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Reminder</Text>
                            </View>
                            <View style={styles.reminderContainer}>
                                <Text style={styles.reminderText}>Enable daily reminder</Text>
                                <Switch
                                    value={reminderEnabled}
                                    onValueChange={setReminderEnabled}
                                    trackColor={{ false: colors.disabled, true: colors.primary }}
                                    thumbColor={'#FFFFFF'}
                                    ios_backgroundColor={colors.disabled}
                                />
                            </View>
                            {reminderEnabled && (
                                <View style={styles.reminderTimeContainer}>
                                    <Text style={styles.reminderText}>Reminder Time</Text>
                                    <TouchableOpacity
                                        style={styles.timeSelector}
                                        onPress={() => setShowReminderPicker(true)}
                                    >
                                        <Text style={styles.timeSelectorText}>{reminderTimeDisplay}</Text>
                                        <Icon name="clock-outline" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    {showReminderPicker && (
                                        <DateTimePicker
                                            testID="dateTimePicker"
                                            value={reminderTime}
                                            mode={'time'}
                                            is24Hour={false}
                                            display="default"
                                            onChange={handleReminderTimeChange}
                                        />
                                    )}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueButtonText}>Continue to Review</Text>
                            <Icon name="arrow-right" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    formSection: {
        marginBottom: spacing.xl,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionIcon: {
        marginRight: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: 'bold',
        color: colors.text,
    },
    infoCard: {
        backgroundColor: colors.info + '15', // 15% opacity
        borderRadius: borderRadius.md,
        padding: spacing.md,
        width: '100%',
        marginBottom: spacing.xl,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    infoIcon: {
        marginRight: spacing.sm,
    },
    infoTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.info,
    },
    infoText: {
        color: colors.text,
        fontSize: typography.fontSize.md,
        lineHeight: 22,
    },
    inputContainer: {
        width: '100%',
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: typography.fontSize.md,
        fontWeight: '500',
        marginBottom: spacing.xs,
        color: colors.text,
    },
    input: {
        backgroundColor: colors.inputBackground,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.sm,
        fontSize: typography.fontSize.md,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
    },
    errorText: {
        color: colors.error,
        marginTop: spacing.xs,
        fontSize: typography.fontSize.sm,
    },
    helperText: {
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontSize: typography.fontSize.sm,
    },
    required: {
        color: colors.error,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        width: '100%',
        marginVertical: spacing.md,
    },
    reminderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    reminderText: {
        fontSize: typography.fontSize.md,
        color: colors.text,
    },
    reminderTimeContainer: {
        marginTop: spacing.md,
    },
    timeSelector: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeSelectorText: {
        color: 'white',
        fontSize: typography.fontSize.md,
    },
    continueButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        ...shadows.md,
    },
    continueButtonText: {
        color: 'white',
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        marginRight: spacing.sm,
    },
});

export default AddHabitPage3;
