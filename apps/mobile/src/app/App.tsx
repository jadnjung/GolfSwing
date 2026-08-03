import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../diagnostics/ErrorBoundary';
import { installGlobalErrorHandler } from '../diagnostics/installGlobalErrorHandler';
import { RootNavigator } from '../navigation/RootNavigator';

// Installed at module scope (not in a component effect) so it's active
// before the first screen mounts, catching errors during initial render.
installGlobalErrorHandler();

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
      <ErrorBoundary>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
