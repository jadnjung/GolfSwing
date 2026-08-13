import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { Body, Title } from '../components/Typography';
import { colors, spacing } from '../theme/theme';

// See HomeScreen's comment: same honest-placeholder treatment, replacing
// what used to be leftover "Active tab: Training" debug instrumentation.
// Personalized training plans/drills are Phase 4 scope (PRD 16) — nothing
// to build here yet beyond an honest placeholder.
export function TrainingScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Title>Training</Title>
      <Card style={styles.card} testID="training-placeholder-card">
        <Body>
          Personalized drills and training plans will live here once swing
          analysis is available.
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
