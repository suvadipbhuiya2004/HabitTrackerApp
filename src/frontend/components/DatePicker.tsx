import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    TouchableWithoutFeedback,
    ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../theme/theme';

export type DatePickerProps = {
    label?: string;
    date: Date;
    onDateChange: (date: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    required?: boolean;
    containerStyle?: ViewStyle;
};

const DatePicker: React.FC<DatePickerProps> = ({
    label,
    date,
    onDateChange,
    minimumDate,
    maximumDate,
    required = false,
    containerStyle,
}) => {
    const [show, setShow] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        if (selectedDate) {
            onDateChange(selectedDate);
            if (Platform.OS === 'ios') {
                setModalVisible(false);
            }
        } else if (Platform.OS === 'ios') {
            setModalVisible(false);
        }
    };

    const showDatepicker = () => {
        if (Platform.OS === 'ios') {
            setModalVisible(true);
        } else {
            setShow(true);
        }
    };

    const formatDate = (dateValue: Date) => {
        const day = dateValue.getDate().toString().padStart(2, '0');
        const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
        const year = dateValue.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {required && <Text style={styles.requiredStar}>*</Text>}
                </View>
            )}

            <TouchableOpacity
                style={styles.dateButton}
                onPress={showDatepicker}
                activeOpacity={0.7}
            >
                <Text style={styles.dateText}>{formatDate(date)}</Text>
            </TouchableOpacity>

            {Platform.OS === 'android' && show && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}

            {Platform.OS === 'ios' && (
                <Modal
                    transparent={true}
                    visible={modalVisible}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <TouchableOpacity
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.modalCancel}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.modalDone}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="spinner"
                                        onChange={onChange}
                                        style={styles.iosPicker}
                                        minimumDate={minimumDate}
                                        maximumDate={maximumDate}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: spacing.md,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    label: {
        fontSize: typography.fontSize.md,
        color: colors.text,
        fontWeight: '500',
    },
    requiredStar: {
        color: colors.error,
        marginLeft: 4,
        fontSize: typography.fontSize.md,
    },
    dateButton: {
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        justifyContent: 'center',
    },
    dateText: {
        fontSize: typography.fontSize.md,
        color: colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    modalCancel: {
        color: colors.textSecondary,
        fontSize: 16,
    },
    modalDone: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    iosPicker: {
        height: 200,
    },
});

export default DatePicker;
