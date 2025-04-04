import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';

type TimeInputProps = {
    label: string;
    onTimeChange: (seconds: number) => void;
    initialSeconds?: number;
    required?: boolean;
};

const TimeInput: React.FC<TimeInputProps> = ({
    label,
    onTimeChange,
    initialSeconds = 0,
    required = false,
}) => {
    const [hours, setHours] = useState(Math.floor(initialSeconds / 3600).toString());
    const [minutes, setMinutes] = useState(Math.floor((initialSeconds % 3600) / 60).toString());
    const [seconds, setSeconds] = useState((initialSeconds % 60).toString());
    const [error, setError] = useState('');

    useEffect(() => {
        // Convert to total seconds and notify parent
        const h = parseInt(hours, 10) || 0;
        const m = parseInt(minutes, 10) || 0;
        const s = parseInt(seconds, 10) || 0;

        const totalSeconds = h * 3600 + m * 60 + s;

        if (required && totalSeconds === 0) {
            setError('Time is required');
        } else {
            setError('');
            onTimeChange(totalSeconds);
        }
    }, [hours, minutes, seconds, required, onTimeChange]);

    const validateAndSetHours = (text: string) => {
        if (text === '' || /^\d+$/.test(text)) {
            setHours(text);
        }
    };

    const validateAndSetMinutes = (text: string) => {
        if (text === '' || (/^\d+$/.test(text) && parseInt(text, 10) < 60)) {
            setMinutes(text);
        }
    };

    const validateAndSetSeconds = (text: string) => {
        if (text === '' || (/^\d+$/.test(text) && parseInt(text, 10) < 60)) {
            setSeconds(text);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>

            <View style={styles.timeInputContainer}>
                <View style={styles.timeUnit}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={hours}
                        onChangeText={validateAndSetHours}
                        maxLength={2}
                        placeholder="00"
                    />
                    <Text style={styles.unitLabel}>Hours</Text>
                </View>

                <Text style={styles.separator}>:</Text>

                <View style={styles.timeUnit}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={minutes}
                        onChangeText={validateAndSetMinutes}
                        maxLength={2}
                        placeholder="00"
                    />
                    <Text style={styles.unitLabel}>Min</Text>
                </View>

                <Text style={styles.separator}>:</Text>

                <View style={styles.timeUnit}>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={seconds}
                        onChangeText={validateAndSetSeconds}
                        maxLength={2}
                        placeholder="00"
                    />
                    <Text style={styles.unitLabel}>Sec</Text>
                </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.presetContainer}>
                <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                        setHours('0');
                        setMinutes('15');
                        setSeconds('0');
                    }}
                >
                    <Text style={styles.presetText}>15 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                        setHours('0');
                        setMinutes('30');
                        setSeconds('0');
                    }}
                >
                    <Text style={styles.presetText}>30 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                        setHours('1');
                        setMinutes('0');
                        setSeconds('0');
                    }}
                >
                    <Text style={styles.presetText}>1 hour</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    required: {
        color: '#E53935',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    timeUnit: {
        alignItems: 'center',
        flex: 1,
    },
    input: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
        paddingVertical: 4,
    },
    unitLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    separator: {
        fontSize: 24,
        fontWeight: '600',
        color: '#666',
        marginHorizontal: 4,
    },
    errorText: {
        color: '#E53935',
        fontSize: 14,
        marginTop: 4,
    },
    presetContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    presetButton: {
        backgroundColor: '#E8F4FD',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetText: {
        color: '#4A90E2',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default TimeInput;
