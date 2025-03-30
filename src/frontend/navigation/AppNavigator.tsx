import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

// Import navigation items
import { createBottomTabNavigator, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { RouteProp, ParamListBase } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import the screens
import DailyPage from '../screens/TodayScreen';
import HabitScreen from '../screens/HabitScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import icons
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type RootStackParamList = {
    TabNavigator: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

const BLUE_COLOR = '#4A6FFF';

// Define styles first so they can be used in components
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {
        height: 65,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        paddingBottom: 8,
        paddingTop: 8,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 10,
        position: 'absolute',
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 4,
    },
    header: {
        backgroundColor: '#FFFFFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#333333',
    },
    addButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContent: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    addButtonLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: BLUE_COLOR,
        marginTop: 4,
    },
    SettingsButton: {
        justifyContent: 'center',
        alignItems: 'center',
        right: 25,
        position: 'absolute',
    },
});


// Settings button component to avoid creating during render
const SettingsButton: React.FC = () => {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.SettingsButton}
            onPress={() => navigation.navigate('Settings' as never)}>
            <Icon name="cog" size={28} color="#333" />
        </TouchableOpacity>
    );
};

const getScreenOptions = ({ route }: { route: RouteProp<ParamListBase, string> }): BottomTabNavigationOptions => ({
    tabBarIcon: ({ color, size }: { color: string; size: number }) => {
        if (route.name === 'Today') {
            const hour = new Date().getHours();
            const iconName = hour >= 6 && hour < 18 ? 'weather-sunny' : 'weather-night';
            return <Icon name={iconName} size={size} color={color} />;
        }

        if (route.name === 'Habit') {
            return <Icon name="calendar-check-outline" size={size} color={color} />;
        }

        if (route.name === 'AddHabit') {
            return <Icon name="plus-circle" size={28} color={color} />;
        }
    },
    tabBarActiveTintColor: BLUE_COLOR,
    tabBarInactiveTintColor: '#95A5A6',
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabBarLabel,
    headerRight: () =>
        <TouchableOpacity
            style={styles.SettingsButton}
            onPress={() => {
                console.log('Settings');
            }}>
            <Icon name="cog" size={28} color="#333" />
        </TouchableOpacity>,
});

// Common screen options for all tab screens
const commonTabScreenOptions = {
    headerTitleAlign: 'center' as const,
    headerStyle: styles.header,
    headerTitleStyle: styles.headerTitle,
    headerRight: () => <SettingsButton />,
};

// Main tab navigator
const TabNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Today"
            screenOptions={getScreenOptions}
            backBehavior="initialRoute"
        >
            <Tab.Screen
                name="Today"
                component={DailyPage}
                options={{
                    title: 'Today',
                    ...commonTabScreenOptions,
                }}
            />

            <Tab.Screen
                name="AddHabit"
                component={AddHabitScreen}
                options={{
                    title: 'Add Habit',
                    ...commonTabScreenOptions,
                }}
            />

            <Tab.Screen
                name="Habit"
                component={HabitScreen}
                options={{
                    title: 'Habit',
                    ...commonTabScreenOptions,
                }}
            />
        </Tab.Navigator>
    );
};

// Root stack navigator with tabs and settings
const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="TabNavigator" component={TabNavigator} />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        headerShown: true,
                        title: 'Settings',
                        headerTitleAlign: 'center',
                        headerStyle: styles.header,
                        headerTitleStyle: styles.headerTitle,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
