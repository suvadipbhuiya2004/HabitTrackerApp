import React, { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    getAllHabits,
    deleteHabit,
    Habit,
    getHabitStreak,
    getTotalDays,
    getCompletedDays,
    getWeeklyProgress,
} from '../services/HabitService';

const HabitScreen = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [habitStats, setHabitStats] = useState<{
        streak: number;
        totalDays: number;
        completedDays: number;
        weeklyProgress: { day: string; progress: number }[];
    }>({ streak: 0, totalDays: 0, completedDays: 0, weeklyProgress: [] });
    const [completionRates, setCompletionRates] = useState<{ [key: number]: number }>({});
    const navigation = useNavigation();

    // Calculate completion rate for a single habit
    const calculateCompletionRate = useCallback(async (habit: Habit): Promise<number> => {
        try {
            const totalDays = await getTotalDays(habit.id);
            const completedDays = await getCompletedDays(habit.id);
            if (totalDays === 0) {
                return 0;
            }
            return Math.round((completedDays / totalDays) * 100);
        } catch (error) {
            console.error(`Error calculating completion rate for habit ${habit.id}:`, error);
            return 0;
        }
    }, []);

    const fetchHabits = useCallback(async () => {
        try {
            setLoading(true);
            const habitsData = await getAllHabits();
            setHabits(habitsData);
            // Calculate completion rates for all habits
            const rates: { [key: number]: number } = {};
            for (const habit of habitsData) {
                rates[habit.id] = await calculateCompletionRate(habit);
            }
            setCompletionRates(rates);
        } catch (error) {
            console.error('Error fetching habits:', error);
            Alert.alert('Error', 'Failed to load habits. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [calculateCompletionRate]);

    // Fetch habits when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchHabits();
        }, [fetchHabits])
    );

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHabits();
    }, [fetchHabits]);

    const handleDeleteHabit = (id: number) => {
        Alert.alert(
            'Delete Habit',
            'Are you sure you want to delete this habit? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHabit(id);
                            // Remove the habit from the list
                            setHabits(habits.filter(habit => habit.id !== id));
                            if (selectedHabit?.id === id) {
                                setSelectedHabit(null);
                            }
                        } catch (error) {
                            console.error('Error deleting habit:', error);
                            Alert.alert('Error', 'Failed to delete habit. Please try again.');
                        }
                    },
                },
            ],
        );
    };

    const getHabitTypeText = (mode: number) => {
        switch (mode) {
            case 1:
                return 'Yes/No';
            case 2:
                return 'Numeric';
            case 3:
                return 'Timer';
            default:
                return 'Unknown';
        }
    };

    const getFrequencyText = (habit: Habit) => {
        const days = [];
        if (habit.sun) { days.push('Sun'); }
        if (habit.mon) { days.push('Mon'); }
        if (habit.tue) { days.push('Tue'); }
        if (habit.wed) { days.push('Wed'); }
        if (habit.thu) { days.push('Thu'); }
        if (habit.fri) { days.push('Fri'); }
        if (habit.sat) { days.push('Sat'); }

        if (days.length === 7) { return 'Every day'; }
        if (days.length === 0) { return 'No days selected'; }
        return days.join(', ');
    };

    // Format time in seconds to hours and minutes
    const formatTimeDisplay = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    // Load habit statistics when a habit is selected
    useEffect(() => {
        const loadHabitStats = async () => {
            if (selectedHabit) {
                setLoading(true);
                try {
                    const streak = await getHabitStreak(selectedHabit.id);
                    const totalDays = await getTotalDays(selectedHabit.id);
                    const completedDays = await getCompletedDays(selectedHabit.id);
                    const weeklyProgress = await getWeeklyProgress(selectedHabit.id);

                    setHabitStats({
                        streak,
                        totalDays,
                        completedDays,
                        weeklyProgress,
                    });
                } catch (error) {
                    console.error('Error loading habit statistics:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        loadHabitStats();
    }, [selectedHabit]);

    const renderHabitItem = ({ item }: { item: Habit }) => {
        const completionRate = completionRates[item.id] || 0;
        const isSelected = selectedHabit?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.habitCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedHabit(isSelected ? null : item)}
            >
                <View style={styles.habitHeader}>
                    <Text style={styles.habitName}>{item.name}</Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteHabit(item.id)}
                    >
                        <Icon name="trash-can-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>

                <View style={styles.habitDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type:</Text>
                        <Text style={styles.detailValue}>{getHabitTypeText(item.mode)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Target:</Text>
                        <Text style={styles.detailValue}>
                            {item.mode === 3 ? formatTimeDisplay(item.target) : item.target}
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Frequency:</Text>
                        <Text style={styles.detailValue}>{getFrequencyText(item)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Started:</Text>
                        <Text style={styles.detailValue}>{item.startDate}</Text>
                    </View>
                    {item.endDate && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Ends:</Text>
                            <Text style={styles.detailValue}>{item.endDate}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.progressSection}>
                    <Text style={styles.progressTitle}>Completion Rate</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${completionRate}%` },
                                completionRate > 75
                                    ? styles.progressHigh
                                    : completionRate > 40
                                        ? styles.progressMedium
                                        : styles.progressLow,
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>{completionRate}%</Text>
                </View>

                {isSelected && (
                    <View style={styles.analyticsSection}>
                        <Text style={styles.analyticsTitle}>Habit Analytics</Text>

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{habitStats.streak}</Text>
                                <Text style={styles.statLabel}>Current Streak</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{habitStats.totalDays}</Text>
                                <Text style={styles.statLabel}>Total Days</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{habitStats.completedDays}</Text>
                                <Text style={styles.statLabel}>Days Completed</Text>
                            </View>
                        </View>

                        <View style={styles.weeklyStatsContainer}>
                            <Text style={styles.chartTitle}>Weekly Performance</Text>
                            <View style={styles.weeklyStats}>
                                {habitStats.weeklyProgress.map((dayData) => {
                                    // Calculate progress percentage based on habit target
                                    const dayProgress = item.target > 0
                                        ? Math.min(100, Math.max(0, Math.round((dayData.progress / item.target) * 100)))
                                        : (dayData.progress > 0 ? 100 : 0); // Handle target 0 or yes/no case (target=1)
                                    return (
                                        <View key={dayData.day} style={styles.dayStats}>
                                            <View style={styles.dayBarContainer}>
                                                <View
                                                    style={[
                                                        styles.dayBar,
                                                        { height: `${dayProgress}%` },
                                                        dayProgress > 75 ? styles.progressHigh : dayProgress > 40 ? styles.progressMedium : styles.progressLow,
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.dayLabel}>{dayData.day}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Habits</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddHabit' as never)}
                >
                    <Icon name="plus-circle" size={24} color="#4A90E2" />
                    <Text style={styles.addButtonText}>New Habit</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator style={styles.loader} size="large" color="#4A90E2" />
            ) : habits.length > 0 ? (
                <FlatList
                    data={habits}
                    renderItem={renderHabitItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
                    }
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Icon name="calendar-blank" size={60} color="#CCCCCC" />
                    <Text style={styles.emptyText}>No habits found</Text>
                    <Text style={styles.emptySubtext}>
                        Tap the "New Habit" button to create your first habit
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
        paddingBottom: 80,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        marginLeft: 4,
        color: '#4A90E2',
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
    },
    habitCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: '#4A90E2',
    },
    habitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    habitName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        flex: 1,
    },
    deleteButton: {
        padding: 4,
    },
    habitDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailLabel: {
        width: 80,
        fontSize: 14,
        color: '#666666',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#333333',
        flex: 1,
    },
    progressSection: {
        marginTop: 8,
    },
    progressTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333333',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLow: {
        backgroundColor: '#F44336',
    },
    progressMedium: {
        backgroundColor: '#FFC107',
    },
    progressHigh: {
        backgroundColor: '#4CAF50',
    },
    progressText: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
        textAlign: 'right',
    },
    analyticsSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    analyticsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333333',
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333333',
        alignSelf: 'flex-start',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    statLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
        textAlign: 'center',
    },
    weeklyStatsContainer: {
        marginTop: 8,
    },
    weeklyStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 150,
        alignItems: 'flex-end',
    },
    dayStats: {
        alignItems: 'center',
        flex: 1,
    },
    dayBarContainer: {
        height: 120,
        width: 16,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    dayBar: {
        width: '100%',
        borderRadius: 8,
    },
    dayLabel: {
        fontSize: 10,
        color: '#666666',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
        marginTop: 8,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HabitScreen;
