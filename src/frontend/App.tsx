import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './navigation/AppNavigator';
import { startHabitReminderSystem } from './screens/Notification';

const App = () => {
    startHabitReminderSystem();
    return (
        <PaperProvider>
            <AppNavigator />
        </PaperProvider>
    );
};

export default App;
