import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { Body, Title } from '../components/Typography';
import { colors, spacing } from '../theme/theme';

// Deliberately honest, not a fake dashboard: a real home dashboard (recent
// swings, quick-record CTA, progress) is real product work, not a styling
// pass — tracked as its own follow-up. This replaces what used to be here
// (a raw "Active tab: Home" debug string, leftover instrumentation for
// proving the tab-navigation store wired up correctly — never meant to be
// user-facing, see App.test.tsx for where that proof now lives instead).
export function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Title>Home</Title>
      <Card style={styles.card} testID="home-placeholder-card">
        <Body>
          Your swing dashboard will live here — recent swings, quick access
          to recording, and progress over time. Head to the Record tab to
          capture your first swing.
        </Body>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    marginTop: spacing.sm,
  },
});
