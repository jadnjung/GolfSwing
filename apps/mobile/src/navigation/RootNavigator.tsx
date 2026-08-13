import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Deep-imported per icon rather than `from 'lucide-react-native'` — the
// package barrel re-exports its entire ~1600-icon set, and Jest/Metro both
// have to load and transform every one of those files just to resolve the
// five names actually used here.
import Clock from 'lucide-react-native/icons/clock';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import House from 'lucide-react-native/icons/house';
import Settings from 'lucide-react-native/icons/settings';
import Video from 'lucide-react-native/icons/video';
import { HistoryStackNavigator } from './HistoryStackNavigator';
import type { RootTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { useUiStore, type TabName } from '../state/uiStore';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

// One `focus` listener per tab, each setting a known literal — reactivity
// is proven in __tests__/App.test.tsx, reading this store's state directly
// after simulating a tab focus, rather than via any rendered UI.
function onFocus(tab: TabName) {
  return () => useUiStore.getState().setActiveTab(tab);
}

// Declared at module scope, not inline in `options`, so each is a stable
// component reference across renders rather than a new function identity
// every time (react/no-unstable-nested-components).
type TabIconProps = { color: string; size: number };
function HomeTabIcon({ color, size }: TabIconProps) {
  return <House color={color} size={size} />;
}
function RecordTabIcon({ color, size }: TabIconProps) {
  return <Video color={color} size={size} />;
}
function HistoryTabIcon({ color, size }: TabIconProps) {
  return <Clock color={color} size={size} />;
}
function TrainingTabIcon({ color, size }: TabIconProps) {
  return <Dumbbell color={color} size={size} />;
}
function SettingsTabIcon({ color, size }: TabIconProps) {
  return <Settings color={color} size={size} />;
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        listeners={{ focus: onFocus('Home') }}
        options={{ tabBarIcon: HomeTabIcon }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        listeners={{ focus: onFocus('Record') }}
        options={{ tabBarIcon: RecordTabIcon }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        listeners={{ focus: onFocus('History') }}
        options={{ tabBarIcon: HistoryTabIcon }}
      />
      <Tab.Screen
        name="Training"
        component={TrainingScreen}
        listeners={{ focus: onFocus('Training') }}
        options={{ tabBarIcon: TrainingTabIcon }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={{ focus: onFocus('Settings') }}
        options={{ tabBarIcon: SettingsTabIcon }}
      />
    </Tab.Navigator>
  );
}
