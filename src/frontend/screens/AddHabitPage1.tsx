import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddHabitStackParamList, HabitData } from './AddHabitScreen';
import { HabitProps } from '../../backend/props/HabitProps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, shadows, borderRadius, typography } from '../theme/theme';

type AddHabitPage1Props = {
    navigation: NativeStackNavigationProp<AddHabitStackParamList, 'Page1'>;
    updateHabitData: (data: Partial<HabitData>) => void;
};

const AddHabitPage1 = ({ navigation, updateHabitData }: AddHabitPage1Props) => {
    const [evaluationType, setEvaluationType] = useState<HabitData['evaluationType']>(null);

    const handleSelectType = (type: NonNullable<HabitData['evaluationType']>) => {
        setEvaluationType(type);
        updateHabitData({ evaluationType: type });
        navigation.navigate('Page2', { evaluationType: type });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>How do you want to evaluate your habit?</Text>
                    <Text style={styles.subtitle}>Choose the method that best fits your habit tracking needs</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={[styles.optionCard, evaluationType === HabitProps.with_yes_or_no && styles.selectedCard]}
                            onPress={() => handleSelectType(HabitProps.with_yes_or_no)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon
                                    name="check-circle-outline"
                                    size={40}
                                    color={evaluationType === HabitProps.with_yes_or_no ? colors.primary : colors.textSecondary}
                                />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, evaluationType === HabitProps.with_yes_or_no && styles.selectedText]}>Yes or No</Text>
                                <Text style={styles.optionDescription}>Simple completion tracking. Did you do it or not?</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionCard, evaluationType === HabitProps.with_number && styles.selectedCard]}
                            onPress={() => handleSelectType(HabitProps.with_number)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon
                                    name="numeric"
                                    size={40}
                                    color={evaluationType === HabitProps.with_number ? colors.primary : colors.textSecondary}
                                />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, evaluationType === HabitProps.with_number && styles.selectedText]}>Number</Text>
                                <Text style={styles.optionDescription}>Track with a number (reps, pages, etc.)</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionCard, evaluationType === HabitProps.with_time && styles.selectedCard]}
                            onPress={() => handleSelectType(HabitProps.with_time)}
                        >
                            <View style={styles.iconContainer}>
                                <Icon
                                    name="clock-outline"
                                    size={40}
                                    color={evaluationType === HabitProps.with_time ? colors.primary : colors.textSecondary}
                                />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.optionTitle, evaluationType === HabitProps.with_time && styles.selectedText]}>Time</Text>
                                <Text style={styles.optionDescription}>Track time spent (minutes, hours)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoContainer}>
                        <Icon name="information-outline" size={20} color={colors.info} style={styles.infoIcon} />
                        <Text style={styles.infoText}>You'll be able to set specific targets on the next screen</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddHabitPage1;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: 60,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: typography.fontSize.xl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '20',
    },
    iconContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    selectedText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    optionDescription: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.info + '15',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    infoIcon: {
        marginRight: spacing.sm,
    },
    infoText: {
        fontSize: typography.fontSize.sm,
        color: colors.textSecondary,
        flex: 1,
    },
});
