import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/theme';

interface ScreenContainerProps {
  title: string;
}

export function ScreenContainer({
  title,
  children,
}: PropsWithChildren<ScreenContainerProps>) {
  return (
    // Bottom edge deliberately excluded: these screens render inside the
    // bottom tab navigator, which already accounts for the bottom safe
    // area (home indicator) for its own bar — adding it here too would
    // double the gap above the tab bar.
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
});
