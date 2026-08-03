import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompareScreen } from '../screens/CompareScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ReplayScreen } from '../screens/ReplayScreen';
import { SelectComparisonSwingScreen } from '../screens/SelectComparisonSwingScreen';
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
      <Stack.Screen
        name="SelectComparisonSwing"
        component={SelectComparisonSwingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Compare"
        component={CompareScreen}
        options={{ title: 'Compare' }}
      />
    </Stack.Navigator>
  );
}
