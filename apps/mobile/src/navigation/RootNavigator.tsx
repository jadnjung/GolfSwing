import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TrainingScreen } from '../screens/TrainingScreen';
import { useUiStore, type TabName } from '../state/uiStore';
import { colors } from '../theme/theme';

const Tab = createBottomTabNavigator();

// One `focus` listener per tab, each setting a known literal — reactivity
// is proven by ActiveTabBanner (rendered on every screen) reading this same
// store value back out.
function onFocus(tab: TabName) {
  return () => useUiStore.getState().setActiveTab(tab);
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
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        listeners={{ focus: onFocus('Record') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        listeners={{ focus: onFocus('History') }}
      />
      <Tab.Screen
        name="Training"
        component={TrainingScreen}
        listeners={{ focus: onFocus('Training') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        listeners={{ focus: onFocus('Settings') }}
      />
    </Tab.Navigator>
  );
}
