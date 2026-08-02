import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../navigation/RootNavigator';

// react-native-screens' enableScreens() is deliberately not called yet:
// it's a required peer of @react-navigation/bottom-tabs (so it's installed
// and available for native builds), but opting into it here would pull in
// a native module with no Jest-safe mock for this version, breaking
// rendering tests for no benefit at this shell-only stage. Revisit once
// native builds can actually be verified (Xcode/Android Studio installed).
export function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
