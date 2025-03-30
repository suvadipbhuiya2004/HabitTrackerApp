import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type DaySelectorProps = {
    selectedDays: string[];
    onDayToggle: (day: string) => void;
};

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onDayToggle }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select days:</Text>
            <View style={styles.daysContainer}>
                {days.map((day) => (
                    <TouchableOpacity
                        key={day}
                        style={[
                            styles.dayCircle,
                            selectedDays.includes(day) && styles.selectedDay,
                        ]}
                        onPress={() => onDayToggle(day)}
                    >
                        <Text
                            style={[
                                styles.dayText,
                                selectedDays.includes(day) && styles.selectedDayText,
                            ]}
                        >
                            {day}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
        color: '#333',
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedDay: {
        backgroundColor: '#4A90E2',
    },
    dayText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    selectedDayText: {
        color: 'white',
    },
});

export default DaySelector;
