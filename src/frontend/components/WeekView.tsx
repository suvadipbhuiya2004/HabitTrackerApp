import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { HabitWithProgress, getHabitsForDate, updateHabitProgress } from '../services/HabitService';
import { HabitProps } from '../../backend/props/HabitProps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, shadows, borderRadius, typography } from '../theme/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = SCREEN_WIDTH / 8.3;

const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 8 }, (_, i) => addDays(start, i));
};

const WeekView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [habits, setHabits] = useState<HabitWithProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<HabitWithProgress | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [progressInput, setProgressInput] = useState('');
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [timeHours, setTimeHours] = useState('0');
    const [timeMinutes, setTimeMinutes] = useState('0');

    const panGesture = Gesture.Pan()
        .onEnd((e) => {
            if (e.translationX < -50) {
                setCurrentDate((prev) => addDays(prev, 7));
            }
            if (e.translationX > 50) {
                setCurrentDate((prev) => subDays(prev, 7));
            }
        });

    const weekDays = getWeekDays(currentDate);

    const fetchHabitsForDate = useCallback(async (date: Date) => {
        try {
            setLoading(true);
            const habitsData = await getHabitsForDate(date);
            setHabits(habitsData);
        } catch (error) {
            console.error('Error fetching habits:', error);
            Alert.alert('Error', 'Failed to load habits. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHabitsForDate(selectedDate);
    }, [selectedDate, fetchHabitsForDate]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    const handleHabitPress = (habit: HabitWithProgress) => {
        setSelectedHabit(habit);

        if (habit.mode === HabitProps.with_yes_or_no) {
            const newProgress = habit.progress === 1 ? 0 : 1;
            updateHabitProgressAndRefresh(habit, newProgress);
        } else {
            setProgressInput(habit.progress?.toString() || '0');
            if (habit.mode === HabitProps.with_time) {
                const hours = Math.floor((habit.progress || 0) / 3600);
                const minutes = Math.floor(((habit.progress || 0) % 3600) / 60);
                setTimeHours(hours.toString());
                setTimeMinutes(minutes.toString());
            }
            setModalVisible(true);
        }
    };

    const updateHabitProgressAndRefresh = async (habit: HabitWithProgress, progress: number) => {
        try {
            setUpdatingProgress(true);
            await updateHabitProgress(habit.id, selectedDate, progress);
            fetchHabitsForDate(selectedDate);
        } catch (error) {
            console.error('Error updating habit progress:', error);
            Alert.alert('Error', 'Failed to update progress. Please try again.');
        } finally {
            setUpdatingProgress(false);
            setModalVisible(false);
        }
    };

    const handleProgressSubmit = () => {
        if (!selectedHabit) {return;}

        let progress = 0;

        if (selectedHabit.mode === HabitProps.with_number) {
            progress = parseInt(progressInput, 10) || 0;
        } else if (selectedHabit.mode === HabitProps.with_time) {
            const hours = parseInt(timeHours, 10) || 0;
            const minutes = parseInt(timeMinutes, 10) || 0;
            progress = (hours * 3600) + (minutes * 60);
        }

        updateHabitProgressAndRefresh(selectedHabit, progress);
    };

    const renderDayItem = ({ item }: { item: Date }) => {
        const day = format(item, 'EEE');
        const date = format(item, 'd');
        const isSelected = isSameDay(item, selectedDate);
        const isToday = isSameDay(item, new Date());

        return (
            <TouchableOpacity
                style={[styles.dayItem, isSelected && styles.selectedDay]}
                onPress={() => handleDateSelect(item)}
            >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText, isToday && styles.todayText]}>
                    {day}
                </Text>
                <View style={[styles.dateCircle, isSelected && styles.selectedDateCircle, isToday && styles.todayCircle]}>
                    <Text style={[styles.dateText, isSelected && styles.selectedDateText, isToday && styles.todayText]}>
                        {date}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHabitItem = ({ item }: { item: HabitWithProgress }) => {
        let progressDisplay;
        let progressIcon;
        let progressColor;

        if (item.mode === HabitProps.with_yes_or_no) {
            progressIcon = item.progress === 1 ? 'check-circle' : 'circle-outline';
            progressColor = item.progress === 1 ? colors.success : colors.textTertiary;
        } else {
            const percentage = Math.min(100, Math.round((item.progress || 0) / item.target * 100));
            progressColor = percentage >= 100 ? colors.success : percentage >= 50 ? colors.primary : percentage > 0 ? colors.info : colors.textTertiary;

            if (item.mode === HabitProps.with_number) {
                progressDisplay = `${item.progress || 0}/${item.target}`;
                progressIcon = percentage >= 100 ? 'check-circle' : 'numeric';
            } else {
                const hours = Math.floor((item.progress || 0) / 3600);
                const minutes = Math.floor(((item.progress || 0) % 3600) / 60);
                progressDisplay = `${hours}h ${minutes}m / ${Math.floor(item.target / 3600)}h ${Math.floor((item.target % 3600) / 60)}m`;
                progressIcon = percentage >= 100 ? 'check-circle' : 'clock-outline';
            }
        }

        return (
            <TouchableOpacity
                style={styles.habitItem}
                onPress={() => handleHabitPress(item)}
            >
                <View style={styles.habitContent}>
                    <View style={styles.habitHeader}>
                        <Text style={styles.habitName}>{item.name}</Text>
                        <Icon name={progressIcon} size={24} color={progressColor} />
                    </View>

                    {item.mode !== HabitProps.with_yes_or_no && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${Math.min(100, Math.round((item.progress || 0) / item.target * 100))}%`,
                                            backgroundColor: progressColor,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>{progressDisplay}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <View style={styles.weekContainer}>
                    <View style={styles.weekHeader}>
                        <TouchableOpacity onPress={() => setCurrentDate((prev) => subDays(prev, 7))}>
                            <Icon name="chevron-left" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.weekTitle}>
                            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                        </Text>
                        <TouchableOpacity onPress={() => setCurrentDate((prev) => addDays(prev, 7))}>
                            <Icon name="chevron-right" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={weekDays}
                        renderItem={renderDayItem}
                        keyExtractor={(item) => item.toISOString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysContainer}
                    />
                </View>
            </GestureDetector>

            <View style={styles.habitsContainer}>
                <Text style={styles.dateHeader}>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : habits.length > 0 ? (
                    <FlatList
                        data={habits}
                        renderItem={renderHabitItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.habitsList}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Icon name="calendar-check" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>No habits scheduled for this day</Text>
                        <Text style={styles.emptySubtext}>Add a new habit or select another day</Text>
                    </View>
                )}
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Update Progress: {selectedHabit?.name}
                        </Text>

                        {selectedHabit?.mode === HabitProps.with_number ? (
                            <TextInput
                                style={styles.progressInput}
                                keyboardType="numeric"
                                value={progressInput}
                                onChangeText={setProgressInput}
                                placeholder="Enter progress"
                            />
                        ) : selectedHabit?.mode === HabitProps.with_time ? (
                            <View style={styles.timeInputContainer}>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Hours</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        keyboardType="numeric"
                                        value={timeHours}
                                        onChangeText={setTimeHours}
                                    />
                                </View>
                                <Text style={styles.timeSeparator}>:</Text>
                                <View style={styles.timeInputGroup}>
                                    <Text style={styles.timeLabel}>Minutes</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        keyboardType="numeric"
                                        value={timeMinutes}
                                        onChangeText={setTimeMinutes}
                                    />
                                </View>
                            </View>
                        ) : null}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleProgressSubmit}
                                disabled={updatingProgress}
                            >
                                {updatingProgress ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    weekContainer: {
        backgroundColor: colors.card,
        paddingVertical: spacing.sm,
        ...shadows.sm,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    weekTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: colors.text,
    },
    daysContainer: {
        paddingHorizontal: spacing.sm,
    },
    dayItem: {
        width: DAY_WIDTH,
        alignItems: 'center',
        paddingVertical: spacing.xs,
        marginHorizontal: spacing.xs,
    },
    selectedDay: {
        backgroundColor: colors.primaryLight,
        borderRadius: borderRadius.md,
    },
    dayText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    selectedDayText: {
        color: colors.primary,
        fontWeight: '600',
    },
    todayText: {
        color: colors.secondary,
        fontWeight: '600',
    },
    dateCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDateCircle: {
        backgroundColor: colors.primary,
    },
    todayCircle: {
        borderWidth: 1,
        borderColor: colors.secondary,
    },
    dateText: {
        fontSize: typography.fontSize.sm,
        color: colors.text,
    },
    selectedDateText: {
        color: 'white',
        fontWeight: '600',
    },
    habitsContainer: {
        flex: 1,
        padding: spacing.md,
    },
    dateHeader: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
    },
    habitsList: {
        paddingBottom: spacing.xl,
    },
    habitItem: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    habitContent: {
        padding: spacing.md,
    },
    habitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    habitName: {
        fontSize: typography.fontSize.md,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    progressContainer: {
        marginTop: spacing.xs,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: colors.divider,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: '100%',
        borderRadius: borderRadius.round,
    },
    progressText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        textAlign: 'right',
    },
    loader: {
        marginTop: spacing.xl,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: typography.fontSize.md,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        width: '80%',
        ...shadows.lg,
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    progressInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.fontSize.lg,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    timeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    timeInputGroup: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    timeInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.fontSize.lg,
        color: colors.text,
        textAlign: 'center',
        width: 80,
    },
    timeSeparator: {
        fontSize: typography.fontSize.xl,
        color: colors.text,
        marginHorizontal: spacing.sm,
        marginTop: spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: colors.background,
        marginRight: spacing.sm,
    },
    saveButton: {
        backgroundColor: colors.primary,
        marginLeft: spacing.sm,
    },
    cancelButtonText: {
        color: colors.text,
        fontSize: typography.fontSize.md,
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontSize: typography.fontSize.md,
        fontWeight: '600',
    },
});

export default WeekView;
