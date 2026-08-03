import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ReplayScreen } from '../screens/ReplayScreen';
import { colors } from '../theme/theme';
import type { HistoryStackParamList } from './types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

// Nested inside the History tab so tapping a saved swing pushes a Replay
// screen with a native back button, rather than needing its own tab.
export function HistoryStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Replay"
        component={ReplayScreen}
        options={{ title: 'Replay' }}
      />
    </Stack.Navigator>
  );
}
