import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

interface CardProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Shared surface container — a bordered, radiused, padded box on
// `colors.surface`. Used wherever a screen needs to visually group content
// as one unit rather than letting it float on the bare background.
export function Card({
  children,
  style,
  testID,
}: PropsWithChildren<CardProps>) {
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
