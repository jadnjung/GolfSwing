import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../diagnostics/ErrorBoundary';
import { installGlobalErrorHandler } from '../diagnostics/installGlobalErrorHandler';
import { RootNavigator } from '../navigation/RootNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { useProfileStore } from '../state/profileStore';
import { colors } from '../theme/theme';

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
  const status = useProfileStore(state => state.status);
  const profile = useProfileStore(state => state.profile);
  const load = useProfileStore(state => state.load);

  useEffect(() => {
    // Guarded so an already-resolved profile (e.g. a test presetting the
    // store) isn't clobbered by a redundant reload on mount.
    if (status === 'loading') {
      load();
    }
  }, [status, load]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <ErrorBoundary>
        {status === 'loading' ? (
          // Brief — profile.json is a tiny local read. An empty themed
          // view avoids a white flash without needing a spinner asset.
          <View style={styles.loading} testID="app-loading" />
        ) : profile === null ? (
          <OnboardingScreen />
        ) : (
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
