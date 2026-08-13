import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme/theme';
import { Body } from './Typography';

interface EmptyStateProps {
  message: string;
  testID?: string;
}

// Shared "nothing here yet" state — was previously a single plain
// StyleSheet.create({ message: {...} }) line duplicated per screen
// (HistoryScreen, SelectComparisonSwingScreen), each slightly different.
export function EmptyState({ message, testID }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Body style={styles.message}>{message}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    textAlign: 'center',
  },
});
