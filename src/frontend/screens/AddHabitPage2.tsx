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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AddHabitStackParamList, HabitData } from './AddHabitScreen';
import DatePicker from '../components/DatePicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, shadows, borderRadius, typography } from '../theme/theme';

type AddHabitPage2Props = {
    route: RouteProp<AddHabitStackParamList, 'Page2'>;
    navigation: NativeStackNavigationProp<AddHabitStackParamList, 'Page2'>;
    updateHabitData: (data: Partial<HabitData>) => void;
};

const AddHabitPage2 = ({ route, navigation, updateHabitData }: AddHabitPage2Props) => {
    const { evaluationType } = route.params;
    const [habitName, setHabitName] = useState('');
    const [nameError, setNameError] = useState('');

    // Set all days selected by default
    const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [selectedDays, setSelectedDays] = useState<string[]>(allDays);

    // Set default start date to today, but no default end date
    const today = new Date();
    const [startDate, setStartDate] = useState<Date>(today);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [hasEndDate, setHasEndDate] = useState(false);

    const handleDaySelect = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const handleContinue = () => {
        // Validate inputs
        if (!habitName.trim()) {
            setNameError('Please enter a habit name');
            return;
        }

        // Format dates to YYYY-MM-DD format for database
        const formatDate = (date: Date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${year}-${month}-${day}`;
        };

        // Update habit data in parent component
        updateHabitData({
            habitName: habitName.trim(),
            frequency: selectedDays,
            startDate: formatDate(startDate),
            endDate: hasEndDate && endDate ? formatDate(endDate) : undefined,
        });

        // Navigate to the next page
        navigation.navigate('Page3', { evaluationType, habitName: habitName.trim() });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="pencil-outline" size={24} color={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Name Your Habit</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter habit name"
                                    placeholderTextColor={colors.textSecondary}
                                    value={habitName}
                                    onChangeText={(text) => {
                                        setHabitName(text);
                                        if (text.trim()) {setNameError('');}
                                    }}
                                    maxLength={50}
                                />
                                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="calendar-week" size={24} color={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Frequency</Text>
                            </View>
                            <Text style={styles.sectionSubtitle}>Which days will you do this habit?</Text>
                            <View style={styles.daysContainer}>
                                {allDays.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, selectedDays.includes(day) && styles.selectedDayButton]}
                                        onPress={() => handleDaySelect(day)}
                                    >
                                        <Text style={[styles.dayText, selectedDays.includes(day) && styles.selectedDayText]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <View style={styles.sectionHeader}>
                                <Icon name="calendar-range" size={24} color={colors.primary} style={styles.sectionIcon} />
                                <Text style={styles.sectionTitle}>Date Range</Text>
                            </View>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateLabel}>Start Date:</Text>
                                <DatePicker
                                    date={startDate}
                                    onDateChange={setStartDate}
                                />
                            </View>

                            <View style={styles.endDateToggleContainer}>
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    onPress={() => setHasEndDate(!hasEndDate)}
                                >
                                    <View style={[styles.checkbox, hasEndDate && styles.checkboxChecked]}>
                                        {hasEndDate && <Icon name="check" size={16} color="white" />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>Set end date</Text>
                                </TouchableOpacity>
                            </View>

                            {hasEndDate && (
                                <View style={styles.dateContainer}>
                                    <Text style={styles.dateLabel}>End Date:</Text>
                                    <DatePicker
                                        date={endDate || new Date()}
                                        onDateChange={setEndDate}
                                        minimumDate={startDate}
                                    />
                                </View>
                            )}
                        </View>

                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Icon name="arrow-right" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddHabitPage2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: 60,
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
    sectionSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    inputContainer: {
        marginTop: spacing.sm,
    },
    input: {
        backgroundColor: colors.inputBackground,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.fontSize.sm,
        marginTop: spacing.xs,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    dayButton: {
        width: '13%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.sm,
        backgroundColor: colors.inputBackground,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectedDayButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dayText: {
        fontSize: typography.fontSize.sm,
        color: colors.text,
    },
    selectedDayText: {
        color: 'white',
        fontWeight: 'bold',
    },
    dateContainer: {
        marginTop: spacing.md,
    },
    dateLabel: {
        fontSize: typography.fontSize.md,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    endDateToggleContainer: {
        marginTop: spacing.md,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    checkboxLabel: {
        fontSize: typography.fontSize.md,
        color: colors.text,
    },
    continueButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        flexDirection: 'row',
        ...shadows.md,
    },
    continueButtonText: {
        color: 'white',
        fontSize: typography.fontSize.md,
        fontWeight: 'bold',
        marginRight: spacing.sm,
    },
});
