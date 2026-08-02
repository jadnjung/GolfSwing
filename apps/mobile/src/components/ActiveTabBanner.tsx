import { StyleSheet, Text } from 'react-native';
import { useUiStore } from '../state/uiStore';
import { colors, spacing } from '../theme/theme';

/**
 * Proves the UI-state store (Zustand) is genuinely wired end to end: shows
 * whichever tab the navigator most recently reported as active, read
 * reactively from the store rather than passed down as a prop.
 */
export function ActiveTabBanner() {
  const activeTab = useUiStore(state => state.activeTab);

  return <Text style={styles.text}>Active tab: {activeTab}</Text>;
}

const styles = StyleSheet.create({
  text: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
});
