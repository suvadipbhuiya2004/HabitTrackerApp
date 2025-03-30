import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useNotification } from './UseNoti';
import WeekView from '../components/WeekView';
import { colors, spacing } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TodayScreen() {
    useNotification(); // Initialize the notification listener

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Today's Habits</Text>
                <Icon name="star-circle" size={24} color={colors.primary} />
            </View>
            <WeekView />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
});
