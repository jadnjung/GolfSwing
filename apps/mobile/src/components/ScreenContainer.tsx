import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/theme';

interface ScreenContainerProps {
  title: string;
}

export function ScreenContainer({
  title,
  children,
}: PropsWithChildren<ScreenContainerProps>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
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
